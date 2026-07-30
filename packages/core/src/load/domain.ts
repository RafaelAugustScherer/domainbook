import { join } from "node:path";
import { checkDomainBody } from "../body/domain.js";
import type { Issue } from "../issue.js";
import type { DomainRecord, FieldLines } from "../model.js";
import { type Domain, domainSchema } from "../schemas/domain.js";
import { frontmatterOf, readArtifact } from "./artifact.js";
import { loadChangelog } from "./changelog.js";
import { loadLog } from "./decision.js";
import { entries, isFile, relate, strange } from "./disk.js";
import { loadFeatures } from "./feature.js";
import { loadGlossary } from "./glossary.js";

const domainHolds =
  "a domain folder holds index.md, glossary.md, changelog.md, features/*.md, and decisions/*.md";

export function loadDomain(
  dir: string,
  id: string
): { record: DomainRecord; issues: Issue[] } {
  const issues: Issue[] = [];
  const known = ["index.md", "glossary.md", "changelog.md"];
  for (const entry of entries(dir))
    if (
      entry.isDirectory()
        ? entry.name !== "features" && entry.name !== "decisions"
        : !known.includes(entry.name)
    )
      issues.push(strange(dir, entry, domainHolds));

  const canvas = loadCanvas(dir, id);
  const glossary = loadGlossary(dir);
  const changelog = loadChangelog(dir);
  const log = loadLog(join(dir, "decisions"), id);
  const features = loadFeatures(join(dir, "features"), id);
  return {
    record: {
      id,
      file: relate(join(dir, "index.md")),
      frontmatter: canvas.frontmatter,
      lines: canvas.lines,
      glossary: glossary.record,
      changelog: changelog.record,
      features: features.records,
      decisions: log.records,
      decisionFiles: log.files,
    },
    issues: [
      ...issues,
      ...canvas.issues,
      ...glossary.issues,
      ...changelog.issues,
      ...features.issues,
      ...log.issues,
    ],
  };
}

function loadCanvas(
  dir: string,
  id: string
): { frontmatter?: Domain; lines: FieldLines; issues: Issue[] } {
  const path = join(dir, "index.md");
  const file = relate(path);
  if (!isFile(path))
    return {
      lines: {},
      issues: [
        {
          file: relate(dir),
          message: `the domain folder "${id}" has no index.md — add one with "id: ${id}", a "name", and the eight canvas sections`,
        },
      ],
    };
  const artifact = readArtifact(path, file);
  const parsed = frontmatterOf(
    file,
    artifact,
    domainSchema,
    "domain page",
    '"id", "name", and "classification"'
  );
  return {
    frontmatter: parsed.frontmatter,
    lines: artifact.lines,
    issues: [
      ...artifact.issues,
      ...(artifact.readable ? checkDomainBody(file, artifact.nodes) : []),
      ...parsed.issues,
    ],
  };
}
