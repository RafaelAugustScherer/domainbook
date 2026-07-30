import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import {
  isMap,
  isScalar,
  isSeq,
  parse,
  parseDocument,
  YAMLParseError,
} from "yaml";
import type { ZodType } from "zod";
import { parseChangelog } from "./body/changelog.js";
import { parseDecisionBody } from "./body/decision.js";
import { checkDomainBody } from "./body/domain.js";
import { parseFeatureBody } from "./body/feature.js";
import { parseGlossary } from "./body/glossary.js";
import { type Node, parseMarkdown } from "./body/markdown.js";
import { parseFrontmatter } from "./frontmatter.js";
import { dotted, type Issue, schemaIssues } from "./issue.js";
import {
  type Book,
  type ChangelogRecord,
  type DecisionFile,
  type DecisionRecord,
  type DomainRecord,
  type FeatureRecord,
  type FieldLines,
  type GlossaryRecord,
  termSlug,
} from "./model.js";
import { slugSource } from "./schemas/common.js";
import { configSchema } from "./schemas/config.js";
import { decisionSchema } from "./schemas/decision.js";
import { type Domain, domainSchema } from "./schemas/domain.js";
import { featureSchema } from "./schemas/feature.js";
import { roadmapSchema } from "./schemas/roadmap.js";

export const configFile = "domainbook.config.yaml";

type Artifact = {
  data: unknown;
  readable: boolean;
  nodes: Node[];
  lines: FieldLines;
  issues: Issue[];
};

type Filed = {
  name: string;
  file: string;
  number: number;
  artifact: Artifact;
  body: { title: string; issues: Issue[] };
};

const named = new RegExp(`^(\\d{4})-(${slugSource})\\.md$`, "u");
const numbered = /^(\d+)-(.+)\.md$/;

const rootHolds = `a book root holds roadmap.md, glossary.md, changelog.md, ${configFile}, decisions/*.md, and domains/`;
const domainsHold = "domains/ holds one folder per domain and nothing else";
const domainHolds =
  "a domain folder holds index.md, glossary.md, changelog.md, features/*.md, and decisions/*.md";
const featuresHold =
  "a features folder holds one .md file per feature and nothing else";
const logHolds = "a decision log holds .md files and nothing else";

export function loadBook(root: string): { book: Book; issues: Issue[] } {
  const dir = resolve(root);
  const issues: Issue[] = [];
  const book: Book = {
    root: relate(dir),
    config: configSchema.parse({}),
    decisions: [],
    decisionFiles: [],
    domains: [],
  };

  if (!existsSync(dir)) {
    issues.push({
      file: book.root,
      message: `no book here — run "domainbook init ${book.root}" to write one`,
    });
    return { book, issues };
  }
  if (!statSync(dir).isDirectory()) {
    issues.push({
      file: book.root,
      message: "a book root is a folder, and this path is a file",
    });
    return { book, issues };
  }

  const known = ["roadmap.md", "glossary.md", "changelog.md", configFile];
  for (const entry of entries(dir))
    if (
      entry.isDirectory()
        ? entry.name !== "decisions" && entry.name !== "domains"
        : !known.includes(entry.name)
    )
      issues.push(strange(dir, entry, rootHolds));

  const config = loadConfig(dir);
  book.config = config.config;
  issues.push(...config.issues);

  const roadmap = loadRoadmap(dir);
  book.roadmap = roadmap.record;
  issues.push(...roadmap.issues);

  const glossary = loadGlossary(dir);
  book.glossary = glossary.record;
  issues.push(...glossary.issues);

  const changelog = loadChangelog(dir);
  book.changelog = changelog.record;
  issues.push(...changelog.issues);

  const log = loadLog(join(dir, "decisions"), undefined);
  book.decisions = log.records;
  book.decisionFiles = log.files;
  issues.push(...log.issues);

  const domains = join(dir, "domains");
  for (const entry of entries(domains)) {
    if (!entry.isDirectory()) {
      issues.push(strange(domains, entry, domainsHold));
      continue;
    }
    const domain = loadDomain(join(domains, entry.name), entry.name);
    issues.push(...domain.issues);
    book.domains.push(domain.record);
  }

  return { book, issues };
}

