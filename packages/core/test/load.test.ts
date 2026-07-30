import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import {
  configFile,
  formatIssue,
  type Issue,
  loadBook,
  sortIssues,
  termSlug,
} from "../src/index.js";
import { validBooksDir } from "./fixtures/valid-books/manifest.js";
import { bookDir } from "./paths.js";

const roots: string[] = [];

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

function temporary(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "domainbook-"));
  roots.push(root);
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}

function messages(root: string): string[] {
  return sortIssues(loadBook(root).issues).map((issue) => issue.message);
}

const milestones = `---
id: boxoffice
milestones:
  - { id: phase-0, name: Start, status: done }
---

# Roadmap

Prose.
`;

const madr = `---
status: accepted
date: 2026-04-02
---

# Expire holds

## Context and Problem Statement

Why.

## Considered Options

- One.

## Decision Outcome

Chosen.

### Consequences

- Good.
`;

const tdr = `---
status: open
date: 2026-04-27
severity: low
quadrant: deliberate-prudent
---

# Holds are swept by hand

## Debt

Nothing expires a hold.

## Impact

Seats sit unsellable overnight.

## Remedy

Sweep on a timer.
`;

const loaded = loadBook(bookDir);
const ticketing = loaded.book.domains.find(
  (domain) => domain.id === "ticketing"
);

describe("loadBook over the golden fixture book", () => {
  it("reads the tree with no issues", () => {
    expect(sortIssues(loaded.issues).map(formatIssue)).toEqual([]);
  });

  it("names every file relative to the working directory", () => {
    expect(ticketing?.file).toBe(
      "packages/core/test/fixtures/book/domains/ticketing/index.md"
    );
    expect(loaded.book.root).toBe("packages/core/test/fixtures/book");
  });

  it("holds one record per artifact", () => {
    expect(loaded.book.domains.map((domain) => domain.id)).toEqual([
      "access-control",
      "seating",
      "ticketing",
    ]);
    expect(loaded.book.decisions.map((one) => one.number)).toEqual([1]);
    expect(ticketing?.decisions.map((one) => one.number)).toEqual([1, 2, 3]);
    expect(loaded.book.debt.map((one) => one.number)).toEqual([1, 2]);
    expect(ticketing?.debt.map((one) => one.number)).toEqual([1, 2]);
    expect(ticketing?.features.map((one) => one.frontmatter.id)).toEqual([
      "hold-seats-during-checkout",
    ]);
    expect(loaded.book.roadmap?.frontmatter.id).toBe("boxoffice");
    expect(loaded.book.glossary?.terms).toHaveLength(3);
    expect(ticketing?.changelog?.changelog.releases).toHaveLength(3);
  });

  it("takes a decision's title from its H1", () => {
    expect(ticketing?.decisions.map((one) => one.title)).toEqual([
      "Expire holds after ten minutes",
      "Reject a capture that lands after the hold expired",
      "Refund a late capture in full",
    ]);
  });

  it("takes a debt record's title from its H1", () => {
    expect(ticketing?.debt.map((one) => one.title)).toEqual([
      "Hold expiry is checked only when a hold is read",
      "Late-capture refunds are reconciled by hand each morning",
    ]);
  });

  it("reads the config file", () => {
    expect(loaded.book.config.enforcement.require_reason).toBe("agents");
  });

  it("gives a book with no config file the same config as an empty one", () => {
    const bare = loadBook(join(validBooksDir, "mirrored-relationship"));
    expect(bare.book.config).toEqual(loaded.book.config);
  });

  it("maps every frontmatter field to the line it sits on", () => {
    expect(ticketing?.lines["id"]).toBe(2);
    expect(ticketing?.lines["classification.evolution"]).toBe(7);
    expect(ticketing?.lines["relationships[1].direction"]).toBe(18);
    expect(loaded.book.roadmap?.lines["milestones[2].id"]).toBe(6);
  });
});

