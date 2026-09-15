import { readdirSync } from "node:fs";
import { join } from "node:path";
import { git, lines, records } from "../git.js";
import { type Claim, listClaims } from "./claims.js";
import { isNumbered, type Key, pathOf } from "./keys.js";
import { defaultBranch, type Me, type Remote } from "./remote.js";

export type Source = {
  kind: "draft" | "branch";
  ref: string;
  commit: string;
  email: string;
  author: string;
  branch: string;
  when: number;
};

export type Holder = {
  kind: "draft" | "branch" | "claim" | "default";
  email: string;
  branch: string;
};

export type Ledger = {
  remote: Remote;
  me: Me;
  base: string | undefined;
  others: Source[];
  claims: Claim[];
  numbers: Map<string, number[]>;
  present: Map<string, boolean>;
};

const numbered = /^(\d+)-.*\.md$/u;

export function sources(remote: Remote): Source[] {
  const base = defaultBranch(remote);
  const found = records(
    git(remote.repo, [
      "for-each-ref",
      "--format=%(refname)%00%(objectname)%00%(authoremail:trim)%00%(committerdate:unix)%01",
      `refs/remotes/${remote.name}`,
      "refs/domainbook/drafts",
    ]).out
  );
  const all: Source[] = [];
  for (const [ref = "", commit = "", email = "", when = "0"] of found) {
    const draft = draftParts(ref);
    if (draft !== undefined) {
      all.push({ kind: "draft", ref, commit, email, when: Number(when), ...draft });
      continue;
    }
    const branch = ref.slice(`refs/remotes/${remote.name}/`.length);
    if (branch === "HEAD" || `${remote.name}/${branch}` === base) continue;
    all.push({ kind: "branch", ref, commit, email, author: "", branch, when: Number(when) });
  }
  return all;
}

export function others(remote: Remote, me: Me): Source[] {
  return sources(remote).filter((one) => !mine(one, me));
}

export function ledgerOf(remote: Remote, me: Me): Ledger {
  return {
    remote,
    me,
    base: defaultBranch(remote),
    others: others(remote, me),
    claims: listClaims(remote),
    numbers: new Map(),
    present: new Map(),
  };
}

export function numbersOn(ledger: Ledger, ref: string, logDir: string): number[] {
  const at = `${ref} ${logDir}`;
  const hit = ledger.numbers.get(at);
  if (hit !== undefined) return hit;
  const found = readNumbers(ledger.remote, ref, logDir);
  ledger.numbers.set(at, found);
  return found;
}

export function holds(ledger: Ledger, ref: string, path: string): boolean {
  const at = `${ref} ${path}`;
  const hit = ledger.present.get(at);
  if (hit !== undefined) return hit;
  const there =
    git(ledger.remote.repo, [
      "cat-file",
      "-e",
      `${ref}:${ledger.remote.book}/${path}`,
    ]).code === 0;
  ledger.present.set(at, there);
  return there;
}

export function takenNumbers(ledger: Ledger, logDir: string): number[] {
  const taken = new Set<number>();
  if (ledger.base !== undefined)
    for (const one of numbersOn(ledger, ledger.base, logDir)) taken.add(one);
  for (const source of ledger.others)
    for (const one of numbersOn(ledger, source.ref, logDir)) taken.add(one);
  const prefix = `${logDir}/`;
  for (const claim of ledger.claims)
    if (claim.key.startsWith(prefix)) {
      const digits = claim.key.slice(prefix.length);
      if (/^\d{4}$/u.test(digits)) taken.add(Number(digits));
    }
  return [...taken].sort((one, other) => one - other);
}

export function holdersOf(ledger: Ledger, key: Key): Holder[] {
  const found: Holder[] = [];
  if (ledger.base !== undefined && onDefault(ledger, key))
    found.push({ kind: "default", email: "", branch: ledger.base });
  for (const claim of ledger.claims)
    if (claim.key === key.key && !own(ledger, claim))
      found.push({ kind: "claim", email: claim.email, branch: claim.branch ?? "" });
  for (const source of ledger.others)
    if (sourceHolds(ledger, source, key))
      found.push({ kind: source.kind, email: source.email, branch: source.branch });
  return found;
}

export function holderOf(ledger: Ledger, key: Key): Holder | undefined {
  return holdersOf(ledger, key)[0];
}

export function onDefault(ledger: Ledger, key: Key): boolean {
  if (ledger.base === undefined) return false;
  return isNumbered(key)
    ? numbersOn(ledger, ledger.base, key.logDir).includes(key.number)
    : holds(ledger, ledger.base, pathOf(key));
}

export function nextFree(ledger: Ledger, logDir: string): number {
  const known = [...localNumbers(ledger.remote, logDir), ...takenNumbers(ledger, logDir)];
  return known.length === 0 ? 1 : Math.max(...known) + 1;
}

export function localNumbers(remote: Remote, logDir: string): number[] {
  let names: string[];
  try {
    names = readdirSync(join(remote.repo, remote.book, logDir));
  } catch {
    return [];
  }
  return names
    .map((name) => Number(numbered.exec(name)?.[1] ?? Number.NaN))
    .filter((one) => !Number.isNaN(one));
}

function sourceHolds(ledger: Ledger, source: Source, key: Key): boolean {
  return isNumbered(key)
    ? numbersOn(ledger, source.ref, key.logDir).includes(key.number)
    : holds(ledger, source.ref, pathOf(key));
}

function own(ledger: Ledger, claim: Claim): boolean {
  return claim.email === ledger.me.email && claim.branch === ledger.me.branch;
}

function readNumbers(remote: Remote, ref: string, logDir: string): number[] {
  const listed = git(remote.repo, [
    "ls-tree",
    "--name-only",
    `${ref}:${remote.book}/${logDir}/`,
  ]);
  return lines(listed.out)
    .map((name) => Number(numbered.exec(name)?.[1] ?? Number.NaN))
    .filter((one) => !Number.isNaN(one));
}

function mine(one: Source, me: Me): boolean {
  if (me.branch === undefined) return false;
  if (one.kind === "draft") return one.author === me.author && one.branch === me.branch;
  return one.branch === me.branch;
}

function draftParts(ref: string): { author: string; branch: string } | undefined {
  const prefix = "refs/domainbook/drafts/";
  if (!ref.startsWith(prefix)) return undefined;
  const rest = ref.slice(prefix.length);
  const slash = rest.indexOf("/");
  if (slash < 0) return undefined;
  return { author: rest.slice(0, slash), branch: rest.slice(slash + 1) };
}
