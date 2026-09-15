import type { Book, DecisionRecord, PeerWork } from "@domainbook/core";
import {
  adrRef,
  findDecision,
  inProgress,
  live,
  opening,
  sectionNamed,
} from "@domainbook/core";
import { type Answer, refuse, said } from "../answer.js";
import { text } from "../files.js";
import { alone, drafted, footer, type Peers } from "../peers.js";
import { type Asked, scoped } from "../scope.js";

type Drafted = { record: DecisionRecord; peer: PeerWork };

export function getDecisions(
  book: Book,
  asked: {
    domain?: string;
    paths?: string[];
    ids?: string[];
    all?: boolean;
  },
  peers: Peers = alone
): Answer {
  if (asked.ids !== undefined && asked.ids.length > 0)
    return bodies(book, asked.ids, peers);
  const found = scope(book, asked);
  if ("refusal" in found) return refuse(found.refusal);
  const local = found.records.filter(live);
  const drafts = fromPeers(peers, asked);
  const [first] = [...local, ...drafts.map((one) => one.record)];
  if (first === undefined)
    return said("no live decisions in that scope", ...footer(peers));
  return said(
    ...local.map((record) => `- ${indexed(record)}`),
    ...drafts.map((one) => `- ${indexed(one.record)}\n  ${inProgress(one.peer.peer)}`),
    "",
    `Read one in full with get_decisions and its id, as ids: ["${adrRef(
      first
    )}"].`,
    ...footer(peers)
  );
}

function scope(
  book: Book,
  asked: Asked
): { records: DecisionRecord[] } | { refusal: string } {
  return scoped(
    book,
    asked,
    (domain) => domain.decisions,
    book.decisions,
    "name a domain, the paths you are changing, or the ids you want — or pass all to read every decision in the book"
  );
}

function fromPeers(peers: Peers, asked: Asked): Drafted[] {
  return drafted(peers, (book) => {
    const found = scope(book, asked);
    return "refusal" in found ? [] : found.records.filter(live);
  }).map(({ one, peer }) => ({ record: one, peer }));
}

function bodies(book: Book, ids: string[], peers: Peers): Answer {
  const found = ids.map((id) => ({ id, body: bodyOf(book, peers, id) }));
  const missing = found.filter((one) => one.body === undefined);
  if (missing.length > 0)
    return refuse(...missing.map((one) => absent(book, one.id)));
  return said(
    found.map((one) => one.body).join("\n\n---\n\n"),
    ...footer(peers)
  );
}

function bodyOf(book: Book, peers: Peers, id: string): string | undefined {
  const local = findDecision(book, id);
  if (local !== undefined) return text(local.file);
  const [found] = drafted(peers, (peerBook) => {
    const record = findDecision(peerBook, id);
    return record === undefined ? [] : [record];
  });
  if (found === undefined) return undefined;
  return `${inProgress(found.peer.peer)}\n\n${text(found.one.file)}`;
}

function absent(book: Book, id: string): string {
  const domain = id.includes("/") ? id.split("/")[0] : undefined;
  const log =
    domain === undefined
      ? book.decisions
      : book.domains.find((one) => one.id === domain)?.decisions ?? [];
  const last = log.at(-1);
  const number = id.split("ADR-").at(-1) ?? id;
  const dir =
    domain === undefined
      ? `${book.root}/decisions/`
      : `${book.root}/domains/${domain}/decisions/`;
  if (last === undefined)
    return `no ADR-${number} in ${dir} — that log is empty`;
  return `no ADR-${number} in ${dir} — that log runs to ${adrRef(last)
    .split("/")
    .at(-1)}`;
}

function indexed(record: DecisionRecord): string {
  const outcome = opening(sectionNamed(record.file, "Decision Outcome"));
  const where = record.domain ?? "the book";
  const head = `${adrRef(record)} — ${record.title} (${
    record.frontmatter.status
  }, ${record.frontmatter.date}, ${where})`;
  return outcome === "" ? head : `${head}\n  ${outcome}`;
}
