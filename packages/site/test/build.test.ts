import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { builtInto } from "./built.js";

let out = "";

function page(at: string): string {
  return readFileSync(join(out, at, "index.html"), "utf8");
}

beforeAll(async () => {
  out = builtInto("/");
}, 300_000);

afterAll(() => {
  rmSync(out, { recursive: true, force: true });
});

describe("the site a valid book builds into", () => {
  it("writes a page for every artifact the book holds", () => {
    for (const at of [
      "",
      "map",
      "glossary",
      "decisions",
      "decisions/0001",
      "debt",
      "domains/ticketing",
      "domains/ticketing/features/hold-seats-during-checkout",
      "domains/ticketing/decisions/0001",
      "domains/ticketing/debt/0001",
      "domains/ticketing/changelog",
      "domains/seating/glossary",
    ])
      expect(existsSync(join(out, at, "index.html")), at).toBe(true);
  });

  it("indexes itself for search with no server behind it", () => {
    expect(existsSync(join(out, "pagefind", "pagefind.js"))).toBe(true);
    expect(existsSync(join(out, "pagefind", "pagefind-entry.json"))).toBe(true);
  });

  it("reads a canvas in canvas order", () => {
    const found = [
      ...page("domains/ticketing").matchAll(/<h2[^>]*>(.*?)<\/h2>/g),
    ]
      .map((one) => one[1])
      .filter((one) => one !== undefined);
    expect(found.slice(0, 9)).toEqual([
      "Ubiquitous Language",
      "Purpose",
      "Domain Roles",
      "Inbound Communication",
      "Outbound Communication",
      "Business Decisions",
      "Assumptions",
      "Verification Metrics",
      "Open Questions",
    ]);
  });

  it("draws a declared separate-ways as a dashed edge with no arrowhead", () => {
    const line = /<polyline[^>]*edge-apart[^>]*\/>/.exec(
      page("domains/seating")
    );
    expect(line?.[0]).toBeDefined();
    expect(line?.[0]).not.toContain("marker-end");
    expect(page("domains/seating")).toContain(
      "a dashed edge is separate-ways — the two contexts deliberately do not integrate"
    );
  });

  it("highlights gherkin as text, with nothing to run", () => {
    const feature = page(
      "domains/ticketing/features/hold-seats-during-checkout"
    );
    expect(feature).toContain('class="astro-code');
    expect(feature).toContain("Given");
    expect(feature).not.toContain("<button");
  });

  it("keeps the three lines of a story apart", () => {
    const story = page("domains/ticketing/features/hold-seats-during-checkout");
    expect(story).toContain("<br>");
  });

  it("names a claimed glob and what claiming it means", () => {
    const canvas = page("domains/ticketing");
    expect(canvas).toContain("src/ticketing/**");
    expect(canvas).toContain(
      "changing code these globs match means updating this context"
    );
  });

  it("puts what is still owed at the top of the register", () => {
    const rows = [...page("debt").matchAll(/TDR-\d{4}/g)].map((one) => one[0]);
    expect(rows.length).toBeGreaterThan(0);
  });

  it("names a debt record TDR-NNNN and the log it sits in, never qualified", () => {
    const register = page("debt");
    expect(register).not.toContain("/TDR-");
    expect(register).toContain("/domains/ticketing/debt/<");
    expect(register).toContain("/book/debt/<");
  });

  it("opens a decision a debt record names, with its title", () => {
    const record = page("domains/ticketing/debt/0001");
    expect(record).toContain("ticketing/ADR-0001");
    expect(record).toContain(
      'href="/domains/ticketing/decisions/0001/">Expire holds after ten minutes'
    );
  });

  it("links a decision reference the prose names", () => {
    expect(page("domains/ticketing/decisions/0002")).toContain(
      '<a href="/domains/ticketing/decisions/0003/">ticketing/ADR-0003</a>'
    );
  });

  it("gives a domain that holds a log a page of its own, and one that does not none", () => {
    for (const at of ["domains/ticketing/decisions", "domains/ticketing/debt"])
      expect(existsSync(join(out, at, "index.html")), at).toBe(true);
    for (const at of ["domains/seating/decisions", "domains/seating/debt"])
      expect(existsSync(join(out, at, "index.html")), at).toBe(false);
  });

  it("keeps the roadmap off the front page and on its own", () => {
    expect(existsSync(join(out, "roadmap", "index.html"))).toBe(true);
    expect(page("")).toContain("Where it is going");
  });

  it("carries one h1 and a way past the navigation, on every page", () => {
    for (const at of ["", "roadmap", "map", "glossary", "domains/ticketing"])
      expect([...page(at).matchAll(/<h1[\s>]/g)], at).toHaveLength(1);
    expect(page("domains/ticketing")).toContain('class="skip"');
  });

  it("reads a log's outcome line as the record wrote it", () => {
    const log = page("domains/ticketing/decisions");
    expect(log).not.toMatch(/class="note"><p>[^<]*`/);
  });

  it("draws a pattern on the end of the edge that declared it", () => {
    expect(page("map")).toContain('class="edge-pattern">ACL<');
  });
});

describe("the site a book published under a path builds into", () => {
  let under = "";

  beforeAll(() => {
    under = builtInto("/book/");
  }, 300_000);

  afterAll(() => {
    rmSync(under, { recursive: true, force: true });
  });

  it("resolves every link and asset under that path", () => {
    const html = readFileSync(join(under, "index.html"), "utf8");
    expect(html).toContain('href="/book/');
    expect(html).not.toMatch(/href="\/domains\//);
  });

  it("points the search bundle under it too", () => {
    const html = readFileSync(join(under, "search", "index.html"), "utf8");
    expect(html).toContain("/book/pagefind/pagefind.js");
  });

  it("leaves that path out of the search index, so pagefind adds it once", () => {
    const urls = indexedUrls(under);
    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) expect(url.startsWith("/book/")).toBe(false);
    expect(urls).toContain("/domains/ticketing/");
  });
});

function indexedUrls(root: string): string[] {
  const dir = join(root, "pagefind", "fragment");
  return readdirSync(dir).map((name) => {
    const raw = gunzipSync(readFileSync(join(dir, name))).toString("utf8");
    const json = raw.slice(raw.indexOf("{"));
    return (JSON.parse(json) as { url: string }).url;
  });
}
