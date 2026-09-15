import { git, records } from "../git.js";
import type { Remote } from "./remote.js";
import { fetchAll, push, type Reached } from "./transport.js";

export type Claim = {
  key: string;
  ref: string;
  commit: string;
  email: string;
  branch: string | undefined;
  title: string | undefined;
  when: number;
};

export type Claimed =
  | { kind: "claimed" }
  | { kind: "taken"; by: Claim | undefined }
  | { kind: "unreachable"; tried: string[]; reason: string };

const prefix = "refs/domainbook/claims/";

export function claimRef(key: string): string {
  const leaf = isDomain(key) ? `${key}/index` : key;
  return `${prefix}${leaf}`;
}

export function listClaims(remote: Remote): Claim[] {
  const found = records(
    git(remote.repo, [
      "for-each-ref",
      "--format=%(subject)%00%(refname)%00%(objectname)%00%(authoremail:trim)%00%(authordate:unix)%00%(trailers:key=branch,valueonly)%00%(trailers:key=title,valueonly)%01",
      "refs/domainbook/claims",
    ]).out
  );
  return found.map(([subject = "", ref = "", commit = "", email = "", when = "0", branch = "", title = ""]) => ({
    key: subject.slice("claim ".length),
    ref,
    commit,
    email,
    branch: branch === "" ? undefined : branch,
    title: title === "" ? undefined : title,
    when: Number(when),
  }));
}

export function findClaim(remote: Remote, key: string): Claim | undefined {
  return listClaims(remote).find((one) => one.key === key);
}

export function makeClaim(
  remote: Remote,
  key: string,
  title: string,
  branch: string | undefined
): Claimed {
  const tree = git(remote.repo, ["mktree"], undefined).out.trim() || emptyTree(remote);
  const message = [`claim ${key}`, "", `branch: ${branch ?? ""}`, `title: ${title}`].join("\n");
  const commit = git(remote.repo, ["commit-tree", tree, "-m", message]).out.trim();
  const pushed = push(remote, [`${commit}:${claimRef(key)}`], false);
  if (pushed.kind === "ok") {
    git(remote.repo, ["update-ref", claimRef(key), commit]);
    return { kind: "claimed" };
  }
  if (pushed.kind === "unreachable") return pushed;
  fetchAll(remote);
  return { kind: "taken", by: findClaim(remote, key) };
}

export function releaseClaims(remote: Remote, keys: string[]): Reached | undefined {
  if (keys.length === 0) return undefined;
  const pushed = push(remote, keys.map((key) => `:${claimRef(key)}`), false);
  if (pushed.kind === "ok")
    for (const key of keys) git(remote.repo, ["update-ref", "-d", claimRef(key)]);
  return pushed;
}

function isDomain(key: string): boolean {
  return key.startsWith("domains/") && !key.slice("domains/".length).includes("/");
}

function emptyTree(remote: Remote): string {
  return git(remote.repo, ["hash-object", "-t", "tree", "/dev/null"]).out.trim();
}
