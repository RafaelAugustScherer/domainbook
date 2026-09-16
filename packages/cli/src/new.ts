import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  canvas,
  divergence,
  logDirOf,
  overlong,
  parseFrontmatter,
  publishDraft,
  slug,
  slugBytes,
  takeNumber,
  takeSlug,
  termSlug,
  whoAmI,
  type Holder,
  type Me,
  type Remote,
} from "@domainbook/core";
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
import {
  detachedLine,
  named,
  remoteOf,
  unclaimed,
  whoOn,
  writtenBy,
} from "./remote.js";
import { refuse, type Result } from "./result.js";

const numbered = /^(\d+)-.*\.md$/;
const statusLine = /^status:.*$/m;

type Kind = { dir: "decisions" | "debt"; one: string; finish: string };

const decisionKind: Kind = {
  dir: "decisions",
  one: "decision",
  finish: "fill in the sections",
};

const debtKind: Kind = {
  dir: "debt",
  one: "debt record",
  finish: "set the severity and the quadrant, fill in the sections",
};

type Draft = { remote: Remote; me: Me };

type Held = { said: string[]; draft: Draft | undefined };

export function newDomain(root: string, id: string): Result {
  const dir = join(root, "domains", id);
  const page = join(dir, "index.md");
  const glossary = join(dir, "glossary.md");
  const changelog = join(dir, "changelog.md");
  const context = `the ${id} context`;
  const wrong =
    noBook(root) ??
    notSlug(id, "domain id") ??
    unwritable(id, "domain id") ??
    taken(page) ??
    taken(glossary) ??
    taken(changelog);
  if (wrong !== undefined) return refuse(wrong);
  const held = hold(root, `domains/${id}/index.md`, `domains/${id}`, id);
  if (typeof held === "string") return refuse(held);
  const failed =
    write(page, domainPage(id)) ??
    write(glossary, glossaryPage(`${titled(id)} glossary`, context)) ??
    write(changelog, changelogPage(context)) ??
    write(join(dir, "features", ".gitkeep"), "") ??
    write(join(dir, "decisions", ".gitkeep"), "") ??
    write(join(dir, "debt", ".gitkeep"), "");
  if (failed !== undefined) return refuse(failed);
  return {
    code: 0,
    lines: [
      `wrote ${relate(
        dir
      )}/ — index.md, glossary.md, changelog.md, features/, decisions/ and debt/`,
      ...held.said,
      ...published(held.draft, root),
      `next: set the three classification axes, fill in the eight canvas sections, and replace the placeholder term in glossary.md, then "${rooted(
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
  const inside = `domains/${domain}/features/${id}`;
  const held = hold(root, `${inside}.md`, inside, id);
  if (typeof held === "string") return refuse(held);
  const failed = write(path, featurePage(id));
  if (failed !== undefined) return refuse(failed);
  return {
    code: 0,
    lines: [
      `wrote ${relate(path)}`,
      ...held.said,
      ...published(held.draft, root),
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
  const sited = site(root, title, domain, decisionKind);
  if (typeof sited === "string") return refuse(sited);
  const old = supersedes === undefined ? undefined : oldOf(sited, supersedes);
  if (typeof old === "string") return refuse(old);
  const placed = number(sited);
  if (typeof placed === "string") return refuse(placed);
  return wrote(
    placed,
    decisionPage(title),
    old === undefined ? undefined : superseding(old, domain, placed.next)
  );
}

export function newDebt(
  root: string,
  title: string,
  domain: string | undefined
): Result {
  const sited = site(root, title, domain, debtKind);
  if (typeof sited === "string") return refuse(sited);
  const placed = number(sited);
  if (typeof placed === "string") return refuse(placed);
  return wrote(placed, debtPage(title), undefined);
}

type Sited = {
  root: string;
  dir: string;
  logDir: string;
  name: string;
  used: number[];
  title: string;
  kind: Kind;
  after: string;
};

type Placed = Sited & {
  next: number;
  path: string;
  said: string[];
  draft: Draft | undefined;
};

type Also = { file: string; text: string; line: string };

type Old = { file: string; head: string; body: string };

function hold(
  root: string,
  path: string,
  key: string,
  id: string
): Held | string {
  const remote = remoteOf(root);
  if (remote === undefined) return { said: [], draft: undefined };
  const me = whoAmI(remote);
  const taken = takeSlug(remote, me, path, key, titled(id));
  if (taken.kind === "held") return heldBy(root, remote, path, id, taken.by[0]);
  if (taken.kind === "taken")
    return heldBy(
      root,
      remote,
      path,
      id,
      taken.by === undefined
        ? undefined
        : { kind: "claim", email: taken.by.email, branch: taken.by.branch ?? "" }
    );
  if (taken.kind === "pending")
    return { said: [unclaimed(id, remote, root)], draft: undefined };
  return { said: [], draft: { remote, me } };
}

function heldBy(
  root: string,
  remote: Remote,
  path: string,
  id: string,
  holder: Holder | undefined
): string {
  if (holder === undefined)
    return `${id} is already claimed on ${remote.name} by a peer — pick another id, or run "${rooted(
      "domainbook status",
      root
    )}" to see who is writing it`;
  if (holder.kind === "default")
    return `${id} already exists on ${holder.branch} — pull before writing it`;
  return writtenBy(
    id,
    path,
    whoOn(holder.email, holder.branch),
    "pick another id or continue on that branch",
    root
  );
}

