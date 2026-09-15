import type { Book, DomainRecord } from "@domainbook/core";
import { adrRef, live, peerPath, tdrRef } from "@domainbook/core";
import { type Answer, said } from "../answer.js";
import { text } from "../files.js";
import { alone, footer, home, marked, type Peers, touched } from "../peers.js";

export type Kind =
  | "roadmap"
  | "glossary"
  | "changelog"
  | "domain"
  | "feature"
  | "decision"
  | "debt";

type Located = { kind: Kind; file: string; domain?: string; id: string };

type Source = Located & { shown: string; note?: string };

type Hit = { source: Source; line: number; excerpt: string };

const cap = 20;

export function searchBook(
  book: Book,
  query: string,
  asked: { kind?: Kind; domain?: string },
  peers: Peers = alone
): Answer {
  const wanted = query.trim().toLowerCase();
  if (wanted === "") return said("there is nothing to search for");
  const kept = (source: Source) =>
    (asked.kind === undefined || source.kind === asked.kind) &&
    (asked.domain === undefined || source.domain === asked.domain);
  const known = local(book)
    .filter(kept)
    .flatMap((source) => matches(source, wanted));
  const drafted = fromPeers(book, peers)
    .filter(kept)
    .flatMap((source) => matches(source, wanted))
    .filter((hit) => !known.some((one) => repeats(one, hit)));
  const hits = [...known, ...drafted];
  if (hits.length === 0)
    return said(`nothing in this book matches "${query}"`, ...footer(peers));
  const shown = hits.slice(0, cap);
  const artifacts = new Set(hits.map((hit) => hit.source.file)).size;
  return said(
    ...shown.map(written),
    "",
    `${artifacts} artifact${artifacts === 1 ? "" : "s"} matched${
      hits.length > shown.length ? `, showing the first ${cap} lines` : ""
    }.`,
    ...footer(peers)
  );
}

function local(book: Book): Source[] {
  return searchable(book).map((one) => ({ ...one, shown: one.file }));
}

function fromPeers(book: Book, peers: Peers): Source[] {
  return peers.work.flatMap((peer) => {
    const writing = touched(peer);
    return searchable(peer.book)
      .filter((one) => writing.has(peerPath(peer.root, one.file)))
      .map((one) => ({
        ...one,
        shown: home(book, peer, one.file),
        note: marked(peer),
      }));
  });
}

function repeats(known: Hit, hit: Hit): boolean {
  return known.source.shown === hit.source.shown && known.excerpt === hit.excerpt;
}

function written(hit: Hit): string {
  const where =
    hit.source.domain === undefined ? "the book" : hit.source.domain;
  const note = hit.source.note === undefined ? "" : `\n  ${hit.source.note}`;
  return `- ${hit.source.kind} ${hit.source.id} (${where}) — ${hit.source.shown}:${hit.line}\n  ${hit.excerpt}${note}`;
}

function matches(source: Source, wanted: string): Hit[] {
  const found: Hit[] = [];
  const lines = text(source.file).split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    if (!line.toLowerCase().includes(wanted)) continue;
    found.push({
      source,
      line: index + 1,
      excerpt: line.trim().slice(0, 160),
    });
    if (found.length === 3) break;
  }
  return found;
}

function searchable(book: Book): Located[] {
  return [
    ...(book.roadmap === undefined
      ? []
      : [{ kind: "roadmap" as const, file: book.roadmap.file, id: "roadmap" }]),
    ...(book.glossary === undefined
      ? []
      : [
          {
            kind: "glossary" as const,
            file: book.glossary.file,
            id: "glossary",
          },
        ]),
    ...(book.changelog === undefined
      ? []
      : [
          {
            kind: "changelog" as const,
            file: book.changelog.file,
            id: "changelog",
          },
        ]),
    ...book.decisions.filter(live).map((one) => ({
      kind: "decision" as const,
      file: one.file,
      id: adrRef(one),
    })),
    ...book.debt.map((one) => ({
      kind: "debt" as const,
      file: one.file,
      id: tdrRef(one),
    })),
    ...book.domains.flatMap(within),
  ];
}

function within(domain: DomainRecord): Located[] {
  return [
    { kind: "domain", file: domain.file, domain: domain.id, id: domain.id },
    ...(domain.glossary === undefined
      ? []
      : [
          {
            kind: "glossary" as const,
            file: domain.glossary.file,
            domain: domain.id,
            id: `${domain.id}/glossary`,
          },
        ]),
    ...(domain.changelog === undefined
      ? []
      : [
          {
            kind: "changelog" as const,
            file: domain.changelog.file,
            domain: domain.id,
            id: `${domain.id}/changelog`,
          },
        ]),
    ...domain.features.map((one) => ({
      kind: "feature" as const,
      file: one.file,
      domain: domain.id,
      id: one.frontmatter.id,
    })),
    ...domain.decisions.filter(live).map((one) => ({
      kind: "decision" as const,
      file: one.file,
      domain: domain.id,
      id: adrRef(one),
    })),
    ...domain.debt.map((one) => ({
      kind: "debt" as const,
      file: one.file,
      domain: domain.id,
      id: tdrRef(one),
    })),
  ];
}
