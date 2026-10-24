import { join, resolve } from "node:path";
import type { Issue } from "../issue.js";
import { entries, relate, rooted } from "./disk.js";

export const changelogFile = "changelog.md";

export function isChangelog(entry: {
  name: string;
  isDirectory: () => boolean;
}): boolean {
  return !entry.isDirectory() && entry.name === changelogFile;
}

export function noChangelog(path: string, root: string): Issue {
  return {
    file: relate(path),
    message: `a book holds no changelog — run "${rooted(
      "domainbook validate --fix",
      root
    )}" to delete it, or move it out of ${root}/ if the project keeps one`,
  };
}

export function bookChangelogs(root: string): string[] {
  const dir = resolve(root);
  const domains = join(dir, "domains");
  const folders = entries(domains)
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(domains, entry.name));
  return [dir, ...folders].flatMap((folder) =>
    entries(folder)
      .filter(isChangelog)
      .map((entry) => relate(join(folder, entry.name)))
  );
}
