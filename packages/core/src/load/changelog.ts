import { parseChangelog } from "../body/changelog.js";
import type { Issue } from "../issue.js";
import type { ChangelogRecord } from "../model.js";
import { readBody } from "./artifact.js";

export function loadChangelog(dir: string): {
  record?: ChangelogRecord;
  issues: Issue[];
} {
  const read = readBody(
    dir,
    "changelog.md",
    "changelog",
    'a release is an H2 heading like "## [1.2.0] - 2026-06-30"'
  );
  if (read === undefined) return { issues: [] };
  if (!read.readable) return { issues: read.issues };
  const parsed = parseChangelog(read.file, read.nodes);
  return { record: parsed.record, issues: [...read.issues, ...parsed.issues] };
}
