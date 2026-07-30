import {
  AstBuilder,
  Errors,
  GherkinClassicTokenMatcher,
  Parser,
} from "@cucumber/gherkin";
import { IdGenerator } from "@cucumber/messages";
import type { Issue } from "../issue.js";
import { type Fence, type Node, prose, sections } from "./markdown.js";

export type ParsedRule = {
  name: string;
  line: number;
  examples: Array<{ source: string; line: number }>;
};

const prefix = "Rule: ";
const order = "a feature is Story, then its rules, then Open Questions";
const ranks = ["Story", prefix, "Open Questions"];

export function parseFeatureBody(
  file: string,
  nodes: Node[]
): { story: string; rules: ParsedRule[]; issues: Issue[] } {
  const found = sections(nodes, 2);
  const issues: Issue[] = [];
  const seen = new Set<string>();
  let above: { text: string; rank: number } | undefined;
  for (const section of found) {
    const { text, line } = section.heading;
    const rank = ranks.findIndex((name) =>
      name === prefix ? text.startsWith(prefix) : text === name
    );
    if (rank === -1) {
      issues.push({
        file,
        line,
        message: `"${text}" is not a feature section — ${order}`,
      });
      continue;
    }
    if (seen.has(text)) {
      issues.push({
        file,
        line,
        message: `the feature section "${text}" appears twice — ${order}`,
      });
      continue;
    }
    seen.add(text);
    if (above !== undefined && rank < above.rank)
      issues.push({
        file,
        line,
        message: `feature sections are out of order — "${text}" comes after "${above.text}"; ${order}`,
      });
    above = { text, rank };
  }

  const story = found.find((section) => section.heading.text === "Story");
  if (story === undefined)
    issues.push({
      file,
      message: `a feature opens with "## Story" — ${order}`,
    });
  if (!found.some((section) => section.heading.text === "Open Questions"))
    issues.push({
      file,
      message: `a feature closes with "## Open Questions" — ${order}`,
    });

  const rules = found
    .filter((section) => section.heading.text.startsWith(prefix))
    .map((section) => ({
      name: section.heading.text.slice(prefix.length).trim(),
      line: section.heading.line,
      examples: gherkinFences(section.nodes).map((fence) => ({
        source: fence.content,
        line: fence.line,
      })),
    }));
  if (rules.length === 0)
    issues.push({
      file,
      message: `a feature carries at least one "## Rule: …" — ${order}`,
    });

  const placed = new Set(
    rules.flatMap((rule) => rule.examples.map((example) => example.line))
  );
  for (const fence of gherkinFences(nodes)) {
    if (!placed.has(fence.line)) {
      issues.push({
        file,
        line: fence.line,
        message: `a gherkin example belongs to a rule — move this block under a "## Rule: …" heading`,
      });
      continue;
    }
    issues.push(...checkGherkin(file, fence));
  }

  return {
    story: story === undefined ? "" : prose(story.nodes),
    rules,
    issues,
  };
}

function gherkinFences(nodes: Node[]): Fence[] {
  return nodes
    .filter((node) => node.kind === "fence")
    .filter((fence) => fence.info.split(/\s+/)[0]?.toLowerCase() === "gherkin");
}

function checkGherkin(file: string, fence: Fence): Issue[] {
  const parser = new Parser(
    new AstBuilder(IdGenerator.incrementing()),
    new GherkinClassicTokenMatcher()
  );
  parser.stopAtFirstError = false;
  try {
    const document = parser.parse(`Feature: examples\n${fence.content}\n`);
    const children = (document.feature?.children ?? []).flatMap((child) =>
      child.rule === undefined ? [child] : child.rule.children
    );
    if (children.some((child) => child.scenario !== undefined)) return [];
    return [
      {
        file,
        line: fence.line,
        message: `this gherkin block documents nothing — write "Example: …" with its Given/When/Then steps, or remove the block`,
      },
    ];
  } catch (thrown) {
    return reported(thrown).map((error) => ({
      file,
      line: Math.min(fence.line + at(error) - 1, fence.end),
      message: `gherkin does not parse — ${reason(error)}`,
    }));
  }
}

function reported(thrown: unknown): Error[] {
  if (thrown instanceof Errors.CompositeParserException) return thrown.errors;
  if (thrown instanceof Errors.GherkinException) return [thrown];
  return [thrown instanceof Error ? thrown : new Error(String(thrown))];
}

function at(error: Error): number {
  const { location } = error as { location?: { line?: number } };
  return location?.line ?? 1;
}

function reason(error: Error): string {
  return error.message.replace(/^\(\d+:\d*\):\s*/, "");
}
