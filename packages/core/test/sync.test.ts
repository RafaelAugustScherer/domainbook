import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  configSchema,
  findClaim,
  findRemote,
  keyOf,
  listClaims,
  makeClaim,
  peersOf,
  publishDraft,
  readPending,
  readState,
  reasonOf,
  refSafe,
  releaseClaims,
  type Remote,
  sync,
  takeNumber,
  takeSlug,
  twinOf,
  whoAmI,
} from "../src/index.js";
import { bookDir } from "./paths.js";

const config = configSchema.parse({});
const homes: string[] = [];

afterAll(() => {
  for (const home of homes) rmSync(home, { recursive: true, force: true });
});

type Clone = { dir: string; root: string; remote: Remote };

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function team(): { origin: string; alice: Clone; bob: Clone } {
  const home = mkdtempSync(join(tmpdir(), "domainbook-sync-"));
  homes.push(home);
  const origin = join(home, "origin.git");
  git(home, "init", "--quiet", "--bare", origin);
  const alice = clone(home, "alice", origin);
  cpSync(bookDir, alice.root, { recursive: true });
  git(alice.dir, "add", "-A");
  git(alice.dir, "commit", "--quiet", "-m", "book");
  git(alice.dir, "push", "--quiet", "origin", "main");
  const bob = clone(home, "bob", origin);
  git(bob.dir, "pull", "--quiet", "origin", "main");
  git(alice.dir, "checkout", "--quiet", "-b", "feat/outbox");
  git(bob.dir, "checkout", "--quiet", "-b", "feat/webhooks");
  return { origin, alice: opened(alice), bob: opened(bob) };
}

function clone(home: string, who: string, origin: string): Clone {
  const dir = join(home, who);
  git(home, "init", "--quiet", "--initial-branch=main", dir);
  git(dir, "config", "user.email", `${who}@example.com`);
  git(dir, "config", "user.name", who);
  git(dir, "remote", "add", "origin", origin);
  return { dir, root: join(dir, "domainbook"), remote: undefined as never };
}

function opened(one: Clone): Clone {
  const remote = findRemote(one.root, config);
  if (remote === undefined) throw new Error("no remote");
  return { ...one, remote };
}

function decision(title: string): string {
  return `---
status: proposed
date: 2026-09-14
---

# ${title}

## Context and Problem Statement

Why.

## Considered Options

- One.

## Decision Outcome

Chosen option: "One".

### Consequences

- Good, because it is done.
`;
}

function pathFor(slug: string): (number: number) => string {
  return (number) => `decisions/${String(number).padStart(4, "0")}-${slug}.md`;
}

function offline(origin: string, alice: Clone, then: () => void): void {
  const kept = join(homes.at(-1) ?? "", "kept.git");
  cpSync(origin, kept, { recursive: true });
  rmSync(origin, { recursive: true, force: true });
  takeNumber(alice.remote, whoAmI(alice.remote), "decisions", pathFor("use-an-outbox"), "Use an outbox");
  writeFileSync(join(alice.root, "decisions", "0002-use-an-outbox.md"), decision("Use an outbox"));
  then();
  cpSync(kept, origin, { recursive: true });
}

function refsOn(origin: string): string[] {
  return git(origin, "for-each-ref", "--format=%(refname)")
    .split("\n")
    .filter((ref) => ref.startsWith("refs/domainbook/"));
}

describe("twinOf", () => {
  it("maps scp-like ssh to https and back", () => {
    expect(twinOf("git@github.com:acme/shop.git")).toBe(
      "https://github.com/acme/shop.git"
    );
    expect(twinOf("https://gitlab.com/acme/shop.git")).toBe(
      "git@gitlab.com:acme/shop.git"
    );
    expect(twinOf("ssh://git@github.com:22/acme/shop")).toBe(
      "https://github.com/acme/shop"
    );
  });

  it("has no twin for a path or a local url", () => {
    expect(twinOf("/srv/git/shop.git")).toBeUndefined();
    expect(twinOf("../origin.git")).toBeUndefined();
    expect(twinOf("file:///srv/git/shop.git")).toBeUndefined();
  });
});