describe("loadBook on a path that is not a book", () => {
  it("says there is no book and how to make one", () => {
    const missing = loadBook(join(bookDir, "nowhere"));
    expect(missing.issues.map(formatIssue)).toEqual([
      'packages/core/test/fixtures/book/nowhere: no book here — run "domainbook init packages/core/test/fixtures/book/nowhere" to write one',
    ]);
  });

  it("says a book root is a folder when handed a file", () => {
    const file = loadBook(join(bookDir, "roadmap.md"));
    expect(file.issues.map(formatIssue)).toEqual([
      "packages/core/test/fixtures/book/roadmap.md: a book root is a folder, and this path is a file",
    ]);
  });
});

describe("loadBook on a tree the filesystem refuses", () => {
  it("keeps the unknown-file issue when domains is a regular file", () => {
    const root = temporary({ "roadmap.md": milestones, domains: "not here\n" });
    expect(messages(root)).toEqual([
      `the format does not know this file — a book root holds roadmap.md, glossary.md, changelog.md, ${configFile}, decisions/*.md, debt/*.md, and domains/`,
    ]);
  });

  it("keeps the unknown-folder issue when glossary.md is a folder", () => {
    const root = temporary({ "roadmap.md": milestones });
    mkdirSync(join(root, "glossary.md"));
    expect(messages(root)).toEqual([
      `the format does not know this folder — a book root holds roadmap.md, glossary.md, changelog.md, ${configFile}, decisions/*.md, debt/*.md, and domains/`,
    ]);
  });

  it("names a file it has no permission to read", () => {
    const root = temporary({
      "roadmap.md": milestones,
      "decisions/0001-expire-holds.md": madr,
    });
    const path = join(root, "decisions/0001-expire-holds.md");
    chmodSync(path, 0o000);
    try {
      expect(messages(root)).toEqual([
        "this file could not be read — EACCES: permission denied; make it readable and run again",
      ]);
    } finally {
      chmodSync(path, 0o644);
    }
  });

  it("names a book root above the working directory relative to it", () => {
    const root = temporary({ "roadmap.md": milestones });
    const loaded = loadBook(root);
    expect(loaded.book.root).toBe(relative(process.cwd(), root));
    expect(loaded.book.root.startsWith("..")).toBe(true);
  });

  it("names a book root that is the working directory itself", () => {
    expect(loadBook(".").book.root).toBe(".");
  });
});

describe("loadBook over a decision log", () => {
  it("reports a misnamed file's own issues as well as its name", () => {
    const root = temporary({
      "roadmap.md": milestones,
      "decisions/1-expire-holds.md":
        "---\nstatus: agreed\ndate: yesterday\n---\n\nNo title.\n",
    });
    const reported = messages(root);
    expect(reported).toContain(
      'decision numbers are four digits — rename to "0001-expire-holds.md"'
    );
    expect(reported).toContain("must be a date as YYYY-MM-DD");
    expect(
      reported.some((message) => message.startsWith("a decision opens with"))
    ).toBe(true);
  });

  it("gives every misnamed file a free number of its own", () => {
    const root = temporary({
      "roadmap.md": milestones,
      "decisions/0001-expire-holds.md": madr,
      "decisions/notes.md": madr,
      "decisions/scratch.md": madr,
    });
    expect(messages(root)).toEqual([
      'decision filenames start with a four-digit number — rename to "0002-expire-holds.md"',
      'decision filenames start with a four-digit number — rename to "0003-expire-holds.md"',
    ]);
  });

  it("suggests a filename that is itself valid", () => {
    const root = temporary({
      "roadmap.md": milestones,
      "decisions/001-Expire Holds.md": madr,
    });
    expect(messages(root)).toEqual([
      'decision numbers are four digits — rename to "0001-expire-holds.md"',
    ]);
  });

  it("suggests the title's own script in the filename it asks for", () => {
    const root = temporary({
      "roadmap.md": milestones,
      "decisions/notes.md": madr.replace(
        "# Expire holds",
        "# 座席表を保存する"
      ),
    });
    expect(messages(root)).toEqual([
      'decision filenames start with a four-digit number — rename to "0001-座席表を保存する.md"',
    ]);
  });

  it("says a title in letters and digits when the title gives no slug", () => {
    const root = temporary({
      "roadmap.md": milestones,
      "decisions/notes.md": madr.replace("# Expire holds", "# ???"),
    });
    expect(messages(root)).toEqual([
      'decision filenames are a four-digit number and a title in letters and digits — "???" has none, so rename to "0001-your-title-here.md"',
    ]);
  });

  it("keeps a decision file named in another script", () => {
    const root = temporary({
      "roadmap.md": milestones,
      "decisions/0001-座席表を保存する.md": madr.replace(
        "# Expire holds",
        "# 座席表を保存する"
      ),
    });
    expect(messages(root)).toEqual([]);
  });

  it("counts every .md in the log, not only the ones that validated", () => {
    const root = temporary({
      "roadmap.md": milestones,
      "decisions/0001-expire-holds.md": madr.replace(
        "date: 2026-04-02",
        "date: nope"
      ),
      "decisions/notes.md": madr,
    });
    expect(loadBook(root).book.decisionFiles.map((one) => one.number)).toEqual([
      1,
    ]);
  });
});

