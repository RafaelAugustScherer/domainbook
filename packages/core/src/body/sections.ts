import type { Issue } from "../issue.js";
import type { Heading } from "./markdown.js";

export type Expected = { depth: number; text: string; optional?: boolean };

export type Wording = {
  kind: string;
  unknown: string;
  missing: string;
  order: string;
};

export function checkSections(
  file: string,
  found: Heading[],
  expected: Expected[],
  wording: Wording
): Issue[] {
  const issues: Issue[] = [];
  const seen: Heading[] = [];
  for (const heading of found) {
    const match = expected.find((section) => section.text === heading.text);
    if (match === undefined) {
      issues.push({
        file,
        line: heading.line,
        message: `"${heading.text}" is not a ${wording.kind} section — ${wording.unknown}`,
      });
      continue;
    }
    if (match.depth !== heading.depth) {
      issues.push({
        file,
        line: heading.line,
        message: `the ${wording.kind} section "${
          heading.text
        }" is written with ${"#".repeat(
          heading.depth
        )} — write it with ${"#".repeat(match.depth)}`,
      });
      seen.push(heading);
      continue;
    }
    if (seen.some((other) => other.text === heading.text)) {
      issues.push({
        file,
        line: heading.line,
        message: `the ${wording.kind} section "${heading.text}" appears twice — ${wording.unknown}`,
      });
      continue;
    }
    seen.push(heading);
  }
  issues.push(...missingSections(file, seen, expected, wording));
  if (issues.length > 0) return issues;
  return misordered(file, seen, expected, wording);
}

function missingSections(
  file: string,
  seen: Heading[],
  expected: Expected[],
  wording: Wording
): Issue[] {
  return expected
    .filter(
      (section) =>
        section.optional !== true &&
        !seen.some((heading) => heading.text === section.text)
    )
    .map((section) => ({
      file,
      message: `the ${wording.kind} section "${section.text}" is missing — ${wording.missing}`,
    }));
}

function misordered(
  file: string,
  seen: Heading[],
  expected: Expected[],
  wording: Wording
): Issue[] {
  let above: { heading: Heading; rank: number } | undefined;
  for (const heading of seen) {
    const rank = expected.findIndex((section) => section.text === heading.text);
    if (above !== undefined && rank < above.rank)
      return [
        {
          file,
          line: heading.line,
          message: `${wording.kind} sections are out of order — "${heading.text}" comes after "${above.heading.text}"; ${wording.order}`,
        },
      ];
    above = { heading, rank };
  }
  return [];
}
