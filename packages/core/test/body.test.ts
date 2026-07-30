import { describe, expect, it } from "vitest";
import { parseChangelog } from "../src/body/changelog.js";
import { parseDecisionBody } from "../src/body/decision.js";
import { checkDomainBody } from "../src/body/domain.js";
import { parseFeatureBody } from "../src/body/feature.js";
import { parseGlossary } from "../src/body/glossary.js";
import { type Node, parseMarkdown } from "../src/body/markdown.js";
import { formatIssue } from "../src/index.js";
import { bookDir, brokenDir, read } from "./paths.js";

function fromBook(name: string) {
  return parseMarkdown(read(bookDir, name), 1);
}

describe("the glossary parser", () => {
  const parsed = parseGlossary(
    "glossary.md",
    fromBook("domains/ticketing/glossary.md")
  );

  it("reads every term with its slug, line, and bullets", () => {
    expect(parsed.issues).toEqual([]);
    expect(parsed.record.terms.map((term) => [term.slug, term.line])).toEqual([
      ["event", 5],
      ["hold", 15],
      ["seat-map", 25],
      ["sale", 34],
    ]);
    expect(parsed.record.terms[1]).toMatchObject({
      name: "Hold",
      aliases: ["reservation", "lock"],
      status: "validated",
      examples: [
        "A hold placed at 10:00 on A1 and A2 releases both seats at 10:10.",
        "A fan who abandons checkout leaves a hold behind; nobody cancels it.",
      ],
    });
  });

  it("defaults a term with no status bullet to draft", () => {
    const terms = parseGlossary("glossary.md", fromBook("glossary.md")).record
      .terms;
    expect(terms.map((term) => [term.slug, term.status])).toEqual([
      ["event", "validated"],
      ["fan", "draft"],
      ["venue", "draft"],
    ]);
  });

  it("joins a bullet's continuation line into the same example", () => {
    expect(parsed.record.terms[0]?.examples).toEqual([
      "A show announced without a seat map is not an event to ticketing until seating publishes one.",
    ]);
  });

  it("names the term's unknown status and the line the bullet sits on", () => {
    const source = read(brokenDir, "glossary-unknown-term-status.md");
    const issues = parseGlossary(
      "glossary.md",
      parseMarkdown(source, 1)
    ).issues;
    expect(issues.map(formatIssue)).toEqual([
      'glossary.md:11 status: must be one of "draft", "validated", "deprecated"',
    ]);
  });

  it("rejects a code block inside a term", () => {
    const source = "## Hold\n\nA claim on seats.\n\n```js\nhold()\n```\n";
    const issues = parseGlossary(
      "glossary.md",
      parseMarkdown(source, 1)
    ).issues;
    expect(issues.map(formatIssue)).toEqual([
      'glossary.md:5: the term "Hold" holds a code block — a term is prose and bullets only',
    ]);
  });

  it("rejects a heading that is not a term", () => {
    const source = "# Glossary\n\n## Hold\n\nA claim.\n\n### Detail\n\nMore.\n";
    const issues = parseGlossary(
      "glossary.md",
      parseMarkdown(source, 1)
    ).issues;
    expect(issues.map(formatIssue)).toEqual([
      'glossary.md:7: "Detail" is not a term — a glossary is an optional H1 title and intro, then one H2 per term',
    ]);
  });

  it("rejects a glossary with no terms at all", () => {
    const issues = parseGlossary(
      "glossary.md",
      parseMarkdown("# Glossary\n\nNothing yet.\n", 1)
    ).issues;
    expect(issues.map(formatIssue)).toEqual([
      "glossary.md: this glossary defines no terms — a glossary is an optional H1 title and intro, then one H2 per term",
    ]);
  });
});

