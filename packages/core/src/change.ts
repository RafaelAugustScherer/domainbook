import { matchesGlob } from "node:path";
import type { Book } from "./model.js";
import { tdrRef } from "./ref.js";

export type StaleDomain = { id: string; paths: string[] };

export type DebtNote = { ref: string; file: string; paths: string[] };

export type Change = {
  checked: string[];
  stale: StaleDomain[];
  debt: DebtNote[];
};

export function checkChange(
  book: Book,
  bookPath: string,
  paths: string[]
): Change {
  const changed = [...new Set(paths)].sort();
  const code = changed.filter((path) => !within(bookPath, path));
  const crossCutting = changed.some(
    (path) =>
      within(`${bookPath}/decisions`, path) ||
      path === `${bookPath}/changelog.md`
  );
  const checked: string[] = [];
  const stale: StaleDomain[] = [];
  for (const domain of book.domains) {
    const claimed = matching(domain.frontmatter?.code, code);
    if (claimed.length === 0) continue;
    checked.push(domain.id);
    const written =
      crossCutting ||
      changed.some((path) => within(`${bookPath}/domains/${domain.id}`, path));
    if (!written) stale.push({ id: domain.id, paths: claimed });
  }
  return { checked, stale, debt: openDebt(book, code) };
}

function openDebt(book: Book, code: string[]): DebtNote[] {
  const records = [...book.debt, ...book.domains.flatMap((one) => one.debt)];
  return records
    .filter((record) => record.frontmatter.status === "open")
    .map((record) => ({
      ref: tdrRef(record),
      file: record.file,
      paths: matching(record.frontmatter.code, code),
    }))
    .filter((note) => note.paths.length > 0)
    .sort(
      (one, other) => order(one.ref, other.ref) || order(one.file, other.file)
    );
}

function order(one: string, other: string): number {
  if (one < other) return -1;
  return one > other ? 1 : 0;
}

function matching(globs: string[] | undefined, paths: string[]): string[] {
  if (globs === undefined) return [];
  return paths.filter((path) => globs.some((glob) => matchesGlob(path, glob)));
}

function within(dir: string, path: string): boolean {
  return path === dir || path.startsWith(`${dir}/`);
}
