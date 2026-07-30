import { parseGlossary } from "../body/glossary.js";
import type { Issue } from "../issue.js";
import type { GlossaryRecord } from "../model.js";
import { readBody } from "./artifact.js";

export function loadGlossary(dir: string): {
  record?: GlossaryRecord;
  issues: Issue[];
} {
  const read = readBody(
    dir,
    "glossary.md",
    "glossary",
    "a term is an H2 heading with its definition below it"
  );
  if (read === undefined) return { issues: [] };
  if (!read.readable) return { issues: read.issues };
  const parsed = parseGlossary(read.file, read.nodes);
  return { record: parsed.record, issues: [...read.issues, ...parsed.issues] };
}
