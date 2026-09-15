import { readdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { git, lines } from "../git.js";
import { buildDir } from "../load.js";
import { pad } from "./keys.js";
import type { Remote } from "./remote.js";
import { numbersOn } from "./refs.js";

export type Renumbered = {
  from: string;
  to: string;
  was: string;
  now: string;
  rewritten: number;
  left: string[];
};

export function committed(remote: Remote, path: string): boolean {
  return (
    git(remote.repo, ["cat-file", "-e", `HEAD:${remote.book}/${path}`]).code === 0
  );
}

export function renumber(
  remote: Remote,
  path: string,
  domain: string | undefined,
  logDir: string,
  kind: "decision" | "debt",
  from: number,
  to: number
): Renumbered {
  const target = path.replace(/(^|\/)\d{4}-/u, `$1${pad(to)}-`);
  const staged = stagedUnder(remote);
  renameSync(join(remote.repo, remote.book, path), join(remote.repo, remote.book, target));
  if (staged.has(path)) {
    git(remote.repo, ["rm", "--cached", "--quiet", "--", `${remote.book}/${path}`]);
    git(remote.repo, ["add", "--", `${remote.book}/${target}`]);
  }
  const was = kind === "debt" ? `TDR-${pad(from)}` : qualified(domain, `ADR-${pad(from)}`);
  const now = kind === "debt" ? `TDR-${pad(to)}` : qualified(domain, `ADR-${pad(to)}`);
  const done = { from: path, to: target, was, now, rewritten: 0, left: [] as string[] };
  if (kind === "debt") return done;
  const token = new RegExp(`(?<![\\w/-])${escape(was)}(?!\\d)`, "gu");
  if (numbersOn(remote, "HEAD", logDir).includes(from))
    return { ...done, left: leftAlone(remote, token) };
  for (const file of bookFiles(join(remote.repo, remote.book))) {
    const text = readFileSync(file, "utf8");
    const count = text.match(token)?.length ?? 0;
    if (count === 0) continue;
    writeFileSync(file, text.replace(token, now));
    done.rewritten += count;
    const inside = file.slice(join(remote.repo, remote.book).length + 1);
    if (staged.has(inside)) git(remote.repo, ["add", "--", file]);
  }
  return done;
}

function leftAlone(remote: Remote, token: RegExp): string[] {
  const found: string[] = [];
  const status = git(remote.repo, [
    "status",
    "--porcelain=v1",
    "--untracked-files=all",
    "--no-renames",
    "--",
    remote.book,
  ]);
  for (const record of lines(status.out)) {
    const path = record.slice(3);
    if (record.startsWith(" D") || record.startsWith("D ")) continue;
    const text = readFileSync(join(remote.repo, path), "utf8").split("\n");
    text.forEach((line, at) => {
      if (token.test(line)) found.push(`${path}:${at + 1}`);
      token.lastIndex = 0;
    });
  }
  return found;
}

function stagedUnder(remote: Remote): Set<string> {
  const listed = git(remote.repo, [
    "diff",
    "--cached",
    "--name-only",
    "--no-renames",
    "--",
    remote.book,
  ]);
  return new Set(lines(listed.out).map((path) => path.slice(remote.book.length + 1)));
}

function bookFiles(dir: string): string[] {
  const found: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === buildDir) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...bookFiles(path));
    else if (entry.name.endsWith(".md") || entry.name.endsWith(".yaml"))
      found.push(path);
  }
  return found;
}

function qualified(domain: string | undefined, ref: string): string {
  return domain === undefined ? ref : `${domain}/${ref}`;
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\/]/gu, "\\$&");
}
