import {
  adrRef,
  findDecision,
  supersededBy,
  type Book,
  type DecisionRecord,
} from "@domainbook/core";

export type Link = { ref: string; title: string };

export function replacedBy(
  book: Book,
  record: DecisionRecord
): Link | undefined {
  const ref = supersededBy(record);
  if (ref === undefined) return undefined;
  const found = findDecision(book, ref);
  return { ref, title: found?.title ?? "" };
}

export function replaces(book: Book, record: DecisionRecord): Link[] {
  const ref = adrRef(record);
  return logOf(book, record)
    .filter((one) => supersededBy(one) === ref)
    .map((one) => ({ ref: adrRef(one), title: one.title }));
}

export function chainOf(book: Book, record: DecisionRecord): Link[] {
  const seen = new Set<string>();
  const before: Link[] = [];
  let older = replaces(book, record)[0];
  while (older !== undefined && !seen.has(older.ref)) {
    seen.add(older.ref);
    before.unshift(older);
    const found = findDecision(book, older.ref);
    older = found === undefined ? undefined : replaces(book, found)[0];
  }
  const after: Link[] = [];
  let newer = replacedBy(book, record);
  while (newer !== undefined && !seen.has(newer.ref)) {
    seen.add(newer.ref);
    after.push(newer);
    const found = findDecision(book, newer.ref);
    newer = found === undefined ? undefined : replacedBy(book, found);
  }
  if (before.length === 0 && after.length === 0) return [];
  return [...before, { ref: adrRef(record), title: record.title }, ...after];
}

function logOf(book: Book, record: DecisionRecord): DecisionRecord[] {
  if (record.domain === undefined) return book.decisions;
  return book.domains.find((one) => one.id === record.domain)?.decisions ?? [];
}
