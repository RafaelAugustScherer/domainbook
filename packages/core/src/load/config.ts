import { join } from "node:path";
import { parse } from "yaml";
import { type Issue, schemaIssues } from "../issue.js";
import type { Book } from "../model.js";
import { configSchema } from "../schemas/config.js";
import { fieldLines, nearest, yamlIssue } from "./artifact.js";
import { isFile, readText, relate } from "./disk.js";

export const configFile = "domainbook.config.yaml";

export function loadConfig(dir: string): {
  config: Book["config"];
  issues: Issue[];
} {
  const path = join(dir, configFile);
  const empty = configSchema.parse({});
  if (!isFile(path)) return { config: empty, issues: [] };
  const file = relate(path);
  const read = readText(path, file);
  if (!("source" in read)) return { config: empty, issues: [read.issue] };
  let data: unknown;
  try {
    data = parse(read.source) ?? {};
  } catch (thrown) {
    return {
      config: empty,
      issues: [yamlIssue(file, thrown, 1, "the config file")],
    };
  }
  const parsed = configSchema.safeParse(data);
  const lines = fieldLines(read.source);
  return {
    config: parsed.success ? parsed.data : empty,
    issues: schemaIssues(file, parsed.error, data, "config file", (at) =>
      nearest(lines, at, 1)
    ),
  };
}
