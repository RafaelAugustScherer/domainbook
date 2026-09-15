import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ago,
  findRemote,
  loadBook,
  peersOf,
  readPending,
  readState,
  sync,
  whoAmI,
  whoWhere,
  type PeerWork,
  type Remote,
  type SyncReport,
} from "@domainbook/core";
import { missingBook } from "./files.js";
import { alone, named } from "./remote.js";
import { refuse, type Result } from "./result.js";

export function status(root: string, path: string | undefined): Result {
  const missing = missingBook(root);
  if (missing !== undefined) return refuse(missing);
  const { config } = loadBook(root).book;
  const remote = findRemote(root, config);
  if (remote === undefined) return { code: 0, lines: [alone] };
  const report = sync(root, config, { force: false, renumber: false });
  const peers = peersOf(remote, whoAmI(remote));
  if (path !== undefined) return held(peers, inside(path, remote.book));
  return {
    code: 0,
    lines: [header(remote, report), ...listed(peers), ...waiting(remote)],
  };
}

function header(remote: Remote, report: SyncReport): string {
  const at = `domainbook: ${remote.name} (${remote.url})`;
  const synced = readState(remote).syncedAt;
  const fetched = synced === undefined ? undefined : ago(synced / 1000);
  if (report.kind !== "unreachable" && fetched !== undefined)
    return `${at}, synced ${fetched} ago`;
  return `${at}, not reachable — ${
    fetched === undefined
      ? "nothing fetched from it yet"
      : `showing what was fetched ${fetched} ago`
  }`;
}

function listed(peers: PeerWork[]): string[] {
  if (peers.length === 0) return ["in progress: nothing"];
  return [
    "in progress:",
    ...peers.flatMap((work) => [
      `  ${whoWhere(work.peer)}`,
      ...work.added.map((path) => entry("+", path, work)),
      ...work.changed.map((path) => entry("~", path, work)),
    ]),
  ];
}

function entry(mark: string, path: string, work: PeerWork): string {
  if (work.unreadable.includes(path)) return `    ? ${path} (cannot be read yet)`;
  return `    ${mark} ${path}`;
}

function waiting(remote: Remote): string[] {
  return readPending(remote).map(
    (pending) =>
      `pending: ${named(pending.path)} (${pending.path}) — not yet claimed`
  );
}

function held(peers: PeerWork[], path: string): Result {
  const lines = peers.flatMap((work) =>
    [...work.added, ...work.changed]
      .filter((one) => one === path || one.startsWith(path))
      .flatMap((one) => [
        `${one} — ${whoWhere(work.peer)}`,
        ...readFileSync(join(work.root, one), "utf8")
          .replace(/\n$/u, "")
          .split("\n"),
      ])
  );
  if (lines.length === 0) return refuse(`no peer is writing ${path}`);
  return { code: 0, lines };
}

function inside(path: string, book: string): string {
  return path.startsWith(`${book}/`) ? path.slice(book.length + 1) : path;
}
