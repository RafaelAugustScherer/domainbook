import {
  formatIssue,
  loadBook,
  sortIssues,
  validateBook,
} from "@domainbook/core";
import { missingBook, remove } from "./files.js";
import type { Result } from "./result.js";

export function validate(root: string, fix: boolean): Result {
  const deleted: string[] = [];
  if (fix && missingBook(root) === undefined) {
    for (const file of loadBook(root).changelogs) {
      const failed = remove(file);
      if (failed !== undefined)
        return { code: 1, lines: [...deleted, failed] };
      deleted.push(`deleted ${file}`);
    }
  }
  const checked = validated(root);
  return { code: checked.code, lines: [...deleted, ...checked.lines] };
}

function validated(root: string): Result {
  const { book, issues } = validateBook(root);
  if (issues.length > 0)
    return { code: 1, lines: sortIssues(issues).map(formatIssue) };
  const features = book.domains.reduce(
    (total, domain) => total + domain.features.length,
    0
  );
  const decisions = book.domains.reduce(
    (total, domain) => total + domain.decisions.length,
    book.decisions.length
  );
  const terms = book.domains.reduce(
    (total, domain) => total + (domain.glossary?.terms.length ?? 0),
    book.glossary?.terms.length ?? 0
  );
  const debt = book.domains.reduce(
    (total, domain) => total + domain.debt.length,
    book.debt.length
  );
  return {
    code: 0,
    lines: [
      `${book.root} is a valid book — ${counted(
        book.domains.length,
        "domain"
      )}, ${counted(features, "feature")}, ${counted(
        decisions,
        "decision"
      )}, ${counted(terms, "term")}, ${counted(debt, "debt record")}`,
    ],
  };
}

function counted(total: number, thing: string): string {
  return `${total} ${thing}${total === 1 ? "" : "s"}`;
}
