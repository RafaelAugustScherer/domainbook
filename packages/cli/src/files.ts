import {
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, relative, resolve } from "node:path";

export { missingBook } from "@domainbook/core";

const readAsSomethingElse = new Set([
  "true",
  "false",
  "null",
  "~",
  "y",
  "n",
  "yes",
  "no",
  "on",
  "off",
]);

export function bookRoot(given: string | undefined): string {
  return resolve(given ?? "domainbook");
}

export function relate(path: string): string {
  return relative(process.cwd(), path) || ".";
}

export function rooted(command: string, root: string): string {
  if (root === resolve("domainbook")) return command;
  const at = relate(root);
  const argument = /\s/.test(at) ? `'${at}'` : at;
  return `${command} ${argument}`;
}

export function quoted(value: string): string {
  if (/^[-+.\d]/.test(value) || readAsSomethingElse.has(value.toLowerCase()))
    return JSON.stringify(value);
  return value;
}

export function write(path: string, text: string): string | undefined {
  try {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
    return undefined;
  } catch (thrown) {
    const message = fsRefusal(thrown);
    if (message === undefined) throw thrown;
    return message;
  }
}

export function fsRefusal(thrown: unknown): string | undefined {
  const error = thrown as NodeJS.ErrnoException;
  if (typeof error?.code !== "string" || typeof error.path !== "string")
    return undefined;
  const blocking = fileAbove(error.path);
  if (blocking !== undefined)
    return `"${blocking}" is a file, and a folder has to go there — move it or delete it, then run this again`;
  const at = relate(error.path);
  if (error.code === "ENAMETOOLONG")
    return `${at} cannot be written — that name is longer than this filesystem allows; use a shorter title`;
  if (error.code === "EACCES" || error.code === "EPERM")
    return `${at} cannot be opened — this shell has no permission for it; change what that path allows, or pass a root you own`;
  return `${at} cannot be used — the filesystem refused with ${error.code}`;
}

export function entries(dir: string): string[] {
  return readdirSync(dir)
    .filter((name) => !name.startsWith("."))
    .sort();
}

export function titled(id: string): string {
  const words = id.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function pad(number: number): string {
  return String(number).padStart(4, "0");
}

function fileAbove(path: string): string | undefined {
  let at = path;
  while (at !== dirname(at)) {
    if (existsSync(at) && !statSync(at).isDirectory()) return relate(at);
    at = dirname(at);
  }
  return undefined;
}
