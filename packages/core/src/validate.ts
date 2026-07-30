import { checkBook } from "./check.js";
import type { Issue } from "./issue.js";
import { loadBook } from "./load.js";
import type { Book } from "./model.js";

export function validateBook(root: string): { book: Book; issues: Issue[] } {
  const loaded = loadBook(root);
  return {
    book: loaded.book,
    issues: [...loaded.issues, ...checkBook(loaded.book)],
  };
}
