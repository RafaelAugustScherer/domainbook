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
let origin = "";
let clones: string[] = [];

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
  for (const dir of [home, origin, ...clones])
    if (dir !== "") rmSync(dir, { recursive: true, force: true });
  origin = "";
  clones = [];
}

export function shared(): string {
  origin = mkdtempSync(join(tmpdir(), "domainbook-origin-"));
  gitIn(origin, "init", "--bare", "--quiet", "--initial-branch=main");
  git("remote", "add", "origin", origin);
  return origin;
}

export function cloned(email: string, branch: string): string {
  const dir = mkdtempSync(join(tmpdir(), "domainbook-peer-"));
  gitIn(dir, "clone", "--quiet", origin, dir);
  gitIn(dir, "config", "user.email", email);
  gitIn(dir, "config", "user.name", "A Peer");
  gitIn(dir, "checkout", "--quiet", "-b", branch);
  clones.push(dir);
  return dir;
}

export function within<T>(dir: string, work: () => T): T {
  const back = process.cwd();
  process.chdir(dir);
  try {
    return work();
  } finally {
    process.chdir(back);
  }
}

export function git(...args: string[]): string {
  return gitIn(process.cwd(), ...args);
}

export function gitIn(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, {
    cwd,
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
