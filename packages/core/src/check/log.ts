import type { Issue } from "../issue.js";
import { debtLog, decisionLog, type LogNaming } from "../log.js";
import type { Book, DecisionRecord, LogFile } from "../model.js";
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

type Titled = { file: string; number: number; title: string };

type Log = {
  id?: string;
  kind: LogNaming;
  records: Titled[];
  files: LogFile[];
};

type DecisionLog = { id?: string; records: DecisionRecord[] };

const superseded = "superseded by ";

export function checkLogs(book: Book): Issue[] {
  return [
    ...logsOf(book).flatMap((log) => [
      ...checkNumbers(book, log),
      ...checkTitles(log),
    ]),
    ...decisionLogsOf(book).flatMap((log) => checkSupersedes(book, log)),
  ];
}

function logsOf(book: Book): Log[] {
  const logs: Log[] = [
    { kind: decisionLog, records: book.decisions, files: book.decisionFiles },
    { kind: debtLog, records: book.debt, files: book.debtFiles },
  ];
  for (const domain of book.domains)
    logs.push(
      {
        id: domain.id,
        kind: decisionLog,
        records: domain.decisions,
        files: domain.decisionFiles,
      },
      {
        id: domain.id,
        kind: debtLog,
        records: domain.debt,
        files: domain.debtFiles,
      }
    );
  return logs;
}

function decisionLogsOf(book: Book): DecisionLog[] {
  return [
    { records: book.decisions },
    ...book.domains.map((domain) => ({
      id: domain.id,
      records: domain.decisions,
    })),
  ];
}

function checkNumbers(book: Book, log: Log): Issue[] {
  const issues: Issue[] = [];
  const seen = new Map<number, LogFile>();
  const { ref, one: kind } = log.kind;
  let free = highest(log.files) + 1;
  for (const one of log.files) {
    if (one.number < 1) {
      issues.push({
        file: one.file,
        message: `${ref}-${pad(
          one.number
        )} is below 0001 — ${kind} numbers run from 0001, so renumber this one to ${pad(
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
      message: `${ref}-${pad(one.number)} is already ${inBook(
        book,
        twin.file
      )} — ${kind} numbers are never reused; renumber this one to ${pad(free)}`,
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
        message: `${ref}-${pad(expected)} is missing from ${logDir(
          log.kind.dir,
          log.id
        )} — ${kind} numbers run from 0001 with no gaps, and a ${kind} is never deleted`,
      });
    expected = one.number + 1;
  }
  return issues;
}

function checkTitles(log: Log): Issue[] {
  const issues: Issue[] = [];
  for (const record of log.records) {
    const at = { file: record.file };
    const filename = basename(record.file);
    if (record.title === "") {
      const unnamed = notNfc(at, filename) ?? notNfkc(at, filename);
      if (unnamed !== undefined) issues.push(unnamed);
      continue;
    }
    const slugged = termSlug(record.title);
    if (slugged === "") {
      issues.push({
        ...at,
        message: `the title "${record.title}" gives no filename — a ${
          log.kind.one
        } filename is its number and its title in letters and digits, so rename to "${pad(
          record.number
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
    const wanted = `${pad(record.number)}-${slugged}.md`;
    if (filename !== wanted)
      issues.push({
        file: record.file,
        message: `the filename does not match the title "${record.title}" — rename to "${wanted}"`,
      });
  }
  return issues;
}

function checkSupersedes(book: Book, log: DecisionLog): Issue[] {
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
          "decisions",
          undefined
        )}, not ${logDir("decisions", log.id)} — write "${
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

function highest(files: LogFile[]): number {
  return Math.max(0, ...files.map((one) => one.number));
}
