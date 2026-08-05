import { readFileSync } from "node:fs";
import { parseFrontmatter } from "@domainbook/core";

export type Part = { heading: string; markdown: string };

const fence = /^[ \t]*(`{3,}|~{3,})/;

export function bodyOf(file: string): string {
  return parseFrontmatter(readFileSync(file, "utf8")).body;
}

export function partsOf(body: string): Part[] {
  const parts: Part[] = [];
  let open: string | undefined;
  for (const line of body.split(/\r?\n/)) {
    const marker = fence.exec(line)?.[1];
    if (marker !== undefined && open === undefined) open = marker;
    else if (marker !== undefined && marker[0] === open?.[0]) open = undefined;
    const heading = open === undefined ? /^##[ \t](.*)$/.exec(line) : null;
    if (heading !== null) {
      parts.push({ heading: (heading[1] ?? "").trim(), markdown: "" });
      continue;
    }
    const last = parts.at(-1);
    if (last !== undefined) last.markdown += `${line}\n`;
  }
  return parts.map((part) => ({ ...part, markdown: part.markdown.trim() }));
}

export function withoutTitle(body: string): string {
  const lines = body.split(/\r?\n/);
  const first = lines.findIndex((line) => line.trim() !== "");
  if (first === -1 || !/^#[ \t]/.test(lines[first] ?? "")) return body;
  return lines
    .slice(first + 1)
    .join("\n")
    .trimStart();
}

export function partNamed(parts: Part[], heading: string): string {
  return parts.find((one) => one.heading === heading)?.markdown ?? "";
}
