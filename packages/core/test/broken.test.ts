import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import type { ZodType } from "zod";
import {
  changelogSchema,
  configSchema,
  decisionSchema,
  domainSchema,
  featureSchema,
  glossarySchema,
  parseFrontmatter,
  roadmapSchema,
} from "../src/index.js";
import { bookDir, brokenDir, read } from "./paths.js";
import { changelogFrom, glossaryFrom } from "./transcribe.js";

const frontmatterFixtures = [
  "domain-unknown-key.md",
  "domain-bad-id.md",
  "domain-unknown-classification.md",
  "domain-symmetric-with-direction.md",
  "domain-missing-direction.md",
  "domain-upstream-with-downstream-pattern.md",
  "decision-missing-status.md",
  "decision-bad-date.md",
  "decision-bad-status.md",
  "feature-unknown-status.md",
  "roadmap-unknown-milestone-status.md",
  "config-unknown-mode.yaml",
];

const bodyFixtures = [
  "changelog-unknown-bucket.md",
  "glossary-unknown-term-status.md",
  "feature-malformed-gherkin.md",
];

function issuesFor(file: string, schema: ZodType) {
  const source = read(brokenDir, file);
  const data = file.endsWith(".yaml")
    ? parse(source)
    : parseFrontmatter(source).data;
  const result = schema.safeParse(data);
  if (result.success)
    throw new Error(`${file} was expected to fail validation`);
  return result.error.issues;
}

function onlyIssue(file: string, schema: ZodType) {
  const issues = issuesFor(file, schema);
  expect(issues).toHaveLength(1);
  return issues[0]!;
}

describe("broken frontmatter fixtures", () => {
  it("domain-unknown-key names the key it did not expect", () => {
    expect(onlyIssue("domain-unknown-key.md", domainSchema)).toMatchObject({
      code: "unrecognized_keys",
      path: [],
      keys: ["owner"],
    });
  });

  it("domain-bad-id points at id", () => {
    expect(onlyIssue("domain-bad-id.md", domainSchema)).toMatchObject({
      code: "invalid_format",
      path: ["id"],
      message: "must be lowercase words joined by single hyphens",
    });
  });

  it("domain-unknown-classification points at the canvas axis", () => {
    expect(
      onlyIssue("domain-unknown-classification.md", domainSchema)
    ).toMatchObject({
      code: "invalid_value",
      path: ["classification", "domain"],
      values: ["core-domain", "supporting-domain", "generic"],
    });
  });

  it("domain-symmetric-with-direction rejects direction and patterns", () => {
    expect(
      onlyIssue("domain-symmetric-with-direction.md", domainSchema)
    ).toMatchObject({
      code: "unrecognized_keys",
      path: ["relationships", 0],
      keys: ["direction", "patterns"],
    });
  });

  it("domain-missing-direction says which types need a direction", () => {
    expect(
      onlyIssue("domain-missing-direction.md", domainSchema)
    ).toMatchObject({
      path: ["relationships", 0, "direction"],
      message:
        'must be "upstream" or "downstream" — "customer-supplier" and "upstream-downstream" need a direction, and "partnership", "shared-kernel", and "separate-ways" take none',
    });
  });

  it("domain-upstream-with-downstream-pattern points at the offending pattern", () => {
    expect(
      onlyIssue("domain-upstream-with-downstream-pattern.md", domainSchema)
    ).toMatchObject({
      code: "invalid_value",
      path: ["relationships", 0, "patterns", 0],
      values: ["OHS", "PL"],
    });
  });

  it("decision-missing-status points at status", () => {
    expect(
      onlyIssue("decision-missing-status.md", decisionSchema)
    ).toMatchObject({
      code: "invalid_union",
      path: ["status"],
      message:
        'must be "proposed", "rejected", "accepted", "deprecated", or "superseded by ADR-NNNN" ("<domain-id>/ADR-NNNN" for a domain log)',
    });
  });

  it("decision-bad-date points at date", () => {
    expect(onlyIssue("decision-bad-date.md", decisionSchema)).toMatchObject({
      code: "invalid_format",
      format: "date",
      path: ["date"],
      message: "must be a date as YYYY-MM-DD",
    });
  });

  it("decision-bad-status spells out the allowed statuses", () => {
    expect(onlyIssue("decision-bad-status.md", decisionSchema)).toMatchObject({
      path: ["status"],
      message:
        'must be "proposed", "rejected", "accepted", "deprecated", or "superseded by ADR-NNNN" ("<domain-id>/ADR-NNNN" for a domain log)',
    });
  });

  it("feature-unknown-status points at status", () => {
    expect(onlyIssue("feature-unknown-status.md", featureSchema)).toMatchObject(
      {
        code: "invalid_value",
        path: ["status"],
        values: ["draft", "ready", "implemented", "deprecated"],
      }
    );
  });

  it("roadmap-unknown-milestone-status points at the milestone", () => {
    expect(
      onlyIssue("roadmap-unknown-milestone-status.md", roadmapSchema)
    ).toMatchObject({
      code: "invalid_value",
      path: ["milestones", 1, "status"],
      values: ["planned", "in-progress", "done"],
    });
  });

  it("config-unknown-mode points at the mode", () => {
    expect(onlyIssue("config-unknown-mode.yaml", configSchema)).toMatchObject({
      code: "invalid_value",
      path: ["enforcement", "mode"],
      values: ["block", "warn"],
    });
  });
});

