import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { canvas, parseFrontmatter, slug, termSlug } from "@domainbook/core";
import {
  entries,
  pad,
  quoted,
  relate,
  rooted,
  titled,
  today,
  write,
} from "./files.js";
import { refuse, type Result } from "./result.js";

const numbered = /^(\d+)-.*\.md$/;
const statusLine = /^status:.*$/m;
const mark = /\p{M}/u;
const slugBytes = 247;

export function newDomain(root: string, id: string): Result {
  const path = join(root, "domains", id, "index.md");
  const wrong =
    noBook(root) ??
    notSlug(id, "domain id") ??
    unwritable(id, "domain id") ??
    taken(path);
  if (wrong !== undefined) return refuse(wrong);
  const failed = write(path, domainPage(id));
  if (failed !== undefined) return refuse(failed);
  return {
    code: 0,
    lines: [
      `wrote ${relate(path)}`,
      `next: set the three classification axes and fill in the eight canvas sections, then "${rooted(
        "domainbook validate",
        root
      )}"`,
    ],
  };
}

export function newFeature(
  root: string,
  id: string,
  domain: string | undefined
): Result {
  if (domain === undefined)
    return refuse(
      `"domainbook new feature" needs the domain the feature belongs to — write "domainbook new feature ${id} --domain <domain-id>"`
    );
  const path = join(root, "domains", domain, "features", `${id}.md`);
  const wrong =
    noBook(root) ??
    notSlug(id, "feature id") ??
    unwritable(id, "feature id") ??
    notSlug(domain, "domain id") ??
    unwritable(domain, "domain id") ??
    noDomain(root, domain) ??
    taken(path);
  if (wrong !== undefined) return refuse(wrong);
  const failed = write(path, featurePage(id));
  if (failed !== undefined) return refuse(failed);
  return {
    code: 0,
    lines: [
      `wrote ${relate(path)}`,
      `next: write the story, name the rule, and replace the example, then "${rooted(
        "domainbook validate",
        root
      )}"`,
    ],
  };
}

export function newDecision(
  root: string,
  title: string,
  domain: string | undefined,
  supersedes: string | undefined
): Result {
  const wrong =
    noBook(root) ??
    (domain === undefined
      ? undefined
      : notSlug(domain, "domain id") ??
        unwritable(domain, "domain id") ??
        noDomain(root, domain)) ??
    notNfc(title, "decision title") ??
    notNfkc(title, "decision title");
  if (wrong !== undefined) return refuse(wrong);
  const name = termSlug(title);
  if (name === "")
    return refuse(
      `"${title}" gives no filename — a decision filename is a four-digit number and the title in letters and digits, and this title has none; write one that has some`
    );
  const bytes = Buffer.byteLength(name, "utf8");
  if (bytes > slugBytes)
    return refuse(
      `"${title}" gives the filename slug "${name}", which is ${bytes} bytes as UTF-8 — a slug holds at most ${slugBytes} bytes, so that "NNNN-<slug>.md" fits the 255 bytes ext4 and APFS give a filename; write a shorter title`
    );

  const dir =
    domain === undefined
      ? join(root, "decisions")
      : join(root, "domains", domain, "decisions");
  const used = numbers(dir);
  const next = used.length === 0 ? 1 : Math.max(...used) + 1;
  const path = join(dir, `${pad(next)}-${name}.md`);
  const after = `next: fill in the sections, then "${rooted(
    "domainbook validate",
    root
  )}"`;

  if (supersedes === undefined) {
    const failed = write(path, decisionPage(title));
    if (failed !== undefined) return refuse(failed);
    return { code: 0, lines: [`wrote ${relate(path)}`, after] };
  }

  if (!/^\d+$/.test(supersedes))
    return refuse(
      `"--supersedes ${supersedes}" is not a decision number — pass the number of the decision this one replaces, as in "--supersedes 3"`
    );
  const old = fileOf(dir, Number(supersedes));
  if (old === undefined)
    return refuse(
      `no ADR-${pad(Number(supersedes))} in ${relate(dir)}/ — ${
        used.length === 0
          ? "that log holds no decisions yet, so there is nothing to supersede"
          : `it holds ${used.map((one) => `ADR-${pad(one)}`).join(", ")}`
      }`
    );
  const source = readFileSync(old, "utf8");
  const { body } = parseFrontmatter(source);
  const head = source.slice(0, source.length - body.length);
  const status = `superseded by ${
    domain === undefined ? "" : `${domain}/`
  }ADR-${pad(next)}`;
  if (!statusLine.test(head))
    return refuse(
      `${relate(
        old
      )} has no "status:" line to change — add "status: ${status}" to its frontmatter, then write the new decision without --supersedes`
    );

  const failed =
    write(path, decisionPage(title)) ??
    write(old, head.replace(statusLine, `status: ${status}`) + body);
  if (failed !== undefined) return refuse(failed);
  return {
    code: 0,
    lines: [
      `wrote ${relate(path)}`,
      `${relate(old)} is now "${status}"`,
      after,
    ],
  };
}

