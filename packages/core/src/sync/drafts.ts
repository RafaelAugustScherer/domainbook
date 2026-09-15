import { git } from "../git.js";
import { localBranches, refExists, type Me, type Remote } from "./remote.js";
import { tempIndex } from "./state.js";
import { push, type Reached } from "./transport.js";

export type Published =
  | { kind: "published" }
  | { kind: "same" }
  | { kind: "detached" }
  | { kind: "unreachable"; tried: string[]; reason: string };

export function draftRef(author: string, branch: string): string {
  return `refs/domainbook/drafts/${author}/${branch}`;
}

export function bookTree(remote: Remote): string {
  const index = tempIndex(remote, "draft");
  const env = { GIT_INDEX_FILE: index };
  git(remote.repo, ["read-tree", "--empty"], env);
  git(remote.repo, ["add", "-A", "--", remote.book], env);
  return git(remote.repo, ["write-tree"], env).out.trim();
}

export function publishDraft(remote: Remote, me: Me): Published {
  if (me.branch === undefined) return { kind: "detached" };
  const ref = draftRef(me.author, me.branch);
  const tree = bookTree(remote);
  const before = git(remote.repo, ["rev-parse", `${ref}^{tree}`]);
  if (before.code === 0 && before.out.trim() === tree) return { kind: "same" };
  const commit = git(remote.repo, [
    "commit-tree",
    tree,
    "-m",
    `draft ${me.branch}`,
  ]).out.trim();
  const pushed = push(remote, [`${commit}:${ref}`], true);
  if (pushed.kind === "unreachable") return pushed;
  git(remote.repo, ["update-ref", ref, commit]);
  return { kind: "published" };
}

export function pruneOwnDrafts(remote: Remote, me: Me): string[] {
  const branches = new Set(localBranches(remote));
  const gone = git(remote.repo, [
    "for-each-ref",
    "--format=%(refname)",
    `refs/domainbook/drafts/${me.author}/`,
  ])
    .out.split("\n")
    .filter((ref) => ref !== "")
    .filter((ref) => !branches.has(ref.slice(draftRef(me.author, "").length)));
  if (gone.length === 0) return [];
  const pushed: Reached = push(remote, gone.map((ref) => `:${ref}`), false);
  if (pushed.kind !== "ok") return [];
  for (const ref of gone)
    if (refExists(remote, ref)) git(remote.repo, ["update-ref", "-d", ref]);
  return gone.map((ref) => ref.slice(draftRef(me.author, "").length));
}
