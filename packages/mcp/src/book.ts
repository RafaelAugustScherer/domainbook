import {
  type Book,
  formatIssue,
  missingBook,
  sortIssues,
  validateBook,
} from "@domainbook/core";

export type Opened = { book: Book } | { refusal: string };

const untrusted =
  'this book does not validate, so what it says cannot be trusted — run "domainbook validate" and fix what it names';

export function open(root: string): Opened {
  const missing = missingBook(root);
  if (missing !== undefined) return { refusal: missing };
  const { book, issues } = validateBook(root);
  if (issues.length === 0) return { book };
  const named = sortIssues(issues).slice(0, 10).map(formatIssue);
  const more =
    issues.length > named.length
      ? [`and ${issues.length - named.length} more`]
      : [];
  return { refusal: [untrusted, "", ...named, ...more].join("\n") };
}