describe("broken body fixtures", () => {
  it("changelog-unknown-bucket names the bucket that is not one of the six", () => {
    const source = read(brokenDir, "changelog-unknown-bucket.md");
    const issues = changelogSchema.safeParse(changelogFrom(source)).error
      ?.issues;
    expect(issues).toMatchObject([
      { code: "unrecognized_keys", path: ["releases", 0], keys: ["notes"] },
    ]);
    expect(parseFrontmatter(source).data).toBeUndefined();
  });

  it("glossary-unknown-term-status points at the term's status", () => {
    const source = read(brokenDir, "glossary-unknown-term-status.md");
    const issues = glossarySchema.safeParse(glossaryFrom(source)).error?.issues;
    expect(issues).toMatchObject([
      {
        code: "invalid_value",
        path: ["terms", 0, "status"],
        values: ["draft", "validated", "deprecated"],
      },
    ]);
    expect(parseFrontmatter(source).data).toBeUndefined();
  });

  it("feature-malformed-gherkin leaves a docstring unterminated", () => {
    const source = read(brokenDir, "feature-malformed-gherkin.md");
    expect(
      featureSchema.safeParse(parseFrontmatter(source).data).error?.issues ?? []
    ).toEqual([]);
    const broken = gherkinBlocks(source);
    expect(broken).toHaveLength(1);
    expect(docStringFences(broken[0]!) % 2).toBe(1);

    const valid = gherkinBlocks(
      read(bookDir, "domains/ticketing/features/hold-seats-during-checkout.md")
    );
    expect(valid.map(docStringFences)).toEqual([0, 0, 0]);
    expect(valid.map(opener)).toEqual([
      "Example: Seats go back on sale when the hold expires",
      "Example: Paying inside the window issues one ticket per seat",
      "Example: A late capture never becomes a ticket",
    ]);
  });
});

describe("the broken fixture set", () => {
  it("covers every file", () => {
    expect(readdirSync(brokenDir).sort()).toEqual(
      [...frontmatterFixtures, ...bodyFixtures].sort()
    );
  });
});

function gherkinBlocks(source: string): string[] {
  return [...source.matchAll(/```gherkin\n([\s\S]*?)```/g)].map(
    (match) => match[1]!
  );
}

function opener(block: string): string {
  return block.trim().split("\n")[0]!.trim();
}

function docStringFences(block: string): number {
  return block.split("\n").filter((line) => line.trim() === '"""').length;
}
