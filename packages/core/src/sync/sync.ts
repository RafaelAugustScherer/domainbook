import type { Config } from "../schemas/config.js";
import { listClaims, makeClaim, releaseClaims } from "./claims.js";
import { type Published, publishDraft, pruneOwnDrafts } from "./drafts.js";
import { numberKey } from "./keys.js";
import { findRemote, type Me, type Remote, whoAmI } from "./remote.js";
import { peersOf, pruneCache } from "./peers.js";
import { type Holder, holderOfNumber, holdersOf, onDefault, takenNumbers } from "./refs.js";
import { committed, renumber, type Renumbered } from "./renumber.js";
import {
  dropPending,
  type Pending,
  readPending,
  readState,
  throttleMs,
  writeState,
} from "./state.js";
import { nextFree, tries } from "./take.js";
import { fetchAll, type FellBack } from "./transport.js";

export type Collision = {
  pending: Pending;
  by: Holder | undefined;
  free: number | undefined;
  committed: boolean;
};

export type Moved = Renumbered & { by: Holder | undefined };

export type SyncReport =
  | { kind: "alone" }
  | { kind: "throttled"; syncedAt: number | undefined }
  | { kind: "unreachable"; remote: Remote; tried: string[]; reason: string; pending: number; syncedAt: number | undefined }
  | {
      kind: "synced";
      remote: Remote;
      url: string;
      fellBack: FellBack | undefined;
      claimsPushed: number;
      draft: Published["kind"];
      claimsReleased: number;
      draftsReleased: string[];
      peers: number;
      renumbered: Moved[];
      collisions: Collision[];
    };

export type SyncOptions = { force: boolean; renumber: boolean };

export function sync(root: string, config: Config, options: SyncOptions): SyncReport {
  const remote = findRemote(root, config);
  if (remote === undefined) return { kind: "alone" };
  const state = readState(remote);
  const now = Date.now();
  if (!options.force && state.attemptedAt !== undefined && now - state.attemptedAt < throttleMs)
    return { kind: "throttled", syncedAt: state.syncedAt };
  writeState(remote, { ...state, attemptedAt: now });
  const fetched = fetchAll(remote);
  if (fetched.kind !== "ok") {
    const tried = fetched.kind === "unreachable" ? fetched.tried : [fetched.url];
    const reason = fetched.kind === "unreachable" ? fetched.reason : fetched.refs.join(", ");
    return { kind: "unreachable", remote, tried, reason, pending: readPending(remote).length, syncedAt: state.syncedAt };
  }
  const me = whoAmI(remote);
  const settled = settlePending(remote, me, options.renumber);
  const draft = publishDraft(remote, me);
  const claimsReleased = releaseMerged(remote);
  const draftsReleased = pruneOwnDrafts(remote, me);
  const peers = peersOf(remote, me);
  pruneCache(remote, peers.map((one) => one.peer.commit));
  const after = readState(remote);
  writeState(remote, { ...after, attemptedAt: now, syncedAt: Date.now() });
  return {
    kind: "synced",
    remote,
    url: fetched.url,
    fellBack: fetched.fellBack,
    claimsPushed: settled.pushed,
    draft: draft.kind,
    claimsReleased,
    draftsReleased,
    peers: peers.length,
    renumbered: settled.renumbered,
    collisions: settled.collisions,
  };
}

type Settled = { pushed: number; renumbered: Moved[]; collisions: Collision[] };

function settlePending(remote: Remote, me: Me, fix: boolean): Settled {
  const done: Settled = { pushed: 0, renumbered: [], collisions: [] };
  for (const pending of readPending(remote)) settleOne(remote, me, fix, pending, done);
  return done;
}

function settleOne(remote: Remote, me: Me, fix: boolean, pending: Pending, done: Settled): void {
  const parsed = numberedKey(pending.key);
  if (!stillTaken(remote, me, pending, parsed)) {
    const made = makeClaim(remote, pending.key, pending.title, pending.branch);
    if (made.kind === "unreachable") return;
    if (made.kind === "claimed") {
      dropPending(remote, pending.key);
      done.pushed += 1;
      return;
    }
  }
  const wasCommitted = committed(remote, pending.path);
  const by = whoHolds(remote, me, pending, parsed);
  const free = parsed === undefined ? undefined : nextFree(remote, me, parsed.logDir);
  const moved = parsed !== undefined && fix && !wasCommitted ? moveToFree(remote, me, pending, parsed) : undefined;
  if (moved === undefined) {
    done.collisions.push({ pending, by, free, committed: wasCommitted });
    return;
  }
  done.renumbered.push({ ...moved, by });
  dropPending(remote, pending.key);
}

function whoHolds(
  remote: Remote,
  me: Me,
  pending: Pending,
  parsed: { logDir: string; number: number } | undefined
): Holder | undefined {
  if (parsed === undefined)
    return holdersOf(remote, pending.path, pending.key, me)[0];
  return holderOfNumber(remote, parsed.logDir, parsed.number, me);
}

function stillTaken(
  remote: Remote,
  me: Me,
  pending: Pending,
  parsed: { logDir: string; number: number } | undefined
): boolean {
  if (parsed === undefined)
    return holdersOf(remote, pending.path, pending.key, me).length > 0;
  return takenNumbers(remote, parsed.logDir, me).includes(parsed.number);
}

function moveToFree(
  remote: Remote,
  me: Me,
  pending: Pending,
  parsed: { logDir: string; number: number; domain: string | undefined; kind: "decision" | "debt" }
): Renumbered | undefined {
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    const to = nextFree(remote, me, parsed.logDir);
    const made = makeClaim(remote, numberKey(parsed.logDir, to), pending.title, me.branch);
    if (made.kind === "claimed")
      return renumber(remote, pending.path, parsed.domain, parsed.logDir, parsed.kind, parsed.number, to);
    if (made.kind === "unreachable") return undefined;
  }
  return undefined;
}

function releaseMerged(remote: Remote): number {
  const merged = listClaims(remote).filter((claim) => {
    const parsed = numberedKey(claim.key);
    return onDefault(remote, claim.key, parsed?.logDir, parsed?.number);
  });
  const released = releaseClaims(remote, merged.map((claim) => claim.key));
  return released?.kind === "ok" ? merged.length : 0;
}

export function numberedKey(
  key: string
): { logDir: string; number: number; domain: string | undefined; kind: "decision" | "debt" } | undefined {
  const parsed = /^((?:domains\/([^/]+)\/)?(decisions|debt))\/(\d{4})$/u.exec(key);
  if (parsed === null) return undefined;
  return {
    logDir: parsed[1] ?? "",
    domain: parsed[2],
    kind: parsed[3] === "debt" ? "debt" : "decision",
    number: Number(parsed[4]),
  };
}
