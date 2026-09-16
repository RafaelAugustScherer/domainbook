import { type Claim, makeClaim } from "./claims.js";
import { numberKey, parseKey } from "./keys.js";
import type { Me, Remote } from "./remote.js";
import { type Holder, holdersOf, ledgerOf, nextFree } from "./refs.js";
import { addPending, type Pending } from "./state.js";
import { fetchAll } from "./transport.js";

export type Taken =
  | { kind: "claimed"; number: number }
  | { kind: "pending"; number: number; reason: string }
  | { kind: "lost"; tries: number };

export type SlugTaken =
  | { kind: "claimed" }
  | { kind: "pending"; reason: string }
  | { kind: "held"; by: Holder[] }
  | { kind: "taken"; by: Claim | undefined };

export type Freed =
  | { kind: "claimed"; number: number }
  | { kind: "unreachable"; reason: string }
  | { kind: "lost"; tries: number };

export const tries = 5;

export function claimFree(
  remote: Remote,
  me: Me,
  logDir: string,
  title: string
): Freed {
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    const number = nextFree(ledgerOf(remote, me), logDir);
    const made = makeClaim(remote, numberKey(logDir, number), title, me.branch);
    if (made.kind === "claimed") return { kind: "claimed", number };
    if (made.kind === "unreachable")
      return { kind: "unreachable", reason: made.reason };
  }
  return { kind: "lost", tries };
}

export function takeNumber(
  remote: Remote,
  me: Me,
  logDir: string,
  path: (number: number) => string,
  title: string
): Taken {
  const pending = (reason: string): Taken => {
    const number = nextFree(ledgerOf(remote, me), logDir);
    addPending(remote, {
      key: numberKey(logDir, number),
      path: path(number),
      title,
      branch: me.branch,
    });
    return { kind: "pending", number, reason };
  };
  const fetched = fetchAll(remote);
  if (fetched.kind === "unreachable") return pending(fetched.reason);
  const freed = claimFree(remote, me, logDir, title);
  if (freed.kind === "claimed") return { kind: "claimed", number: freed.number };
  if (freed.kind === "unreachable") return pending(freed.reason);
  return { kind: "lost", tries: freed.tries };
}

export function takeSlug(
  remote: Remote,
  me: Me,
  path: string,
  key: string,
  title: string
): SlugTaken {
  const pending: Pending = { key, path, title, branch: me.branch };
  const fetched = fetchAll(remote);
  if (fetched.kind === "unreachable") {
    addPending(remote, pending);
    return { kind: "pending", reason: fetched.reason };
  }
  const parsed = parseKey(key);
  const held = parsed === undefined ? [] : holdersOf(ledgerOf(remote, me), parsed);
  if (held.length > 0) return { kind: "held", by: held };
  const made = makeClaim(remote, key, title, me.branch);
  if (made.kind === "claimed") return { kind: "claimed" };
  if (made.kind === "taken") return made;
  addPending(remote, pending);
  return { kind: "pending", reason: made.reason };
}
