import { close, createIndex } from "pagefind";
import {
  loadBook,
  type Book,
  type DomainRecord,
  type GlossaryRecord,
} from "@domainbook/core";
import { bodyOf } from "./body.js";
import {
  changelogPath,
  debtPath,
  decisionPath,
  domainPath,
  featurePath,
  termPath,
} from "./paths.js";

export type Indexed = {
  url: string;
  title: string;
  kind: string;
  context: string;
  content: string;
};

export const bundle = "pagefind";

const shared = "the book";

type Logged = { number: number; title: string; file: string };

export function indexed(book: Book): Indexed[] {
  return [
    ...book.domains.flatMap((domain) => ofDomain(domain)),
    ...ofBook(book),
  ];
}

function ofDomain(domain: DomainRecord): Indexed[] {
  const context = domain.frontmatter?.name ?? domain.id;
  return [
    {
      url: domainPath(domain.id),
      title: context,
      kind: "domain",
      context,
      content: bodyOf(domain.file),
    },
    ...domain.features.map((feature) => ({
      url: featurePath(domain.id, feature.frontmatter.id),
      title: feature.frontmatter.name,
      kind: "feature",
      context,
      content: bodyOf(feature.file),
    })),
    ...ofLog(domain.decisions, "decision", context, domain.id),
    ...ofLog(domain.debt, "debt record", context, domain.id),
    ...ofGlossary(domain.glossary, context, domain.id),
    ...ofChangelog(domain.changelog?.file, context, domain.id),
  ];
}

function ofBook(book: Book): Indexed[] {
  const roadmap = book.roadmap;
  return [
    ...ofLog(book.decisions, "decision", shared, undefined),
    ...ofLog(book.debt, "debt record", shared, undefined),
    ...ofGlossary(book.glossary, shared, undefined),
    ...ofChangelog(book.changelog?.file, shared, undefined),
    ...(roadmap === undefined
      ? []
      : [
          {
            url: "/roadmap/",
            title: "Roadmap",
            kind: "roadmap",
            context: shared,
            content: bodyOf(roadmap.file),
          },
        ]),
  ];
}

function ofLog(
  records: Logged[],
  kind: string,
  context: string,
  domain: string | undefined
): Indexed[] {
  const at = kind === "decision" ? decisionPath : debtPath;
  return records.map((record) => ({
    url: at(domain, record.number),
    title: record.title,
    kind,
    context,
    content: bodyOf(record.file),
  }));
}

function ofGlossary(
  glossary: GlossaryRecord | undefined,
  context: string,
  domain: string | undefined
): Indexed[] {
  return (glossary?.terms ?? []).map((term) => ({
    url: termPath(domain, term.slug),
    title: term.name,
    kind: "term",
    context,
    content: [term.name, ...(term.aliases ?? []), term.definition].join("\n"),
  }));
}

function ofChangelog(
  file: string | undefined,
  context: string,
  domain: string | undefined
): Indexed[] {
  if (file === undefined) return [];
  return [
    {
      url: changelogPath(domain),
      title: domain === undefined ? "Changelog" : `${context} changelog`,
      kind: "changelog",
      context,
      content: bodyOf(file),
    },
  ];
}

export async function buildIndex(
  root: string,
  write: string | undefined
): Promise<Map<string, Uint8Array>> {
  const { book } = loadBook(root);
  const { index } = await createIndex({ keepIndexUrl: true });
  const files = new Map<string, Uint8Array>();
  if (index === undefined) return files;
  for (const record of indexed(book))
    await index.addCustomRecord({
      url: record.url,
      content: record.content,
      language: "en",
      meta: {
        title: record.title,
        kind: record.kind,
        context: record.context,
      },
    });
  if (write === undefined)
    for (const file of (await index.getFiles()).files)
      files.set(file.path, file.content);
  else await index.writeFiles({ outputPath: write });
  await close();
  return files;
}
