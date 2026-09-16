import { basename, dirname } from "node:path";
import {
  addPending,
  ago,
  dropPending,
  findRemote,
  holderOf,
  holdersOf,
  isNumbered,
  keyOf,
  ledgerOf,
  makeClaim,
  readPending,
  sync,
  whoAmI,
  type Book,
  type Holder,
  type Key,
  type Ledger,
  type Me,
  type Remote,
  type SyncReport,
} from "@domainbook/core";
import { rooted, titled } from "./files.js";
import { stagedAdded } from "./git.js";
import { byWhom, named, whoOn, writtenBy } from "./remote.js";
import type { Result } from "./result.js";

type Staged = { path: string; key: Key };

type Clone = {
  remote: Remote;
  me: Me;
  root: string;
  book: string;
  reachable: boolean;
};

type Said = { line: string; refused: boolean };

export function claimStaged(
  root: string,
  book: Book,
  repo: string,
  bookPath: string
): Result {
  const remote = findRemote(root, book.config);
  if (remote === undefined) return { code: 0, lines: [] };
  const report = sync(root, book.config, { force: false, renumber: false });
  const me = whoAmI(remote);
  const ledger = ledgerOf(remote, me);
  const settled = new Set(report.kind === "synced" ? report.settledKeys : []);
  const clone: Clone = {
    remote,
    me,
    root,
    book: bookPath,
    reachable: report.kind !== "unreachable",
  };
  const said = stagedAdded(repo)
    .filter((path) => path.startsWith(`${bookPath}/`))
    .map((path) => path.slice(bookPath.length + 1))
    .map((path) => ({ path, key: keyOf(path) }))
    .filter((one): one is Staged => one.key !== undefined)
    .map((one) => judge(clone, ledger, one, settled))
    .filter((one) => one !== undefined);
  const refused =
    said.some((one) => one.refused) && book.config.enforcement.mode !== "warn";
  return {
    code: refused ? 1 : 0,
    lines: [...unreached(remote, report), ...said.map((one) => one.line)],
  };
}

function unreached(remote: Remote, report: SyncReport): string[] {
  if (report.kind !== "unreachable") return [];
  const fetched =
    report.syncedAt === undefined
      ? "never fetched"
      : `using what was fetched ${ago(report.syncedAt / 1000)} ago`;
  return [`domainbook: ${remote.name} not reachable, ${fetched}`];
}

function judge(
  clone: Clone,
  ledger: Ledger,
  one: Staged,
  settled: Set<string>
): Said | undefined {
  const { remote, me } = clone;
  if (holdersOf(ledger, one.key).some((holder) => holder.kind === "default"))
    return undefined;
  const claim = ledger.claims.find((each) => each.key === one.key.key);
  if (claim?.email === me.email)
    return settled.has(one.key.key) ? claimed(clone, one) : undefined;
  const holder = holderOf(ledger, one.key);
  if (holder !== undefined) return refusal(clone, one, holder);
  if (!clone.reachable) return offline(clone, one);
  const made = makeClaim(remote, one.key.key, titleOf(one.path), me.branch);
  if (made.kind === "claimed") return claimed(clone, one);
  if (made.kind === "unreachable") return offline(clone, one);
  return refusal(
    clone,
    one,
    made.by === undefined
      ? undefined
      : { kind: "claim", email: made.by.email, branch: made.by.branch ?? "" }
  );
}

function claimed(clone: Clone, one: Staged): Said {
  dropPending(clone.remote, one.key.key);
  return {
    line: `domainbook: claimed ${named(one.path)} on ${clone.remote.name}`,
    refused: false,
  };
}

function refusal(clone: Clone, one: Staged, holder: Holder | undefined): Said {
  const name = named(one.path);
  if (!isNumbered(one.key))
    return {
      refused: true,
      line: writtenBy(
        name,
        one.path,
        holder === undefined ? "a peer" : whoOn(holder.email, holder.branch),
        "rename this one or continue on that branch",
        clone.root
      ),
    };
  remember(clone, one);
  const verb = holder?.kind === "claim" ? "claimed" : "taken";
  return {
    refused: true,
    line: `${name} is ${verb} ${byWhom(holder)} — run "${rooted(
      "domainbook sync",
      clone.root
    )}" to move ${clone.book}/${
      one.path
    } to the next free number, then commit again`,
  };
}

function offline(clone: Clone, one: Staged): Said {
  remember(clone, one);
  const then = isNumbered(one.key)
    ? "if the number is taken by then, sync renumbers the file and says so"
    : "if the id is taken by then, sync says so";
  return {
    refused: true,
    line: `${clone.book}/${one.path} carries ${named(
      one.path
    )}, which is not claimed on ${
      clone.remote.name
    } (could not reach it) — run "${rooted(
      "domainbook sync",
      clone.root
    )}" with the network up and commit again; ${then}`,
  };
}

function remember(clone: Clone, one: Staged): void {
  const known = readPending(clone.remote).some(
    (pending) => pending.key === one.key.key
  );
  if (known) return;
  addPending(clone.remote, {
    key: one.key.key,
    path: one.path,
    title: titleOf(one.path),
    branch: clone.me.branch,
  });
}

function titleOf(path: string): string {
  const name = basename(path, ".md");
  if (name === "index") return titled(basename(dirname(path)));
  return titled(name.replace(/^\d{4}-/u, ""));
}
