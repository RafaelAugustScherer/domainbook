import { join } from "node:path";
import { parseFeatureBody } from "../body/feature.js";
import type { Issue } from "../issue.js";
import type { FeatureRecord } from "../model.js";
import { featureSchema } from "../schemas/feature.js";
import { frontmatterOf, readArtifact } from "./artifact.js";
import { entries, relate, strange } from "./disk.js";

const featuresHold =
  "a features folder holds one .md file per feature and nothing else";

export function loadFeatures(
  dir: string,
  domain: string
): { records: FeatureRecord[]; issues: Issue[] } {
  const records: FeatureRecord[] = [];
  const issues: Issue[] = [];
  for (const entry of entries(dir)) {
    if (entry.isDirectory() || !entry.name.endsWith(".md")) {
      issues.push(strange(dir, entry, featuresHold));
      continue;
    }
    const file = relate(join(dir, entry.name));
    const artifact = readArtifact(join(dir, entry.name), file);
    const body = parseFeatureBody(file, artifact.nodes);
    issues.push(...artifact.issues);
    if (artifact.readable) issues.push(...body.issues);
    const parsed = frontmatterOf(
      file,
      artifact,
      featureSchema,
      "feature",
      '"id", "name", and "status"'
    );
    issues.push(...parsed.issues);
    if (parsed.frontmatter !== undefined)
      records.push({
        file,
        domain,
        frontmatter: parsed.frontmatter,
        story: body.story,
        rules: body.rules,
        lines: artifact.lines,
      });
  }
  return { records, issues };
}
