import type { Issue } from "../issue.js";
import { type Heading, headings, type Node } from "./markdown.js";
import { checkSections, type Expected, type Wording } from "./sections.js";

const madr: Expected[] = [
  { depth: 2, text: "Context and Problem Statement" },
  { depth: 2, text: "Decision Drivers", optional: true },
  { depth: 2, text: "Considered Options" },
  { depth: 2, text: "Decision Outcome" },
  { depth: 3, text: "Consequences" },
  { depth: 3, text: "Confirmation", optional: true },
  { depth: 2, text: "Pros and Cons of the Options", optional: true },
  { depth: 2, text: "More Information", optional: true },
];

const sequence =
  "Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome, Pros and Cons of the Options, More Information";

const wording: Wording = {
  kind: "MADR",
  unknown:
    "a decision carries only Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome, Pros and Cons of the Options, and More Information",
  missing:
    'a decision carries Context and Problem Statement, Considered Options, and Decision Outcome with "### Consequences" under it',
  order: `the order is ${sequence}`,
};

export function parseDecisionBody(
  file: string,
  nodes: Node[]
): { title: string; issues: Issue[] } {
  const found = headings(nodes).filter((heading) => heading.depth <= 3);
  const first = found[0];
  const titled = first !== undefined && first.depth === 1;
  const issues = checkSections(
    file,
    outlined(found.slice(titled ? 1 : 0)),
    madr,
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
          'a decision opens with its title as an H1 — write "# <the decision>" above "## Context and Problem Statement"',
      },
      ...issues,
    ],
  };
}

function outlined(found: Heading[]): Heading[] {
  const kept: Heading[] = [];
  let parent = "";
  for (const heading of found) {
    if (heading.depth <= 2) parent = heading.text;
    if (heading.depth !== 3 || parent === "Decision Outcome")
      kept.push(heading);
  }
  return kept;
}