function site(
  root: string,
  title: string,
  domain: string | undefined,
  kind: Kind
): Sited | string {
  const wrong =
    noBook(root) ??
    (domain === undefined
      ? undefined
      : notSlug(domain, "domain id") ??
        unwritable(domain, "domain id") ??
        noDomain(root, domain)) ??
    notNfc(title, `${kind.one} title`) ??
    notNfkc(title, `${kind.one} title`);
  if (wrong !== undefined) return wrong;
  const name = termSlug(title);
  if (name === "")
    return `"${title}" gives no filename — a ${kind.one} filename is a four-digit number and the title in letters and digits, and this title has none; write one that has some`;
  const bytes = overlong(name);
  if (bytes !== undefined)
    return `"${title}" gives the filename slug "${name}", which is ${bytes} bytes as UTF-8 — a slug holds at most ${slugBytes} bytes, so that "NNNN-<slug>.md" fits the 255 bytes ext4 and APFS give a filename; write a shorter title`;
  const logDir = logDirOf(domain, kind.dir);
  return {
    root,
    dir: join(root, logDir),
    logDir,
    name,
    used: numbers(join(root, logDir)),
    title,
    kind,
    after: `next: ${kind.finish}, then "${rooted(
      "domainbook validate",
      root
    )}"`,
  };
}

function number(sited: Sited): Placed | string {
  const { root, logDir, name, used, title, kind } = sited;
  const remote = remoteOf(root);
  if (remote === undefined)
    return placed(sited, used.length === 0 ? 1 : Math.max(...used) + 1, [], undefined);
  const me = whoAmI(remote);
  const pathFor = (one: number): string => `${logDir}/${pad(one)}-${name}.md`;
  const taken = takeNumber(remote, me, logDir, pathFor, title);
  if (taken.kind === "lost")
    return `could not claim a ${kind.one} number on ${remote.name} in ${
      taken.tries
    } tries — a peer is claiming faster than this clone can fetch; run "${rooted(
      "domainbook sync",
      root
    )}" and try again`;
  if (taken.kind === "pending")
    return placed(
      sited,
      taken.number,
      [unclaimed(named(pathFor(taken.number)), remote, root)],
      undefined
    );
  return placed(sited, taken.number, [], { remote, me });
}

function placed(
  sited: Sited,
  next: number,
  said: string[],
  draft: Draft | undefined
): Placed {
  return {
    ...sited,
    next,
    path: join(sited.dir, `${pad(next)}-${sited.name}.md`),
    said,
    draft,
  };
}

function wrote(placed: Placed, page: string, also: Also | undefined): Result {
  const failed =
    write(placed.path, page) ??
    (also === undefined ? undefined : write(also.file, also.text));
  if (failed !== undefined) return refuse(failed);
  return {
    code: 0,
    lines: [
      `wrote ${relate(placed.path)}`,
      ...(also === undefined ? [] : [also.line]),
      ...placed.said,
      ...published(placed.draft, placed.root),
      placed.after,
    ],
  };
}

function published(draft: Draft | undefined, root: string): string[] {
  if (draft === undefined) return [];
  const pushed = publishDraft(draft.remote, draft.me);
  return pushed.kind === "detached" ? [detachedLine(root)] : [];
}