describe("loadBook over a debt log", () => {
  it("calls the artifact a debt record in the name it asks for", () => {
    const root = temporary({ "roadmap.md": milestones, "debt/notes.md": tdr });
    expect(messages(root)).toEqual([
      'debt record filenames start with a four-digit number — rename to "0001-holds-are-swept-by-hand.md"',
    ]);
  });

  it("names the keys a debt record needs when it carries none", () => {
    const root = temporary({
      "roadmap.md": milestones,
      "debt/0001-holds-are-swept-by-hand.md": tdr.split("---\n").at(-1) ?? "",
    });
    expect(messages(root)).toEqual([
      'no frontmatter — a debt record needs "status", "date", "severity", and "quadrant" in a --- block at the top of the file',
    ]);
  });

  it("counts every .md in the debt log, not only the ones that validated", () => {
    const root = temporary({
      "roadmap.md": milestones,
      "debt/0001-holds-are-swept-by-hand.md": tdr.replace(
        "severity: low",
        "severity: enormous"
      ),
      "debt/0002-door-scanners.md": tdr,
    });
    const book = loadBook(root).book;
    expect(book.debtFiles.map((one) => one.number)).toEqual([1, 2]);
    expect(book.debt.map((one) => one.number)).toEqual([2]);
  });
});

describe("loadBook over a domain whose index.md fails", () => {
  const root = temporary({
    "roadmap.md": milestones,
    "domains/ticketing/index.md":
      "---\nid: ticketing\nownerz: [rsh]\n---\n\n## Purpose\n",
    "domains/ticketing/glossary.md": "## Hold\n\nA claim on seats.\n",
  });
  const loaded = loadBook(root);

  it("keeps the domain, its id, and everything under it", () => {
    expect(loaded.book.domains.map((domain) => domain.id)).toEqual([
      "ticketing",
    ]);
    expect(loaded.book.domains[0]?.frontmatter).toBeUndefined();
    expect(
      loaded.book.domains[0]?.glossary?.terms.map((one) => one.slug)
    ).toEqual(["hold"]);
  });

  it("still reports what the page got wrong", () => {
    expect(messages(root)).toContain(
      "is not a field of a domain page — check the spelling, or remove it"
    );
  });
});

