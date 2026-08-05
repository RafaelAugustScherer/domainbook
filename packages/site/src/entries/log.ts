import {
  adrRef,
  findDecision,
  opening,
  sectionNamed,
  tdrRef,
  type Book,
  type DebtRecord,
  type DecisionRecord,
} from "@domainbook/core";
import { bodyOf, withoutTitle } from "../body.js";
import { folderOf, pad } from "../paths.js";
import { chainOf, replacedBy, replaces } from "../view/chain.js";
import type { Entry, Render } from "./types.js";

export async function decisionEntries(
  book: Book,
  render: Render
): Promise<Entry[]> {
  const records = [
    ...book.decisions,
    ...book.domains.flatMap((one) => one.decisions),
  ];
  return Promise.all(
    records.map(async (record) => ({
      id: idOf(record),
      data: {
        ...common(record, adrRef(record)),
        outcome: await render(
          opening(sectionNamed(record.file, "Decision Outcome"))
        ),
        supersedes: replaces(book, record),
        supersededBy: replacedBy(book, record),
        chain: chainOf(book, record),
        html: await render(withoutTitle(bodyOf(record.file))),
      },
    }))
  );
}

export async function debtEntries(
  book: Book,
  render: Render
): Promise<Entry[]> {
  const records = [...book.debt, ...book.domains.flatMap((one) => one.debt)];
  return Promise.all(
    records.map(async (record) => ({
      id: idOf(record),
      data: {
        ...common(record, tdrRef(record)),
        log: `${folderOf(record.file)}/`,
        traces: traced(book, record),
        html: await render(withoutTitle(bodyOf(record.file))),
      },
    }))
  );
}

function traced(book: Book, record: DebtRecord): Record<string, unknown>[] {
  return (record.frontmatter.decisions ?? []).map((ref) => {
    const found = findDecision(book, ref);
    return {
      ref,
      title: found?.title,
      domain: found?.domain,
      number: found?.number,
    };
  });
}

function common(
  record: DecisionRecord | DebtRecord,
  ref: string
): Record<string, unknown> {
  return {
    frontmatter: record.frontmatter,
    domain: record.domain,
    number: record.number,
    ref,
    title: record.title,
    file: record.file,
  };
}

function idOf(record: DecisionRecord | DebtRecord): string {
  return `${record.domain ?? "book"}/${pad(record.number)}`;
}
