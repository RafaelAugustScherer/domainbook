import type { Issue } from "../issue.js";
import type { Book, FieldLines } from "../model.js";

type Coded = { file: string; lines: FieldLines; code?: string[] };

type Pair = { open: string; close: string; fix: string };

type Mark = { value: string; escaped: boolean };

const braces: Pair = {
  open: "{",
  close: "}",
  fix: 'close the alternatives with "}", as in "src/{app,web}/**"',
};

const classes: Pair = {
  open: "[",
  close: "]",
  fix: 'close the character class with "]", as in "src/[ab]*.ts"',
};

const escapable = "[]{}*?\\";

const blank = /^[\s/\\]*$/;

export function checkGlobs(book: Book): Issue[] {
  return coded(book).flatMap((one) =>
    (one.code ?? []).flatMap((pattern, index) => {
      const wrong = fault(pattern);
      if (wrong === undefined) return [];
      const field = `code[${index}]`;
      return [
        { file: one.file, line: one.lines[field], field, message: wrong },
      ];
    })
  );
}

function coded(book: Book): Coded[] {
  const found: Coded[] = book.domains.map((domain) => ({
    file: domain.file,
    lines: domain.lines,
    code: domain.frontmatter?.code,
  }));
  for (const record of [
    ...book.debt,
    ...book.domains.flatMap((domain) => domain.debt),
  ])
    found.push({
      file: record.file,
      lines: record.lines,
      code: record.frontmatter.code,
    });
  return found;
}

function fault(pattern: string): string | undefined {
  if (blank.test(pattern))
    return `"${pattern}" names no path — write a path under the repo root, like "src/**"`;
  const glob = marksOf(pattern);
  const separated = glob.some((mark) => !mark.escaped && mark.value === "\\");
  const marks = separated ? plain(pattern) : glob;
  const fixed = corrected(marks);
  if (fixed.split("/").includes(".."))
    return `"${pattern}" climbs above the repo with ".." — a code path is relative to the repo root, so name the folder from the root instead`;
  const lopsided =
    unbalanced(pattern, marks, braces) ?? unbalanced(pattern, marks, classes);
  if (lopsided !== undefined) return lopsided;
  if (separated)
    return `"${pattern}" separates folders with "\\" — a code path uses "/", so write "${fixed}"`;
  if (pattern.startsWith("/"))
    return `"${pattern}" starts at the filesystem root — a code path is relative to the repo root, so write "${fixed}"`;
  if (pattern.split("/").includes(""))
    return `"${pattern}" has an empty path segment — remove the extra "/", so write "${fixed}"`;
  return undefined;
}

function marksOf(pattern: string): Mark[] {
  const marks: Mark[] = [];
  let index = 0;
  while (index < pattern.length) {
    const value = pattern.charAt(index);
    const next = pattern.charAt(index + 1);
    if (value === "\\" && next !== "" && escapable.includes(next)) {
      marks.push({ value: next, escaped: true });
      index += 2;
      continue;
    }
    marks.push({ value, escaped: false });
    index += 1;
  }
  return marks;
}

function plain(pattern: string): Mark[] {
  return [...pattern].map((value) => ({ value, escaped: false }));
}

function corrected(marks: Mark[]): string {
  return marks
    .map(written)
    .join("")
    .split("/")
    .filter((segment) => segment !== "")
    .join("/");
}

function written(mark: Mark): string {
  if (mark.escaped) return `\\${mark.value}`;
  if (mark.value === "\\") return "/";
  return mark.value;
}

function unbalanced(
  pattern: string,
  marks: Mark[],
  pair: Pair
): string | undefined {
  let open = 0;
  for (const mark of marks) {
    if (mark.escaped) continue;
    if (mark.value === pair.open) open += 1;
    else if (mark.value === pair.close) {
      if (open === 0)
        return `"${pattern}" holds a "${pair.close}" that nothing opened — write "${pair.open}" before it, or drop the "${pair.close}"`;
      open -= 1;
    }
  }
  if (open === 0) return undefined;
  return `"${pattern}" leaves "${pair.open}" unclosed — ${pair.fix}`;
}