describe("the changelog parser", () => {
  const parsed = parseChangelog(
    "changelog.md",
    fromBook("domains/ticketing/changelog.md")
  );

  it("reads unreleased and every release, newest first", () => {
    expect(parsed.issues).toEqual([]);
    expect(parsed.record.changelog).toEqual({
      unreleased: {
        added: [
          "Queue position for fans whose hold expires on a sold-out event.",
        ],
      },
      releases: [
        {
          version: "1.2.0",
          date: "2026-06-30",
          yanked: false,
          added: [
            "Automatic refund when a payment is captured after the hold expired.",
          ],
          changed: [
            "A hold now lasts ten minutes for every event; the per-venue setting is gone.",
          ],
          removed: ["Per-venue hold duration."],
          fixed: [
            "Two fans could hold the same seat when a seat map changed mid-checkout.",
          ],
        },
        {
          version: "1.1.0",
          date: "2026-05-04",
          yanked: true,
          added: ["Per-venue hold duration."],
          security: [
            "Hold identifiers are no longer guessable from the seat number.",
          ],
        },
        {
          version: "1.0.0",
          date: "2026-04-02",
          yanked: false,
          added: [
            "Holds, payment capture, and ticket issuing for seated events.",
          ],
        },
      ],
    });
  });

  it("names a bucket that is not one of the six", () => {
    const source = read(brokenDir, "changelog-unknown-bucket.md");
    const issues = parseChangelog(
      "changelog.md",
      parseMarkdown(source, 1)
    ).issues;
    expect(issues.map(formatIssue)).toEqual([
      'changelog.md:19: "Notes" is not a changelog section — a release holds Added, Changed, Deprecated, Removed, Fixed, Security as H3s, each a bullet list',
    ]);
  });

  it.each([
    [
      "rejects an unreleased section written below a release",
      "## [1.0.0] - 2026-04-02\n\n### Added\n\n- Holds.\n\n## [Unreleased]\n\n### Added\n\n- Queues.\n",
      'changelog.md:7: "[Unreleased]" comes after a release — an unreleased section comes above every release',
    ],
    [
      "names a bucket that sits above every release",
      "# Changelog\n\n### Added\n\n- Floating.\n\n## [1.0.0] - 2026-04-02\n\n### Added\n\n- Holds.\n",
      'changelog.md:3: "Added" is not part of a release — a changelog is an optional H1 title and intro, then "## [Unreleased]" and one H2 per release',
    ],
    [
      "rejects a second H1 written between releases",
      "# Changelog\n\n## [1.0.0] - 2026-04-02\n\n### Added\n\n- Holds.\n\n# Older releases\n\n## [0.9.0] - 2026-03-01\n\n### Added\n\n- Seats.\n",
      'changelog.md:9: "Older releases" is a second H1 — a changelog is an optional H1 title and intro, then "## [Unreleased]" and one H2 per release',
    ],
    [
      "does not call releases out of order when a date is malformed",
      "## [1.2.0] - 06-30-2026\n\n### Added\n\n- Refunds.\n\n## [1.1.0] - 2026-05-04\n\n### Added\n\n- Holds.\n",
      "changelog.md:1 releases[0].date: must be a date as YYYY-MM-DD",
    ],
    [
      "rejects a bucket with no bullets under it",
      "## [1.0.0] - 2026-04-02\n\n### Added\n\n### Fixed\n\n- A.\n",
      'changelog.md:3: "Added" lists nothing — write each change as a "- " bullet, or drop the heading',
    ],
  ])("%s", (_name, source, expected) => {
    const issues = parseChangelog(
      "changelog.md",
      parseMarkdown(source, 1)
    ).issues;
    expect(issues.map(formatIssue)).toEqual([expected]);
  });
});

