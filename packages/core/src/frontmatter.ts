import { parse } from "yaml";

const byteOrderMark = "\uFEFF";
const fence = /^---[^\S\n]*\r?\n(?:([\s\S]*?)\r?\n)?---[^\S\n]*(?:\r?\n|$)/;

export function parseFrontmatter(source: string): {
  data: unknown;
  body: string;
} {
  const text = source.startsWith(byteOrderMark) ? source.slice(1) : source;
  const match = fence.exec(text);
  if (!match) return { data: undefined, body: text };
  const block = match[1] === undefined ? undefined : parse(match[1]);
  return { data: block ?? {}, body: text.slice(match[0].length) };
}