describe("issue formatting", () => {
  it("writes file, line, field, and message", () => {
    expect(
      formatIssue({
        file: "domainbook/domains/mcp/index.md",
        line: 14,
        field: "relationships[0].with",
        message: 'no domain "formt" in this book',
      })
    ).toBe(
      'domainbook/domains/mcp/index.md:14 relationships[0].with: no domain "formt" in this book'
    );
  });

  it("leaves out a line and a field it does not have", () => {
    expect(formatIssue({ file: "domainbook", message: "no book here" })).toBe(
      "domainbook: no book here"
    );
  });

  it("sorts by file, then line, then field", () => {
    const issues: Issue[] = [
      { file: "b.md", line: 1, message: "second file" },
      { file: "a.md", line: 9, field: "id", message: "later line" },
      { file: "a.md", message: "no line at all" },
      { file: "a.md", line: 9, field: "date", message: "same line" },
      { file: "a.md", line: 2, field: "status", message: "earlier line" },
    ];
    expect(sortIssues(issues).map((issue) => issue.message)).toEqual([
      "no line at all",
      "earlier line",
      "same line",
      "later line",
      "second file",
    ]);
  });

  it("leaves the array it was given alone", () => {
    const issues: Issue[] = [
      { file: "b.md", message: "b" },
      { file: "a.md", message: "a" },
    ];
    sortIssues(issues);
    expect(issues.map((issue) => issue.file)).toEqual(["b.md", "a.md"]);
  });
});

const grammar =
  /^[\p{Ll}\p{Lo}\p{Lm}\p{Nd}][\p{Ll}\p{Lo}\p{Lm}\p{M}\p{Nd}]*(?:-[\p{Ll}\p{Lo}\p{Lm}\p{Nd}][\p{Ll}\p{Lo}\p{Lm}\p{M}\p{Nd}]*)*$/u;

const slugged: Array<[string, string]> = [
  ["Seat Map", "seat-map"],
  ["ISTANBUL", "istanbul"],
  ["Stay on TypeScript 6", "stay-on-typescript-6"],
  [
    "Read frontmatter with yaml, not gray-matter",
    "read-frontmatter-with-yaml-not-gray-matter",
  ],
  [
    "Keep `separate-ways` without a CML production",
    "keep-separate-ways-without-a-cml-production",
  ],
  ["  — Seat Map!  ", "seat-map"],
  ["Seat 🎟 Map", "seat-map"],
  ["́Seat map", "seat-map"],
  ["Café Order", "café-order"],
  ["Café Order".normalize("NFD"), "café-order"],
  ["Naïve résumé", "naïve-résumé"],
  ["Größe", "größe"],
  ["Emissão de bilhete", "emissão-de-bilhete"],
  ["注文履行", "注文履行"],
  ["コーヒー豆", "コーヒー豆"],
  ["座席表を保存する", "座席表を保存する"],
  ["طلب القهوة", "طلب-القهوة"],
  ["कॉफ़ी ऑर्डर", "कॉफ़ी-ऑर्डर"],
  ["İstanbul", "i̇stanbul"],
];

describe("termSlug", () => {
  it.each(slugged)("slugs %j as %j", (name, slug) => {
    expect(termSlug(name)).toBe(slug);
  });

  it("gives every name a slug the schema's grammar accepts", () => {
    expect(
      slugged
        .map(([name]) => termSlug(name))
        .filter((one) => !grammar.test(one))
    ).toEqual([]);
  });

  it("gives every name a slug that is already NFC", () => {
    expect(
      slugged
        .map(([name]) => termSlug(name))
        .filter((one) => one !== one.normalize("NFC"))
    ).toEqual([]);
  });

  it("gives no slug to a name with no letter or digit in it", () => {
    expect(termSlug("???")).toBe("");
    expect(termSlug("…")).toBe("");
    expect(termSlug("🎟")).toBe("");
  });

  it("leaves a dotted capital I as its own slug, not the one it looks like", () => {
    expect(termSlug("İstanbul")).not.toBe("istanbul");
  });
});

describe("the config file name", () => {
  it("is the one the book format fixes", () => {
    expect(configFile).toBe("domainbook.config.yaml");
  });
});
