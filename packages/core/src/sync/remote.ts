import { realpathSync } from "node:fs";
import { relative, resolve } from "node:path";
import { git, lines } from "../git.js";
import type { Config } from "../schemas/config.js";

export type Remote = {
  name: string;
  url: string;
  twin: string | undefined;
  repo: string;
  book: string;
};

export type Me = { email: string; author: string; branch: string | undefined };

export function findRemote(root: string, config: Config): Remote | undefined {
  if (!config.collaboration.enabled) return undefined;
  const dir = realPath(root);
  if (dir === undefined) return undefined;
  const top = git(dir, ["rev-parse", "--show-toplevel"]);
  if (top.code !== 0) return undefined;
  const repo = resolve(top.out.trim());
  const name = config.collaboration.remote;
  const url = git(repo, ["remote", "get-url", "--push", name]);
  if (url.code !== 0) return undefined;
  const book = relative(repo, dir).split("\\").join("/");
  return { name, url: url.out.trim(), twin: twinOf(url.out.trim()), repo, book };
}

export function whoAmI(remote: Remote): Me {
  const email = git(remote.repo, ["config", "user.email"]).out.trim();
  const head = git(remote.repo, ["symbolic-ref", "--short", "HEAD"]);
  return {
    email,
    author: refSafe(email),
    branch: head.code === 0 ? head.out.trim() : undefined,
  };
}

export function defaultBranch(remote: Remote): string | undefined {
  const symref = git(remote.repo, [
    "symbolic-ref",
    "--short",
    `refs/remotes/${remote.name}/HEAD`,
  ]);
  if (symref.code === 0) return symref.out.trim();
  for (const guess of ["main", "master"])
    if (refExists(remote, `refs/remotes/${remote.name}/${guess}`))
      return `${remote.name}/${guess}`;
  return undefined;
}

export function refExists(remote: Remote, ref: string): boolean {
  return git(remote.repo, ["show-ref", "--verify", "--quiet", ref]).code === 0;
}

export function localBranches(remote: Remote): string[] {
  return lines(
    git(remote.repo, ["for-each-ref", "--format=%(refname:short)", "refs/heads"])
      .out
  );
}

export function twinOf(url: string): string | undefined {
  const scp = /^(?:[^@/:]+@)?([^/:]+):(?!\/)(.+)$/.exec(url);
  if (scp !== null) return `https://${scp[1]}/${scp[2]}`;
  const ssh = /^ssh:\/\/(?:[^@/]+@)?([^/:]+)(?::\d+)?\/(.+)$/.exec(url);
  if (ssh !== null) return `https://${ssh[1]}/${ssh[2]}`;
  const web = /^https?:\/\/(?:[^@/]+@)?([^/:]+)(?::\d+)?\/(.+)$/.exec(url);
  if (web !== null) return `git@${web[1]}:${web[2]}`;
  return undefined;
}

export function refSafe(text: string): string {
  let safe = text.replace(/[^A-Za-z0-9._@+-]/gu, "-");
  while (safe.includes("..")) safe = safe.replace("..", ".-");
  safe = safe.replace(/^\.+/u, "");
  if (safe.endsWith(".lock")) safe = `${safe}-`;
  return safe === "" ? "unknown" : safe;
}

function realPath(root: string): string | undefined {
  try {
    return realpathSync(resolve(root));
  } catch {
    return undefined;
  }
}
