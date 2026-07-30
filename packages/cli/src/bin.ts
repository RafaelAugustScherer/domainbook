#!/usr/bin/env node
import { fsRefusal } from "./files.js";
import { refuse, type Result } from "./result.js";
import { run } from "./run.js";

const result = dispatch();
const stream = result.code === 0 ? process.stdout : process.stderr;
for (const line of result.lines) stream.write(`${line}\n`);
process.exitCode = result.code;

function dispatch(): Result {
  try {
    return run(process.argv.slice(2));
  } catch (thrown) {
    const message = fsRefusal(thrown);
    if (message === undefined) throw thrown;
    return refuse(message);
  }
}
