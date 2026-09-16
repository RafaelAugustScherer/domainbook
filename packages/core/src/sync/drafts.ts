import { git, object } from "../git.js";
import { draftParts } from "./refs.js";
import { localBranches, refExists, type Me, type Remote } from "./remote.js";
import { tempIndex } from "./state.js";
import { push, type Pushed } from "./transport.js";

export type Published =
  | { kind: "published" }
  | { kind: "same" }
  | { kind: "detached" }
  | { kind: "rejected" }
  | { kind: "unreachable"; tried: string[]; reason: string };

export const draftLeaf = "book";

export function draftRef(author: string, branch: string): string {
  return `refs/domainbook/drafts/${author}/${branch}/${draftLeaf}`;
}

export function bookTree(remote: Remote): string | undefined {
  const index = tempIndex(remote, "draft");
  const env = { GIT_INDEX_FILE: index };
  git(remote.repo, ["read-tree", "--empty"], env);
  git(remote.repo, ["add", "-A", "--", remote.book], env);
  return object(remote.repo, ["write-tree"], env);
}

export function publishDraft(remote: Remote, me: Me): Published {
  if (me.branch === undefined) return { kind: "detached" };
  const ref = draftRef(me.author, me.branch);
  const tree = bookTree(remote);
  if (tree === undefined)
    return { kind: "unreachable", tried: [], reason: "could not write the book tree" };
  const before = git(remote.repo, ["rev-parse", `${ref}^{tree}`]);
  if (before.code === 0 && before.out.trim() === tree) return { kind: "same" };
  const commit = object(remote.repo, ["commit-tree", tree, "-m", `draft ${me.branch}`]);
  if (commit === undefined)
    return { kind: "unreachable", tried: [], reason: "could not create the draft commit" };
  const pushed = push(remote, [`${commit}:${ref}`], true);
  if (pushed.kind === "unreachable") return pushed;
  if (pushed.kind === "rejected") return { kind: "rejected" };
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
    .filter((ref) => {
      const branch = draftParts(ref)?.branch;
      return branch !== undefined && !branches.has(branch);
    });
  if (gone.length === 0) return [];
  const pushed: Pushed = push(remote, gone.map((ref) => `:${ref}`), false);
  if (pushed.kind !== "ok") return [];
  for (const ref of gone)
    if (refExists(remote, ref)) git(remote.repo, ["update-ref", "-d", ref]);
  return gone.map((ref) => draftParts(ref)?.branch ?? ref);
}
