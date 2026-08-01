import type { Book, FeatureRecord, TermRecord } from "@domainbook/core";
import { termSlug } from "@domainbook/core";
import { type Answer, listed, said } from "../answer.js";

type Found = { term: TermRecord; where: string; file: string; alias?: string };

export function explainTerms(
  book: Book,
  names: string[],
  domain?: string
): Answer {
  const glossaries = inScope(book, domain);
  if (glossaries.length === 0)
    return said(
      `this book has no glossary yet — "domainbook new domain" writes one per context, and ${book.root}/glossary.md holds the words every context shares`
    );
  if (names.length === 0) return said("there are no words to explain");
  return said(
    names.map((name) => explained(book, glossaries, name)).join("\n\n")
  );
}

function explained(
  book: Book,
  glossaries: { where: string; file: string; terms: TermRecord[] }[],
  name: string
): string {
  const wanted = termSlug(name);
  const found = glossaries.flatMap((glossary) =>
    glossary.terms.flatMap((term) => matched(glossary, term, wanted))
  );
  if (found.length === 0) return unknown(glossaries, name);
  return found.map((one) => written(book, one, name)).join("\n\n");
}

function matched(
  glossary: { where: string; file: string },
  term: TermRecord,
  wanted: string
): Found[] {
  if (term.slug === wanted) return [{ term, ...glossary }];
  const alias = (term.aliases ?? []).find((one) => termSlug(one) === wanted);
  if (alias === undefined) return [];
  return [{ term, ...glossary, alias }];
}

function written(book: Book, found: Found, asked: string): string {
  const { term } = found;
  return [
    `## ${term.name} — ${found.where}`,
    "",
    term.definition,
    "",
    found.alias === undefined
      ? undefined
      : `- "${asked}" is an alias of ${term.name}`,
    `- Status: ${term.status}`,
    term.aliases === undefined
      ? undefined
      : `- Aliases: ${term.aliases.join(", ")}`,
    ...(term.examples ?? []).map((one) => `- Example: ${one}`),
    `- Defined in ${found.file}:${term.line}`,
    using(book, term.slug),
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

function using(book: Book, slug: string): string {
  const features = book.domains
    .flatMap((one) => one.features)
    .filter((feature) => (feature.frontmatter.terms ?? []).includes(slug));
  if (features.length === 0) return "- No feature references it";
  return `- Used by ${features.map(named).join(", ")}`;
}

function named(feature: FeatureRecord): string {
  return `${feature.frontmatter.id} (${feature.file})`;
}

function unknown(glossaries: { terms: TermRecord[] }[], name: string): string {
  const near = glossaries
    .flatMap((one) => one.terms.map((term) => term.name))
    .slice(0, 8);
  return [
    `no "${name}" in this book`,
    near.length === 0 ? undefined : `near it: ${listed(near)}`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

function inScope(
  book: Book,
  domain: string | undefined
): { where: string; file: string; terms: TermRecord[] }[] {
  const rooted =
    book.glossary === undefined
      ? []
      : [
          {
            where: "the book",
            file: book.glossary.file,
            terms: book.glossary.terms,
          },
        ];
  const wanted =
    domain === undefined
      ? book.domains
      : book.domains.filter((one) => one.id === domain);
  const scoped = wanted.flatMap((one) =>
    one.glossary === undefined
      ? []
      : [{ where: one.id, file: one.glossary.file, terms: one.glossary.terms }]
  );
  return [...scoped, ...rooted];
}
