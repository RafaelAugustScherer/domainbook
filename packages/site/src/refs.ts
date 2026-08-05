import { adrRef, type Book } from "@domainbook/core";
import { decisionPath } from "./paths.js";

const reference = /(?:[a-z0-9][a-z0-9-]{0,62}\/)?ADR-\d{4}/gu;

const opaque = /^<\/?(?:a|pre|script|style)\b/iu;

type Piece = { tag: boolean; text: string };

export type Resolve = (ref: string) => string | undefined;

export function resolver(book: Book, base: string): Resolve {
  const known = new Map<string, string>();
  for (const record of book.decisions)
    known.set(
      adrRef(record),
      joined(base, decisionPath(undefined, record.number))
    );
  for (const domain of book.domains)
    for (const record of domain.decisions)
      known.set(
        adrRef(record),
        joined(base, decisionPath(domain.id, record.number))
      );
  return (ref) => known.get(ref);
}

export function linked(html: string, resolve: Resolve): string {
  let out = "";
  let inside = 0;
  for (const piece of pieces(html)) {
    if (!piece.tag) {
      out += inside > 0 ? piece.text : anchored(piece.text, resolve);
      continue;
    }
    out += piece.text;
    if (opaque.test(piece.text))
      inside = Math.max(0, inside + (piece.text[1] === "/" ? -1 : 1));
  }
  return out;
}

function* pieces(html: string): Generator<Piece> {
  let read = 0;
  while (read < html.length) {
    const open = html.indexOf("<", read);
    if (open === -1) {
      yield { tag: false, text: html.slice(read) };
      return;
    }
    if (open > read) yield { tag: false, text: html.slice(read, open) };
    const shut = html.indexOf(">", open);
    const end = shut === -1 ? html.length : shut + 1;
    yield { tag: true, text: html.slice(open, end) };
    read = end;
  }
}

function anchored(text: string, resolve: Resolve): string {
  return text.replace(reference, (ref) => {
    const url = resolve(ref);
    return url === undefined ? ref : `<a href="${url}">${ref}</a>`;
  });
}

function joined(base: string, path: string): string {
  return `${base.replace(/\/$/, "")}${path}`;
}
