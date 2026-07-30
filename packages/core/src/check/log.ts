import type { Issue } from "../issue.js";
import type { Book, DecisionFile, DecisionRecord } from "../model.js";
import { termSlug } from "../model.js";
import {
  basename,
  findDecision,
  inBook,
  logDir,
  notNfc,
  notNfkc,
  pad,
  tooLong,
} from "./common.js";

type Log = { id?: string; records: DecisionRecord[]; files: DecisionFile[] };

const superseded = "superseded by ";

export function checkLogs(book: Book): Issue[] {
  const logs: Log[] = [
    { records: book.decisions, files: book.decisionFiles },
    ...book.domains.map((domain) => ({
      id: domain.id,
      records: domain.decisions,
      files: domain.decisionFiles,
    })),
  ];
  return logs.flatMap((log) => [
    ...checkNumbers(book, log),
    ...checkTitles(log),
    ...checkSupersedes(book, log),
  ]);
}

function checkNumbers(book: Book, log: Log): Issue[] {
  const issues: Issue[] = [];
  const seen = new Map<number, DecisionFile>();
  let free = highest(log.files) + 1;
  for (const one of log.files) {
    if (one.number < 1) {
      issues.push({
        file: one.file,
        message: `ADR-${pad(
          one.number
        )} is below 0001 — decision numbers run from 0001, so renumber this one to ${pad(
          free
        )}`,
      });
      free += 1;
      continue;
    }
    const twin = seen.get(one.number);
    if (twin === undefined) {
      seen.set(one.number, one);
      continue;
    }
    issues.push({
      file: one.file,
      message: `ADR-${pad(one.number)} is already ${inBook(
        book,
        twin.file
      )} — decision numbers are never reused; renumber this one to ${pad(
        free
      )}`,
    });
    free += 1;
  }
  const ordered = [...seen.values()].sort(
    (one, other) => one.number - other.number
  );
  let expected = 1;
  for (const one of ordered) {
    for (; expected < one.number; expected += 1)
      issues.push({
        file: one.file,
        message: `ADR-${pad(expected)} is missing from ${logDir(
          log.id
        )} — decision numbers run from 0001 with no gaps, and an ADR is never deleted`,
      });
    expected = one.number + 1;
  }
  return issues;
}

function checkTitles(log: Log): Issue[] {
  const issues: Issue[] = [];
  for (const decision of log.records) {
    const at = { file: decision.file };
    const filename = basename(decision.file);
    if (decision.title === "") {
      const unnamed = notNfc(at, filename) ?? notNfkc(at, filename);
      if (unnamed !== undefined) issues.push(unnamed);
      continue;
    }
    const slugged = termSlug(decision.title);
    if (slugged === "") {
      issues.push({
        ...at,
        message: `the title "${
          decision.title
        }" gives no filename — a decision filename is its number and its title in letters and digits, so rename to "${pad(
          decision.number
        )}-your-title-here.md"`,
      });
      continue;
    }
    const unwritable =
      notNfkc(at, slugged) ??
      tooLong(at, slugged) ??
      notNfc(at, filename) ??
      notNfkc(at, filename);
    if (unwritable !== undefined) {
      issues.push(unwritable);
      continue;
    }
    const wanted = `${pad(decision.number)}-${slugged}.md`;
    if (filename !== wanted)
      issues.push({
        file: decision.file,
        message: `the filename does not match the title "${decision.title}" — rename to "${wanted}"`,
      });
  }
  return issues;
}

function checkSupersedes(book: Book, log: Log): Issue[] {
  const issues: Issue[] = [];
  for (const decision of log.records) {
    const { status } = decision.frontmatter;
    if (!status.startsWith(superseded)) continue;
    const ref = status.slice(superseded.length);
    const at = {
      file: decision.file,
      line: decision.lines["status"],
      field: "status",
    };
    const unnormalized = notNfc(at, ref) ?? notNfkc(at, ref);
    if (unnormalized !== undefined) {
      issues.push(unnormalized);
      continue;
    }
    if (log.id !== undefined && !ref.includes("/")) {
      issues.push({
        ...at,
        message: `bare "${ref}" in a domain's own log means the book-level ${logDir(
          undefined
        )}, not ${logDir(log.id)} — write "${
          log.id
        }/${ref}" if you meant this domain's log`,
      });
      continue;
    }
    const missing = findDecision(book, ref);
    if (missing !== undefined)
      issues.push({
        ...at,
        message: `"${status}" names no decision — ${missing}`,
      });
  }
  return issues;
}

function highest(files: DecisionFile[]): number {
  return Math.max(0, ...files.map((one) => one.number));
}
