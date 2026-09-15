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
  {
    dir: "japanese-slugs",
    proves:
      "a book written in Japanese names its domains, terms, features, and decisions in its own language, and references resolve across them",
  },
  {
    dir: "logs-with-gaps",
    proves:
      "a log's numbers may skip — 0001 then 0003 in a decision log and in both debt logs — because a number is never reused and an abandoned claim leaves one behind",
  },
];
