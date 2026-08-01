import type { Book, DomainRecord } from "@domainbook/core";
import { live } from "@domainbook/core";
import { changedAt, text } from "./files.js";

export type Listing = {
  uri: string;
  name: string;
  title: string;
  description: string;
  mimeType: string;
  annotations?: { lastModified?: string };
};

export const scheme = "domainbook://";

export function listing(book: Book): Listing[] {
  return offered(book).map((one) => ({
    uri: `${scheme}${inside(book, one.file)}`,
    name: inside(book, one.file),
    title: one.title,
    description: one.description,
    mimeType: "text/markdown",
    ...annotated(one.file),
  }));
}

export function read(book: Book, uri: string): string | undefined {
  if (!uri.startsWith(scheme)) return undefined;
  const within = uri.slice(scheme.length);
  if (within.includes("..")) return undefined;
  const source = text(`${book.root}/${within}`);
  return source === "" ? undefined : source;
}

function annotated(file: string): { annotations?: { lastModified: string } } {
  const at = changedAt(file);
  return at === undefined ? {} : { annotations: { lastModified: at } };
}

function inside(book: Book, file: string): string {
  return file.startsWith(`${book.root}/`)
    ? file.slice(book.root.length + 1)
    : file;
}

type Offered = { file: string; title: string; description: string };

function offered(book: Book): Offered[] {
  return [
    ...(book.roadmap === undefined
      ? []
      : [
          {
            file: book.roadmap.file,
            title: "Roadmap",
            description: "milestone index and the plan behind it",
          },
        ]),
    ...(book.glossary === undefined
      ? []
      : [
          {
            file: book.glossary.file,
            title: "Glossary",
            description: "the words every context in this book shares",
          },
        ]),
    ...(book.changelog === undefined
      ? []
      : [
          {
            file: book.changelog.file,
            title: "Changelog",
            description: "what changed across the whole book",
          },
        ]),
    ...book.decisions.filter(live).map((one) => ({
      file: one.file,
      title: one.title,
      description: `decision — ${one.frontmatter.status}, ${one.frontmatter.date}`,
    })),
    ...book.debt.map((one) => ({
      file: one.file,
      title: one.title,
      description: `debt record — ${one.frontmatter.status}, ${one.frontmatter.severity}`,
    })),
    ...book.domains.flatMap(artifactsOf),
  ];
}

function artifactsOf(domain: DomainRecord): Offered[] {
  const name = domain.frontmatter?.name ?? domain.id;
  return [
    {
      file: domain.file,
      title: `${name} — canvas`,
      description: `domain — the bounded context canvas for ${domain.id}`,
    },
    ...(domain.glossary === undefined
      ? []
      : [
          {
            file: domain.glossary.file,
            title: `${name} — glossary`,
            description: `glossary — the ubiquitous language of ${domain.id}`,
          },
        ]),
    ...(domain.changelog === undefined
      ? []
      : [
          {
            file: domain.changelog.file,
            title: `${name} — changelog`,
            description: `changelog — what changed in ${domain.id}`,
          },
        ]),
    ...domain.features.map((one) => ({
      file: one.file,
      title: one.frontmatter.name,
      description: `feature — ${one.frontmatter.status}, in ${domain.id}`,
    })),
    ...domain.decisions.filter(live).map((one) => ({
      file: one.file,
      title: one.title,
      description: `decision — ${one.frontmatter.status}, ${one.frontmatter.date}, in ${domain.id}`,
    })),
    ...domain.debt.map((one) => ({
      file: one.file,
      title: one.title,
      description: `debt record — ${one.frontmatter.status}, ${one.frontmatter.severity}, in ${domain.id}`,
    })),
  ];
}
