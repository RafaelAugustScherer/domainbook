import { readFileSync, statSync } from "node:fs";
import { isAbsolute, relative } from "node:path";

export function text(file: string): string {
  try {
    return readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

export function matchable(paths: string[]): string[] {
  return paths.map((path) =>
    path.endsWith("/") || !isDirectory(path) ? path : `${path}/`
  );
}

function isDirectory(path: string): boolean {
  return statSync(path, { throwIfNoEntry: false })?.isDirectory() === true;
}

export function changedAt(file: string): string | undefined {
  return statSync(file, { throwIfNoEntry: false })?.mtime.toISOString();
}

export function outsideRepo(path: string): string | undefined {
  const below = isAbsolute(path) ? relative(process.cwd(), path) : path;
  if (below === ".." || below.startsWith("../") || isAbsolute(below))
    return `paths are read from the repo root — "${path}" climbs out of it`;
  if (below !== path)
    return `paths are read from the repo root — pass "${below}" rather than an absolute path`;
  return undefined;
}
