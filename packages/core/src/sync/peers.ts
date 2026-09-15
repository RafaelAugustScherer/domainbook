import { existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { git, lines } from "../git.js";
import { loadBook } from "../load.js";
import type { Book } from "../model.js";
import { defaultBranch, type Me, type Remote } from "./remote.js";
import { others, type Source } from "./refs.js";
import { stateDir, tempIndex } from "./state.js";

export type PeerWork = {
  peer: Source;
  added: string[];
  changed: string[];
  touched: Set<string>;
  unreadable: string[];
  book: Book;
  root: string;
};

export function peersOf(remote: Remote, me: Me): PeerWork[] {
  const base = defaultBranch(remote);
  if (base === undefined) return [];
  const work: PeerWork[] = [];
  for (const peer of newest(others(remote, me))) {
    const { added, changed } = changesOf(remote, base, peer.commit);
    if (added.length + changed.length === 0) continue;
    const root = materialize(remote, peer.commit);
    const { book, issues } = loadBook(root);
    const broken = new Set(issues.map((issue) => peerPath(root, issue.file)));
    const touched = new Set([...added, ...changed]);
    const unreadable = [...touched].filter((path) => broken.has(path));
    work.push({ peer, added, changed, touched, unreadable, book, root });
  }
  return work.sort((one, other) => other.peer.when - one.peer.when);
}

export function peerPath(root: string, file: string): string {
  return relative(root, resolve(file)).split("\\").join("/");
}

export function materialize(remote: Remote, commit: string): string {
  const dir = join(stateDir(remote), "peers", commit);
  if (existsSync(join(dir, "roadmap.md"))) return dir;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const env = { GIT_INDEX_FILE: tempIndex(remote, "peer") };
  git(remote.repo, ["read-tree", `${commit}:${remote.book}`], env);
  git(remote.repo, ["checkout-index", "-a", `--prefix=${dir}/`], env);
  return dir;
}

export function pruneCache(remote: Remote, keep: string[]): void {
  const dir = join(stateDir(remote), "peers");
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir))
    if (!keep.includes(name))
      rmSync(join(dir, name), { recursive: true, force: true });
}

function changesOf(
  remote: Remote,
  base: string,
  commit: string
): { added: string[]; changed: string[] } {
  const added: string[] = [];
  const changed: string[] = [];
  const diff = git(remote.repo, [
    "diff",
    "--name-status",
    "--no-renames",
    base,
    commit,
    "--",
    remote.book,
  ]);
  for (const line of lines(diff.out)) {
    const [status = "", path = ""] = line.split("\t");
    const inside = path.slice(remote.book.length + 1);
    if (status === "A") added.push(inside);
    if (status === "M") changed.push(inside);
  }
  return { added, changed };
}

function newest(all: Source[]): Source[] {
  const kept = new Map<string, Source>();
  for (const one of all) {
    const id = `${one.email}\u0000${one.branch}`;
    const seen = kept.get(id);
    if (seen === undefined || seen.when < one.when) kept.set(id, one);
  }
  return [...kept.values()];
}
