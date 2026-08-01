import { cpSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { type Book, loadBook } from "@domainbook/core";

export const goldenDir = fileURLToPath(
  new URL("../../core/test/fixtures/book/", import.meta.url)
);

export function golden(): Book {
  return loadBook(goldenDir).book;
}

export function copied(): { book: Book; dir: string; remove: () => void } {
  const dir = mkdtempSync(join(tmpdir(), "domainbook-mcp-"));
  const root = join(dir, "domainbook");
  cpSync(goldenDir, root, { recursive: true });
  return {
    book: loadBook(root).book,
    dir: relative(process.cwd(), root),
    remove: () => rmSync(dir, { recursive: true, force: true }),
  };
}

export function textOf(answer: {
  content: { type: "text"; text: string }[];
}): string {
  return answer.content.map((one) => one.text).join("\n");
}
