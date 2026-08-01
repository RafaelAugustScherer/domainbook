import type { Book, DomainRecord } from "@domainbook/core";
import { checkChange } from "@domainbook/core";
import { listed } from "./answer.js";
import { matchable } from "./files.js";

export function named(
  book: Book,
  id: string
): { domain: DomainRecord } | { refusal: string } {
  const domain = book.domains.find((one) => one.id === id);
  if (domain !== undefined) return { domain };
  return { refusal: noDomain(book, id) };
}

export function noDomain(book: Book, id: string): string {
  return `no domain "${id}" in this book — it holds ${listed(
    book.domains.map((one) => one.id)
  )}`;
}

export type Asked = { domain?: string; paths?: string[]; all?: boolean };

export function scoped<T>(
  book: Book,
  asked: Asked,
  of: (domain: DomainRecord) => T[],
  rooted: T[],
  needs: string
): { records: T[] } | { refusal: string } {
  if (asked.all === true)
    return { records: [...rooted, ...book.domains.flatMap(of)] };
  if (asked.domain !== undefined) {
    const found = named(book, asked.domain);
    return "refusal" in found ? found : { records: of(found.domain) };
  }
  if (asked.paths !== undefined && asked.paths.length > 0) {
    const within = claiming(book, asked.paths);
    return "refusal" in within
      ? within
      : { records: within.domains.flatMap(of) };
  }
  return { refusal: needs };
}

function claiming(
  book: Book,
  paths: string[]
): { domains: DomainRecord[] } | { refusal: string } {
  const within = new Set(
    checkChange(book, book.root, matchable(paths)).checked
  );
  if (within.size === 0) return { refusal: unclaimed };
  return { domains: book.domains.filter((one) => within.has(one.id)) };
}

const unclaimed =
  "no domain claims those paths — name a domain instead, or pass all to read the whole book";
