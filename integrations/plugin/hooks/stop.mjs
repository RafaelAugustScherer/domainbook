import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { blocks, payload, touched } from "./state.mjs";

const cap = 3;

const event = await payload();
const session = event?.session_id;
if (typeof session !== "string" || !existsSync(touched(session))) process.exit(0);

const before = counted(session);
if (event.stop_hook_active === true || before >= cap) {
  publish(event.cwd);
  process.exit(0);
}

const found = ran(["check", "--session", touched(session)], event.cwd);
if (found.code === 0) {
  publish(event.cwd);
  process.exit(0);
}

const now = before + 1;
mkdirSync(dirname(blocks(session)), { recursive: true });
writeFileSync(blocks(session), String(now));

const reason = now === cap ? [...found.lines, lastCall(found.lines)] : found.lines;
process.stdout.write(
  JSON.stringify({ decision: "block", reason: reason.join("\n") })
);

function publish(cwd) {
  const synced = ran(["sync"], cwd);
  const line = synced.lines[0];
  if (synced.code !== 0 && line !== undefined)
    process.stdout.write(JSON.stringify({ systemMessage: line }));
}

function ran(args, cwd) {
  try {
    const out = execFileSync("domainbook", args, {
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
