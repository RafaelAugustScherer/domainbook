import type { Book, GlossaryRecord, TermRecord } from "@domainbook/core";
import { usedBy } from "../terms.js";
import type { Entry, Render } from "./types.js";

export async function termEntries(
  book: Book,
  render: Render
): Promise<Entry[]> {
  const glossaries: { domain: string | undefined; glossary: GlossaryRecord }[] =
    [
      ...(book.glossary === undefined
        ? []
        : [{ domain: undefined, glossary: book.glossary }]),
      ...book.domains.flatMap((one) =>
        one.glossary === undefined
          ? []
          : [{ domain: one.id, glossary: one.glossary }]
      ),
    ];
  const found = glossaries.flatMap((one) =>
    one.glossary.terms.map((term) => ({ domain: one.domain, term }))
  );
  return Promise.all(
    found.map((one) => entryOf(book, one.domain, one.term, render))
  );
}

async function entryOf(
  book: Book,
  domain: string | undefined,
  term: TermRecord,
  render: Render
): Promise<Entry> {
  return {
    id: `${domain ?? "book"}/${term.slug}`,
    data: {
      name: term.name,
      slug: term.slug,
      domain,
      status: term.status,
      aliases: term.aliases ?? [],
      definitionHtml: await render(term.definition),
      examplesHtml: await Promise.all((term.examples ?? []).map(render)),
      usedBy: usedBy(book, domain, term.slug),
      search: [term.name, ...(term.aliases ?? [])].join(" ").toLowerCase(),
    },
  };
}
