import { readdirSync } from "node:fs";
import { join } from "node:path";
import { type Claim, makeClaim } from "./claims.js";
import { numberKey } from "./keys.js";
import type { Me, Remote } from "./remote.js";
import { type Holder, holdersOf, takenNumbers } from "./refs.js";
import { addPending } from "./state.js";
import { fetchAll, type Reached } from "./transport.js";

export type Taken =
  | { kind: "claimed"; number: number; fetched: Reached }
  | { kind: "pending"; number: number; reason: string }
  | { kind: "lost"; tries: number };

export type SlugTaken =
  | { kind: "claimed"; fetched: Reached }
  | { kind: "pending"; reason: string }
  | { kind: "held"; by: Holder[] }
  | { kind: "taken"; by: Claim | undefined };

export const tries = 5;

const numbered = /^(\d+)-.*\.md$/u;

export function takeNumber(
  remote: Remote,
  me: Me,
  logDir: string,
  path: (number: number) => string,
  title: string
): Taken {
  const fetched = fetchAll(remote);
  if (fetched.kind === "unreachable") {
    const number = nextFree(remote, me, logDir);
    addPending(remote, {
      key: numberKey(logDir, number),
      path: path(number),
      title,
      branch: me.branch,
    });
    return { kind: "pending", number, reason: fetched.reason };
  }
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    const number = nextFree(remote, me, logDir);
    const made = makeClaim(remote, numberKey(logDir, number), title, me.branch);
    if (made.kind === "claimed") return { kind: "claimed", number, fetched };
    if (made.kind === "unreachable") {
      addPending(remote, {
        key: numberKey(logDir, number),
        path: path(number),
        title,
        branch: me.branch,
      });
      return { kind: "pending", number, reason: made.reason };
    }
  }
  return { kind: "lost", tries };
}

export function takeSlug(
  remote: Remote,
  me: Me,
  path: string,
  key: string,
  title: string
): SlugTaken {
  const fetched = fetchAll(remote);
  if (fetched.kind === "unreachable") {
    addPending(remote, { key, path, title, branch: me.branch });
    return { kind: "pending", reason: fetched.reason };
  }
  const held = holdersOf(remote, path, key, me);
  if (held.length > 0) return { kind: "held", by: held };
  const made = makeClaim(remote, key, title, me.branch);
  if (made.kind === "claimed") return { kind: "claimed", fetched };
  if (made.kind === "taken") return made;
  addPending(remote, { key, path, title, branch: me.branch });
  return { kind: "pending", reason: made.reason };
}

export function nextFree(remote: Remote, me: Me, logDir: string): number {
  const known = [...localNumbers(remote, logDir), ...takenNumbers(remote, logDir, me)];
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
