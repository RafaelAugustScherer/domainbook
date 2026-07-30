import type { Issue } from "../issue.js";
import type { Book } from "../model.js";
import { checkDecisionRefs } from "./common.js";

export function checkDebt(book: Book): Issue[] {
  return [
    ...book.debt,
    ...book.domains.flatMap((domain) => domain.debt),
  ].flatMap((record) =>
    checkDecisionRefs(book, record, record.frontmatter.decisions ?? [])
  );
}
