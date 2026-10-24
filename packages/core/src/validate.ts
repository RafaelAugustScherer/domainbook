import { checkBook } from "./check.js";
import { type Loaded, loadBook } from "./load.js";

export function validateBook(root: string): Loaded {
  const loaded = loadBook(root);
  return {
    book: loaded.book,
    issues: [...loaded.issues, ...checkBook(loaded.book)],
    changelogs: loaded.changelogs,
  };
}
