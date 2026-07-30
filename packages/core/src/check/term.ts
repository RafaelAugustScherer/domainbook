import type { Issue } from "../issue.js";
import type { Book } from "../model.js";
import { notNfc, notNfkc, tooLong } from "./common.js";

export function checkTerms(book: Book): Issue[] {
  const issues: Issue[] = [];
  const glossaries = [
    book.glossary,
    ...book.domains.map((domain) => domain.glossary),
  ];
  for (const glossary of glossaries) {
    if (glossary === undefined) continue;
    for (const term of glossary.terms) {
      const at = { file: glossary.file, line: term.line };
      const wrong =
        notNfc(at, term.name) ??
        notNfkc(at, term.slug) ??
        tooLong(at, term.slug);
      if (wrong !== undefined) issues.push(wrong);
    }
  }
  return issues;
}
