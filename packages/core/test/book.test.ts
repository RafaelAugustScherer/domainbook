import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import { parseGlossary } from "../src/body/glossary.js";
import { parseMarkdown } from "../src/body/markdown.js";
import type { ZodType } from "zod";
import {
  configSchema,
  decisionSchema,
  decisionStatusSchema,
  domainSchema,
  featureSchema,
  parseFrontmatter,
  roadmapSchema,
} from "../src/index.js";
import { validBooks, validBooksDir } from "./fixtures/valid-books/manifest.js";
import { bookDir, read } from "./paths.js";

const withFrontmatter: Array<[string, ZodType]> = [
  ["roadmap.md", roadmapSchema],
  ["decisions/0001-store-every-timestamp-in-utc.md", decisionSchema],
  ["domains/access-control/index.md", domainSchema],
  ["domains/seating/index.md", domainSchema],
  ["domains/ticketing/index.md", domainSchema],
  [
    "domains/ticketing/decisions/0001-expire-holds-after-ten-minutes.md",
    decisionSchema,
  ],
  [
    "domains/ticketing/decisions/0002-reject-a-capture-that-lands-after-the-hold-expired.md",
    decisionSchema,
  ],
  [
    "domains/ticketing/decisions/0003-refund-a-late-capture-in-full.md",
    decisionSchema,
  ],
  ["domains/ticketing/features/hold-seats-during-checkout.md", featureSchema],
];

const bodyOnly = [
  "glossary.md",
  "domains/seating/glossary.md",
  "domains/ticketing/glossary.md",
  "domains/ticketing/changelog.md",
];