describe("the feature parser", () => {
  const parsed = parseFeatureBody(
    "feature.md",
    parseMarkdown(
      read(bookDir, "domains/ticketing/features/hold-seats-during-checkout.md"),
      1
    )
  );

  it("reads the story and one record per rule", () => {
    expect(parsed.rules.map((rule) => rule.name)).toEqual([
      "A hold expires ten minutes after it is placed",
      "Payment captured before the hold expires issues a ticket",
      "Payment captured after the hold expires is refunded",
    ]);
    expect(parsed.story).toContain("As a fan buying tickets");
    expect(
      parsed.rules.map((rule) => rule.examples.map((one) => one.line))
    ).toEqual([[18], [33], [43]]);
  });

  it("maps a gherkin parse error back to the markdown line", () => {
    const source = read(brokenDir, "feature-malformed-gherkin.md");
    const issues = parseFeatureBody(
      "feature.md",
      parseMarkdown(source, 1)
    ).issues;
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toMatch(/^gherkin does not parse — /);
    expect(source.split("\n")[(issues[0]?.line ?? 1) - 1]).toBe("```");
  });

  it.each([
    [
      "rejects a gherkin block that belongs to no rule",
      "## Story\n\nAs a fan\n\n```gherkin\nExample: stray\n  Given a hold\n```\n\n## Rule: A hold expires\n\n## Open Questions\n\n- None.\n",
      [
        'feature.md:5: a gherkin example belongs to a rule — move this block under a "## Rule: …" heading',
      ],
    ],
    [
      "rejects a section written twice",
      "## Story\n\nAs a fan\n\n## Story\n\nAgain\n\n## Rule: A hold expires\n\n## Rule: A hold expires\n\n## Open Questions\n\n- None.\n\n## Open Questions\n\n- None.\n",
      [
        'feature.md:5: the feature section "Story" appears twice — a feature is Story, then its rules, then Open Questions',
        'feature.md:11: the feature section "Rule: A hold expires" appears twice — a feature is Story, then its rules, then Open Questions',
        'feature.md:17: the feature section "Open Questions" appears twice — a feature is Story, then its rules, then Open Questions',
      ],
    ],
    [
      "rejects a gherkin block with no example in it",
      "## Story\n\nAs a fan\n\n## Rule: A hold expires\n\n```gherkin\n```\n\n## Open Questions\n\n- None.\n",
      [
        'feature.md:7: this gherkin block documents nothing — write "Example: …" with its Given/When/Then steps, or remove the block',
      ],
    ],
  ])("%s", (_name, source, expected) => {
    const issues = parseFeatureBody(
      "feature.md",
      parseMarkdown(source, 1)
    ).issues;
    expect(issues.map(formatIssue)).toEqual(expected);
  });

  it("reads a fence tagged Gherkin the same as gherkin", () => {
    const source =
      "## Story\n\nAs a fan\n\n## Rule: A hold expires\n\n```Gherkin\nExample: a hold expires\n  Given a hold\n```\n\n## Open Questions\n\n- None.\n";
    const parsed = parseFeatureBody("feature.md", parseMarkdown(source, 1));
    expect(parsed.issues).toEqual([]);
    expect(parsed.rules[0]?.examples.map((one) => one.line)).toEqual([7]);
  });

  it("rejects a feature with no rule at all", () => {
    const source = "## Story\n\nAs a fan\n\n## Open Questions\n\n- None.\n";
    const issues = parseFeatureBody(
      "feature.md",
      parseMarkdown(source, 1)
    ).issues;
    expect(issues.map(formatIssue)).toEqual([
      'feature.md: a feature carries at least one "## Rule: …" — a feature is Story, then its rules, then Open Questions',
    ]);
  });
});

describe("the domain body check", () => {
  it("passes the eight canvas sections in canvas order", () => {
    expect(
      checkDomainBody("index.md", fromBook("domains/seating/index.md"))
    ).toEqual([]);
  });

  it("rejects a canvas section written twice", () => {
    const source = [
      "## Purpose",
      "## Domain Roles",
      "## Inbound Communication",
      "## Outbound Communication",
      "## Business Decisions",
      "## Assumptions",
      "## Verification Metrics",
      "## Open Questions",
      "## Purpose",
    ].join("\n\n");
    expect(
      checkDomainBody("index.md", parseMarkdown(source, 1)).map(formatIssue)
    ).toEqual([
      'index.md:17: the canvas section "Purpose" appears twice — a domain page carries only Purpose, Domain Roles, Inbound Communication, Outbound Communication, Business Decisions, Assumptions, Verification Metrics, Open Questions',
    ]);
  });
});