function noBook(root: string): string | undefined {
  if (existsSync(join(root, "roadmap.md"))) return undefined;
  return `no book in ${relate(
    root
  )} — every book has a roadmap.md; run "${rooted(
    "domainbook init",
    root
  )}" to write one, or pass the root of the book you meant`;
}

function notSlug(id: string, what: string): string | undefined {
  if (slug.safeParse(id).success) return undefined;
  const fixed = termSlug(id.normalize("NFKC"));
  return `"${id}" is not a ${what} — write words joined by single hyphens, where a word starts with a letter or digit in any script and carries no capitals${
    fixed === "" ? "" : `, as in "${fixed}"`
  }`;
}

function unwritable(value: string, what: string): string | undefined {
  return notNfc(value, what) ?? notNfkc(value, what) ?? tooLong(value, what);
}

function notNfc(value: string, what: string): string | undefined {
  const composed = value.normalize("NFC");
  if (composed === value) return undefined;
  const index = diverges(value, composed);
  return `the ${what} "${value}" is not in Unicode NFC — at character ${
    index + 1
  } it holds ${points(value, index)} where NFC holds ${points(
    composed,
    index
  )}; write "${composed}" instead, or this and the same text written elsewhere will not match`;
}

function notNfkc(value: string, what: string): string | undefined {
  const folded = value.normalize("NFKC");
  if (folded === value) return undefined;
  const index = diverges(value, folded);
  return `the ${what} "${value}" folds to "${folded}" under NFKC — character ${
    index + 1
  } is ${points(
    value,
    index
  )}, a compatibility form; write "${folded}" instead, or this and the ${what} it looks like are two different names`;
}

function tooLong(value: string, what: string): string | undefined {
  const bytes = Buffer.byteLength(value, "utf8");
  if (bytes <= slugBytes) return undefined;
  return `the ${what} "${value}" is ${bytes} bytes as UTF-8 — a ${what} holds at most ${slugBytes} bytes, so the filenames it forms fit the 255 bytes ext4 and APFS give one; write a shorter one`;
}

function diverges(value: string, wanted: string): number {
  const held = [...value];
  const other = [...wanted];
  let index = 0;
  while (index < held.length && held[index] === other[index]) index += 1;
  return index;
}

function points(value: string, index: number): string {
  const chars = [...value];
  const run = [chars[index] ?? ""];
  for (let at = index + 1; at < chars.length; at += 1) {
    if (!mark.test(chars[at] ?? "")) break;
    run.push(chars[at] ?? "");
  }
  return run.map(codepoint).join(" ");
}

function codepoint(char: string): string {
  return `U+${(char.codePointAt(0) ?? 0)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0")}`;
}

function noDomain(root: string, id: string): string | undefined {
  if (existsSync(join(root, "domains", id, "index.md"))) return undefined;
  const known = domains(root);
  return `no domain "${id}" in ${relate(root)} — run "${rooted(
    `domainbook new domain ${id}`,
    root
  )}" first${known.length === 0 ? "" : `, or name one of ${known.join(", ")}`}`;
}

function taken(path: string): string | undefined {
  if (!existsSync(path)) return undefined;
  return `${relate(
    path
  )} already exists — edit what is there, or pick another id`;
}

function domains(root: string): string[] {
  const dir = join(root, "domains");
  if (!existsSync(dir)) return [];
  return entries(dir).filter((name) => existsSync(join(dir, name, "index.md")));
}

function numbers(dir: string): number[] {
  if (!existsSync(dir)) return [];
  return entries(dir)
    .map(numberOf)
    .filter((one) => !Number.isNaN(one));
}

function fileOf(dir: string, number: number): string | undefined {
  if (!existsSync(dir)) return undefined;
  const name = entries(dir).find((one) => numberOf(one) === number);
  return name === undefined ? undefined : join(dir, name);
}

function numberOf(name: string): number {
  return Number(numbered.exec(name)?.[1] ?? Number.NaN);
}

function domainPage(id: string): string {
  return `---
id: ${quoted(id)}
name: ${quoted(titled(id))}
classification: # all three are placeholders — set them before anyone reads this
  domain: supporting-domain
  business-model: revenue-generator
  evolution: custom-built
---
${canvas.map((section) => `\n## ${section}\n`).join("")}`;
}

function featurePage(id: string): string {
  return `---
id: ${quoted(id)}
name: ${quoted(titled(id))}
status: draft
---

## Story

As a <role>
I want <capability>
So that <why it is worth building>

## Rule: <what is always true>

\`\`\`gherkin
Example: <the case this rule covers>
  Given <the starting state>
  When <what happens>
  Then <what must be true afterwards>
\`\`\`

## Open Questions
`;
}

function decisionPage(title: string): string {
  return `---
status: proposed
date: ${today()}
---

# ${title}

## Context and Problem Statement

## Considered Options

## Decision Outcome

### Consequences
`;
}