describe("refSafe and reasonOf", () => {
  it("replaces what a ref name cannot hold", () => {
    expect(refSafe("a~b:c@example.com")).toBe("a-b-c@example.com");
    expect(refSafe("dots..twice@x")).toBe("dots.-twice@x");
    expect(refSafe("")).toBe("unknown");
    expect(refSafe("x.lock")).toBe("x.lock-");
  });

  it("takes git's first line and drops the hints", () => {
    expect(
      reasonOf(
        "git@github.com: Permission denied (publickey).\nfatal: Could not read from remote repository.\nhint: try again\n"
      )
    ).toBe("git@github.com: Permission denied (publickey)");
    expect(reasonOf("")).toBe("no reason given");
  });
});

describe("keyOf", () => {
  it("derives a claim key from an artifact path", () => {
    expect(keyOf("decisions/0015-x.md")?.key).toBe("decisions/0015");
    expect(keyOf("domains/billing/debt/0002-x.md")?.key).toBe(
      "domains/billing/debt/0002"
    );
    expect(keyOf("domains/billing/features/refund-order.md")?.key).toBe(
      "domains/billing/features/refund-order"
    );
    expect(keyOf("domains/billing/index.md")?.key).toBe("domains/billing");
    expect(keyOf("glossary.md")).toBeUndefined();
    expect(keyOf("domains/billing/glossary.md")).toBeUndefined();
  });
});

describe("claims", () => {
  it("gives two clones that never fetched each other different numbers", () => {
    const { origin, alice, bob } = team();
    const one = takeNumber(alice.remote, whoAmI(alice.remote), "decisions", pathFor("use-an-outbox"), "Use an outbox");
    const other = takeNumber(bob.remote, whoAmI(bob.remote), "decisions", pathFor("retry-webhooks"), "Retry webhooks");
    expect(one).toMatchObject({ kind: "claimed", number: 2 });
    expect(other).toMatchObject({ kind: "claimed", number: 3 });
    expect(refsOn(origin)).toEqual([
      "refs/domainbook/claims/decisions/0002",
      "refs/domainbook/claims/decisions/0003",
    ]);
  });

  it("records who, on which branch, and for what, in a root commit with an empty tree", () => {
    const { alice } = team();
    takeNumber(alice.remote, whoAmI(alice.remote), "decisions", pathFor("use-an-outbox"), "Use an outbox");
    const [claim] = listClaims(alice.remote);
    expect(claim).toMatchObject({
      key: "decisions/0002",
      email: "alice@example.com",
      branch: "feat/outbox",
      title: "Use an outbox",
    });
    const shown = git(alice.dir, "log", "-1", "--format=%P|%T|%B", claim?.commit ?? "");
    expect(shown).toBe(
      "|4b825dc642cb6eb9a060e54bf8d69288fbee4904|claim decisions/0002\n\nbranch: feat/outbox\ntitle: Use an outbox\n\n"
    );
  });

  it("claims a domain and the records inside it side by side", () => {
    const { origin, alice } = team();
    const remote = alice.remote;
    expect(makeClaim(remote, "domains/billing", "Billing", "feat/billing").kind).toBe("claimed");
    expect(makeClaim(remote, "domains/billing/decisions/0001", "Charge once", "feat/billing").kind).toBe("claimed");
    expect(makeClaim(remote, "domains/billing/features/refund-order", "Refund order", "feat/billing").kind).toBe("claimed");
    expect(refsOn(origin)).toEqual([
      "refs/domainbook/claims/domains/billing/decisions/0001",
      "refs/domainbook/claims/domains/billing/features/refund-order",
      "refs/domainbook/claims/domains/billing/index",
    ]);
    expect(listClaims(remote).map((claim) => claim.key)).toEqual([
      "domains/billing/decisions/0001",
      "domains/billing/features/refund-order",
      "domains/billing",
    ]);
    expect(findClaim(remote, "domains/billing")?.title).toBe("Billing");
    expect(releaseClaims(remote, ["domains/billing"])?.kind).toBe("ok");
    expect(refsOn(origin)).toHaveLength(2);
  });

  it("lets one of two racing claims win and tells the other who won", () => {
    const { alice, bob } = team();
    const first = makeClaim(alice.remote, "decisions/0002", "Use an outbox", "feat/outbox");
    const second = makeClaim(bob.remote, "decisions/0002", "Retry webhooks", "feat/webhooks");
    expect(first.kind).toBe("claimed");
    expect(second).toMatchObject({
      kind: "taken",
      by: { email: "alice@example.com", branch: "feat/outbox" },
    });
  });

  it("refuses a slug a peer is already writing", () => {
    const { alice, bob } = team();
    const path = "domains/ticketing/features/refund-order.md";
    mkdirSync(join(alice.root, "domains/ticketing/features"), { recursive: true });
    writeFileSync(join(alice.root, path), "---\nid: refund-order\nname: Refund order\nstatus: draft\n---\n\n## Story\n\nAs a x\nI want y\nSo that z\n");
    expect(publishDraft(alice.remote, whoAmI(alice.remote)).kind).toBe("published");
    const taken = takeSlug(bob.remote, whoAmI(bob.remote), path, "domains/ticketing/features/refund-order", "refund-order");
    expect(taken).toMatchObject({
      kind: "held",
      by: [{ kind: "draft", email: "alice@example.com", branch: "feat/outbox" }],
    });
  });

  it("takes a number locally and keeps the claim pending when the remote is out of reach", () => {
    const { origin, alice } = team();
    rmSync(origin, { recursive: true, force: true });
    const taken = takeNumber(alice.remote, whoAmI(alice.remote), "decisions", pathFor("use-an-outbox"), "Use an outbox");
    expect(taken).toMatchObject({ kind: "pending", number: 2 });
    expect(readPending(alice.remote)).toEqual([
      { key: "decisions/0002", path: "decisions/0002-use-an-outbox.md", title: "Use an outbox", branch: "feat/outbox" },
    ]);
  });
});

