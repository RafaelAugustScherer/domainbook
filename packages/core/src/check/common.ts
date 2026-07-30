import type { Issue } from "../issue.js";
import type { Book } from "../model.js";
import { slug, slugSource } from "../schemas/common.js";
import { divergence, overlong, slugBytes } from "../unicode.js";

export type At = { file: string; line?: number; field?: string };

const reference = new RegExp(`^(?:(${slugSource})/)?ADR-(\\d{4})$`, "u");

export function notNfc(at: At, value: string): Issue | undefined {
  const wrong = divergence(value, "NFC");
  if (wrong === undefined) return undefined;
  return {
    ...at,
    message: `"${value}" is not in Unicode NFC — at character ${
      wrong.index + 1
    } it holds ${wrong.held} where NFC holds ${
      wrong.wanted
    }; write the NFC form, or this and the same text written elsewhere will not match`,
  };
}

export function notNfkc(at: At, value: string): Issue | undefined {
  const wrong = divergence(value, "NFKC");
  if (wrong === undefined) return undefined;
  return {
    ...at,
    message: `"${value}" folds to "${
      wrong.normalized
    }" under NFKC — character ${wrong.index + 1} is ${
      wrong.held
    }, a compatibility form; write the folded form, or this and the slug it looks like are two different names`,
  };
}

export function tooLong(at: At, value: string): Issue | undefined {
  const bytes = overlong(value);
  if (bytes === undefined) return undefined;
  return {
    ...at,
    message: `"${value}" is ${bytes} bytes as UTF-8 — a slug holds at most ${slugBytes}, so that "NNNN-<slug>.md" fits the 255 bytes ext4 and APFS give a filename; shorten it`,
  };
}

export function orSetId(name: string): string {
  return slug.safeParse(name).success ? ` or set id to "${name}"` : "";
}

export function findDecision(book: Book, ref: string): string | undefined {
  const match = reference.exec(ref);
  if (match === null)
    return `write "ADR-NNNN", or "<domain-id>/ADR-NNNN" for a domain's own log`;
  const id = match[1];
  const domain =
    id === undefined ? undefined : book.domains.find((one) => one.id === id);
  if (id !== undefined && domain === undefined)
    return `there is no domain "${id}" in this book`;
  const files =
    domain === undefined ? book.decisionFiles : domain.decisionFiles;
  if (files.some((one) => one.number === Number(match[2]))) return undefined;
  const dir = logDir(id);
  if (files.length === 0) return `${dir} is empty`;
  const names = files.map((one) => `ADR-${pad(one.number)}`);
  return `${dir} holds ${listed(names)}`;
}

export function logDir(id: string | undefined): string {
  return id === undefined ? "decisions/" : `domains/${id}/decisions/`;
}

export function inBook(book: Book, file: string): string {
  return file.startsWith(`${book.root}/`)
    ? file.slice(book.root.length + 1)
    : file;
}

function listed(names: string[]): string {
  if (names.length < 3) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

export function basename(file: string): string {
  return file.slice(file.lastIndexOf("/") + 1);
}

export function pad(number: number): string {
  return String(number).padStart(4, "0");
}
