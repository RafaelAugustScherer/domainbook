import type { Book, PeerWork, Remote } from "@domainbook/core";
import {
  counted,
  findRemote,
  peerPath,
  peersOf,
  readState,
  sync,
  whoAmI,
} from "@domainbook/core";

export type Peers = { work: PeerWork[]; asOf: string | undefined };

export const alone: Peers = { work: [], asOf: undefined };

export function readPeers(root: string, book: Book): Peers {
  const remote = findRemote(root, book.config);
  if (remote === undefined) return alone;
  const report = sync(root, book.config, { force: false, renumber: false });
  const work =
    report.kind === "synced" ? report.peers : peersOf(remote, whoAmI(remote));
  return { work, asOf: dated(remote) };
}

export function drafted<T extends { file: string }>(
  peers: Peers,
  pick: (book: Book) => T[]
): { one: T; peer: PeerWork }[] {
  return peers.work.flatMap((peer) =>
    pick(peer.book)
      .filter((one) => peer.touched.has(peerPath(peer.root, one.file)))
      .map((one) => ({ one, peer }))
  );
}

export function home(book: Book, peer: PeerWork, file: string): string {
  return `${book.root}/${peerPath(peer.root, file)}`;
}

export function footer(peers: Peers): string[] {
  const lines = [
    ...peers.work.filter((peer) => peer.unreadable.length > 0).map(unreadable),
    peers.asOf,
  ].filter((line) => line !== undefined);
  return lines.length === 0 ? [] : ["", ...lines];
}

function unreadable(peer: PeerWork): string {
  return `${counted(peer.unreadable.length, "in-progress artifact")} from ${
    peer.peer.email
  } on ${peer.peer.branch} cannot be read yet`;
}

function dated(remote: Remote): string | undefined {
  const { attemptedAt, syncedAt } = readState(remote);
  if (syncedAt !== undefined && syncedAt >= (attemptedAt ?? 0)) return undefined;
  const when =
    syncedAt === undefined ? "peers unknown" : `peers as of ${clock(syncedAt)}`;
  return `${when} — ${remote.name} not reachable`;
}

function clock(ms: number): string {
  const at = new Date(ms);
  const hours = String(at.getHours()).padStart(2, "0");
  const minutes = String(at.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
