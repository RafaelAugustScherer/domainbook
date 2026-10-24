import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { Issue } from "../issue.js";

export function entries(dir: string) {
  if (statSync(dir, { throwIfNoEntry: false })?.isDirectory() !== true)
    return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => !entry.name.startsWith("."))
    .sort((one, other) => (one.name < other.name ? -1 : 1));
}

export function isFile(path: string): boolean {
  return statSync(path, { throwIfNoEntry: false })?.isFile() === true;
}

export function readText(
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

export function strange(
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

export function relate(path: string): string {
  return relative(process.cwd(), path) || ".";
}
