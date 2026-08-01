import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getChangelog } from "../src/tools/changelog.js";
import { getDecisions } from "../src/tools/decisions.js";
import { getContextMap, getDomain } from "../src/tools/domain.js";
import { whereToDocument } from "../src/tools/document.js";
import { getFeature } from "../src/tools/feature.js";
import { searchBook } from "../src/tools/search.js";
import { explainTerms } from "../src/tools/terms.js";
import { golden, textOf } from "./book.js";

const book = golden();

describe("explain_terms", () => {
  it("gives a term its definition, status and the features that use it", () => {
    const said = textOf(explainTerms(book, ["hold"]));
    expect(said).toContain("## Hold — ticketing");
    expect(said).toContain("A claim on named seats");
    expect(said).toContain("- Status: validated");
    expect(said).toContain("- Aliases: reservation, lock");
    expect(said).toContain("- Used by hold-seats-during-checkout");
  });

  it("finds a term through one of its aliases and says so", () => {
    const said = textOf(explainTerms(book, ["reservation"]));
    expect(said).toContain("## Hold — ticketing");
    expect(said).toContain('- "reservation" is an alias of Hold');
  });

  it("gives both definitions when two glossaries define one word", () => {
    const said = textOf(explainTerms(book, ["event"]));
    expect(said).toContain("## Event — ticketing");
    expect(said).toContain("## Event — the book");
  });

  it("puts a context's own word first when the context is named", () => {
    const said = textOf(explainTerms(book, ["event"], "ticketing"));
    expect(said.indexOf("## Event — ticketing")).toBeLessThan(
      said.indexOf("## Event — the book")
    );
  });

  it("leaves other contexts out when one is named", () => {
    const said = textOf(explainTerms(book, ["hold"], "seating"));
    expect(said).toContain('no "hold" in this book');
  });

  it("does not guess at a word the book has never heard of", () => {
    const said = textOf(explainTerms(book, ["escrow"]));
    expect(said).toContain('no "escrow" in this book');
    expect(said).toContain("near it: ");
  });

  it("matches a word written with different capitals", () => {
    expect(textOf(explainTerms(book, ["Seat Map"]))).toContain(
      "## Seat Map — ticketing"
    );
  });

  it("answers three words in one call and keeps the two it knows", () => {
    const said = textOf(explainTerms(book, ["hold", "escrow", "sale"]));
    expect(said).toContain("## Hold — ticketing");
    expect(said).toContain("## Sale — ticketing");
    expect(said).toContain('no "escrow" in this book');
  });

  it("marks a draft term as a draft", () => {
    expect(textOf(explainTerms(book, ["sale"]))).toContain("- Status: draft");
  });

  it("says when a term is referenced by no feature", () => {
    const said = textOf(explainTerms(book, ["venue"]));
    expect(said).toContain("## Venue — the book");
    expect(said).toContain("- No feature references it");
  });

  it("keeps the book's shared words in reach from inside a context", () => {
    expect(textOf(explainTerms(book, ["fan"], "seating"))).toContain(
      "## Fan — the book"
    );
  });
});