describe("the decision body parser", () => {
  it("takes the title from the H1 and accepts MADR order", () => {
    const parsed = parseDecisionBody(
      "decision.md",
      fromBook("decisions/0001-store-every-timestamp-in-utc.md")
    );
    expect(parsed.issues).toEqual([]);
    expect(parsed.title).toBe("Store every timestamp in UTC");
  });

  it("leaves the option headings under Pros and Cons alone", () => {
    const parsed = parseDecisionBody(
      "decision.md",
      fromBook("decisions/0001-store-every-timestamp-in-utc.md")
    );
    expect(parsed.issues).toEqual([]);
  });

  it("rejects a decision with no H1 title", () => {
    const source =
      "## Context and Problem Statement\n\nWhy.\n\n## Considered Options\n\n- One.\n\n## Decision Outcome\n\nChosen.\n\n### Consequences\n\n- Good.\n";
    const parsed = parseDecisionBody("decision.md", parseMarkdown(source, 1));
    expect(parsed.title).toBe("");
    expect(parsed.issues.map(formatIssue)).toEqual([
      'decision.md:1: a decision opens with its title as an H1 — write "# <the decision>" above "## Context and Problem Statement"',
    ]);
  });

  it("rejects Consequences written as an H2", () => {
    const source =
      "# Title\n\n## Context and Problem Statement\n\nWhy.\n\n## Considered Options\n\n- One.\n\n## Decision Outcome\n\nChosen.\n\n## Consequences\n\n- Good.\n";
    const parsed = parseDecisionBody("decision.md", parseMarkdown(source, 1));
    expect(parsed.issues.map(formatIssue)).toEqual([
      'decision.md:15: the MADR section "Consequences" is written with ## — write it with ###',
    ]);
  });
});

describe("the markdown scanner", () => {
  it("ignores a heading inside a fenced block", () => {
    const nodes = parseMarkdown(
      "## Real\n\n```\n## Fake\n```\n\n## Also real\n",
      1
    );
    expect(
      nodes.filter((node) => node.kind === "heading").map((node) => node.text)
    ).toEqual(["Real", "Also real"]);
  });

  it("counts lines from the line the body starts on", () => {
    const nodes = parseMarkdown("## Purpose\n", 10);
    expect(nodes[0]).toMatchObject({ kind: "heading", line: 10 });
  });
});

describe("a body written with CRLF line endings", () => {
  const domainPage = "domains/seating/index.md";
  const decisionPage =
    "domains/ticketing/decisions/0001-expire-holds-after-ten-minutes.md";
  const featurePage =
    "domains/ticketing/features/hold-seats-during-checkout.md";

  function bothWays(name: string): [Node[], Node[]] {
    const source = read(bookDir, name);
    return [
      parseMarkdown(source, 1),
      parseMarkdown(source.replace(/\n/g, "\r\n"), 1),
    ];
  }

  it.each([
    "roadmap.md",
    "glossary.md",
    domainPage,
    "domains/ticketing/changelog.md",
    decisionPage,
    featurePage,
  ])("scans %s into the same nodes as its LF copy", (name) => {
    const [lf, crlf] = bothWays(name);
    expect(crlf).toEqual(lf);
  });

  it("reads a domain page with no canvas issues of its own", () => {
    const [lf, crlf] = bothWays(domainPage);
    expect(checkDomainBody("index.md", crlf)).toEqual(
      checkDomainBody("index.md", lf)
    );
    expect(checkDomainBody("index.md", crlf)).toEqual([]);
  });

  it("reads a decision's title and MADR sections", () => {
    const [lf, crlf] = bothWays(decisionPage);
    const parsed = parseDecisionBody("decision.md", crlf);
    expect(parsed).toEqual(parseDecisionBody("decision.md", lf));
    expect(parsed.title).toBe("Expire holds after ten minutes");
    expect(parsed.issues).toEqual([]);
  });

  it("reads a feature's story, rules, and gherkin blocks", () => {
    const [lf, crlf] = bothWays(featurePage);
    const parsed = parseFeatureBody("feature.md", crlf);
    expect(parsed).toEqual(parseFeatureBody("feature.md", lf));
    expect(parsed.rules).toHaveLength(3);
    expect(parsed.rules[0]?.examples[0]?.source).toContain("Given");
    expect(parsed.issues).toEqual([]);
  });
});
