import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  type Book,
  configSchema,
  findRemote,
  publishDraft,
  readState,
  type Remote,
  sync,
  whoAmI,
  writeState,
} from "@domainbook/core";
import { open } from "../src/book.js";
import type { Peers } from "../src/peers.js";
import { getDecisions } from "../src/tools/decisions.js";
import { getDomain } from "../src/tools/domain.js";
import { whereToDocument } from "../src/tools/document.js";
import { getFeature } from "../src/tools/feature.js";
import { searchBook } from "../src/tools/search.js";
import { explainTerms } from "../src/tools/terms.js";
import { copied, goldenDir, textOf } from "./book.js";

const config = configSchema.parse({});
const inProgress = /in progress — bob@example\.com on feat\/refunds \(draft, \d+ seconds? ago\)/g;

type Clone = { dir: string; root: string; remote: Remote };

let home: string;
let origin: string;
let alice: Clone;
let bob: Clone;

beforeAll(() => {
  home = mkdtempSync(join(tmpdir(), "domainbook-peers-"));
  origin = join(home, "origin.git");
  git(home, "init", "--quiet", "--bare", origin);
  alice = clone("alice");
  cpSync(goldenDir, alice.root, { recursive: true });
  git(alice.dir, "add", "-A");
  git(alice.dir, "commit", "--quiet", "-m", "book");
  git(alice.dir, "push", "--quiet", "origin", "main");
  bob = clone("bob");
  git(bob.dir, "pull", "--quiet", "origin", "main");
  git(bob.dir, "checkout", "--quiet", "-b", "feat/refunds");
  writeBobsWork();
  expect(publishDraft(bob.remote, whoAmI(bob.remote)).kind).toBe("published");
});

afterAll(() => {
  rmSync(home, { recursive: true, force: true });
});

