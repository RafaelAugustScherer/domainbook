import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  cloned,
  committed,
  enter,
  failed,
  git,
  gitIn,
  leave,
  ran,
  shared,
  within,
  wrote,
} from "./repo.js";

let origin = "";

const outbox = "domainbook/decisions/0001-use-an-outbox.md";
const nothingStaged = "domainbook: nothing staged that a domain claims";

beforeEach(() => {
  enter();
  git("config", "user.email", "alice@example.com");
  ran("init");
  ran("new", "domain", "billing");
  committed("Start the book");
  origin = shared();
  git("push", "--quiet", "-u", "origin", "main");
  git("checkout", "--quiet", "-b", "feat/outbox");
});

afterEach(leave);

function refs(): string[] {
  return gitIn(origin, "for-each-ref", "--format=%(refname)")
    .split("\n")
    .filter((line) => line !== "");
}

function gone(): void {
  git("remote", "set-url", "origin", join(origin, "gone"));
}

function back(): void {
  git("remote", "set-url", "origin", origin);
}

function bobWrote(...argv: string[]): void {
  const bob = cloned("bob@example.com", "feat/webhooks");
  within(bob, () => ran("new", ...argv));
}

function decision(title: string): string {
  return `---
status: proposed
date: 2026-09-14
---

# ${title}

## Context and Problem Statement

## Considered Options

## Decision Outcome

### Consequences
`;
}

function feature(decisionRef: string): string {
  return `---
id: refund-order
name: Refund order
status: draft
decisions: [${decisionRef}]
---

## Story

As a buyer
I want a refund
So that I am whole

## Rule: A refund is whole

\`\`\`gherkin
Example: A late refund
  Given a captured order
  When it is refunded
  Then the buyer is whole
\`\`\`

## Open Questions
`;
}

describe("what new does with a remote", () => {
  it("writes the file, claims the number, publishes the draft, and touches nothing else", () => {
    expect(ran("new", "decision", "Use an outbox")).toEqual([
      `wrote ${outbox}`,
      'next: fill in the sections, then "domainbook validate"',
    ]);
    expect(git("status", "--short", "--untracked-files=all")).toBe(`?? ${outbox}\n`);
    expect(refs()).toEqual(
      expect.arrayContaining([
        "refs/domainbook/claims/decisions/0001",
        "refs/domainbook/drafts/alice@example.com/feat/outbox",
      ])
    );
  });

  it("gives two clones that never fetched each other different numbers", () => {
    ran("new", "decision", "Use an outbox");
    const bob = cloned("bob@example.com", "feat/webhooks");
    expect(within(bob, () => ran("new", "decision", "Retry webhooks")[0])).toBe(
      "wrote domainbook/decisions/0002-retry-webhooks.md"
    );
    expect(refs().filter((ref) => ref.includes("/claims/"))).toEqual([
      "refs/domainbook/claims/decisions/0001",
      "refs/domainbook/claims/decisions/0002",
    ]);
  });

  it("claims each log, a debt record, and a domain under their own keys", () => {
    ran("new", "decision", "Expire holds", "--domain", "billing");
    ran("new", "debt", "Manual sweep of expired holds");
    ran("new", "domain", "shipping");
    expect(refs()).toEqual(
      expect.arrayContaining([
        "refs/domainbook/claims/domains/billing/decisions/0001",
        "refs/domainbook/claims/debt/0001",
        "refs/domainbook/claims/domains/shipping/index",
      ])
    );
  });

  it("refuses a feature id a peer is writing and says where to read it", () => {
    bobWrote("feature", "refund-order", "--domain", "billing");
    expect(
      failed("new", "feature", "refund-order", "--domain", "billing")
    ).toEqual([
      'refund-order is already being written by bob@example.com on feat/webhooks — read it with "domainbook status domains/billing/features/refund-order.md", then pick another id or continue on that branch',
    ]);
    expect(
      existsSync("domainbook/domains/billing/features/refund-order.md")
    ).toBe(false);
  });

  it("says nothing about claims and writes no state when there is no remote", () => {
    git("remote", "remove", "origin");
    expect(ran("new", "decision", "Use an outbox")).toEqual([
      `wrote ${outbox}`,
      'next: fill in the sections, then "domainbook validate"',
    ]);
    expect(existsSync(".git/domainbook")).toBe(false);
  });
});

