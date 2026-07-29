import { fileURLToPath } from "node:url";

export type ValidBook = { dir: string; proves: string };

export const validBooksDir = fileURLToPath(new URL("./", import.meta.url));

export const validBooks: ValidBook[] = [
  {
    dir: "mirrored-relationship",
    proves:
      "both ends may declare one relationship when they agree — same type, opposite directions",
  },
  {
    dir: "gherkin-rule-keyword",
    proves:
      "a gherkin block may carry its examples under gherkin's own Rule: keyword",
  },
  {
    dir: "book-level-supersede",
    proves:
      'a bare "superseded by ADR-NNNN" in the book-level log names that log, so a book-level chain resolves',
  },
];
