#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { fsRefusal } from "./files.js";
import { refuse, type Result } from "./result.js";
import { run } from "./run.js";

const result = dispatch();
const stream = result.code === 0 ? process.stdout : process.stderr;
for (const line of result.lines) stream.write(`${line}\n`);
process.exitCode = result.code;

if (result.serve !== undefined) {
  const { serve } = await import("@domainbook/mcp");
  serve(result.serve, version());
}

function version(): string {
  const manifest = readFileSync(
    new URL("../package.json", import.meta.url),
    "utf8"
  );
  return (JSON.parse(manifest) as { version: string }).version;
}

function dispatch(): Result {
  try {
    return run(process.argv.slice(2));
  } catch (thrown) {
    const message = fsRefusal(thrown);
    if (message === undefined) throw thrown;
    return refuse(message);
  }
}