describe("what happens with the remote out of reach", () => {
  it("takes the number locally, refuses the commit, and claims it at the next sync", () => {
    gone();
    expect(ran("new", "decision", "Use an outbox")).toEqual([
      `wrote ${outbox}`,
      'ADR-0001 is not claimed on origin (could not reach it) — the next "domainbook sync" with the network up claims it, and the commit hook refuses the file until then',
      'next: fill in the sections, then "domainbook validate"',
    ]);
    expect(readFileSync(".git/domainbook/pending.json", "utf8")).toContain(
      '"key": "decisions/0001"'
    );
    git("add", "-A");
    expect(failed("check", "--staged")).toEqual([
      nothingStaged,
      "domainbook: origin not reachable, never fetched",
      `${outbox} carries ADR-0001, which is not claimed on origin (could not reach it) — run "domainbook sync" with the network up and commit again; if the number is taken by then, sync renumbers the file and says so`,
    ]);
    back();
    expect(ran("sync")).toEqual([
      "domainbook: synced with origin — 1 claim pushed, draft published, 0 peers in progress",
    ]);
    expect(refs()).toContain("refs/domainbook/claims/decisions/0001");
    expect(existsSync(".git/domainbook/pending.json")).toBe(false);
  });

  it("lets the commit through in warn mode and still says what is owed", () => {
    wrote("domainbook/domainbook.config.yaml", "enforcement:\n  mode: warn\n");
    gone();
    ran("new", "decision", "Use an outbox");
    git("add", "-A");
    expect(ran("check", "--staged").at(-1)).toContain(
      "which is not claimed on origin (could not reach it)"
    );
  });

  it("carries on with what it has when only the remote is out of reach", () => {
    ran("sync");
    const state = JSON.parse(
      readFileSync(".git/domainbook/state.json", "utf8")
    ) as Record<string, unknown>;
    const earlier = Date.now() - 180_000;
    wrote(
      ".git/domainbook/state.json",
      JSON.stringify({ ...state, attemptedAt: earlier, syncedAt: earlier })
    );
    gone();
    wrote("README.md", "# Shop\n");
    git("add", "-A");
    expect(ran("check", "--staged")).toEqual([
      nothingStaged,
      "domainbook: origin not reachable, using what was fetched 3 minutes ago",
    ]);
  });

  it("moves an uncommitted file and its references when a peer took the number", () => {
    gone();
    ran("new", "decision", "Use an outbox");
    const refund = "domainbook/domains/billing/features/refund-order.md";
    wrote(refund, feature("ADR-0001"));
    bobWrote("decision", "Retry webhooks");
    back();
    expect(ran("sync")).toEqual([
      "ADR-0001 was taken by bob@example.com on feat/webhooks while this clone was offline — 0001-use-an-outbox.md is now 0002-use-an-outbox.md, and 1 reference to it was rewritten",
      "domainbook: synced with origin — draft published, 1 peer in progress",
    ]);
    expect(existsSync(outbox)).toBe(false);
    expect(existsSync("domainbook/decisions/0002-use-an-outbox.md")).toBe(true);
    expect(readFileSync(refund, "utf8")).toContain("decisions: [ADR-0002]");
  });

  it("reports a committed collision instead of renaming, and exits 1", () => {
    gone();
    ran("new", "decision", "Use an outbox");
    committed("Decide on an outbox");
    bobWrote("decision", "Retry webhooks");
    back();
    expect(failed("sync")).toEqual([
      "ADR-0001 is committed here and claimed by bob@example.com on feat/webhooks — the next free number is 0002; rename 0001-use-an-outbox.md, rewrite its references, and commit before this branch is pushed",
      "domainbook: synced with origin — draft published, 1 peer in progress",
    ]);
    expect(existsSync(outbox)).toBe(true);
  });
});

describe("what check --staged does about claims", () => {
  it("claims at commit what an offline new could not", () => {
    gone();
    ran("new", "decision", "Use an outbox");
    back();
    git("add", "-A");
    expect(ran("check", "--staged")).toEqual([
      nothingStaged,
      "domainbook: claimed ADR-0001 on origin",
    ]);
    expect(refs()).toContain("refs/domainbook/claims/decisions/0001");
    expect(existsSync(".git/domainbook/pending.json")).toBe(false);
  });

  it("fetches once for two checks within a minute", () => {
    wrote("README.md", "# Shop\n");
    git("add", "-A");
    expect(ran("check", "--staged")).toEqual([nothingStaged]);
    gone();
    expect(ran("check", "--staged")).toEqual([nothingStaged]);
  });

  it("claims a hand-written decision on the spot and passes silently after", () => {
    wrote(outbox, decision("Use an outbox"));
    git("add", "-A");
    expect(ran("check", "--staged")).toEqual([
      nothingStaged,
      "domainbook: claimed ADR-0001 on origin",
    ]);
    expect(refs()).toContain("refs/domainbook/claims/decisions/0001");
    expect(ran("check", "--staged")).toEqual([nothingStaged]);
  });

  it("refuses a number a peer claimed meanwhile and names the fix", () => {
    gone();
    ran("new", "decision", "Use an outbox");
    bobWrote("decision", "Retry webhooks");
    back();
    git("add", "-A");
    expect(failed("check", "--staged")).toEqual([
      nothingStaged,
      `ADR-0001 is claimed by bob@example.com on feat/webhooks — run "domainbook sync" to move ${outbox} to the next free number, then commit again`,
    ]);
  });

  it("refuses a hand-written feature whose id a peer holds", () => {
    bobWrote("feature", "refund-order", "--domain", "billing");
    wrote(
      "domainbook/domains/billing/features/refund-order.md",
      feature("ADR-0001")
    );
    wrote(outbox, decision("Use an outbox"));
    git("add", "-A");
    expect(failed("check", "--staged")).toEqual([
      nothingStaged,
      "domainbook: claimed ADR-0001 on origin",
      'refund-order is already being written by bob@example.com on feat/webhooks — read it with "domainbook status domains/billing/features/refund-order.md", then rename this one or continue on that branch',
    ]);
  });

  it("does not let a waiver stand in for a claim", () => {
    gone();
    ran("new", "decision", "Use an outbox");
    git("add", "-A");
    wrote(".git/COMMIT_EDITMSG", "Decide\n\nSkip-Docs: offline\n");
    expect(
      failed("check", "--staged", "--message-file", ".git/COMMIT_EDITMSG").at(-1)
    ).toContain("is not claimed on origin (could not reach it)");
  });
});

