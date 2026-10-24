import { join } from "node:path";
import { parseGlossary } from "../body/glossary.js";
import type { Issue } from "../issue.js";
import type { GlossaryRecord } from "../model.js";
import { readArtifact } from "./artifact.js";
import { isFile, relate } from "./disk.js";

export function loadGlossary(dir: string): {
  record?: GlossaryRecord;
  issues: Issue[];
} {
  const path = join(dir, "glossary.md");
  if (!isFile(path)) return { issues: [] };
  const file = relate(path);
  const artifact = readArtifact(path, file);
  const issues = [...artifact.issues];
  if (artifact.data !== undefined)
    issues.push({
      file,
      line: 1,
      message:
        "a glossary carries no frontmatter — delete the --- block; a term is an H2 heading with its definition below it",
    });
  if (!artifact.readable) return { issues };
  const parsed = parseGlossary(file, artifact.nodes);
  return { record: parsed.record, issues: [...issues, ...parsed.issues] };
}
