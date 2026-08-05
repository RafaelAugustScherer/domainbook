import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { formatIssue, loadBook, sortIssues } from "@domainbook/core";
import { afterAll, describe, expect, it } from "vitest";
import { bookEntry } from "../src/entries/book.js";
import { domainEntries } from "../src/entries/domain.js";
import { under } from "../src/issues.js";
import { linked, resolver } from "../src/refs.js";
import { oneAtATime } from "../src/watch.js";

const bookDir = fileURLToPath(
  new URL("../../core/test/fixtures/book/", import.meta.url)
);

const roots: string[] = [];

afterAll(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

const asIs = async (markdown: string): Promise<string> => markdown;

const roadmap =
  "---\nid: venue\nmilestones:\n  - id: one\n    name: One\n    status: in-progress\n---\n\n# Roadmap\n";

const canvas = [
  "---",
  "id: ticketing",
  "name: Ticketing",
  "classification:",
  "  domain: core-domain",
  "  business-model: revenue-generator",
  "---",
  "",
  "# Ticketing",
  "",
  "## Purpose",
  "",
  "Hold seats until a fan pays.",
  "",
].join("\n");

function temporary(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), "domainbook-site-"));
  roots.push(root);
  for (const [at, held] of Object.entries(files)) {
    mkdirSync(dirname(join(root, at)), { recursive: true });
    writeFileSync(join(root, at), held);
  }
  return root;
}

describe("what a reference in prose turns into", () => {
  const { book } = loadBook(bookDir);
  const resolve = resolver(book, "/");

  it("opens a domain's own log from a qualified reference", () => {
    expect(linked("<p>see ticketing/ADR-0001 for it</p>", resolve)).toBe(
      '<p>see <a href="/domains/ticketing/decisions/0001/">ticketing/ADR-0001</a> for it</p>'
    );
  });

  it("opens the book's log from a bare one", () => {
    expect(linked("<p>ADR-0001</p>", resolve)).toBe(
      '<p><a href="/decisions/0001/">ADR-0001</a></p>'
    );
  });

  it("carries the published path the site is mounted under", () => {
    expect(linked("<p>ADR-0001</p>", resolver(book, "/book/"))).toContain(
      'href="/book/decisions/0001/"'
    );
  });

  it("leaves a reference no decision carries alone", () => {
    expect(linked("<p>ADR-9999</p>", resolve)).toBe("<p>ADR-9999</p>");
  });

  it("leaves a highlighted code block alone", () => {
    const fenced = '<pre class="astro-code"><span>ADR-0001</span></pre>';
    expect(linked(fenced, resolve)).toBe(fenced);
  });

  it("does not put a link inside a link", () => {
    const already = '<a href="/decisions/0001/">ADR-0001</a>';
    expect(linked(already, resolve)).toBe(already);
  });
});

describe("what a domain whose canvas does not read still gives a page", () => {
  const root = temporary({
    "roadmap.md": roadmap,
    "domains/ticketing/index.md": canvas,
  });
  const loaded = loadBook(root);

  it("says what validate says, word for word", async () => {
    const [entry] = await domainEntries(loaded.book, loaded, asIs);
    const said = sortIssues(loaded.issues).map((one) => formatIssue(one));
    expect(entry?.id).toBe("ticketing");
    expect(entry?.data["issues"]).toEqual(said);
    expect(said.join("\n")).toContain("classification.evolution");
  });

  it("keeps the sections that still read", async () => {
    const [entry] = await domainEntries(loaded.book, loaded, asIs);
    const sections = entry?.data["sections"] as { heading: string }[];
    expect(sections.map((one) => one.heading)).toContain("Purpose");
    expect(entry?.data["frontmatter"]).toBeUndefined();
  });

  it("leaves the overview with a context it can still name", async () => {
    const entry = await bookEntry(loaded.book, loaded, asIs);
    const [context] = entry.data["contexts"] as Record<string, unknown>[];
    expect(context?.["name"]).toBe("ticketing");
    expect(context?.["classification"]).toBeUndefined();
    expect(context?.["issues"]).toBeGreaterThan(0);
  });

  it("attributes an issue to the folder it is in and no other", () => {
    expect(under(loaded.issues, "nowhere")).toEqual([]);
  });
});

describe("what the front page is handed", () => {
  it("names the milestone in progress rather than the whole roadmap", async () => {
    const loaded = loadBook(bookDir);
    const entry = await bookEntry(loaded.book, loaded, asIs);
    const now = entry.data["now"] as { status: string } | undefined;
    const totals = entry.data["totals"] as Record<string, unknown>;
    expect(now?.status).toBe("in-progress");
    expect(totals["roadmap"]).toBe(true);
  });
});

describe("what happens when the book changes faster than it can be reread", () => {
  it("never runs two rereads at once, and runs one more for what came in late", async () => {
    let running = 0;
    let most = 0;
    let done = 0;
    let release: (() => void) | undefined;
    const queued = oneAtATime(async () => {
      running += 1;
      most = Math.max(most, running);
      await new Promise<void>((settle) => {
        release = settle;
      });
      running -= 1;
      done += 1;
    });
    queued();
    queued();
    queued();
    release?.();
    await new Promise((settle) => setTimeout(settle, 0));
    release?.();
    await new Promise((settle) => setTimeout(settle, 0));
    expect(most).toBe(1);
    expect(done).toBe(2);
  });

  it("keeps going after one of them throws", async () => {
    let runs = 0;
    const queued = oneAtATime(async () => {
      runs += 1;
      throw new Error("pagefind went away");
    });
    queued();
    await new Promise((settle) => setTimeout(settle, 0));
    queued();
    await new Promise((settle) => setTimeout(settle, 0));
    expect(runs).toBe(2);
  });
});