describe("what status shows", () => {
  it("lists each peer's work under a header naming the remote", () => {
    bobWrote("decision", "Retry webhooks");
    const lines = ran("status");
    expect(lines[0]).toMatch(
      /^domainbook: origin \(.+\), synced \d+ seconds? ago$/
    );
    expect(lines.slice(1)).toEqual([
      "in progress:",
      expect.stringMatching(
        /^ {2}bob@example\.com on feat\/webhooks \(draft, \d+ seconds? ago\)$/
      ),
      "    + decisions/0001-retry-webhooks.md",
    ]);
    expect(git("status", "--short")).toBe("");
  });

  it("says nobody is in progress and names what is still pending", () => {
    gone();
    ran("new", "decision", "Use an outbox");
    const lines = ran("status");
    expect(lines[0]).toMatch(
      /^domainbook: origin \(.+\), not reachable — nothing fetched from it yet$/
    );
    expect(lines.slice(1)).toEqual([
      "in progress: nothing",
      "pending: ADR-0001 (decisions/0001-use-an-outbox.md) — not yet claimed",
    ]);
  });

  it("prints a peer's file for a path, and refuses a path nobody holds", () => {
    bobWrote("decision", "Retry webhooks");
    const lines = ran("status", "decisions/0001");
    expect(lines[0]).toMatch(
      /^decisions\/0001-retry-webhooks\.md — bob@example\.com on feat\/webhooks \(draft, \d+ seconds? ago\)$/
    );
    expect(lines.slice(1, 5)).toEqual([
      "---",
      "status: proposed",
      expect.stringMatching(/^date: \d{4}-\d{2}-\d{2}$/),
      "---",
    ]);
    expect(lines).toContain("# Retry webhooks");
    expect(failed("status", "decisions/0009")).toEqual([
      "no peer is writing decisions/0009",
    ]);
  });

  it("is working alone without a remote", () => {
    git("remote", "remove", "origin");
    expect(ran("status")).toEqual(["domainbook: no remote, working alone"]);
    expect(ran("sync")).toEqual(["domainbook: no remote, working alone"]);
  });
});

describe("what sync reports", () => {
  it("says nothing pending when the draft already matches", () => {
    ran("new", "decision", "Use an outbox");
    expect(ran("sync")).toEqual([
      "domainbook: synced with origin — nothing pending, 0 peers in progress",
    ]);
  });

  it("publishes an edit made since the draft", () => {
    ran("new", "decision", "Use an outbox");
    wrote(outbox, decision("Use an outbox, always"));
    expect(ran("sync")).toEqual([
      "domainbook: synced with origin — draft published, 0 peers in progress",
    ]);
  });

  it("releases a claim once its file is on main", () => {
    ran("new", "decision", "Use an outbox");
    committed("Decide on an outbox");
    git("push", "--quiet", "origin", "feat/outbox:main");
    expect(ran("sync")).toEqual([
      "domainbook: synced with origin — 1 claim released, 0 peers in progress",
    ]);
    expect(refs()).not.toContain("refs/domainbook/claims/decisions/0001");
  });

  it("releases its own draft once the branch is gone", () => {
    ran("new", "decision", "Use an outbox");
    committed("Decide on an outbox");
    git("checkout", "--quiet", "main");
    git("branch", "--quiet", "-D", "feat/outbox");
    expect(ran("sync")).toEqual([
      "draft for feat/outbox released — the branch is gone",
      "domainbook: synced with origin — draft published, 0 peers in progress",
    ]);
  });

  it("exits 1 naming the URL and git's reason when the remote is out of reach", () => {
    gone();
    expect(failed("sync")[0]).toMatch(
      /^could not reach origin \(.+\/gone\): .*does not appear to be a git repository$/
    );
  });
});
