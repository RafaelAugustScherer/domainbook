import { join } from "node:path";
import type { Issue } from "../issue.js";
import type { LogKind } from "../log.js";
import { type LogFile, type LogRecord, termSlug } from "../model.js";
import { slugSource } from "../schemas/common.js";
import { type Artifact, frontmatterOf, readArtifact } from "./artifact.js";
import { entries, relate, strange } from "./disk.js";

type Filed = {
  name: string;
  file: string;
  number: number;
  artifact: Artifact;
  body: { title: string; issues: Issue[] };
};

const named = new RegExp(`^(\\d{4})-(${slugSource})\\.md$`, "u");
const numbered = /^(\d+)-(.+)\.md$/;

export function loadLog<T>(
  root: string,
  domain: string | undefined,
  kind: LogKind<T>
): { records: LogRecord<T>[]; files: LogFile[]; issues: Issue[] } {
  const dir = join(root, kind.dir);
  const records: LogRecord<T>[] = [];
  const issues: Issue[] = [];
  const holds = `a ${kind.one} log holds .md files and nothing else`;

  const filed: Filed[] = [];
  for (const entry of entries(dir)) {
    if (entry.isDirectory() || !entry.name.endsWith(".md")) {
      issues.push(strange(dir, entry, holds));
      continue;
    }
    const file = relate(join(dir, entry.name));
    const artifact = readArtifact(join(dir, entry.name), file);
    filed.push({
      name: entry.name,
      file,
      number: Number(numbered.exec(entry.name)?.[1] ?? Number.NaN),
      artifact,
      body: kind.body(file, artifact.nodes),
    });
  }

  const files = filed
    .filter((one) => !Number.isNaN(one.number))
    .map((one) => ({ file: one.file, number: one.number }));
  let free = Math.max(0, ...files.map((one) => one.number)) + 1;

  for (const one of filed) {
    const wellNamed = named.test(one.name);
    if (!wellNamed) {
      const misnamed = misname(one, free, kind.one);
      issues.push({ file: one.file, message: misnamed.message });
      free = misnamed.free;
    }
    issues.push(...one.artifact.issues);
    if (one.artifact.readable) issues.push(...one.body.issues);
    const parsed = frontmatterOf(
      one.file,
      one.artifact,
      kind.schema,
      kind.one,
      kind.keys
    );
    issues.push(...parsed.issues);
    if (wellNamed && parsed.frontmatter !== undefined)
      records.push({
        file: one.file,
        number: one.number,
        title: one.body.title,
        domain,
        frontmatter: parsed.frontmatter,
        lines: one.artifact.lines,
      });
  }
  return { records, files, issues };
}

function misname(
  one: Filed,
  free: number,
  kind: string
): { message: string; free: number } {
  const match = numbered.exec(one.name);
  if (match === null) {
    const title =
      one.body.title === "" ? one.name.replace(/\.md$/, "") : one.body.title;
    const slug = termSlug(title);
    return {
      message:
        slug === ""
          ? unsluggable(title, free, kind)
          : `${kind} filenames start with a four-digit number — rename to "${pad(
              free
            )}-${slug}.md"`,
      free: free + 1,
    };
  }
  const digits = match[1] ?? "";
  const slug = termSlug(match[2] ?? "");
  if (slug === "")
    return { message: unsluggable(match[2] ?? "", Number(digits), kind), free };
  if (digits.length !== 4)
    return {
      message: `${kind} numbers are four digits — rename to "${pad(
        Number(digits)
      )}-${slug}.md"`,
      free,
    };
  return {
    message: `the title in a ${kind} filename is words joined by single hyphens, each starting with a letter or digit in any script and carrying no capitals — rename to "${digits}-${slug}.md"`,
    free,
  };
}

function unsluggable(text: string, number: number, kind: string): string {
  return `${kind} filenames are a four-digit number and a title in letters and digits — "${text}" has none, so rename to "${pad(
    number
  )}-your-title-here.md"`;
}

function pad(number: number): string {
  return String(number).padStart(4, "0");
}
