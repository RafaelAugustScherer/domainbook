import type { Config } from "../schemas/config.js";
import { makeClaim, releaseClaims } from "./claims.js";
import { type Published, publishDraft, pruneOwnDrafts } from "./drafts.js";
import { isNumbered, type Key, type Numbered, parseKey } from "./keys.js";
import { peersOf, type PeerWork, pruneCache } from "./peers.js";
import {
  type Holder,
  holderOf,
  holdersOf,
  type Ledger,
  ledgerOf,
  nextFree,
  onDefault,
  takenNumbers,
} from "./refs.js";
import { findRemote, type Me, type Remote, whoAmI } from "./remote.js";
import { committed, renumber, type Renumbered } from "./renumber.js";
import {
  dropPending,
  type Pending,
  readPending,
  readState,
  throttleMs,
  writeState,
} from "./state.js";
import { claimFree } from "./take.js";
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
      settledKeys: string[];
      draft: Published["kind"];
      claimsReleased: number;
      draftsReleased: string[];
      peers: PeerWork[];
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
  if (fetched.kind === "unreachable")
    return {
      kind: "unreachable",
      remote,
      tried: fetched.tried,
      reason: fetched.reason,
      pending: readPending(remote).length,
      syncedAt: state.syncedAt,
    };
  const me = whoAmI(remote);
  const settled = settlePending(remote, me, options.renumber);
  const draft = publishDraft(remote, me);
  const claimsReleased = releaseMerged(remote, me);
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
    settledKeys: settled.settledKeys,
    draft: draft.kind,
    claimsReleased,
    draftsReleased,
    peers,
    renumbered: settled.renumbered,
    collisions: settled.collisions,
  };
}

type Settled = {
  pushed: number;
  settledKeys: string[];
  renumbered: Moved[];
  collisions: Collision[];
};

function settlePending(remote: Remote, me: Me, fix: boolean): Settled {
  const done: Settled = { pushed: 0, settledKeys: [], renumbered: [], collisions: [] };
  for (const pending of readPending(remote)) settleOne(remote, me, fix, pending, done);
  return done;
}

function settleOne(remote: Remote, me: Me, fix: boolean, pending: Pending, done: Settled): void {
  const key = parseKey(pending.key);
  if (claimIfFree(remote, me, pending, key, done)) return;
  const wasCommitted = committed(remote, pending.path);
  const moved =
    key !== undefined && isNumbered(key) && fix && !wasCommitted
      ? move(remote, me, key, pending)
      : undefined;
  const ledger = ledgerOf(remote, me);
  if (moved !== undefined) {
    done.renumbered.push({ ...moved, by: heldBy(ledger, key) });
    dropPending(remote, pending.key);
    return;
  }
  done.collisions.push({
    pending,
    by: heldBy(ledger, key),
    free: key !== undefined && isNumbered(key) ? nextFree(ledger, key.logDir) : undefined,
    committed: wasCommitted,
  });
}

function claimIfFree(
  remote: Remote,
  me: Me,
  pending: Pending,
  key: Key | undefined,
  done: Settled
): boolean {
  if (stillTaken(ledgerOf(remote, me), key)) return false;
  const made = makeClaim(remote, pending.key, pending.title, pending.branch);
  if (made.kind === "unreachable") return true;
  if (made.kind === "claimed") {
    dropPending(remote, pending.key);
    done.pushed += 1;
    done.settledKeys.push(pending.key);
    return true;
  }
  return false;
}

function move(remote: Remote, me: Me, key: Numbered, pending: Pending): Renumbered | undefined {
  const freed = claimFree(remote, me, key.logDir, pending.title);
  if (freed.kind !== "claimed") return undefined;
  return renumber(ledgerOf(remote, me), key, pending.path, freed.number);
}

function heldBy(ledger: Ledger, key: Key | undefined): Holder | undefined {
  return key === undefined ? undefined : holderOf(ledger, key);
}

function stillTaken(ledger: Ledger, key: Key | undefined): boolean {
  if (key === undefined) return false;
  return isNumbered(key)
    ? takenNumbers(ledger, key.logDir).includes(key.number)
    : holdersOf(ledger, key).length > 0;
}

function releaseMerged(remote: Remote, me: Me): number {
  const ledger = ledgerOf(remote, me);
  const merged = ledger.claims.filter((claim) => {
    const key = parseKey(claim.key);
    return key !== undefined && onDefault(ledger, key);
  });
  const released = releaseClaims(remote, merged.map((claim) => claim.key));
  return released?.kind === "ok" ? merged.length : 0;
}
