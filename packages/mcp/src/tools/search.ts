import type { Book, DomainRecord } from "@domainbook/core";
import { adrRef, live, tdrRef } from "@domainbook/core";
import { type Answer, said } from "../answer.js";
import { text } from "../files.js";

export type Kind =
  | "roadmap"
  | "glossary"
  | "changelog"
  | "domain"
  | "feature"
  | "decision"
  | "debt";

type Source = { kind: Kind; file: string; domain?: string; id: string };

type Hit = { source: Source; line: number; excerpt: string };

const cap = 20;

export function searchBook(
  book: Book,
  query: string,
  asked: { kind?: Kind; domain?: string }
): Answer {
  const wanted = query.trim().toLowerCase();
  if (wanted === "") return said("there is nothing to search for");
  const sources = searchable(book).filter(
    (source) =>
      (asked.kind === undefined || source.kind === asked.kind) &&
      (asked.domain === undefined || source.domain === asked.domain)
  );
  const hits = sources.flatMap((source) => matches(source, wanted));
  if (hits.length === 0) return said(`nothing in this book matches "${query}"`);
  const shown = hits.slice(0, cap);
  const artifacts = new Set(hits.map((hit) => hit.source.file)).size;
  return said(
    ...shown.map(written),
    "",
    `${artifacts} artifact${artifacts === 1 ? "" : "s"} matched${
      hits.length > shown.length ? `, showing the first ${cap} lines` : ""
    }.`
  );
}

function written(hit: Hit): string {
  const where =
    hit.source.domain === undefined ? "the book" : hit.source.domain;
  return `- ${hit.source.kind} ${hit.source.id} (${where}) — ${hit.source.file}:${hit.line}\n  ${hit.excerpt}`;
}

function matches(source: Source, wanted: string): Hit[] {
  const found: Hit[] = [];
  const lines = text(source.file).split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    if (!line.toLowerCase().includes(wanted)) continue;
    found.push({
      source,
      line: index + 1,
      excerpt: line.trim().slice(0, 160),
    });
    if (found.length === 3) break;
  }
  return found;
}

function searchable(book: Book): Source[] {
  return [
    ...(book.roadmap === undefined
      ? []
      : [{ kind: "roadmap" as const, file: book.roadmap.file, id: "roadmap" }]),
    ...(book.glossary === undefined
      ? []
      : [
          {
            kind: "glossary" as const,
            file: book.glossary.file,
            id: "glossary",
          },
        ]),
    ...(book.changelog === undefined
      ? []
      : [
          {
            kind: "changelog" as const,
            file: book.changelog.file,
            id: "changelog",
          },
        ]),
    ...book.decisions.filter(live).map((one) => ({
      kind: "decision" as const,
      file: one.file,
      id: adrRef(one),
    })),
    ...book.debt.map((one) => ({
      kind: "debt" as const,
      file: one.file,
      id: tdrRef(one),
    })),
    ...book.domains.flatMap(within),
  ];
}

function within(domain: DomainRecord): Source[] {
  return [
    { kind: "domain", file: domain.file, domain: domain.id, id: domain.id },
    ...(domain.glossary === undefined
      ? []
      : [
          {
            kind: "glossary" as const,
            file: domain.glossary.file,
            domain: domain.id,
            id: `${domain.id}/glossary`,
          },
        ]),
    ...(domain.changelog === undefined
      ? []
      : [
          {
            kind: "changelog" as const,
            file: domain.changelog.file,
            domain: domain.id,
            id: `${domain.id}/changelog`,
          },
        ]),
    ...domain.features.map((one) => ({
      kind: "feature" as const,
      file: one.file,
      domain: domain.id,
      id: one.frontmatter.id,
    })),
    ...domain.decisions.filter(live).map((one) => ({
      kind: "decision" as const,
      file: one.file,
      domain: domain.id,
      id: adrRef(one),
    })),
    ...domain.debt.map((one) => ({
      kind: "debt" as const,
      file: one.file,
      domain: domain.id,
      id: tdrRef(one),
    })),
  ];
}
