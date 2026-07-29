import type { Issue } from "../issue.js";
import { headings, type Node } from "./markdown.js";
import { checkSections, type Wording } from "./sections.js";

export const canvas = [
  "Purpose",
  "Domain Roles",
  "Inbound Communication",
  "Outbound Communication",
  "Business Decisions",
  "Assumptions",
  "Verification Metrics",
  "Open Questions",
];

const wording: Wording = {
  kind: "canvas",
  unknown: `a domain page carries only ${canvas.join(", ")}`,
  missing: `a domain page carries all eight: ${canvas.join(", ")}`,
  order: "a domain page carries them in canvas order",
};

export function checkDomainBody(file: string, nodes: Node[]): Issue[] {
  const found = headings(nodes);
  return [
    ...found
      .filter((heading) => heading.depth === 1)
      .map((heading) => ({
        file,
        line: heading.line,
        message: `a domain page carries no H1 — its name is the "name" key in frontmatter, and the body starts at "## Purpose"`,
      })),
    ...checkSections(
      file,
      found.filter((heading) => heading.depth === 2),
      canvas.map((text) => ({ depth: 2, text })),
      wording
    ),
  ];
}
