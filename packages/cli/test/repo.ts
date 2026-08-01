import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { expect } from "vitest";
import { run } from "../src/index.js";

let home = "";
let previous = "";

export function enter(): void {
  previous = process.cwd();
  home = mkdtempSync(join(tmpdir(), "domainbook-repo-"));
  process.chdir(home);
  git("init", "--initial-branch=main");
  git("config", "user.email", "book@example.com");
  git("config", "user.name", "A Reader");
}

export function leave(): void {
  process.chdir(previous);
  rmSync(home, { recursive: true, force: true });
}

export function git(...args: string[]): string {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

export function ran(...argv: string[]): string[] {
  const result = run(argv);
  expect(result.code, result.lines.join("\n")).toBe(0);
  return result.lines;
}

export function failed(...argv: string[]): string[] {
  const result = run(argv);
  expect(result.code, result.lines.join("\n")).toBe(1);
  return result.lines;
}

export function wrote(path: string, text: string): void {
  mkdirSync(dirname(join(process.cwd(), path)), { recursive: true });
  writeFileSync(join(process.cwd(), path), text);
}

export function claims(id: string, glob: string): void {
  ran("new", "domain", id);
  const page = `domainbook/domains/${id}/index.md`;
  const before = readFileSync(page, "utf8");
  wrote(page, before.replace("\n---\n", `\ncode:\n  - "${glob}"\n---\n`));
}

export function committed(message: string): void {
  git("add", "-A");
  git("commit", "-q", "--no-verify", "-m", message);
}
