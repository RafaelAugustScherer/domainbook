import { readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import {
  checkChange,
  validateBook,
  type Book,
  type Change,
} from "@domainbook/core";
import { missingBook, rooted } from "./files.js";
import {
  messageTrailers,
  rangePaths,
  rangeTrailers,
  reaches,
  repoRoot,
  stagedPaths,
  stamp,
  statusOf,
  type Status,
  type Trailer,
} from "./git.js";
import { refuse, type Result } from "./result.js";

export type Source =
  | { kind: "staged"; messageFile?: string }
  | { kind: "range"; range: string }
  | { kind: "session"; file: string };

type Read =
  | { kind: "staged"; messageFile?: string }
  | { kind: "range"; base: string; head: string }
  | { kind: "session"; file: string };

type Waiver =
  | { kind: "none" }
  | { kind: "waived"; line: string }
  | { kind: "refused"; line: string };

const noRepo =
  'there is no git repo here — "domainbook check" reads what git knows about the change, so run this from inside the repo the book documents';

const shallow =
  "this checkout does not reach the base commit, so the range cannot be read — set fetch-depth to 0 on the checkout step, and run this again";

const noMessage =
  'this run read no commit message, so a waiver on it could not be seen — the commit-msg hook passes one, and "domainbook check --staged --message-file <file>" does too';

const stamped = "human bypass";

export function check(root: string, source: Source): Result {
  const repo = repoRoot();
  if (repo === undefined) return refuse(noRepo);
  const missing = missingBook(root);
  if (missing !== undefined) return refuse(missing);
  const { book, issues } = validateBook(root);
  if (issues.length > 0)
    return refuse(
      `domainbook: this book does not validate, so the code it claims cannot be trusted — run "${rooted(
        "domainbook validate",
        root
      )}" and fix what it names, then commit again`
    );
  const read = readOf(source, repo);
  if (typeof read === "string") return refuse(read);
  const bookPath = relative(repo, resolve(root));
  const change = checkChange(book, bookPath, pathsOf(repo, read, bookPath));
  return report(book, bookPath, change, repo, read);
}

function readOf(source: Source, repo: string): Read | string {
  if (source.kind !== "range") return source;
  const [base, head] = source.range.split(/\.{2,3}/);
  if (base === undefined || head === undefined || base === "" || head === "")
    return `"${source.range}" is not a commit range — write it as "<base>..<head>", naming the commit the branch started from and the one it ends at`;
  if (!reaches(repo, base, head)) return shallow;
  return { kind: "range", base, head };
}

function pathsOf(repo: string, read: Read, bookPath: string): string[] {
  if (read.kind === "staged") return stagedPaths(repo);
  if (read.kind === "range") return rangePaths(repo, read.base, read.head);
  const touched = new Set(
    recorded(read.file).map((line) => relative(repo, resolve(repo, line)))
  );
  return statusOf(repo)
    .map((one) => one.path)
    .filter((path) => touched.has(path) || path.startsWith(`${bookPath}/`));
}

function recorded(file: string): string[] {
  try {
    return readFileSync(file, "utf8")
      .split("\n")
      .filter((line) => line !== "");
  } catch {
    return [];
  }
}

function report(
  book: Book,
  bookPath: string,
  change: Change,
  repo: string,
  read: Read
): Result {
  const { mode, trailer } = book.config.enforcement;
  const debt = change.debt.map(
    (note) =>
      `${note.ref} is open over ${named(note.paths)} — read ${
        note.file
      } before you change this`
  );
  if (change.stale.length === 0)
    return { code: 0, lines: [passed(read, change.checked), ...debt] };
  const waiver = waive(book, repo, read);
  if (waiver.kind === "waived")
    return { code: 0, lines: [waiver.line, ...debt] };
  const status = read.kind === "staged" ? statusOf(repo) : [];
  const blocked = change.stale.flatMap((one) => [
    `${one.id}: ${named(one.paths)} changed and ${bookPath}/domains/${
      one.id
    }/ did not — update that domain's book (canvas, glossary, changelog, a feature, a decision, or a debt record), or waive this commit with a "${trailer}: <reason>" trailer`,
    ...nearMisses(status, `${bookPath}/domains/${one.id}`),
  ]);
  if (waiver.kind === "refused") blocked.push(waiver.line);
  else if (read.kind === "staged" && read.messageFile === undefined)
    blocked.push(noMessage);
  return { code: mode === "warn" ? 0 : 1, lines: [...blocked, ...debt] };
}

function waive(book: Book, repo: string, read: Read): Waiver {
  const { trailer, require_reason: reason } = book.config.enforcement;
  const agent = process.env.CLAUDECODE === "1";
  const found = waiverTrailer(repo, read, trailer);
  if (found !== undefined)
    return fromTrailer(found, trailer, agent || reason === "always");
  if (read.kind !== "staged" || process.env.SKIP_DOCS !== "1")
    return { kind: "none" };
  if (agent)
    return refused(
      `SKIP_DOCS=1 waives without a reason, and this shell is an agent's — write the reason in a "${trailer}: <reason>" trailer on this commit instead`
    );
  if (reason === "always")
    return refused(
      `SKIP_DOCS=1 waives without a reason, and this book sets enforcement.require_reason to always — write the reason in a "${trailer}: <reason>" trailer on this commit instead`
    );
  if (read.messageFile === undefined) return { kind: "none" };
  stamp(repo, read.messageFile, { key: trailer, value: stamped });
  return {
    kind: "waived",
    line: `domainbook: waived — ${trailer}: ${stamped}`,
  };
}

function fromTrailer(found: Trailer, trailer: string, strict: boolean): Waiver {
  if (found.value !== "")
    return {
      kind: "waived",
      line: `domainbook: waived — ${found.key}: ${found.value}`,
    };
  if (!strict)
    return { kind: "waived", line: `domainbook: waived — ${found.key}:` };
  return refused(
    `the "${trailer}" trailer on this commit carries no reason — write what makes this change safe to leave undocumented, as in "${trailer}: renamed a private helper, no behaviour changed"`
  );
}

function refused(line: string): Waiver {
  return { kind: "refused", line };
}

function waiverTrailer(
  repo: string,
  read: Read,
  key: string
): Trailer | undefined {
  const found = trailersOf(repo, read, key);
  return found.find((one) => one.key.toLowerCase() === key.toLowerCase());
}

function trailersOf(repo: string, read: Read, key: string): Trailer[] {
  if (read.kind === "range")
    return rangeTrailers(repo, read.base, read.head, key);
  if (read.kind === "staged" && read.messageFile !== undefined)
    return messageTrailers(repo, read.messageFile);
  return [];
}

function nearMisses(status: Status[], folder: string): string[] {
  return status
    .filter((one) => one.unstaged && one.path.startsWith(`${folder}/`))
    .map(
      (one) =>
        `${one.path} is edited but not staged — "git add ${one.path}" clears this`
    )
    .sort();
}

function passed(read: Read, checked: string[]): string {
  const verb = read.kind === "staged" ? "staged" : "changed";
  if (checked.length === 0)
    return `domainbook: nothing ${verb} that a domain claims`;
  return `domainbook: ${checked.length} domain${
    checked.length === 1 ? "" : "s"
  } checked, nothing stale`;
}

function named(paths: string[]): string {
  if (paths.length > 3)
    return `${paths.slice(0, 3).join(", ")} and ${paths.length - 3} more`;
  if (paths.length === 1) return paths.join("");
  return `${paths.slice(0, -1).join(", ")} and ${paths.slice(-1).join("")}`;
}