function git(cwd: string, ...args: string[]): string {
  return execFileSync("git", args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function clone(who: string): Clone {
  const dir = join(home, who);
  git(home, "init", "--quiet", "--initial-branch=main", dir);
  git(dir, "remote", "add", "origin", origin);
  const identity = { "user.email": `${who}@example.com`, "user.name": who };
  for (const [key, value] of Object.entries(identity))
    git(dir, "config", key, value);
  const root = join(dir, "domainbook");
  mkdirSync(root, { recursive: true });
  const remote = findRemote(root, config);
  if (remote === undefined) throw new Error("no remote");
  return { dir, root, remote };
}

function writeBobsWork(): void {
  const ticketing = join(bob.root, "domains", "ticketing");
  writeFileSync(
    join(ticketing, "decisions", "0004-charge-back-a-disputed-sale.md"),
    decision("Charge back a disputed sale")
  );
  const glossary = join(ticketing, "glossary.md");
  writeFileSync(
    glossary,
    readFileSync(glossary, "utf8").replace(
      "A payment captured against a hold, before the hold expired. A sale is what\nissues a ticket.",
      "A payment captured against a hold before it expired, net of any chargeback."
    ) +
      "\n## Chargeback\n\nA sale the fan's bank reversed after the event.\n\n- **Status:** draft\n"
  );
  writeFileSync(join(ticketing, "features", "refund-order.md"), feature());
  writeFileSync(
    join(ticketing, "debt", "0003-refund-latency-is-not-tracked.md"),
    debt()
  );
}

function debt(): string {
  return `---
status: open
date: 2026-09-14
severity: medium
quadrant: deliberate-prudent
owners: [bob]
---

# Refund latency is not tracked

## Debt

Nothing records how long a refund takes from request to money returned, so a
slow path shows up only when a fan complains.

## Impact

Support cannot tell a normal delay from a stuck one, and there is no number to
watch after the refund path changes.

## Remedy

Emit a timestamp when a refund is requested and when it settles, and put the gap
on the canvas as a metric.
`;
}

function decision(title: string): string {
  return `---
status: proposed
date: 2026-09-14
decision-makers: [bob]
---

# ${title}

## Context and Problem Statement

A bank can reverse a sale after the event — a chargeback.

## Considered Options

- Refund the fan and eat the fee.

## Decision Outcome

Chosen option: "Refund the fan and eat the fee", because the fee is cheaper than the dispute.

### Consequences

- Good, because the fan is made whole.
`;
}

function feature(): string {
  return `---
id: refund-order
name: Refund an order
status: draft
owners: [bob]
terms: [chargeback]
---

## Story

As a fan whose bank reversed a sale
I want the order refunded
So that I am not charged twice

## Rule: A chargeback refunds the order

\`\`\`gherkin
Example: A reversed sale is refunded
  Given a sale the bank reversed
  When the chargeback lands
  Then the order is refunded
\`\`\`

## Open Questions

None.
`;
}

function opened(root: string): { book: Book; peers: Peers } {
  const result = open(root);
  if ("refusal" in result) throw new Error(result.refusal);
  return result;
}

describe("get_decisions with a peer in progress", () => {
  it("lists the peer's unmerged record after main's, with the in-progress line", () => {
    const { book, peers } = opened(alice.root);
    const said = textOf(getDecisions(book, { domain: "ticketing" }, peers));
    expect(said).toContain(
      "- ticketing/ADR-0004 — Charge back a disputed sale (proposed, 2026-09-14, ticketing)"
    );
    expect(said.match(inProgress)).toHaveLength(1);
    expect(said.indexOf("in progress")).toBeGreaterThan(
      said.indexOf("- ticketing/ADR-0004")
    );
    expect(said.indexOf("- ticketing/ADR-0003")).toBeLessThan(
      said.indexOf("- ticketing/ADR-0004")
    );
  });

  it("does not repeat a merged record the peer's draft carries unchanged", () => {
    const { book, peers } = opened(alice.root);
    const said = textOf(getDecisions(book, { domain: "ticketing" }, peers));
    expect(said.match(/- ticketing\/ADR-0001 — /g)).toHaveLength(1);
  });

  it("reaches the peer's record through a path scope and through all", () => {
    const { book, peers } = opened(alice.root);
    expect(
      textOf(getDecisions(book, { paths: ["src/ticketing/hold.ts"] }, peers))
    ).toContain("- ticketing/ADR-0004 — ");
    expect(textOf(getDecisions(book, { all: true }, peers))).toContain(
      "- ticketing/ADR-0004 — "
    );
  });

  it("falls back to the peer's record when an id is not in this book", () => {
    const { book, peers } = opened(alice.root);
    const said = textOf(
      getDecisions(book, { ids: ["ticketing/ADR-0004"] }, peers)
    );
    expect(said).toMatch(/^in progress — bob@example\.com on feat\/refunds/);
    expect(said).toContain("# Charge back a disputed sale");
    expect(said).toContain("## Decision Outcome");
  });

  it("serves a merged record without any in-progress line", () => {
    const { book, peers } = opened(alice.root);
    expect(
      textOf(getDecisions(book, { ids: ["ticketing/ADR-0001"] }, peers))
    ).not.toContain("in progress");
  });

  it("still refuses an id nobody holds", () => {
    const { book, peers } = opened(alice.root);
    const answer = getDecisions(book, { ids: ["ticketing/ADR-0099"] }, peers);
    expect(answer.isError).toBe(true);
    expect(textOf(answer)).toContain("that log runs to ADR-0003");
  });
});

describe("explain_terms with a peer in progress", () => {
  it("explains a word only the peer has defined, and says where it comes from", () => {
    const { book, peers } = opened(alice.root);
    const said = textOf(explainTerms(book, ["chargeback"], undefined, peers));
    expect(said).toContain("## Chargeback — ticketing");
    expect(said).toContain("A sale the fan's bank reversed after the event.");
    expect(said).toContain("- Used by refund-order (");
    expect(said).toContain("/domains/ticketing/features/refund-order.md)");
    expect(said).not.toContain(".git/domainbook");
    expect(said.match(inProgress)).toHaveLength(1);
    expect(said).not.toContain('no "chargeback" in this book');
  });

  it("gives the peer's edit of a merged word as a second reading after main's", () => {
    const { book, peers } = opened(alice.root);
    const said = textOf(explainTerms(book, ["sale"], undefined, peers));
    expect(said.match(/## Sale — ticketing/g)).toHaveLength(2);
    expect(said.indexOf("before the hold expired. A sale is what")).toBeLessThan(
      said.indexOf("net of any chargeback")
    );
    expect(said.match(inProgress)).toHaveLength(1);
  });

  it("does not repeat a word the peer's changed glossary defines as main does", () => {
    const { book, peers } = opened(alice.root);
    const said = textOf(explainTerms(book, ["hold"], undefined, peers));
    expect(said.match(/## Hold — ticketing/g)).toHaveLength(1);
    expect(said).not.toContain("in progress");
  });
});

describe("get_feature with a peer in progress", () => {
  it("falls back to the peer's feature when this book has none by that id", () => {
    const { book, peers } = opened(alice.root);
    const said = textOf(getFeature(book, "refund-order", undefined, peers));
    expect(said).toContain("# Refund an order (refund-order)");
    expect(said).toContain("ticketing · draft");
    expect(said).toContain("File: ");
    expect(said).toContain("/domains/ticketing/features/refund-order.md");
    expect(said).not.toContain(".git/domainbook");
    expect(said).toContain("## Story");
    expect(said.match(inProgress)).toHaveLength(1);
  });

  it("keeps a merged feature free of any in-progress line", () => {
    const { book, peers } = opened(alice.root);
    const said = textOf(
      getFeature(book, "hold-seats-during-checkout", undefined, peers)
    );
    expect(said).toContain("## Story");
    expect(said).not.toContain("in progress");
  });

  it("does not find the peer's feature in a context that lacks it", () => {
    const { book, peers } = opened(alice.root);
    expect(getFeature(book, "refund-order", "seating", peers).isError).toBe(true);
  });
});

describe("search_book with a peer in progress", () => {
  it("returns a locator for the peer's artifact with the in-progress line", () => {
    const { book, peers } = opened(alice.root);
    const said = textOf(searchBook(book, "chargeback", {}, peers));
    expect(said).toContain("- decision ticketing/ADR-0004 (ticketing) — ");
    expect(said).toContain(
      "/domains/ticketing/decisions/0004-charge-back-a-disputed-sale.md:"
    );
    expect(said).toContain("- glossary ticketing/glossary (ticketing) — ");
    expect(said).not.toContain(".git/domainbook");
    expect((said.match(inProgress) ?? []).length).toBeGreaterThan(0);
  });

  it("leaves main's own hits unmarked", () => {
    const { book, peers } = opened(alice.root);
    const said = textOf(searchBook(book, "ten minutes", {}, peers));
    expect(said).toContain("artifacts matched");
    expect(said).not.toContain("in progress");
  });
});

describe("get_domain with a peer in progress", () => {
  it("folds a peer's new debt into the count and marks it in progress", () => {
    const { book, peers } = opened(alice.root);
    const said = textOf(getDomain(book, "ticketing", peers));
    expect(said).toContain(
      "- 3 open or recorded debt records, 1 in progress from peers — read them with search_book"
    );
  });

  it("counts only this book's debt when there are no peers", () => {
    const { book } = opened(alice.root);
    expect(textOf(getDomain(book, "ticketing"))).toContain(
      "- 2 open or recorded debt records — read them with search_book"
    );
  });
});

describe("where_to_document with peers in progress", () => {
  it("answers as it would with no peers", () => {
    const { book } = opened(alice.root);
    const said = textOf(whereToDocument(book, ["src/ticketing/hold.ts"]));
    expect(said).toContain("## ticketing");
    expect(said).toContain("/domains/ticketing/");
    expect(said).not.toContain("in progress");
  });
});

describe("the sync behind every call", () => {
  it("fetches once for two calls within a minute", () => {
    opened(alice.root);
    const before = readState(alice.remote).attemptedAt;
    expect(before).toBeDefined();
    opened(alice.root);
    expect(readState(alice.remote).attemptedAt).toBe(before);
  });

  it("works alone when there is no remote", () => {
    const local = copied();
    const { peers } = opened(local.dir);
    expect(peers).toEqual({ work: [], asOf: undefined });
    local.remove();
  });

  it("counts a peer's unreadable file instead of failing this book", () => {
    writeFileSync(
      join(bob.root, "domains", "ticketing", "decisions", "0005-broken.md"),
      "---\nstatus: [\n---\n"
    );
    expect(publishDraft(bob.remote, whoAmI(bob.remote)).kind).toBe("published");
    expect(sync(alice.root, config, { force: true, renumber: false }).kind).toBe(
      "synced"
    );
    const { book, peers } = opened(alice.root);
    const said = textOf(getDecisions(book, { domain: "ticketing" }, peers));
    expect(said).toContain("- ticketing/ADR-0004 — ");
    expect(said).toContain(
      "1 in-progress artifact from bob@example.com on feat/refunds cannot be read yet"
    );
  });

  it("dates the answer when origin cannot be reached", () => {
    renameSync(origin, join(home, "gone.git"));
    writeState(alice.remote, { ...readState(alice.remote), attemptedAt: undefined });
    const { book, peers } = opened(alice.root);
    expect(peers.asOf).toMatch(/^peers as of \d\d:\d\d — origin not reachable$/);
    const said = textOf(getDecisions(book, { domain: "ticketing" }, peers));
    expect(said).toContain("- ticketing/ADR-0004 — ");
    expect(said).toMatch(/peers as of \d\d:\d\d — origin not reachable$/);
    renameSync(join(home, "gone.git"), origin);
  });

  it("says peers are unknown when origin was never reached", () => {
    const carol = clone("carol");
    git(carol.dir, "remote", "set-url", "origin", join(home, "nowhere.git"));
    cpSync(goldenDir, carol.root, { recursive: true });
    const { peers } = opened(carol.root);
    expect(peers).toEqual({
      work: [],
      asOf: "peers unknown — origin not reachable",
    });
  });
});
