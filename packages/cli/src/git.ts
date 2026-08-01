import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

export type Trailer = { key: string; value: string };

export type Status = { path: string; unstaged: boolean };

export function repoRoot(): string | undefined {
  const top = git(process.cwd(), ["rev-parse", "--show-toplevel"]);
  return top === undefined ? undefined : resolve(top.trim());
}

export function hooksDir(repo: string): string {
  const path = git(repo, ["rev-parse", "--git-path", "hooks"]) ?? ".git/hooks";
  return path.trim();
}

export function stagedPaths(repo: string): string[] {
  return split(
    git(repo, ["diff", "--cached", "--name-only", "--no-renames", "-z"]) ?? ""
  );
}

export function rangePaths(repo: string, base: string, head: string): string[] {
  return split(
    git(repo, [
      "diff",
      "--name-only",
      "--no-renames",
      "-z",
      `${base}...${head}`,
    ]) ?? ""
  );
}

export function reaches(repo: string, base: string, head: string): boolean {
  if (git(repo, ["cat-file", "-e", `${base}^{commit}`]) === undefined)
    return false;
  return git(repo, ["merge-base", base, head]) !== undefined;
}

export function statusOf(repo: string): Status[] {
  const out = git(repo, [
    "status",
    "--porcelain=v1",
    "--no-renames",
    "--untracked-files=all",
    "-z",
  ]);
  if (out === undefined) return [];
  return split(out).map((record) => ({
    path: record.slice(3),
    unstaged: record.charAt(1) !== " ",
  }));
}

export function messageTrailers(repo: string, file: string): Trailer[] {
  const out = git(repo, ["interpret-trailers", "--parse", file]);
  return out === undefined ? [] : parseTrailers(out);
}

export function rangeTrailers(
  repo: string,
  base: string,
  head: string,
  key: string
): Trailer[] {
  const out = git(repo, [
    "log",
    `--format=%(trailers:key=${key})`,
    `${base}..${head}`,
  ]);
  return out === undefined ? [] : parseTrailers(out);
}

export function stamp(repo: string, file: string, trailer: Trailer): boolean {
  return (
    git(repo, [
      "interpret-trailers",
      "--if-exists",
      "doNothing",
      "--trailer",
      `${trailer.key}: ${trailer.value}`,
      "--in-place",
      file,
    ]) !== undefined
  );
}

function parseTrailers(out: string): Trailer[] {
  const found: Trailer[] = [];
  for (const line of out.split("\n")) {
    const [, key = "", value = ""] =
      /^([^\s:][^:]*):[ \t]?(.*)$/.exec(line) ?? [];
    if (key !== "") found.push({ key, value: value.trim() });
  }
  return found;
}

function split(out: string): string[] {
  return out.split("\0").filter((one) => one !== "");
}

function git(cwd: string, args: string[]): string | undefined {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return undefined;
  }
}
