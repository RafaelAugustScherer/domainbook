import { join } from "node:path";
import { isMap, isScalar, isSeq, parseDocument, YAMLParseError } from "yaml";
import type { ZodType } from "zod";
import { type Node, parseMarkdown } from "../body/markdown.js";
import { parseFrontmatter } from "../frontmatter.js";
import { dotted, type Issue, schemaIssues } from "../issue.js";
import type { FieldLines } from "../model.js";
import { isFile, readText, relate } from "./disk.js";

export type Artifact = {
  data: unknown;
  readable: boolean;
  nodes: Node[];
  lines: FieldLines;
  issues: Issue[];
};

export function readArtifact(path: string, file: string): Artifact {
  const read = readText(path, file);
  if (!("source" in read))
    return {
      data: undefined,
      readable: false,
      nodes: [],
      lines: {},
      issues: [read.issue],
    };
  const source = read.source;
  let split;
  try {
    split = parseFrontmatter(source);
  } catch (thrown) {
    return {
      data: undefined,
      readable: false,
      nodes: [],
      lines: {},
      issues: [yamlIssue(file, thrown, 2, "frontmatter")],
    };
  }
  const head = source.slice(0, source.length - split.body.length);
  return {
    data: split.data,
    readable: true,
    nodes: parseMarkdown(split.body, head.split("\n").length),
    lines: split.data === undefined ? {} : fieldLines(head),
    issues: [],
  };
}

export function readBody(
  dir: string,
  name: string,
  label: string,
  instead: string
):
  | { file: string; readable: boolean; nodes: Node[]; issues: Issue[] }
  | undefined {
  const path = join(dir, name);
  if (!isFile(path)) return undefined;
  const file = relate(path);
  const artifact = readArtifact(path, file);
  return {
    file,
    readable: artifact.readable,
    nodes: artifact.nodes,
    issues:
      artifact.data === undefined
        ? artifact.issues
        : [
            ...artifact.issues,
            {
              file,
              line: 1,
              message: `a ${label} carries no frontmatter — delete the --- block; ${instead}`,
            },
          ],
  };
}

export function frontmatterOf<T>(
  file: string,
  artifact: Artifact,
  schema: ZodType<T>,
  label: string,
  keys: string
): { frontmatter?: T; issues: Issue[] } {
  if (!artifact.readable) return { issues: [] };
  if (artifact.data === undefined)
    return {
      issues: [
        {
          file,
          message: `no frontmatter — a ${label} needs ${keys} in a --- block at the top of the file`,
        },
      ],
    };
  if (Object.keys(artifact.data as object).length === 0)
    return {
      issues: [
        {
          file,
          line: 1,
          message: `frontmatter is empty — a ${label} needs ${keys} between the --- fences`,
        },
      ],
    };
  const parsed = schema.safeParse(artifact.data);
  return {
    frontmatter: parsed.success ? parsed.data : undefined,
    issues: schemaIssues(file, parsed.error, artifact.data, label, (path) =>
      nearest(artifact.lines, path, 2)
    ),
  };
}

export function fieldLines(text: string): FieldLines {
  const lines: FieldLines = {};
  walk(
    parseDocument(text).contents,
    [],
    lines,
    (offset) => 1 + (text.slice(0, offset).match(/\n/g)?.length ?? 0)
  );
  return lines;
}

function walk(
  node: unknown,
  path: PropertyKey[],
  lines: FieldLines,
  at: (offset: number) => number
): void {
  if (!isScalar(node) && !isMap(node) && !isSeq(node)) return;
  if (path.length > 0 && node.range) lines[dotted(path)] = at(node.range[0]);
  if (isMap(node))
    for (const pair of node.items) {
      if (!isScalar(pair.key)) continue;
      const next = [...path, String(pair.key.value)];
      walk(pair.value, next, lines, at);
      if (pair.key.range) lines[dotted(next)] = at(pair.key.range[0]);
    }
  else if (isSeq(node))
    node.items.forEach((item, index) =>
      walk(item, [...path, index], lines, at)
    );
}

export function nearest(
  lines: FieldLines,
  path: PropertyKey[],
  fallback: number
): number {
  for (let end = path.length; end > 0; end -= 1) {
    const found = lines[dotted(path.slice(0, end))];
    if (found !== undefined) return found;
  }
  return fallback;
}

export function yamlIssue(
  file: string,
  thrown: unknown,
  base: number,
  subject: string
): Issue {
  if (!(thrown instanceof YAMLParseError))
    return { file, message: `this file could not be read — ${String(thrown)}` };
  return {
    file,
    line: base + (thrown.linePos?.[0]?.line ?? 1) - 1,
    message: `${subject} is not valid YAML — ${
      thrown.message.split(" at line ")[0]
    }`,
  };
}