describe("get_domain", () => {
  it("gives the canvas in canvas order", () => {
    const said = textOf(getDomain(book, "ticketing"));
    const order = [
      "## Purpose",
      "## Domain Roles",
      "## Inbound Communication",
      "## Outbound Communication",
      "## Business Decisions",
      "## Assumptions",
      "## Verification Metrics",
      "## Open Questions",
    ].map((heading) => said.indexOf(heading));
    expect(order.every((at) => at !== -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("carries the name, the three classification axes and the code it claims", () => {
    const said = textOf(getDomain(book, "ticketing"));
    expect(said).toContain("# Ticketing (ticketing)");
    expect(said).toContain("core-domain · revenue-generator · custom-built");
    expect(said).toContain("Claims `src/ticketing/**`.");
  });

  it("indexes what the context holds without giving any of it", () => {
    const said = textOf(getDomain(book, "ticketing"));
    expect(said).toContain("- Features: hold-seats-during-checkout");
    expect(said).toContain("- 3 decisions — read them with get_decisions");
    expect(said).toContain("terms — read them with explain_terms");
    expect(said).not.toContain("As a fan buying tickets");
  });

  it("names the domains there are when one is not there", () => {
    const answer = getDomain(book, "shipping");
    expect(answer.isError).toBe(true);
    expect(textOf(answer)).toBe(
      'no domain "shipping" in this book — it holds access-control, seating and ticketing'
    );
  });
});

describe("get_context_map", () => {
  it("orients an asymmetric relationship and carries its patterns", () => {
    const said = textOf(getContextMap(book));
    expect(said).toContain(
      "- seating ↔ ticketing: upstream-downstream — seating upstream, ticketing downstream (ticketing: ACL)"
    );
  });

  it("leaves a symmetric relationship without a direction", () => {
    const said = textOf(getContextMap(book));
    expect(said).toContain("- access-control ↔ seating: separate-ways");
    expect(said).not.toContain("separate-ways — ");
  });

  it("carries every context with its classification", () => {
    const said = textOf(getContextMap(book));
    expect(said).toContain(
      "- Ticketing (ticketing) — core-domain, revenue-generator, custom-built"
    );
  });

  it("narrows to one context and its neighbours", () => {
    const said = textOf(getContextMap(book, "access-control"));
    expect(said).toContain("access-control");
    expect(said).toContain("seating");
  });

  it("names the domains there are when one is not there", () => {
    expect(getContextMap(book, "shipping").isError).toBe(true);
  });
});

describe("get_feature", () => {
  it("gives the story, the rules and the gherkin as written", () => {
    const said = textOf(getFeature(book, "hold-seats-during-checkout"));
    expect(said).toContain("## Story");
    expect(said).toContain("As a fan buying tickets");
    expect(said).toContain("## Rule:");
    expect(said).toContain("```gherkin");
    expect(said).toContain("## Open Questions");
  });

  it("carries the frontmatter with it", () => {
    const said = textOf(getFeature(book, "hold-seats-during-checkout"));
    expect(said).toContain("ticketing · implemented");
    expect(said).toContain("Terms: hold, seat-map, sale, event, fan");
    expect(said).toContain("Decisions: ticketing/ADR-0001, ADR-0001");
  });

  it("names the features there are when one is not there", () => {
    const answer = getFeature(book, "cancel-a-hold", "ticketing");
    expect(answer.isError).toBe(true);
    expect(textOf(answer)).toBe(
      'no feature "cancel-a-hold" in ticketing — it holds hold-seats-during-checkout'
    );
  });

  it("names the domains there are when the context is not there", () => {
    expect(getFeature(book, "anything", "shipping").isError).toBe(true);
  });
});

describe("get_decisions", () => {
  it("answers a domain with one line per record and no bodies", () => {
    const said = textOf(getDecisions(book, { domain: "ticketing" }));
    expect(said).toContain("- ticketing/ADR-0001 — ");
    expect(said).toContain("- ticketing/ADR-0003 — ");
    expect(said).not.toContain("## Context and Problem Statement");
  });

  it("carries the author's own opening sentence", () => {
    const said = textOf(getDecisions(book, { domain: "ticketing" }));
    expect(said).toMatch(/Chosen option/);
  });

  it("gives a body back when a record is named by id", () => {
    const said = textOf(getDecisions(book, { ids: ["ticketing/ADR-0001"] }));
    expect(said).toContain("## Context and Problem Statement");
    expect(said).toContain("## Decision Outcome");
  });

  it("leaves the book's own log out of a path-scoped answer", () => {
    const said = textOf(
      getDecisions(book, { paths: ["src/ticketing/hold.ts"] })
    );
    expect(said).toContain("- ticketing/ADR-0001 — ");
    expect(said).not.toContain("- ADR-0001 — ");
  });

  it("takes a folder as scope, not only a file inside it", () => {
    const said = textOf(getDecisions(book, { paths: ["src/ticketing/"] }));
    expect(said).toContain("- ticketing/ADR-0001 — ");
  });

  it("says so when no domain claims the paths", () => {
    const answer = getDecisions(book, { paths: ["README.md"] });
    expect(answer.isError).toBe(true);
    expect(textOf(answer)).toBe(
      "no domain claims those paths — name a domain instead, or pass all to read the whole book"
    );
  });

  it("refuses a call with no scope at all", () => {
    const answer = getDecisions(book, {});
    expect(answer.isError).toBe(true);
    expect(textOf(answer)).toBe(
      "name a domain, the paths you are changing, or the ids you want — or pass all to read every decision in the book"
    );
  });

  it("reads every live record when all is asked for", () => {
    const said = textOf(getDecisions(book, { all: true }));
    expect(said).toContain("- ADR-0001 — ");
    expect(said).toContain("- ticketing/ADR-0003 — ");
  });

  it("names the log's last number when a reference is not there", () => {
    const answer = getDecisions(book, { ids: ["ticketing/ADR-0099"] });
    expect(answer.isError).toBe(true);
    expect(textOf(answer)).toContain("that log runs to ADR-0003");
  });

  it("leaves a superseded record out of the index and keeps it reachable", () => {
    const index = textOf(getDecisions(book, { domain: "ticketing" }));
    expect(index).not.toContain("- ticketing/ADR-0002 — ");
    expect(
      textOf(getDecisions(book, { ids: ["ticketing/ADR-0002"] }))
    ).toContain("## Decision Outcome");
  });
});

describe("get_changelog", () => {
  it("gives the newest release and anything unreleased", () => {
    const said = textOf(getChangelog(book, { domain: "ticketing" }));
    expect(said).toContain("## [Unreleased]");
    expect(said).toContain("## [1.2.0] - 2026-06-30");
    expect(said).not.toContain("## [1.0.0]");
  });

  it("names the release before, so the caller knows what to ask for", () => {
    expect(textOf(getChangelog(book, { domain: "ticketing" }))).toContain(
      "The release before is 1.1.0"
    );
  });

  it("gives an older release whole when its version is named", () => {
    const said = textOf(
      getChangelog(book, { domain: "ticketing", version: "1.0.0" })
    );
    expect(said).toContain("## [1.0.0] - 2026-04-02");
    expect(said).not.toContain("## [1.2.0]");
  });

  it("says a release was yanked", () => {
    expect(
      textOf(getChangelog(book, { domain: "ticketing", version: "1.1.0" }))
    ).toContain("[YANKED]");
  });

  it("reaches every release on or after a date", () => {
    const said = textOf(
      getChangelog(book, { domain: "ticketing", since: "2026-05-01" })
    );
    expect(said).toContain("## [1.2.0]");
    expect(said).toContain("## [1.1.0]");
    expect(said).not.toContain("## [1.0.0]");
  });

  it("returns entries under the bucket they were written in", () => {
    const said = textOf(getChangelog(book, { domain: "ticketing" }));
    expect(said).toContain("### Added");
    expect(said).toContain(
      "- Automatic refund when a payment is captured after the hold expired."
    );
  });

  it("names the versions there are when one is not there", () => {
    expect(
      textOf(getChangelog(book, { domain: "ticketing", version: "9.9.9" }))
    ).toContain("it holds 1.2.0, 1.1.0, 1.0.0");
  });

  it("says when a context keeps no changelog", () => {
    const answer = getChangelog(book, { domain: "seating" });
    expect(answer.isError).toBe(true);
    expect(textOf(answer)).toContain("seating keeps no changelog");
  });

  it("refuses a call with no scope at all", () => {
    expect(getChangelog(book, {}).isError).toBe(true);
  });
});

describe("search_book", () => {
  it("returns locators rather than bodies", () => {
    const said = textOf(searchBook(book, "ten minutes", {}));
    expect(said).toMatch(/- \w+ \S+ \(.+\) — \S+:\d+/);
    expect(said).toContain("artifacts matched");
  });

  it("narrows to one artifact type", () => {
    const said = textOf(searchBook(book, "hold", { kind: "feature" }));
    expect(said).toContain("- feature hold-seats-during-checkout");
    expect(said).not.toContain("- decision ");
  });

  it("narrows to one context", () => {
    const said = textOf(searchBook(book, "seat", { domain: "seating" }));
    expect(said).not.toContain("(ticketing)");
  });

  it("says plainly when nothing matches", () => {
    expect(textOf(searchBook(book, "escrow", {}))).toBe(
      'nothing in this book matches "escrow"'
    );
  });

  it("keeps a superseded record out of results", () => {
    const said = textOf(searchBook(book, "capture", {}));
    expect(said).toContain("- decision ticketing/ADR-0003 ");
    expect(said).not.toContain("- decision ticketing/ADR-0002 ");
  });
});

describe("where_to_document", () => {
  it("names the domain and the folder to write in", () => {
    const said = textOf(whereToDocument(book, ["src/ticketing/hold.ts"]));
    expect(said).toContain("## ticketing");
    expect(said).toContain("/domains/ticketing/");
    expect(said).toContain(
      "the canvas, the glossary, the changelog, a feature, a decision or a debt record"
    );
  });

  it("says nothing is claimed when no domain claims the paths", () => {
    expect(textOf(whereToDocument(book, ["README.md"]))).toBe(
      "nothing in this change is claimed by a domain"
    );
  });

  it("says the book already covers a change that touches it", () => {
    const said = textOf(
      whereToDocument(book, [
        "src/ticketing/hold.ts",
        `${book.root}/domains/ticketing/changelog.md`,
      ])
    );
    expect(said).toContain("the book already covers this change");
  });

  it("takes a folder as scope, not only a file inside it", () => {
    const said = textOf(whereToDocument(book, ["src/ticketing/"]));
    expect(said).toContain("## ticketing");
  });

  it("names the open debt over the paths", () => {
    const said = textOf(
      whereToDocument(book, ["src/ticketing/holds/expiry.ts"])
    );
    expect(said).toContain(
      "ticketing/TDR-0001 is open over src/ticketing/holds/expiry.ts"
    );
  });

  it("leaves debt that is accepted or repaid out", () => {
    const said = textOf(
      whereToDocument(book, ["src/ticketing/holds/expiry.ts"])
    );
    expect(said).not.toContain("TDR-0002");
    expect(said).not.toContain("- TDR-0001 ");
  });

  it("refuses an absolute path with the path to pass instead", () => {
    const answer = whereToDocument(book, [
      join(process.cwd(), "src/ticketing/hold.ts"),
    ]);
    expect(answer.isError).toBe(true);
    expect(textOf(answer)).toBe(
      'paths are read from the repo root — pass "src/ticketing/hold.ts" rather than an absolute path'
    );
  });

  it("refuses a path that climbs out of the repo", () => {
    const answer = whereToDocument(book, ["../other/src/ticketing/hold.ts"]);
    expect(answer.isError).toBe(true);
    expect(textOf(answer)).toContain("climbs out of it");
  });

  it("treats no paths as a question with no answer", () => {
    expect(textOf(whereToDocument(book, []))).toBe(
      "there are no paths to place"
    );
  });
});