describe("drafts and peers", () => {
  it("publishes the book as the working tree holds it, ignored files left out", () => {
    const { origin, alice } = team();
    writeFileSync(join(alice.dir, ".gitignore"), "build/\n");
    mkdirSync(join(alice.root, "build"), { recursive: true });
    writeFileSync(join(alice.root, "build", "site.html"), "junk");
    writeFileSync(join(alice.root, "decisions", "0002-use-an-outbox.md"), decision("Use an outbox"));
    const me = whoAmI(alice.remote);
    expect(publishDraft(alice.remote, me).kind).toBe("published");
    expect(publishDraft(alice.remote, me).kind).toBe("same");
    const ref = "refs/domainbook/drafts/alice@example.com/feat/outbox";
    expect(refsOn(origin)).toContain(ref);
    const files = git(alice.dir, "ls-tree", "-r", "--name-only", ref)
      .split("\n")
      .filter((file) => file !== "");
    expect(files).toContain("domainbook/decisions/0002-use-an-outbox.md");
    expect(files.some((file) => file.includes("build/"))).toBe(false);
    expect(files.some((file) => !file.startsWith("domainbook/"))).toBe(false);
    expect(git(alice.dir, "log", "-1", "--format=%P", ref)).toBe("\n");
  });

  it("shows a peer's added and changed artifacts, and nothing enters the working tree", () => {
    const { alice, bob } = team();
    writeFileSync(join(alice.root, "decisions", "0002-use-an-outbox.md"), decision("Use an outbox"));
    writeFileSync(join(alice.root, "glossary.md"), `${readFileSync(join(alice.root, "glossary.md"), "utf8")}\n## Outbox\n\nA table of messages to send.\n\n- **Status:** draft\n`);
    publishDraft(alice.remote, whoAmI(alice.remote));
    const report = sync(bob.root, config, { force: true, renumber: false });
    expect(report.kind).toBe("synced");
    const [work, ...rest] = peersOf(bob.remote, whoAmI(bob.remote));
    expect(rest).toEqual([]);
    expect(work?.peer).toMatchObject({ kind: "draft", email: "alice@example.com", branch: "feat/outbox" });
    expect(work?.added).toEqual(["decisions/0002-use-an-outbox.md"]);
    expect(work?.changed).toEqual(["glossary.md"]);
    expect(work?.unreadable).toEqual([]);
    expect(work?.book.decisions.map((one) => one.title)).toContain("Use an outbox");
    expect(git(bob.dir, "status", "--porcelain")).toBe("");
    expect(existsSync(join(bob.root, "decisions", "0002-use-an-outbox.md"))).toBe(false);
  });

  it("counts a peer's unreadable file instead of failing", () => {
    const { alice, bob } = team();
    writeFileSync(join(alice.root, "decisions", "0002-broken.md"), "---\nstatus: [\n---\n");
    publishDraft(alice.remote, whoAmI(alice.remote));
    sync(bob.root, config, { force: true, renumber: false });
    const [work] = peersOf(bob.remote, whoAmI(bob.remote));
    expect(work?.unreadable).toEqual(["decisions/0002-broken.md"]);
  });

  it("is throttled for a minute unless forced", () => {
    const { alice } = team();
    expect(sync(alice.root, config, { force: true, renumber: false }).kind).toBe("synced");
    expect(sync(alice.root, config, { force: false, renumber: false }).kind).toBe("throttled");
    expect(sync(alice.root, config, { force: true, renumber: false }).kind).toBe("synced");
  });

  it("works alone without a remote or with collaboration off", () => {
    const { alice } = team();
    const off = configSchema.parse({ collaboration: { enabled: false } });
    expect(sync(alice.root, off, { force: true, renumber: false }).kind).toBe("alone");
    git(alice.dir, "remote", "remove", "origin");
    expect(findRemote(alice.root, config)).toBeUndefined();
  });
});

