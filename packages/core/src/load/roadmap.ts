import { join } from "node:path";
import type { Issue } from "../issue.js";
import type { Book } from "../model.js";
import { roadmapSchema } from "../schemas/roadmap.js";
import { frontmatterOf, readArtifact } from "./artifact.js";
import { isFile, relate } from "./disk.js";

export function loadRoadmap(dir: string): {
  record?: Book["roadmap"];
  issues: Issue[];
} {
  const path = join(dir, "roadmap.md");
  const file = relate(path);
  if (!isFile(path))
    return {
      issues: [
        {
          file,
          message:
            'the book has no roadmap.md — every book needs one; add it with an "id" and a "milestones" list in frontmatter',
        },
      ],
    };
  const artifact = readArtifact(path, file);
  const parsed = frontmatterOf(
    file,
    artifact,
    roadmapSchema,
    "roadmap",
    '"id" and "milestones"'
  );
  const issues = [...artifact.issues, ...parsed.issues];
  if (parsed.frontmatter === undefined) return { issues };
  return {
    record: { file, frontmatter: parsed.frontmatter, lines: artifact.lines },
    issues,
  };
}
