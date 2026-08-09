import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { slug } from "../src/index.js";
import { slugSource, unicodeFlagNote } from "../src/schemas/common.js";

const schemaDir = fileURLToPath(new URL("../schema/", import.meta.url));

function published(): unknown[] {
  const found: unknown[] = [];
  const collect = (node: unknown): void => {
    if (Array.isArray(node)) return node.forEach(collect);
    if (node === null || typeof node !== "object") return;
    found.push(node);
    Object.values(node).forEach(collect);
  };
  for (const name of readdirSync(schemaDir))
    collect(JSON.parse(readFileSync(schemaDir + name, "utf8")));
  return found;
}

const accepted: Array<[string, string]> = [
  ["order-fulfilment", "latin words joined by hyphens"],
  ["seat-map-2", "a digit as a word of its own"],
  ["注文履行", "japanese, which has no case at all"],
  ["コーヒー豆", "ー U+30FC, a modifier letter, inside a word"],
  ["各々", "々 U+3005, a modifier letter, at the end of a word"],
  ["한국어-도메인", "hangul syllables"],
  ["تنفيذ-الطلب", "arabic, written without harakat"],
  ["עברית", "hebrew"],
  ["आदेश-पूर्ति", "devanagari, whose vowel signs are marks"],
  ["पूर्ति-२", "devanagari digits, which are Nd"],
  ["ก่อน", "thai, whose tone mark is a mark"],
  ["café", "a latin letter that carries its accent as one code point"],
  ["二千二十五", "a year written in ideographs"],
];

const rejected: Array<[string, string]> = [
  ["Order", "a capital"],
  ["İstanbul", "a capital outside ascii"],
  ["-lead", "a leading hyphen"],
  ["trail-", "a trailing hyphen"],
  ["a--b", "two hyphens in a row"],
  ["seat map", "a space"],
  ["seat_map", "an underscore"],
  ["seat.map", "a dot"],
  ["seat/map", "a slash"],
  ["", "nothing at all"],
  ["ोमेन", "a mark where the word's first letter should be"],
  ["二〇二五-年度", "〇 U+3007, a numeral that is not a digit"],
  ["Ⅳ", "Ⅳ U+2163, which folds to the ascii letters IV"],
  ["½", "½ U+00BD, which folds to 1⁄2"],
  ["seat​map", "a zero-width space"],
  ["seat‮map", "a right-to-left override"],
];

describe("the slug grammar", () => {
  it.each(accepted)("accepts %s — %s", (value) => {
    expect(slug.safeParse(value).success).toBe(true);
  });

  it.each(rejected)("rejects %s — %s", (value) => {
    expect(slug.safeParse(value).success).toBe(false);
  });

  it("says what the rule is when a value breaks it", () => {
    expect(slug.safeParse("Box Office").error?.issues[0]?.message).toBe(
      "must be words joined by single hyphens — a word starts with a letter or digit in any script, and carries no capitals"
    );
  });

  it("leaves every slug that was legal before this grammar legal", () => {
    const ascii = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    const alphabet = "abcdefghijklmnopqrstuvwxyz0123456789-";
    const now = new RegExp(`^${slugSource}$`, "u");
    let seed = 1;
    const pick = () => {
      seed = (seed * 48271) % 2147483647;
      return alphabet[seed % alphabet.length];
    };
    for (let count = 0; count < 20000; count += 1) {
      let value = "";
      for (let length = 1 + (count % 12); length > 0; length -= 1)
        value += pick();
      expect(now.test(value), value).toBe(ascii.test(value));
    }
  });

  it("publishes a pattern that needs the u flag to mean anything", () => {
    expect(new RegExp(`^${slugSource}$`, "u").test("注文履行")).toBe(true);
    expect(new RegExp(`^${slugSource}$`).test("注文履行")).toBe(false);
    expect(new RegExp(`^${slugSource}$`).test("p{Ll}")).toBe(true);
  });
});

describe("the published JSON Schema", () => {
  const nodes = published();

  it("carries the grammar as a bare pattern, verbatim", () => {
    const patterns = nodes
      .map((node) => (node as { pattern?: string }).pattern)
      .filter((pattern) => pattern !== undefined);
    expect(patterns).toContain(`^${slugSource}$`);
  });

  it("warns on every described pattern that it needs the u flag", () => {
    const described = nodes
      .filter((node) =>
        ((node as { pattern?: string }).pattern ?? "").includes(String.raw`\p{`)
      )
      .map((node) => (node as { description?: string }).description)
      .filter((description) => description !== undefined);
    expect(described.length).toBeGreaterThan(0);
    for (const description of described)
      expect(description.endsWith(unicodeFlagNote)).toBe(true);
  });

  it("names no format the specification has not defined", () => {
    const formats = new Set(
      nodes
        .map((node) => (node as { format?: string }).format)
        .filter((format) => format !== undefined)
    );
    expect([...formats]).toEqual(["date"]);
  });
});
