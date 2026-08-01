import { tmpdir } from "node:os";
import { join } from "node:path";

const given = process.argv[2];

const data =
  given === undefined || given === "" || given.includes("${")
    ? join(tmpdir(), "domainbook-plugin")
    : given;

export function touched(session) {
  return join(data, `${session}.paths`);
}

export function blocks(session) {
  return join(data, `${session}.blocks`);
}

export async function payload() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    return undefined;
  }
}