describe("sync", () => {
  it("releases a claim once its file is on main and prunes a draft whose branch is gone", () => {
    const { origin, alice } = team();
    const me = whoAmI(alice.remote);
    takeNumber(alice.remote, me, "decisions", pathFor("use-an-outbox"), "Use an outbox");
    writeFileSync(join(alice.root, "decisions", "0002-use-an-outbox.md"), decision("Use an outbox"));
    publishDraft(alice.remote, me);
    git(alice.dir, "add", "-A");
    git(alice.dir, "commit", "--quiet", "-m", "outbox");
    git(alice.dir, "checkout", "--quiet", "main");
    git(alice.dir, "merge", "--quiet", "feat/outbox");
    git(alice.dir, "push", "--quiet", "origin", "main");
    git(alice.dir, "branch", "--quiet", "-D", "feat/outbox");
    const report = sync(alice.root, config, { force: true, renumber: false });
    expect(report).toMatchObject({ kind: "synced", claimsReleased: 1, draftsReleased: ["feat/outbox"] });
    expect(refsOn(origin).filter((ref) => !ref.includes("/main"))).toEqual([]);
  });

  it("renumbers an uncommitted file whose pending number was taken, references included", () => {
    const { origin, alice, bob } = team();
    const feature = join(alice.root, "domains", "ticketing", "features", "hold-seats-during-checkout.md");
    offline(origin, alice, () => {
      writeFileSync(feature, readFileSync(feature, "utf8").replace("---\n\n", "decisions: [ADR-0002]\n---\n\n"));
    });
    expect(makeClaim(bob.remote, "decisions/0002", "Retry webhooks", "feat/webhooks").kind).toBe("claimed");
    const report = sync(alice.root, config, { force: true, renumber: true });
    expect(report).toMatchObject({
      kind: "synced",
      claimsPushed: 0,
      renumbered: [
        {
          from: "decisions/0002-use-an-outbox.md",
          to: "decisions/0003-use-an-outbox.md",
          was: "ADR-0002",
          now: "ADR-0003",
          rewritten: 1,
          left: [],
        },
      ],
    });
    expect(existsSync(join(alice.root, "decisions", "0003-use-an-outbox.md"))).toBe(true);
    expect(readFileSync(feature, "utf8")).toContain("decisions: [ADR-0003]");
    expect(readPending(alice.remote)).toEqual([]);
    expect(refsOn(origin)).toContain("refs/domainbook/claims/decisions/0003");
  });

  it("reports a committed file instead of renaming it", () => {
    const { origin, alice, bob } = team();
    offline(origin, alice, () => {
      git(alice.dir, "add", "-A");
      git(alice.dir, "commit", "--quiet", "--no-verify", "-m", "outbox");
    });
    makeClaim(bob.remote, "decisions/0002", "Retry webhooks", "feat/webhooks");
    const report = sync(alice.root, config, { force: true, renumber: true });
    expect(report).toMatchObject({
      kind: "synced",
      renumbered: [],
      collisions: [{ committed: true, free: 3, by: { kind: "claim", email: "bob@example.com", branch: "feat/webhooks" } }],
    });
    expect(existsSync(join(alice.root, "decisions", "0002-use-an-outbox.md"))).toBe(true);
  });

  it("reports the remote as out of reach and keeps the claim pending", () => {
    const { origin, alice } = team();
    rmSync(origin, { recursive: true, force: true });
    takeNumber(alice.remote, whoAmI(alice.remote), "decisions", pathFor("use-an-outbox"), "Use an outbox");
    const report = sync(alice.root, config, { force: true, renumber: true });
    expect(report).toMatchObject({ kind: "unreachable", pending: 1, tried: [origin] });
    expect(readState(alice.remote).syncedAt).toBeUndefined();
  });
});
