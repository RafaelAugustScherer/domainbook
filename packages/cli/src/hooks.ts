import {
  chmodSync,
  existsSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { relative, resolve } from "node:path";
import { missingBook, write } from "./files.js";
import { hooksDir, repoRoot } from "./git.js";
import { refuse, type Result } from "./result.js";

const start = "# domainbook:start";
const end = "# domainbook:end";

const noRepo =
  'there is no git repo here — a commit hook needs one, so run "git init" first, or run this from inside the repo the book documents';

const next =
  'next: run "domainbook instructions" to write the rule where agents will read it';

const shells = ["sh", "bash", "zsh", "dash", "ksh", "ash"];

const managers = [
  "lefthook.yml",
  "lefthook.yaml",
  ".lefthook.yml",
  ".lefthook.yaml",
];

export function hooksInstall(root: string): Result {
  const repo = repoRoot();
  if (repo === undefined) return refuse(noRepo);
  const missing = missingBook(root);
  if (missing !== undefined) return refuse(missing);
  const run = command(repo, root);
  const manager = managers.find((name) => existsSync(resolve(repo, name)));
  if (manager !== undefined) return lefthook(manager, run);
  const at = hookFile(repo);
  const file = resolve(repo, at);
  if (!existsSync(file))
    return install(file, ["#!/bin/sh"], run, [
      `${at} is installed — every commit now runs "domainbook check --staged"`,
      next,
    ]);
  const lines = readFileSync(file, "utf8").split("\n");
  if (lines.some((line) => line.trim() === start))
    return install(file, cut(lines), run, [
      `${at} is up to date — every commit runs "domainbook check --staged"`,
    ]);
  const refusal = unshellable(at, lines);
  if (refusal !== undefined) return refuse(refusal);
  return install(file, lines, run, [
    `${at} already existed, so the check was added to the end of it — the hook that was there runs first and still decides first`,
    next,
  ]);
}

export function hooksUninstall(): Result {
  const repo = repoRoot();
  if (repo === undefined) return refuse(noRepo);
  const at = hookFile(repo);
  const file = resolve(repo, at);
  if (!existsSync(file))
    return said(`there is no ${at} here, so nothing was removed`);
  const lines = readFileSync(file, "utf8").split("\n");
  if (!lines.some((line) => line.trim() === start))
    return said(`${at} carries no domainbook block, so nothing was removed`);
  const kept = trimmed(cut(lines));
  if (kept.every((line) => line.startsWith("#!"))) {
    rmSync(file);
    return said(
      `${at} held nothing but the domainbook block, so the hook is removed`
    );
  }
  writeFileSync(file, `${kept.join("\n")}\n`);
  return said(
    `the domainbook block is removed from ${at} — what was already in that hook is untouched`
  );
}

function install(
  file: string,
  before: string[],
  run: string,
  lines: string[]
): Result {
  const text = [...trimmed(before), "", start, `${run} || exit 1`, end].join(
    "\n"
  );
  const refusal = write(file, `${text}\n`);
  if (refusal !== undefined) return refuse(refusal);
  chmodSync(file, 0o755);
  return { code: 0, lines };
}

function lefthook(manager: string, run: string): Result {
  return {
    code: 0,
    lines: [
      `${manager} is here, and lefthook rewrites .git/hooks — add this to ${manager} instead:`,
      "",
      "commit-msg:",
      "  commands:",
      "    domainbook:",
      `      run: ${run.replace('"$1"', "{1}")}`,
    ],
  };
}

function said(line: string): Result {
  return { code: 0, lines: [line] };
}

function command(repo: string, root: string): string {
  const run = 'domainbook check --staged --message-file "$1"';
  const at = relative(repo, resolve(root));
  if (at === "domainbook") return run;
  if (/\s/.test(at)) return `${run} '${at}'`;
  return `${run} ${at}`;
}

function cut(lines: string[]): string[] {
  const from = lines.findIndex((line) => line.trim() === start);
  const to = lines.findIndex((line) => line.trim() === end);
  return [...lines.slice(0, from), ...lines.slice(to + 1)];
}

function trimmed(lines: string[]): string[] {
  const kept = [...lines];
  while (kept.at(-1)?.trim() === "") kept.pop();
  return kept;
}

function unshellable(at: string, lines: string[]): string | undefined {
  const language = interpreter(lines[0] ?? "");
  if (language !== undefined)
    return `${at} is a ${language} script, and the check is a shell line — add the equivalent of "domainbook check --staged --message-file \\"$1\\"" to it yourself, or move it aside and run this again`;
  if (trimmed(lines).at(-1)?.trim() === "exit 0")
    return `${at} ends with "exit 0", so a check appended below it would never run — put "domainbook check --staged --message-file \\"$1\\"" above that line yourself, or move the hook aside and run this again`;
  return undefined;
}

function interpreter(line: string): string | undefined {
  if (!line.startsWith("#!")) return undefined;
  const words = line.slice(2).trim().split(/\s+/);
  const named = words[0]?.endsWith("env") === true ? words[1] : words[0];
  const language = named?.split("/").at(-1);
  if (language === undefined || shells.includes(language)) return undefined;
  return language;
}

function hookFile(repo: string): string {
  return `${hooksDir(repo)}/commit-msg`;
}
