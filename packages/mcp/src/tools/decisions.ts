import type { Book, DecisionRecord } from "@domainbook/core";
import {
  adrRef,
  findDecision,
  live,
  opening,
  sectionNamed,
} from "@domainbook/core";
import { type Answer, refuse, said } from "../answer.js";
import { text } from "../files.js";
import { type Asked, scoped } from "../scope.js";

export function getDecisions(
  book: Book,
  asked: {
    domain?: string;
    paths?: string[];
    ids?: string[];
    all?: boolean;
  }
): Answer {
  if (asked.ids !== undefined && asked.ids.length > 0)
    return bodies(book, asked.ids);
  const found = scope(book, asked);
  if ("refusal" in found) return refuse(found.refusal);
  const [first, ...rest] = found.records.filter(live);
  if (first === undefined) return said("no live decisions in that scope");
  return said(
    ...[first, ...rest].map((record) => `- ${indexed(record)}`),
    "",
    `Read one in full with get_decisions and its id, as ids: ["${adrRef(
      first
    )}"].`
  );
}

function scope(
  book: Book,
  asked: Asked
): { records: DecisionRecord[] } | { refusal: string } {
  return scoped(
    book,
    asked,
    (domain) => domain.decisions,
    book.decisions,
    "name a domain, the paths you are changing, or the ids you want — or pass all to read every decision in the book"
  );
}

function bodies(book: Book, ids: string[]): Answer {
  const found = ids.map((id) => ({ id, record: findDecision(book, id) }));
  const missing = found.filter((one) => one.record === undefined);
  if (missing.length > 0)
    return refuse(...missing.map((one) => absent(book, one.id)));
  return said(
    found
      .flatMap((one) =>
        one.record === undefined ? [] : [text(one.record.file)]
      )
      .join("\n\n---\n\n")
  );
}

function absent(book: Book, id: string): string {
  const domain = id.includes("/") ? id.split("/")[0] : undefined;
  const log =
    domain === undefined
      ? book.decisions
      : book.domains.find((one) => one.id === domain)?.decisions ?? [];
  const last = log.at(-1);
  const number = id.split("ADR-").at(-1) ?? id;
  const dir =
    domain === undefined
      ? `${book.root}/decisions/`
      : `${book.root}/domains/${domain}/decisions/`;
  if (last === undefined)
    return `no ADR-${number} in ${dir} — that log is empty`;
  return `no ADR-${number} in ${dir} — that log runs to ${adrRef(last)
    .split("/")
    .at(-1)}`;
}

function indexed(record: DecisionRecord): string {
  const outcome = opening(sectionNamed(record.file, "Decision Outcome"));
  const where = record.domain ?? "the book";
  const head = `${adrRef(record)} — ${record.title} (${
    record.frontmatter.status
  }, ${record.frontmatter.date}, ${where})`;
  return outcome === "" ? head : `${head}\n  ${outcome}`;
}
