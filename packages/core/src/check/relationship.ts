import type { Issue } from "../issue.js";
import type { Book, DomainRecord } from "../model.js";
import { inBook, notNfc, notNfkc } from "./common.js";

type Declared = {
  domain: DomainRecord;
  index: number;
  with: string;
  type: string;
  direction?: string;
};

export function checkRelationships(book: Book): Issue[] {
  const issues: Issue[] = [];
  const declared: Declared[] = [];
  for (const domain of book.domains)
    for (const [index, relationship] of (
      domain.frontmatter?.relationships ?? []
    ).entries()) {
      const wrong = badPartner(book, domain, index, relationship.with);
      if (wrong !== undefined) {
        issues.push(wrong);
        continue;
      }
      declared.push({
        domain,
        index,
        with: relationship.with,
        type: relationship.type,
        direction:
          "direction" in relationship ? relationship.direction : undefined,
      });
    }
  return [...issues, ...mirrorIssues(book, declared)];
}

function badPartner(
  book: Book,
  domain: DomainRecord,
  index: number,
  partner: string
): Issue | undefined {
  const at = {
    file: domain.file,
    line: domain.lines[`relationships[${index}].with`],
    field: `relationships[${index}].with`,
  };
  const unnormalized = notNfc(at, partner) ?? notNfkc(at, partner);
  if (unnormalized !== undefined) return unnormalized;
  if (partner === domain.id)
    return {
      ...at,
      message: `"${domain.id}" is this domain — a relationship names another domain`,
    };
  const ids = book.domains.map((one) => one.id).sort();
  if (!ids.includes(partner))
    return {
      ...at,
      message: `no domain "${partner}" in this book — domains are ${ids.join(
        ", "
      )}`,
    };
  return undefined;
}

function mirrorIssues(book: Book, declared: Declared[]): Issue[] {
  const issues: Issue[] = [];
  const pairs = new Map<string, Declared[]>();
  for (const one of declared) {
    const key = [one.domain.id, one.with].sort().join(" ");
    pairs.set(key, [...(pairs.get(key) ?? []), one]);
  }
  for (const group of pairs.values()) {
    const seen: Declared[] = [];
    for (const one of group) {
      if (seen.some((other) => other.domain.file === one.domain.file)) {
        issues.push({
          ...at(one, "with"),
          message: `"${one.with}" is declared twice on this page — a relationship is declared once`,
        });
        continue;
      }
      for (const other of seen) issues.push(...contradiction(book, other, one));
      seen.push(one);
    }
  }
  return issues;
}

function at(one: Declared, key: string) {
  return {
    file: one.domain.file,
    line: one.domain.lines[`relationships[${one.index}].${key}`],
    field: `relationships[${one.index}].${key}`,
  };
}

function contradiction(book: Book, held: Declared, mirror: Declared): Issue[] {
  if (mirror.type !== held.type)
    return [
      {
        ...at(held, "type"),
        message: `"${held.type}" contradicts "${
          mirror.type
        }" declared in ${inBook(
          book,
          mirror.domain.file
        )} — mirrored declarations of the same relationship must agree`,
      },
    ];
  if (held.direction !== undefined && held.direction === mirror.direction)
    return [
      {
        ...at(held, "direction"),
        message: `both sides are "${held.direction}" — ${inBook(
          book,
          mirror.domain.file
        )} declares the mirror, so one of the two is "${opposite(
          held.direction
        )}"`,
      },
    ];
  return [];
}

function opposite(direction: string): string {
  return direction === "upstream" ? "downstream" : "upstream";
}
