import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
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
import { bookDir, read } from "./fixtures.js";

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
