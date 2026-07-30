import { formatIssue, sortIssues, validateBook } from "@domainbook/core";
import type { Result } from "./result.js";

export function validate(root: string): Result {
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
  return {
    code: 0,
    lines: [
      `${book.root} is a valid book — ${counted(
        book.domains.length,
        "domain"
      )}, ${counted(features, "feature")}, ${counted(
        decisions,
        "decision"
      )}, ${counted(terms, "term")}`,
    ],
  };
}

function counted(total: number, thing: string): string {
  return `${total} ${thing}${total === 1 ? "" : "s"}`;
}
