import { basename } from "node:path";
import {
  counted,
  loadBook,
  pad,
  schemeOf,
  sync,
  type Collision,
  type Moved,
  type SyncReport,
} from "@domainbook/core";
import { missingBook, rooted } from "./files.js";
import {
  alone,
  byWhom,
  detachedLine,
  named,
  whoOn,
  writtenBy,
} from "./remote.js";
import { refuse, type Result } from "./result.js";

type Synced = Extract<SyncReport, { kind: "synced" }>;

export function syncBook(root: string): Result {
  const missing = missingBook(root);
  if (missing !== undefined) return refuse(missing);
  const report = sync(root, loadBook(root).book.config, {
    force: true,
    renumber: true,
  });
  if (report.kind === "unreachable")
    return refuse(
      `could not reach ${report.remote.name} (${report.tried.join(
        ", then "
      )}): ${report.reason}${
        report.pending === 0
          ? ""
          : ` — ${counted(report.pending, "claim")} still pending`
      }`
    );
  if (report.kind !== "synced") return { code: 0, lines: [alone] };
  const { remote } = report;
  return {
    code: report.collisions.some((hit) => hit.committed) ? 1 : 0,
    lines: [
      ...fellBack(report),
      ...report.renumbered.map(movedLine),
      ...report.collisions.map((hit) => collided(root, hit)),
      ...draftLines(report, root),
      ...report.draftsReleased.map(
        (branch) => `draft for ${branch} released — the branch is gone`
      ),
      `domainbook: synced with ${remote.name} — ${summary(report)}`,
    ],
  };
}

function fellBack(report: Synced): string[] {
  if (report.fellBack === undefined) return [];
  return [
    `${report.remote.name} over ${schemeOf(
      report.fellBack.from
    )} was not reachable (${report.fellBack.reason}) — synced over ${
      report.url
    } instead`,
  ];
}

function draftLines(report: Synced, root: string): string[] {
  if (report.draft === "detached") return [detachedLine(root)];
  if (report.draft === "unreachable")
    return [
      `the draft could not be pushed to ${
        report.remote.name
      } — run "${rooted("domainbook sync", root)}" again`,
    ];
  return [];
}

function movedLine(moved: Moved): string {
  const from = basename(moved.from);
  const to = basename(moved.to);
  if (moved.left.length > 0)
    return `${from} is now ${to} — ${
      moved.was
    } also names a record on this branch, so ${counted(
      moved.left.length,
      "reference"
    )} ${moved.left.length === 1 ? "was" : "were"} left for you to settle: ${moved.left.join(
      ", "
    )}`;
  return `${moved.was} was taken ${byWhom(
    moved.by
  )} while this clone was offline — ${from} is now ${to}, and ${counted(
    moved.rewritten,
    "reference"
  )} to it ${moved.rewritten === 1 ? "was" : "were"} rewritten`;
}

function collided(root: string, hit: Collision): string {
  const { path } = hit.pending;
  const name = named(path);
  const verb = hit.by?.kind === "claim" ? "claimed" : "taken";
  if (hit.free === undefined) {
    const who = hit.by === undefined ? "a peer" : whoOn(hit.by.email, hit.by.branch);
    if (!hit.committed)
      return writtenBy(name, path, who, "rename this one or continue on that branch", root);
    return `${name} is committed here and already being written by ${who} — read it with "${rooted(
      `domainbook status ${path}`,
      root
    )}", then rename this one before this branch is pushed`;
  }
  if (hit.committed)
    return `${name} is committed here and ${verb} ${byWhom(
      hit.by
    )} — the next free number is ${pad(hit.free)}; rename ${basename(
      path
    )}, rewrite its references, and commit before this branch is pushed`;
  return `${name} is ${verb} ${byWhom(hit.by)} and could not be moved to ${pad(
    hit.free
  )} — run "${rooted("domainbook sync", root)}" again`;
}

function summary(report: Synced): string {
  const done = [
    report.claimsPushed === 0
      ? undefined
      : `${counted(report.claimsPushed, "claim")} pushed`,
    report.draft === "published" ? "draft published" : undefined,
    report.claimsReleased === 0
      ? undefined
      : `${counted(report.claimsReleased, "claim")} released`,
  ].filter((part) => part !== undefined);
  return [
    ...(done.length === 0 ? ["nothing pending"] : done),
    `${counted(report.peers, "peer")} in progress`,
  ].join(", ");
}
