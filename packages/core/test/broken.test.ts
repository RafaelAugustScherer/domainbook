import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";
import type { ZodType } from "zod";
import { parseChangelog } from "../src/body/changelog.js";
import { parseFeatureBody } from "../src/body/feature.js";
import { parseGlossary } from "../src/body/glossary.js";
import { parseMarkdown } from "../src/body/markdown.js";
import {
  configSchema,
  debtSchema,
  decisionSchema,
  domainSchema,
  featureSchema,
  formatIssue,
  parseFrontmatter,
  roadmapSchema,
} from "../src/index.js";
import { schemaIssues } from "../src/issue.js";
import {
  brokenBooks,
  brokenBooksDir,
} from "./fixtures/broken-books/manifest.js";
import { brokenDir, read } from "./paths.js";

const frontmatterFixtures = [
  "domain-unknown-key.md",
  "domain-bad-id.md",
  "domain-unknown-classification.md",
  "domain-symmetric-with-direction.md",
  "domain-missing-direction.md",
  "domain-upstream-with-downstream-pattern.md",
  "domain-owners-not-a-list.md",
  "domain-classification-not-a-block.md",
  "domain-code-lists-nothing.md",
  "domain-name-empty.md",
  "decision-missing-status.md",
  "decision-bad-date.md",
  "decision-bad-status.md",
  "debt-missing-date.md",
  "debt-bad-date.md",
  "debt-unknown-status.md",
  "debt-unknown-severity.md",
  "debt-unknown-quadrant.md",
  "debt-unknown-key.md",
  "debt-bad-decision-ref.md",
  "feature-unknown-status.md",
  "roadmap-unknown-milestone-status.md",
  "roadmap-milestone-name-not-text.md",
  "config-unknown-mode.yaml",
];

