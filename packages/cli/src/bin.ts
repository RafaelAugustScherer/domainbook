#!/usr/bin/env node
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { loadBook } from "@domainbook/core";
import { fsRefusal, relate } from "./files.js";
import { refuse, type Result, type Serving } from "./result.js";
import { run } from "./run.js";

const output = "domainbook-site";

const result = dispatch();
const stream = result.code === 0 ? process.stdout : process.stderr;
for (const line of result.lines) stream.write(`${line}\n`);
process.exitCode = result.code;

try {
  if (result.serve !== undefined) await serving(result.serve);
  if (result.build !== undefined) await building(result.build);
} catch (thrown) {
  process.stderr.write(`${broke(thrown)}\n`);
  process.exitCode = 1;
}

function broke(thrown: unknown): string {
  const message = thrown instanceof Error ? thrown.message : String(thrown);
  if ((thrown as { code?: string }).code === "ERR_MODULE_NOT_FOUND")
    return `the site could not be built here — ${
      message.split("\n")[0]
    }; run this from the repo domainbook is installed in, so its dependencies can be found`;
  return `the site could not be built — ${message.split("\n")[0]}`;
}

async function serving(asked: Serving): Promise<void> {
  const said = asked.mcp ? process.stderr : process.stdout;
  if (asked.web) {
    const { dev } = await import("@domainbook/site");
    const base = baseOf(asked.root);
    const { port } = await dev({ root: asked.root, base, quiet: asked.mcp });
    said.write(`${reached(asked.root, base, port)}\n`);
  }
  if (!asked.mcp) return;
  const { serve } = await import("@domainbook/mcp");
  serve(asked.root, version());
}

async function building(root: string): Promise<void> {
  const { build } = await import("@domainbook/site");
  try {
    await build({ root, base: baseOf(root), outDir: output, quiet: true });
  } catch (thrown) {
    if (!existsSync(join(output, "index.html")))
      rmSync(output, { recursive: true, force: true });
    throw thrown;
  }
  process.stdout.write(
    `the book at ${relate(
      root
    )} is built into ${output} — publish that folder\n`
  );
}

function reached(root: string, base: string, port: number): string {
  const url = `http://localhost:${port}${base === "/" ? "" : base}`;
  const there = `the book at ${relate(root)} is at ${url}`;
  const stop = "press Ctrl+C to stop";
  if (port === 4321) return `${there} — ${stop}`;
  return `4321 was taken, so ${there} — ${stop}`;
}

function baseOf(root: string): string {
  return loadBook(root).book.config.site.base;
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
