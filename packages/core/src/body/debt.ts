import type { Issue } from "../issue.js";
import { headings, type Node } from "./markdown.js";
import { checkSections, type Expected, type Wording } from "./sections.js";

const record: Expected[] = [
  { depth: 2, text: "Debt" },
  { depth: 2, text: "Impact" },
  { depth: 2, text: "Remedy" },
];

const wording: Wording = {
  kind: "debt record",
  unknown: "a debt record carries only Debt, Impact, and Remedy",
  missing: "a debt record carries Debt, Impact, and Remedy",
  order: "the order is Debt, Impact, Remedy",
};

export function parseDebtBody(
  file: string,
  nodes: Node[]
): { title: string; issues: Issue[] } {
  const found = headings(nodes).filter((heading) => heading.depth <= 2);
  const first = found[0];
  const titled = first !== undefined && first.depth === 1;
  const issues = checkSections(
    file,
    found.slice(titled ? 1 : 0),
    record,
    wording
  );
  if (titled) return { title: first.text, issues };
  return {
    title: "",
    issues: [
      {
        file,
        line: first?.line,
        message:
          'a debt record opens with its title as an H1 — write "# <the debt>" above "## Debt"',
      },
      ...issues,
    ],
  };
}
