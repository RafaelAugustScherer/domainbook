import { loadBook, type Book, type Issue } from "@domainbook/core";
import type { Loader } from "astro/loaders";
import { bookEntry } from "./entries/book.js";
import { changelogEntries } from "./entries/changelog.js";
import { domainEntries } from "./entries/domain.js";
import { featureEntries } from "./entries/feature.js";
import { debtEntries, decisionEntries } from "./entries/log.js";
import { termEntries } from "./entries/term.js";
import type { Entry, Render } from "./entries/types.js";
import { linked, resolver } from "./refs.js";

export const loaderName = "domainbook";

export type Kind =
  | "book"
  | "domains"
  | "features"
  | "decisions"
  | "debt"
  | "terms"
  | "changelogs";

export function fromBook(root: string, base: string, kind: Kind): Loader {
  return {
    name: loaderName,
    async load(context) {
      const { book, issues } = loadBook(root);
      const resolve = resolver(book, base);
      const render: Render = async (markdown) =>
        markdown.trim() === ""
          ? ""
          : linked((await context.renderMarkdown(markdown)).html, resolve);
      context.store.clear();
      for (const entry of await entriesOf(kind, book, issues, render))
        context.store.set({
          id: entry.id,
          data: await context.parseData({ id: entry.id, data: entry.data }),
        });
    },
  };
}

async function entriesOf(
  kind: Kind,
  book: Book,
  issues: Issue[],
  render: Render
): Promise<Entry[]> {
  if (kind === "book") return [await bookEntry(book, { issues }, render)];
  if (kind === "domains") return domainEntries(book, { issues }, render);
  if (kind === "features") return featureEntries(book, render);
  if (kind === "decisions") return decisionEntries(book, render);
  if (kind === "debt") return debtEntries(book, render);
  if (kind === "terms") return termEntries(book, render);
  return changelogEntries(book, render);
}
