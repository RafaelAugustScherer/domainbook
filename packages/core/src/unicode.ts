const mark = /\p{M}/u;

export const slugBytes = 247;

export type Divergence = {
  normalized: string;
  index: number;
  held: string;
  wanted: string;
};

export function divergence(
  value: string,
  form: "NFC" | "NFKC"
): Divergence | undefined {
  const normalized = value.normalize(form);
  if (normalized === value) return undefined;
  const held = [...value];
  const wanted = [...normalized];
  let index = 0;
  while (index < held.length && held[index] === wanted[index]) index += 1;
  return {
    normalized,
    index,
    held: points(held, index),
    wanted: points(wanted, index),
  };
}

export function overlong(value: string): number | undefined {
  const bytes = Buffer.byteLength(value, "utf8");
  return bytes <= slugBytes ? undefined : bytes;
}

function points(chars: string[], index: number): string {
  let end = index + 1;
  while (end < chars.length && mark.test(chars[end] ?? "")) end += 1;
  return chars.slice(index, end).map(codepoint).join(" ");
}

function codepoint(char: string): string {
  return `U+${(char.codePointAt(0) ?? 0)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0")}`;
}