function loadRoadmap(dir: string): {
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

function loadDomain(
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

function loadFeatures(
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

function loadLog(
  dir: string,
  domain: string | undefined
): { records: DecisionRecord[]; files: DecisionFile[]; issues: Issue[] } {
  const records: DecisionRecord[] = [];
  const issues: Issue[] = [];

  const filed: Filed[] = [];
  for (const entry of entries(dir)) {
    if (entry.isDirectory() || !entry.name.endsWith(".md")) {
      issues.push(strange(dir, entry, logHolds));
      continue;
    }
    const file = relate(join(dir, entry.name));
    const artifact = readArtifact(join(dir, entry.name), file);
    filed.push({
      name: entry.name,
      file,
      number: Number(numbered.exec(entry.name)?.[1] ?? Number.NaN),
      artifact,
      body: parseDecisionBody(file, artifact.nodes),
    });
  }

  const files = filed
    .filter((one) => !Number.isNaN(one.number))
    .map((one) => ({ file: one.file, number: one.number }));
  let free = Math.max(0, ...files.map((one) => one.number)) + 1;

  for (const one of filed) {
    const wellNamed = named.test(one.name);
    if (!wellNamed) {
      const misnamed = misname(one, free);
      issues.push({ file: one.file, message: misnamed.message });
      free = misnamed.free;
    }
    issues.push(...one.artifact.issues);
    if (one.artifact.readable) issues.push(...one.body.issues);
    const parsed = frontmatterOf(
      one.file,
      one.artifact,
      decisionSchema,
      "decision",
      '"status" and "date"'
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

function misname(one: Filed, free: number): { message: string; free: number } {
  const match = numbered.exec(one.name);
  if (match === null) {
    const title =
      one.body.title === "" ? one.name.replace(/\.md$/, "") : one.body.title;
    const slug = termSlug(title);
    return {
      message:
        slug === ""
          ? unsluggable(title, free)
          : `decision filenames start with a four-digit number — rename to "${pad(
              free
            )}-${slug}.md"`,
      free: free + 1,
    };
  }
  const digits = match[1] ?? "";
  const slug = termSlug(match[2] ?? "");
  if (slug === "")
    return { message: unsluggable(match[2] ?? "", Number(digits)), free };
  if (digits.length !== 4)
    return {
      message: `decision numbers are four digits — rename to "${pad(
        Number(digits)
      )}-${slug}.md"`,
      free,
    };
  return {
    message: `the title in a decision filename is words joined by single hyphens, each starting with a letter or digit in any script and carrying no capitals — rename to "${digits}-${slug}.md"`,
    free,
  };
}

function unsluggable(text: string, number: number): string {
  return `decision filenames are a four-digit number and a title in letters and digits — "${text}" has none, so rename to "${pad(
    number
  )}-your-title-here.md"`;
}

function loadGlossary(dir: string): {
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

function loadChangelog(dir: string): {
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

function readBody(
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

function loadConfig(dir: string): { config: Book["config"]; issues: Issue[] } {
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

function readArtifact(path: string, file: string): Artifact {
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

function frontmatterOf<T>(
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

function fieldLines(text: string): FieldLines {
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

function nearest(
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

function yamlIssue(
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

function entries(dir: string) {
  if (statSync(dir, { throwIfNoEntry: false })?.isDirectory() !== true)
    return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .sort((one, other) => (one.name < other.name ? -1 : 1));
}

function isFile(path: string): boolean {
  return statSync(path, { throwIfNoEntry: false })?.isFile() === true;
}

function readText(
  path: string,
  file: string
): { source: string } | { issue: Issue } {
  try {
    return { source: readFileSync(path, "utf8") };
  } catch (thrown) {
    return {
      issue: {
        file,
        message: `this file could not be read — ${trouble(
          thrown
        )}; make it readable and run again`,
      },
    };
  }
}

function trouble(thrown: unknown): string {
  if (!(thrown instanceof Error)) return String(thrown);
  return thrown.message.split(",")[0] ?? thrown.message;
}

function strange(
  dir: string,
  entry: { name: string; isDirectory: () => boolean },
  holds: string
): Issue {
  return {
    file: relate(join(dir, entry.name)),
    message: `the format does not know this ${
      entry.isDirectory() ? "folder" : "file"
    } — ${holds}`,
  };
}

function relate(path: string): string {
  return relative(process.cwd(), path) || ".";
}

function pad(number: number): string {
  return String(number).padStart(4, "0");
}
