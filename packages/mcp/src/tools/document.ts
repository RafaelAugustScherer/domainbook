import type { Book } from "@domainbook/core";
import { checkChange } from "@domainbook/core";
import { type Answer, listed, refuse, said } from "../answer.js";
import { matchable, outsideRepo } from "../files.js";

const writingIn =
  "the canvas, the glossary, the changelog, a feature, a decision or a debt record";

export function whereToDocument(book: Book, paths: string[]): Answer {
  const wrong = paths.map(outsideRepo).filter((one) => one !== undefined);
  if (wrong.length > 0) return refuse(...wrong);
  if (paths.length === 0) return said("there are no paths to place");
  const change = checkChange(book, book.root, matchable(paths));
  const debt = change.debt.map(
    (note) =>
      `- ${note.ref} is open over ${listed(note.paths)} — read ${
        note.file
      } before you change this`
  );
  if (change.checked.length === 0)
    return said("nothing in this change is claimed by a domain", ...debt);
  if (change.stale.length === 0)
    return said(
      `the book already covers this change — ${listed(change.checked)} ${
        change.checked.length === 1 ? "has" : "have"
      } a book file in it`,
      ...(debt.length === 0 ? [] : ["", ...debt])
    );
  return said(
    ...change.stale.flatMap((stale) => [
      `## ${stale.id}`,
      "",
      `${listed(stale.paths)} ${
        stale.paths.length === 1 ? "belongs" : "belong"
      } to ${stale.id}.`,
      `Write in ${book.root}/domains/${stale.id}/ — ${writingIn} all count.`,
      "",
    ]),
    change.stale.length > 1
      ? `A decision under ${book.root}/decisions/ or an entry in ${
          book.root
        }/changelog.md clears ${listed(
          change.stale.map((one) => one.id)
        )} at once.`
      : undefined,
    ...debt
  );
}
