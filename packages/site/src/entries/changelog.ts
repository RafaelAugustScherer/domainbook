import type { Book, ChangelogRecord, Changelog } from "@domainbook/core";
import type { Entry, Render } from "./types.js";

const order = [
  "added",
  "changed",
  "deprecated",
  "removed",
  "fixed",
  "security",
] as const;

export async function changelogEntries(
  book: Book,
  render: Render
): Promise<Entry[]> {
  const found: { domain: string | undefined; record: ChangelogRecord }[] = [
    ...(book.changelog === undefined
      ? []
      : [{ domain: undefined, record: book.changelog }]),
    ...book.domains.flatMap((one) =>
      one.changelog === undefined
        ? []
        : [{ domain: one.id, record: one.changelog }]
    ),
  ];
  return Promise.all(
    found.map(async (one) => ({
      id: one.domain ?? "book",
      data: {
        domain: one.domain,
        file: one.record.file,
        releases: await releasesOf(one.record.changelog, render),
      },
    }))
  );
}

async function releasesOf(
  changelog: Changelog,
  render: Render
): Promise<Record<string, unknown>[]> {
  const unreleased =
    changelog.unreleased === undefined
      ? []
      : [
          {
            version: "Unreleased",
            date: undefined,
            yanked: false,
            ...changelog.unreleased,
          },
        ];
  return Promise.all(
    [...unreleased, ...changelog.releases].map(async (release) => ({
      version: release.version,
      date: release.date,
      yanked: release.yanked,
      buckets: await bucketsOf(release, render),
    }))
  );
}

async function bucketsOf(
  release: Record<string, unknown>,
  render: Render
): Promise<Record<string, unknown>[]> {
  const held = order.filter((name) => Array.isArray(release[name]));
  return Promise.all(
    held.map(async (name) => ({
      name,
      entries: await Promise.all((release[name] as string[]).map(render)),
    }))
  );
}
