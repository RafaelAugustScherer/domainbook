import { lines, online } from "../git.js";
import type { Remote } from "./remote.js";
import { readState, writeState } from "./state.js";

export type Reached =
  | { kind: "ok"; url: string; fellBack: FellBack | undefined }
  | { kind: "rejected"; url: string; refs: string[] }
  | { kind: "unreachable"; tried: string[]; reason: string };

export type FellBack = { from: string; reason: string };

export const claimsSpec = "+refs/domainbook/*:refs/domainbook/*";

export function fetchAll(remote: Remote): Reached {
  return reach(remote, (url) =>
    online(remote.repo, [
      "fetch",
      "--prune",
      "--quiet",
      url,
      `+refs/heads/*:refs/remotes/${remote.name}/*`,
      claimsSpec,
    ])
  );
}

export function push(
  remote: Remote,
  refspecs: string[],
  force: boolean
): Reached {
  const flags = force ? ["--force"] : [];
  return reach(remote, (url) =>
    online(remote.repo, [
      "push",
      "--porcelain",
      "--no-verify",
      "--quiet",
      ...flags,
      url,
      ...refspecs,
    ])
  );
}

function reach(
  remote: Remote,
  attempt: (url: string) => { code: number; out: string; err: string }
): Reached {
  const state = readState(remote);
  const urls = ordered(remote, state.url);
  const tried: string[] = [];
  let fellBack: FellBack | undefined;
  for (const url of urls) {
    const ran = attempt(url);
    const refused = lines(ran.out).filter((line) => line.startsWith("!"));
    if (refused.length > 0)
      return { kind: "rejected", url, refs: refused.map(refOf) };
    if (ran.code === 0) {
      if (state.url !== url) writeState(remote, { ...state, url });
      return { kind: "ok", url, fellBack };
    }
    tried.push(url);
    fellBack = { from: url, reason: reasonOf(ran.err) };
  }
  return { kind: "unreachable", tried, reason: fellBack?.reason ?? "" };
}

function ordered(remote: Remote, last: string | undefined): string[] {
  const all = remote.twin === undefined ? [remote.url] : [remote.url, remote.twin];
  if (last === undefined || !all.includes(last)) return all;
  return [last, ...all.filter((url) => url !== last)];
}

function refOf(line: string): string {
  const spec = line.split("\t")[1] ?? "";
  return spec.split(":")[1] ?? spec;
}

export function reasonOf(err: string): string {
  const said = lines(err)
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("hint:"));
  const first = said[0] ?? "no reason given";
  return first.replace(/^(fatal|error): /u, "").replace(/\.$/u, "");
}