describe("the valid fixture book", () => {
  it.each(withFrontmatter)("%s passes its schema", (file, schema) => {
    const { data, body } = parseFrontmatter(read(bookDir, file));
    expect(schema.safeParse(data).error?.issues ?? []).toEqual([]);
    expect(body.trim()).not.toBe("");
  });

  it.each(bodyOnly)("%s carries no frontmatter", (file) => {
    expect(parseFrontmatter(read(bookDir, file)).data).toBeUndefined();
  });

  it("domainbook.config.yaml passes the config schema", () => {
    const result = configSchema.safeParse(
      parse(read(bookDir, "domainbook.config.yaml"))
    );
    expect(result.error?.issues ?? []).toEqual([]);
    expect(result.data).toEqual({
      enforcement: {
        mode: "block",
        trailer: "Skip-Docs",
        require_reason: "agents",
      },
    });
  });

  it("fills enforcement defaults when the config file is empty", () => {
    expect(configSchema.parse({})).toEqual({
      enforcement: {
        mode: "block",
        trailer: "Skip-Docs",
        require_reason: "agents",
      },
    });
  });

  it("keeps both sides of the relationship union", () => {
    const ticketing = domainSchema.parse(
      parseFrontmatter(read(bookDir, "domains/ticketing/index.md")).data
    );
    expect(ticketing.relationships).toEqual([
      {
        with: "seating",
        type: "upstream-downstream",
        direction: "downstream",
        patterns: ["ACL"],
      },
      {
        with: "access-control",
        type: "upstream-downstream",
        direction: "upstream",
        patterns: ["OHS", "PL"],
      },
    ]);

    const seating = domainSchema.parse(
      parseFrontmatter(read(bookDir, "domains/seating/index.md")).data
    );
    expect(seating.relationships).toEqual([
      { with: "access-control", type: "separate-ways" },
    ]);
  });

  it("narrows a shared term in the domain that means less by it", () => {
    const shared = termSlugs("glossary.md");
    const ticketing = termSlugs("domains/ticketing/glossary.md");
    expect(shared).toContain("event");
    expect(ticketing).toContain("event");
    expect(shared).toContain("fan");
    expect(ticketing).not.toContain("fan");

    const feature = featureSchema.parse(
      parseFrontmatter(
        read(
          bookDir,
          "domains/ticketing/features/hold-seats-during-checkout.md"
        )
      ).data
    );
    expect(feature.terms).toEqual(["hold", "seat-map", "sale", "event", "fan"]);
  });

  it("keeps the word a context retired, marked deprecated", () => {
    const terms = parseGlossary(
      "domains/seating/glossary.md",
      parseMarkdown(read(bookDir, "domains/seating/glossary.md"), 1)
    ).record.terms;
    expect(terms.map((term) => [term.slug, term.status])).toEqual([
      ["seat-map", "validated"],
      ["held-back-seat", "validated"],
      ["blocked-seat", "deprecated"],
    ]);
  });

  it("carries every optional MADR section on one decision", () => {
    const { body } = parseFrontmatter(
      read(bookDir, "decisions/0001-store-every-timestamp-in-utc.md")
    );
    expect(headings(body, 2)).toEqual([
      "Context and Problem Statement",
      "Decision Drivers",
      "Considered Options",
      "Decision Outcome",
      "Pros and Cons of the Options",
      "More Information",
    ]);
    expect(headings(body, 3)).toEqual([
      "Consequences",
      "Confirmation",
      "Store UTC everywhere, convert at the edge",
      "Store local time with an offset column",
      "Store local time and the venue's time zone identifier",
    ]);
    expect(headings(body, 4)).toEqual(["What the lookup cost"]);
  });

  it("reads a term's definition as the prose above its bullets", () => {
    const terms = parseGlossary(
      "domains/ticketing/glossary.md",
      parseMarkdown(read(bookDir, "domains/ticketing/glossary.md"), 1)
    ).record.terms;
    expect(terms[0]?.definition).toBe(
      "A performance with seats on sale: it has a published seat map, a hold window, and a door time. Ticketing never sells for a performance until all three exist, so a performance the box office knows about is not yet an event here."
    );
  });

  it("names the superseding decision in the domain's own log", () => {
    const superseded = decisionSchema.parse(
      parseFrontmatter(
        read(
          bookDir,
          "domains/ticketing/decisions/0002-reject-a-capture-that-lands-after-the-hold-expired.md"
        )
      ).data
    );
    expect(superseded.status).toBe("superseded by ticketing/ADR-0003");
    expect(decisionStatusSchema.parse("superseded by ADR-0003")).toBe(
      "superseded by ADR-0003"
    );
    expect(
      decisionStatusSchema.safeParse("superseded by ticketing/ADR-3").success
    ).toBe(false);
  });

  it("covers every file in the book", () => {
    const found = readdirSync(bookDir, { recursive: true })
      .map(String)
      .filter((name) => name.endsWith(".md") || name.endsWith(".yaml"))
      .sort();
    const covered = [
      ...withFrontmatter.map(([file]) => file),
      ...bodyOnly,
      "domainbook.config.yaml",
    ].sort();
    expect(found).toEqual(covered);
  });
});

describe("the valid book set", () => {
  it("covers every book", () => {
    const found = readdirSync(validBooksDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(found).toEqual(validBooks.map((book) => book.dir).sort());
  });

  it("lets both ends declare one relationship when they agree", () => {
    const mirrored = join(validBooksDir, "mirrored-relationship");
    const ticketing = domainSchema.parse(
      parseFrontmatter(read(mirrored, "domains/ticketing/index.md")).data
    );
    const accessControl = domainSchema.parse(
      parseFrontmatter(read(mirrored, "domains/access-control/index.md")).data
    );
    expect(ticketing.relationships).toEqual([
      {
        with: "access-control",
        type: "upstream-downstream",
        direction: "upstream",
        patterns: ["OHS", "PL"],
      },
    ]);
    expect(accessControl.relationships).toEqual([
      {
        with: "ticketing",
        type: "upstream-downstream",
        direction: "downstream",
        patterns: ["ACL"],
      },
    ]);
  });
});

function termSlugs(name: string): string[] {
  const nodes = parseMarkdown(read(bookDir, name), 1);
  return parseGlossary(name, nodes).record.terms.map((term) => term.slug);
}

function headings(body: string, depth: number): string[] {
  const marker = `${"#".repeat(depth)} `;
  return body
    .split("\n")
    .filter((line) => line.startsWith(marker))
    .map((line) => line.slice(marker.length).trim());
}
