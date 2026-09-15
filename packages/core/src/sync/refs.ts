import { git, lines, records } from "../git.js";
import { listClaims } from "./claims.js";
import { numberKey } from "./keys.js";
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

export function numbersOn(remote: Remote, ref: string, logDir: string): number[] {
  const listed = git(remote.repo, [
    "ls-tree",
    "--name-only",
    `${ref}:${remote.book}/${logDir}/`,
  ]);
  return lines(listed.out)
    .map((name) => Number(numbered.exec(name)?.[1] ?? Number.NaN))
    .filter((one) => !Number.isNaN(one));
}

export function takenNumbers(remote: Remote, logDir: string, me: Me): number[] {
  const taken = new Set<number>();
  const base = defaultBranch(remote);
  if (base !== undefined)
    for (const one of numbersOn(remote, base, logDir)) taken.add(one);
  for (const source of others(remote, me))
    for (const one of numbersOn(remote, source.ref, logDir)) taken.add(one);
  const prefix = `${logDir}/`;
  for (const claim of listClaims(remote))
    if (claim.key.startsWith(prefix)) {
      const digits = claim.key.slice(prefix.length);
      if (/^\d{4}$/u.test(digits)) taken.add(Number(digits));
    }
  return [...taken].sort((one, other) => one - other);
}

export function holds(remote: Remote, ref: string, path: string): boolean {
  return (
    git(remote.repo, ["cat-file", "-e", `${ref}:${remote.book}/${path}`]).code ===
    0
  );
}

export function holdersOf(remote: Remote, path: string, key: string, me: Me): Holder[] {
  const found: Holder[] = [];
  const base = defaultBranch(remote);
  if (base !== undefined && holds(remote, base, path))
    found.push({ kind: "default", email: "", branch: base });
  for (const source of others(remote, me))
    if (holds(remote, source.ref, path))
      found.push({ kind: source.kind, email: source.email, branch: source.branch });
  for (const claim of listClaims(remote))
    if (claim.key === key && !(claim.email === me.email && claim.branch === me.branch))
      found.push({ kind: "claim", email: claim.email, branch: claim.branch ?? "" });
  return found;
}

export function onDefault(remote: Remote, key: string, logDir: string | undefined, number: number | undefined): boolean {
  const base = defaultBranch(remote);
  if (base === undefined) return false;
  if (logDir !== undefined && number !== undefined)
    return numbersOn(remote, base, logDir).includes(number);
  const path = key.startsWith("domains/") && !key.includes("/features/") ? `${key}/index.md` : `${key}.md`;
  return holds(remote, base, path);
}

export function holderOfNumber(
  remote: Remote,
  logDir: string,
  number: number,
  me: Me
): Holder | undefined {
  const claim = listClaims(remote).find((one) => one.key === numberKey(logDir, number));
  if (claim !== undefined)
    return { kind: "claim", email: claim.email, branch: claim.branch ?? "" };
  for (const source of others(remote, me))
    if (numbersOn(remote, source.ref, logDir).includes(number))
      return { kind: source.kind, email: source.email, branch: source.branch };
  const base = defaultBranch(remote);
  if (base !== undefined && numbersOn(remote, base, logDir).includes(number))
    return { kind: "default", email: "", branch: base };
  return undefined;
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
