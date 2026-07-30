import type { Issue } from "../issue.js";
import type { Book, DomainRecord, FeatureRecord } from "../model.js";
import {
  basename,
  findDecision,
  inBook,
  notNfc,
  notNfkc,
  orSetId,
  tooLong,
} from "./common.js";

export function checkFeatures(book: Book): Issue[] {
  const issues: Issue[] = [];
  for (const domain of book.domains)
    for (const feature of domain.features)
      issues.push(
        ...checkFeatureTerms(book, domain, feature),
        ...checkFeatureDecisions(book, feature),
        ...checkFeatureId(feature)
      );
  return issues;
}

function checkFeatureTerms(
  book: Book,
  domain: DomainRecord,
  feature: FeatureRecord
): Issue[] {
  const issues: Issue[] = [];
  const glossaries = [domain.glossary, book.glossary].filter(
    (glossary) => glossary !== undefined
  );
  for (const [index, term] of (feature.frontmatter.terms ?? []).entries()) {
    const field = `terms[${index}]`;
    const at = { file: feature.file, line: feature.lines[field], field };
    const unnormalized = notNfc(at, term) ?? notNfkc(at, term);
    if (unnormalized !== undefined) {
      issues.push(unnormalized);
      continue;
    }
    if (
      glossaries.some((glossary) =>
        glossary.terms.some((one) => one.slug === term)
      )
    )
      continue;
    issues.push({ ...at, message: noTerm(book, domain, glossaries, term) });
  }
  return issues;
}

function noTerm(
  book: Book,
  domain: DomainRecord,
  glossaries: { file: string }[],
  term: string
): string {
  if (glossaries.length === 0)
    return `no term "${term}" — neither ${domain.id} nor this book has a glossary.md`;
  const files = glossaries
    .map((glossary) => inBook(book, glossary.file))
    .join(" or ");
  return `no term "${term}" in ${files}`;
}

function checkFeatureDecisions(book: Book, feature: FeatureRecord): Issue[] {
  const issues: Issue[] = [];
  for (const [index, ref] of (feature.frontmatter.decisions ?? []).entries()) {
    const field = `decisions[${index}]`;
    const at = { file: feature.file, line: feature.lines[field], field };
    const unnormalized = notNfc(at, ref) ?? notNfkc(at, ref);
    if (unnormalized !== undefined) {
      issues.push(unnormalized);
      continue;
    }
    const missing = findDecision(book, ref);
    if (missing !== undefined)
      issues.push({ ...at, message: `no decision "${ref}" — ${missing}` });
  }
  return issues;
}

function checkFeatureId(feature: FeatureRecord): Issue[] {
  const filename = basename(feature.file);
  const onDisk = { file: feature.file };
  const unnamed = notNfc(onDisk, filename) ?? notNfkc(onDisk, filename);
  const at = { file: feature.file, line: feature.lines["id"], field: "id" };
  const id = feature.frontmatter.id;
  const wrong = notNfc(at, id) ?? notNfkc(at, id) ?? tooLong(at, id);
  const issues = [unnamed, wrong].filter((issue) => issue !== undefined);
  const name = filename.replace(/\.md$/, "");
  if (issues.length > 0 || id === name) return issues;
  return [
    {
      ...at,
      message: `"${id}" does not match the filename "${name}" — rename the file to "${id}.md"${orSetId(
        name
      )}`,
    },
  ];
}
