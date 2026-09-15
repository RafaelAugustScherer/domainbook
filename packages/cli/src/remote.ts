import {
  findRemote,
  keyOf,
  loadBook,
  pad,
  type Holder,
  type Key,
  type Remote,
} from "@domainbook/core";
import { rooted } from "./files.js";

export const alone = "domainbook: no remote, working alone";

export function remoteOf(root: string): Remote | undefined {
  return findRemote(root, loadBook(root).book.config);
}

export function named(path: string): string {
  const key = keyOf(path);
  return key === undefined ? path : nameOf(key);
}

export function whoOn(email: string, branch: string | undefined): string {
  return branch === undefined || branch === "" ? email : `${email} on ${branch}`;
}

export function byWhom(holder: Holder | undefined): string {
  if (holder === undefined) return "by a peer";
  if (holder.kind === "default") return `on ${holder.branch}`;
  return `by ${whoOn(holder.email, holder.branch)}`;
}

export function detachedLine(root: string): string {
  return `no branch is checked out, so this book is not published as a draft — check a branch out and run "${rooted(
    "domainbook sync",
    root
  )}" to publish it`;
}

export function unclaimed(name: string, remote: Remote, root: string): string {
  return `${name} is not claimed on ${
    remote.name
  } (could not reach it) — the next "${rooted(
    "domainbook sync",
    root
  )}" with the network up claims it, and the commit hook refuses the file until then`;
}

export function writtenBy(
  name: string,
  path: string,
  who: string,
  then: string,
  root: string
): string {
  return `${name} is already being written by ${who} — read it with "${rooted(
    `domainbook status ${path}`,
    root
  )}", then ${then}`;
}

function nameOf(key: Key): string {
  if (key.number === undefined)
    return key.key.slice(key.key.lastIndexOf("/") + 1);
  const ref = `${key.kind === "debt" ? "TDR" : "ADR"}-${pad(key.number)}`;
  return key.kind === "decision" && key.domain !== undefined
    ? `${key.domain}/${ref}`
    : ref;
}
