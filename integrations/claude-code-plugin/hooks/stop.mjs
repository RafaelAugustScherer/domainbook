import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { blocks, payload, touched } from "./state.mjs";

const cap = 3;

const event = await payload();
if (event?.stop_hook_active === true) process.exit(0);

const session = event?.session_id;
if (typeof session !== "string" || !existsSync(touched(session))) process.exit(0);

const before = counted(session);
if (before >= cap) process.exit(0);

const found = ran(touched(session), event.cwd);
if (found.code === 0) process.exit(0);

const now = before + 1;
mkdirSync(dirname(blocks(session)), { recursive: true });
writeFileSync(blocks(session), String(now));

const reason = now === cap ? [...found.lines, lastCall(found.lines)] : found.lines;
process.stdout.write(
  JSON.stringify({ decision: "block", reason: reason.join("\n") })
);

function ran(file, cwd) {
  try {
    const out = execFileSync("domainbook", ["check", "--session", file], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    return { code: 0, lines: spoken(out) };
  } catch (thrown) {
    if (thrown.code === "ENOENT") return { code: 0, lines: [] };
    return {
      code: thrown.status ?? 1,
      lines: spoken(`${thrown.stdout ?? ""}${thrown.stderr ?? ""}`),
    };
  }
}

function spoken(out) {
  return out.split("\n").filter((line) => line !== "");
}

function counted(session) {
  try {
    return Number.parseInt(readFileSync(blocks(session), "utf8"), 10) || 0;
  } catch {
    return 0;
  }
}

function lastCall(lines) {
  const domains = lines
    .filter((line) => line.includes(" changed and "))
    .map((line) => line.split(":")[0]);
  const named = domains.slice(0, -1).join(", ");
  const all =
    domains.length > 1 ? `${named} and ${domains.at(-1)}` : domains.join("");
  return `this is the third time — write the ${all} book${
    domains.length === 1 ? "" : "s"
  } or say why it does not need writing, because this hook will not stop you again; the commit-msg hook and the pull request will`;
}