function oldOf(sited: Sited, supersedes: string): Old | string {
  const { root, dir, used } = sited;
  if (!/^\d+$/.test(supersedes))
    return `"--supersedes ${supersedes}" is not a decision number — pass the number of the decision this one replaces, as in "--supersedes 3"`;
  const file = fileOf(dir, Number(supersedes));
  if (file === undefined)
    return `no ADR-${pad(Number(supersedes))} in ${relate(dir)}/ — ${holds(
      used
    )}`;
  const source = readFileSync(file, "utf8");
  let body;
  try {
    body = parseFrontmatter(source).body;
  } catch {
    return `${relate(
      file
    )} has frontmatter that does not parse as YAML — run "${rooted(
      "domainbook validate",
      root
    )}" to see what is wrong, fix it, then write the new decision again`;
  }
  const head = source.slice(0, source.length - body.length);
  if (!statusLine.test(head))
    return `${relate(
      file
    )} has no "status:" line to change — add "status: superseded by ADR-NNNN" to its frontmatter, naming the new decision's number, then write the new decision without --supersedes`;
  return { file, head, body };
}

function superseding(
  old: Old,
  domain: string | undefined,
  next: number
): Also {
  const log = domain === undefined ? "" : `${domain}/`;
  const status = `superseded by ${log}ADR-${pad(next)}`;
  return {
    file: old.file,
    text: old.head.replace(statusLine, `status: ${status}`) + old.body,
    line: `${relate(old.file)} is now "${status}"`,
  };
}

function holds(used: number[]): string {
  if (used.length === 0)
    return "that log holds no decisions yet, so there is nothing to supersede";
  const names = used.map((one) => `ADR-${pad(one)}`).join(", ");
  return `it holds ${names}`;
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
  const wrong = divergence(value, "NFC");
  if (wrong === undefined) return undefined;
  return `the ${what} "${value}" is not in Unicode NFC — at character ${
    wrong.index + 1
  } it holds ${wrong.held} where NFC holds ${wrong.wanted}; write "${
    wrong.normalized
  }" instead, or this and the same text written elsewhere will not match`;
}

function notNfkc(value: string, what: string): string | undefined {
  const wrong = divergence(value, "NFKC");
  if (wrong === undefined) return undefined;
  return `the ${what} "${value}" folds to "${
    wrong.normalized
  }" under NFKC — character ${wrong.index + 1} is ${
    wrong.held
  }, a compatibility form; write "${
    wrong.normalized
  }" instead, or this and the ${what} it looks like are two different names`;
}

function tooLong(value: string, what: string): string | undefined {
  const bytes = overlong(value);
  if (bytes === undefined) return undefined;
  return `the ${what} "${value}" is ${bytes} bytes as UTF-8 — a ${what} holds at most ${slugBytes} bytes, so the filenames it forms fit the 255 bytes ext4 and APFS give one; write a shorter one`;
}

function noDomain(root: string, id: string): string | undefined {
  if (existsSync(join(root, "domains", id, "index.md"))) return undefined;
  const known = domains(root);
  const others =
    known.length === 0 ? "" : `, or name one of ${known.join(", ")}`;
  return `no domain "${id}" in ${relate(root)} — run "${rooted(
    `domainbook new domain ${id}`,
    root
  )}" first${others}`;
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
  const sections = canvas.map((section) => `\n## ${section}\n`).join("");
  return `---
id: ${quoted(id)}
name: ${quoted(titled(id))}
classification: # all three are placeholders — set them before anyone reads this
  domain: supporting-domain
  business-model: revenue-generator
  evolution: custom-built
---
${sections}`;
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

export function glossaryPage(heading: string, scope: string): string {
  return `# ${heading}

The words ${scope} uses, defined once and then used the same way
wherever they appear. A term is an H2 heading with its definition below it; it
may also carry an **Aliases:** bullet, a **Status:** bullet reading draft,
validated or deprecated, and one **Example:** bullet per case worth showing.

## <Term>

<Replace the heading with the word, and this line with what the word means
in ${scope} — a sentence or two, in the business's own language.>

- **Aliases:** <other names for the same thing — separate them with commas>
- **Status:** draft
- **Example:** <a concrete case the word covers>
`;
}

export function changelogPage(scope: string): string {
  return `# Changelog

What changed in ${scope}, newest release first, in the
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format: one H2 per
release, written "## [1.2.0] - 2026-06-30" with " [YANKED]" appended if the
release was pulled, holding Added, Changed, Deprecated, Removed, Fixed or
Security as H3s, each of them a bullet list.

## [Unreleased]
`;
}

function debtPage(title: string): string {
  return `---
status: open
date: ${today()}
severity: medium # severity and quadrant are placeholders — set them before anyone reads this
quadrant: deliberate-prudent
---

# ${title}

## Debt

## Impact

## Remedy
`;
}
