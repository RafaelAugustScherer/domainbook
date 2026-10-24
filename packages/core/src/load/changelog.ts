export const changelogFile = "changelog.md";

export function isChangelog(entry: {
  name: string;
  isDirectory: () => boolean;
}): boolean {
  return !entry.isDirectory() && entry.name === changelogFile;
}
