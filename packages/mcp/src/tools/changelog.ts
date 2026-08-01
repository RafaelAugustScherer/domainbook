import type {
  Book,
  Changelog,
  ChangelogRecord,
  ChangelogRelease,
} from "@domainbook/core";
import { type Answer, refuse, said } from "../answer.js";
import { type Asked, scoped } from "../scope.js";

const buckets = [
  "added",
  "changed",
  "deprecated",
  "removed",
  "fixed",
  "security",
] as const;

export function getChangelog(
  book: Book,
  asked: {
    domain?: string;
    paths?: string[];
    version?: string;
    since?: string;
    all?: boolean;
  }
): Answer {
  const found = scope(book, asked);
  if ("refusal" in found) return refuse(found.refusal);
  if (found.records.length === 0) return said("no changelog in that scope");
  return said(
    found.records.map((record) => written(record, asked)).join("\n\n")
  );
}

function scope(
  book: Book,
  asked: Asked
): { records: ChangelogRecord[] } | { refusal: string } {
  const only = asked.domain;
  if (only !== undefined) {
    const kept = book.domains.find((one) => one.id === only);
    if (kept !== undefined && kept.changelog === undefined)
      return {
        refusal: `${only} keeps no changelog — ${book.root}/changelog.md is the one this book has`,
      };
  }
  return scoped(
    book,
    asked,
    (domain) => (domain.changelog === undefined ? [] : [domain.changelog]),
    book.changelog === undefined ? [] : [book.changelog],
    "name a domain or the paths you are changing — or pass all to read every changelog in the book"
  );
}

function written(
  record: ChangelogRecord,
  asked: { version?: string; since?: string }
): string {
  const { changelog } = record;
  if (asked.version !== undefined) {
    const release = changelog.releases.find(
      (one) => one.version === asked.version
    );
    if (release === undefined)
      return [
        `no ${asked.version} in ${record.file} — it holds ${
          changelog.releases.length === 0
            ? "no releases"
            : changelog.releases.map((one) => one.version).join(", ")
        }`,
      ].join("\n");
    return [`# ${record.file}`, "", ...section(release)].join("\n");
  }
  return [`# ${record.file}`, "", ...chosen(changelog, asked.since)].join("\n");
}

function chosen(changelog: Changelog, since: string | undefined): string[] {
  const head = unreleased(changelog);
  if (since !== undefined) {
    const kept = changelog.releases.filter((one) => one.date >= since);
    return [...head, ...kept.flatMap(section)];
  }
  const [newest] = changelog.releases;
  if (newest === undefined)
    return [
      ...head,
      "",
      "this changelog has no releases, so bounding by release bounds nothing (mcp/ADR-0003)",
    ];
  const before = changelog.releases[1];
  return [
    ...head,
    ...section(newest),
    before === undefined
      ? undefined
      : `The release before is ${before.version} — name it as version to read it.`,
  ].filter((line) => line !== undefined);
}

function unreleased(changelog: Changelog): string[] {
  if (changelog.unreleased === undefined) return [];
  return ["## [Unreleased]", "", ...entries(changelog.unreleased), ""];
}

function section(release: ChangelogRelease): string[] {
  const yanked = release.yanked ? " [YANKED]" : "";
  return [
    `## [${release.version}] - ${release.date}${yanked}`,
    "",
    ...entries(release),
    "",
  ];
}

function entries(held: Partial<Record<(typeof buckets)[number], string[]>>) {
  return buckets.flatMap((bucket) => {
    const lines = held[bucket];
    if (lines === undefined) return [];
    const title = bucket.charAt(0).toUpperCase() + bucket.slice(1);
    return [`### ${title}`, "", ...lines.map((one) => `- ${one}`), ""];
  });
}
