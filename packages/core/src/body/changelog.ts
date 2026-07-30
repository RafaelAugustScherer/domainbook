import * as z from "zod";
import { type Issue, schemaIssues } from "../issue.js";
import type { ChangelogRecord } from "../model.js";
import { type Changelog, changelogSchema } from "../schemas/changelog.js";
import {
  headings,
  items,
  type Node,
  type Section,
  sections,
} from "./markdown.js";

type Buckets = NonNullable<Changelog["unreleased"]>;
type Release = Changelog["releases"][number];
type Lines = Record<string, number>;
type Placed = { release: Release; text: string; line: number; lines: Lines };

const heading = /^\[([^\]]+)\] - (\S+)( \[YANKED\])?$/;
const isoDate = z.iso.date();
const buckets = [
  "Added",
  "Changed",
  "Deprecated",
  "Removed",
  "Fixed",
  "Security",
];

const layout =
  'write "## [1.2.0] - 2026-06-30", with " [YANKED]" appended if the release was pulled';
const newest = "a changelog lists releases newest first";
const outline =
  'a changelog is an optional H1 title and intro, then "## [Unreleased]" and one H2 per release';
const inside = `a release holds ${buckets.join(
  ", "
)} as H3s, each a bullet list`;

export function parseChangelog(
  file: string,
  nodes: Node[]
): { record: ChangelogRecord; issues: Issue[] } {
  const issues: Issue[] = [...checkOutline(file, nodes)];
  const placed: Placed[] = [];
  let unreleased: Buckets | undefined;
  let unreleasedAt: Lines = {};

  for (const [index, section] of sections(nodes, 2).entries()) {
    const parsed = readBuckets(file, section);
    issues.push(...parsed.issues);
    if (section.heading.text === "[Unreleased]") {
      if (index > 0)
        issues.push({
          file,
          line: section.heading.line,
          message: `"[Unreleased]" comes after a release — an unreleased section comes above every release`,
        });
      unreleased = parsed.buckets;
      unreleasedAt = parsed.lines;
      continue;
    }
    const match = heading.exec(section.heading.text);
    if (match === null) {
      issues.push({
        file,
        line: section.heading.line,
        message: `"${section.heading.text}" is not a release heading — ${layout}`,
      });
      continue;
    }
    placed.push({
      release: {
        version: match[1] ?? "",
        date: match[2] ?? "",
        yanked: match[3] !== undefined,
        ...parsed.buckets,
      },
      text: section.heading.text,
      line: section.heading.line,
      lines: parsed.lines,
    });
  }

  const changelog: Changelog = {
    unreleased,
    releases: placed.map((one) => one.release),
  };
  return {
    record: { file, changelog },
    issues: [
      ...issues,
      ...schemaIssues(
        file,
        changelogSchema.safeParse(changelog).error,
        changelog,
        "changelog",
        (path) => locate(path, placed, unreleasedAt)
      ),
      ...checkOrder(file, placed),
    ],
  };
}

function locate(
  path: PropertyKey[],
  placed: Placed[],
  unreleasedAt: Lines
): number | undefined {
  if (path[0] === "unreleased") return unreleasedAt[String(path[1])];
  const one = placed[Number(path[1])];
  return one?.lines[String(path[2])] ?? one?.line;
}

function checkOutline(file: string, nodes: Node[]): Issue[] {
  const found = headings(nodes);
  const first = found.findIndex((heading) => heading.depth === 2);
  return found.flatMap((heading, index) => {
    if (heading.depth === 1 && index > 0)
      return [
        {
          file,
          line: heading.line,
          message: `"${heading.text}" is a second H1 — ${outline}`,
        },
      ];
    if (heading.depth > 2 && (first === -1 || index < first))
      return [
        {
          file,
          line: heading.line,
          message: `"${heading.text}" is not part of a release — ${outline}`,
        },
      ];
    return [];
  });
}

function dated(one: Placed): boolean {
  return isoDate.safeParse(one.release.date).success;
}

function checkOrder(file: string, placed: Placed[]): Issue[] {
  const issues: Issue[] = [];
  for (const [index, one] of placed.entries()) {
    const above = placed[index - 1];
    if (
      above !== undefined &&
      dated(above) &&
      dated(one) &&
      above.release.date < one.release.date
    )
      issues.push({
        file,
        line: one.line,
        message: `releases are out of order — "${one.text}" comes after "${above.text}"; ${newest}`,
      });
    if (
      placed
        .slice(0, index)
        .some((other) => other.release.version === one.release.version)
    )
      issues.push({
        file,
        line: one.line,
        message: `version ${one.release.version} is released twice — merge the two sections; a version appears once in a changelog`,
      });
  }
  return issues;
}

function readBuckets(
  file: string,
  section: Section
): { buckets: Buckets; lines: Lines; issues: Issue[] } {
  const found: Buckets = {};
  const lines: Lines = {};
  const issues: Issue[] = [];
  for (const bucket of sections(section.nodes, 3)) {
    if (!buckets.includes(bucket.heading.text)) {
      issues.push({
        file,
        line: bucket.heading.line,
        message: `"${bucket.heading.text}" is not a changelog section — ${inside}`,
      });
      continue;
    }
    const key = bucket.heading.text.toLowerCase();
    if (lines[key] !== undefined) {
      issues.push({
        file,
        line: bucket.heading.line,
        message: `"${bucket.heading.text}" appears twice in "${section.heading.text}" — ${inside}`,
      });
      continue;
    }
    lines[key] = bucket.heading.line;
    const entries = items(bucket.nodes);
    if (entries.length === 0) {
      issues.push({
        file,
        line: bucket.heading.line,
        message: `"${bucket.heading.text}" lists nothing — write each change as a "- " bullet, or drop the heading`,
      });
      continue;
    }
    found[key as keyof Buckets] = entries.map((entry) => entry.text);
  }
  return { buckets: found, lines, issues };
}