const bodyFixtures = [
  "changelog-unknown-bucket.md",
  "glossary-unknown-term-status.md",
  "feature-malformed-gherkin.md",
  "feature-gherkin-fence-with-info.md",
  "feature-gherkin-fence-unclosed.md",
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

function written(file: string, schema: ZodType, label: string): string[] {
  const data = parseFrontmatter(read(brokenDir, file)).data;
  return schemaIssues(
    file,
    schema.safeParse(data).error,
    data,
    label,
    () => undefined
  ).map(formatIssue);
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
      message:
        "must be words joined by single hyphens — a word starts with a letter or digit in any script, and carries no capitals",
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

  it("debt-missing-date points at date", () => {
    expect(onlyIssue("debt-missing-date.md", debtSchema)).toMatchObject({
      code: "invalid_type",
      expected: "string",
      path: ["date"],
      message: "must be a date as YYYY-MM-DD",
    });
  });

  it("debt-bad-date points at date", () => {
    expect(onlyIssue("debt-bad-date.md", debtSchema)).toMatchObject({
      code: "invalid_format",
      format: "date",
      path: ["date"],
      message: "must be a date as YYYY-MM-DD",
    });
  });

  it("debt-unknown-status spells out the three debt statuses", () => {
    expect(onlyIssue("debt-unknown-status.md", debtSchema)).toMatchObject({
      code: "invalid_value",
      path: ["status"],
      values: ["open", "accepted", "repaid"],
    });
  });

  it("debt-unknown-severity points at severity", () => {
    expect(onlyIssue("debt-unknown-severity.md", debtSchema)).toMatchObject({
      code: "invalid_value",
      path: ["severity"],
      values: ["low", "medium", "high", "critical"],
    });
  });

  it("debt-unknown-quadrant names the four quadrants", () => {
    expect(onlyIssue("debt-unknown-quadrant.md", debtSchema)).toMatchObject({
      code: "invalid_value",
      path: ["quadrant"],
      values: [
        "deliberate-prudent",
        "deliberate-reckless",
        "inadvertent-prudent",
        "inadvertent-reckless",
      ],
    });
  });

  it("debt-unknown-key names the key it did not expect", () => {
    expect(onlyIssue("debt-unknown-key.md", debtSchema)).toMatchObject({
      code: "unrecognized_keys",
      path: [],
      keys: ["effort"],
    });
  });

  it("debt-bad-decision-ref points at the entry that is not a reference", () => {
    expect(onlyIssue("debt-bad-decision-ref.md", debtSchema)).toMatchObject({
      code: "invalid_format",
      path: ["decisions", 0],
      message: 'must be "ADR-NNNN" or "<domain-id>/ADR-NNNN"',
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

describe("what a schema issue reads like on the page", () => {
  it("asks for a list where a scalar was written", () => {
    expect(
      written("domain-owners-not-a-list.md", domainSchema, "domain page")
    ).toEqual([
      'domain-owners-not-a-list.md owners: must be a list — write each value as a "- " bullet below it',
    ]);
  });

  it("asks for a block of keys where a scalar was written", () => {
    expect(
      written(
        "domain-classification-not-a-block.md",
        domainSchema,
        "domain page"
      )
    ).toEqual([
      "domain-classification-not-a-block.md classification: must be a block of keys indented below it",
    ]);
  });

  it("asks for text where YAML read a number", () => {
    expect(
      written("roadmap-milestone-name-not-text.md", roadmapSchema, "roadmap")
    ).toEqual([
      "roadmap-milestone-name-not-text.md milestones[1].name: must be text — put the value in quotes",
    ]);
  });

  it("says a list that names nothing may go", () => {
    expect(
      written("domain-code-lists-nothing.md", domainSchema, "domain page")
    ).toEqual([
      "domain-code-lists-nothing.md code: lists nothing — name at least one, or remove the key",
    ]);
  });

  it("says an empty value may go", () => {
    expect(
      written("domain-name-empty.md", domainSchema, "domain page")
    ).toEqual([
      "domain-name-empty.md name: is empty — write a value, or remove it",
    ]);
  });

  it("names the field a stray key sits in, once per key", () => {
    expect(
      written("domain-symmetric-with-direction.md", domainSchema, "domain page")
    ).toEqual([
      'domain-symmetric-with-direction.md relationships[0].direction: is not a field of "relationships[0]" — check the spelling, or remove it',
      'domain-symmetric-with-direction.md relationships[0].patterns: is not a field of "relationships[0]" — check the spelling, or remove it',
    ]);
  });
});

describe("broken body fixtures", () => {
  it("changelog-unknown-bucket names the bucket that is not one of the six", () => {
    const source = read(brokenDir, "changelog-unknown-bucket.md");
    expect(parseFrontmatter(source).data).toBeUndefined();
    const issues = parseChangelog(
      "changelog.md",
      parseMarkdown(source, 1)
    ).issues;
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('"Notes" is not a changelog section');
  });

  it("glossary-unknown-term-status points at the term's status", () => {
    const source = read(brokenDir, "glossary-unknown-term-status.md");
    expect(parseFrontmatter(source).data).toBeUndefined();
    const issues = parseGlossary(
      "glossary.md",
      parseMarkdown(source, 1)
    ).issues;
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ field: "status" });
    expect(issues[0]?.message).toContain('"draft", "validated", "deprecated"');
  });

  it("feature-malformed-gherkin fails on the block and nothing else", () => {
    const source = read(brokenDir, "feature-malformed-gherkin.md");
    const { data, body } = parseFrontmatter(source);
    expect(featureSchema.safeParse(data).error?.issues ?? []).toEqual([]);
    const { issues } = parseFeatureBody(
      "feature-malformed-gherkin.md",
      parseMarkdown(body, 2)
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain("gherkin does not parse");
  });

  it("feature-gherkin-fence-with-info checks a block tagged with more than the language", () => {
    const source = read(brokenDir, "feature-gherkin-fence-with-info.md");
    expect(source).toContain('```gherkin title="hold-expiry.feature"');
    const { issues } = parseFeatureBody(
      "feature-gherkin-fence-with-info.md",
      parseMarkdown(source, 1)
    );
    expect(issues.map(formatIssue)).toEqual([
      "feature-gherkin-fence-with-info.md:25: gherkin does not parse — inconsistent cell count within the table",
    ]);
  });

  it("feature-gherkin-fence-unclosed reports no line below the last one in the file", () => {
    const source = read(brokenDir, "feature-gherkin-fence-unclosed.md");
    const { issues } = parseFeatureBody(
      "feature-gherkin-fence-unclosed.md",
      parseMarkdown(source, 1)
    );
    expect(issues.map(formatIssue)).toEqual([
      'feature-gherkin-fence-unclosed.md: a feature closes with "## Open Questions" — a feature is Story, then its rules, then Open Questions',
      "feature-gherkin-fence-unclosed.md:26: gherkin does not parse — unexpected end of file, expected: #DocStringSeparator, #Other",
    ]);
    expect(source.split("\n")).toHaveLength(26);
  });
});

describe("the broken fixture set", () => {
  it("covers every file", () => {
    expect(readdirSync(brokenDir).sort()).toEqual(
      [...frontmatterFixtures, ...bodyFixtures].sort()
    );
  });
});

describe("the broken book set", () => {
  it("covers every book", () => {
    const found = readdirSync(brokenBooksDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    expect(found).toEqual(brokenBooks.map((book) => book.dir).sort());
  });

  it("names every rule the catalogue needs a book for", () => {
    const rules = new Set(brokenBooks.map((book) => book.rule));
    expect([...rules].sort()).toEqual([
      "B1",
      "B2",
      "B3",
      "B4",
      "B5",
      "B6",
      "B7",
      "B8",
      "B9",
      "C1",
      "C10",
      "C11",
      "C2",
      "C3",
      "C4",
      "C5",
      "C6",
      "C7",
      "C8",
      "C9",
      "L2",
      "L3",
      "L4",
      "L5",
      "L6",
      "L7",
      "R1",
      "R2",
      "R3",
      "R4",
      "R5",
      "R6",
      "R7",
      "S1",
    ]);
  });

  it("expects a distinct message from each book", () => {
    const messages = brokenBooks.map((book) => book.expect);
    expect(new Set(messages).size).toBe(messages.length);
  });
});
