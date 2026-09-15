import type { Book, PeerWork, TermRecord } from "@domainbook/core";
import { peerPath, termSlug } from "@domainbook/core";
import { type Answer, listed, said } from "../answer.js";
import { alone, footer, home, marked, type Peers, touched } from "../peers.js";

type Glossary = {
  where: string;
  file: string;
  terms: TermRecord[];
  peer?: PeerWork;
};

type Found = {
  term: TermRecord;
  where: string;
  file: string;
  alias?: string;
  peer?: PeerWork;
};

export function explainTerms(
  book: Book,
  names: string[],
  domain?: string,
  peers: Peers = alone
): Answer {
  const glossaries = inScope(book, domain);
  if (glossaries.length === 0)
    return said(
      `this book has no glossary yet — "domainbook new domain" writes one per context, and ${book.root}/glossary.md holds the words every context shares`
    );
  if (names.length === 0) return said("there are no words to explain");
  const drafts = fromPeers(book, peers, domain);
  return said(
    names.map((name) => explained(book, glossaries, drafts, name)).join("\n\n"),
    ...footer(peers)
  );
}

function explained(
  book: Book,
  glossaries: Glossary[],
  drafts: Glossary[],
  name: string
): string {
  const wanted = termSlug(name);
  const found = glossaries.flatMap((glossary) =>
    glossary.terms.flatMap((term) => matched(glossary, term, wanted))
  );
  const drafted = drafts
    .flatMap((glossary) =>
      glossary.terms.flatMap((term) => matched(glossary, term, wanted))
    )
    .filter((one) => !found.some((known) => same(known, one)));
  if (found.length + drafted.length === 0) return unknown(glossaries, name);
  return [...found, ...drafted]
    .map((one) => written(book, one, name))
    .join("\n\n");
}

function same(known: Found, other: Found): boolean {
  return (
    known.where === other.where &&
    known.term.slug === other.term.slug &&
    known.term.definition === other.term.definition
  );
}

function matched(
  glossary: Glossary,
  term: TermRecord,
  wanted: string
): Found[] {
  const found = { term, where: glossary.where, file: glossary.file };
  const from = glossary.peer === undefined ? {} : { peer: glossary.peer };
  if (term.slug === wanted) return [{ ...found, ...from }];
  const alias = (term.aliases ?? []).find((one) => termSlug(one) === wanted);
  if (alias === undefined) return [];
  return [{ ...found, ...from, alias }];
}

function written(book: Book, found: Found, asked: string): string {
  const { term, peer } = found;
  return [
    `## ${term.name} — ${found.where}`,
    "",
    term.definition,
    "",
    found.alias === undefined
      ? undefined
      : `- "${asked}" is an alias of ${term.name}`,
    `- Status: ${term.status}`,
    term.aliases === undefined
      ? undefined
      : `- Aliases: ${term.aliases.join(", ")}`,
    ...(term.examples ?? []).map((one) => `- Example: ${one}`),
    `- Defined in ${found.file}:${term.line}`,
    peer === undefined
      ? usedBy(book, term.slug, (file) => file)
      : usedBy(peer.book, term.slug, (file) => home(book, peer, file)),
    peer === undefined ? undefined : `- ${marked(peer)}`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

function usedBy(
  book: Book,
  slug: string,
  shown: (file: string) => string
): string {
  const features = book.domains
    .flatMap((one) => one.features)
    .filter((feature) => (feature.frontmatter.terms ?? []).includes(slug));
  if (features.length === 0) return "- No feature references it";
  return `- Used by ${features
    .map((one) => `${one.frontmatter.id} (${shown(one.file)})`)
    .join(", ")}`;
}

function unknown(glossaries: { terms: TermRecord[] }[], name: string): string {
  const near = glossaries
    .flatMap((one) => one.terms.map((term) => term.name))
    .slice(0, 8);
  return [
    `no "${name}" in this book`,
    near.length === 0 ? undefined : `near it: ${listed(near)}`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

function fromPeers(
  book: Book,
  peers: Peers,
  domain: string | undefined
): Glossary[] {
  return peers.work.flatMap((peer) => {
    const writing = touched(peer);
    return inScope(peer.book, domain)
      .filter((one) => writing.has(peerPath(peer.root, one.file)))
      .map((one) => ({ ...one, file: home(book, peer, one.file), peer }));
  });
}

function inScope(book: Book, domain: string | undefined): Glossary[] {
  const rooted =
    book.glossary === undefined
      ? []
      : [
          {
            where: "the book",
            file: book.glossary.file,
            terms: book.glossary.terms,
          },
        ];
  const wanted =
    domain === undefined
      ? book.domains
      : book.domains.filter((one) => one.id === domain);
  const scoped = wanted.flatMap((one) =>
    one.glossary === undefined
      ? []
      : [{ where: one.id, file: one.glossary.file, terms: one.glossary.terms }]
  );
  return [...scoped, ...rooted];
}
