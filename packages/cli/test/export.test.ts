import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { enter, failed, leave, ran } from "./repo.js";

function at(path: string): string {
  return join(process.cwd(), path);
}

describe("domainbook export", () => {
  beforeEach(enter);
  afterEach(leave);

  it("refuses an unknown target with the ones that exist", () => {
    const [line] = failed("export", "xml");
    expect(line).toBe(
      'no export "xml" — the targets are contextive, cml, gherkin, json, mermaid and structurizr'
    );
  });

  it("refuses when no target is named", () => {
    const [line] = failed("export");
    expect(line).toBe(
      'export what? — the targets are contextive, cml, gherkin, json, mermaid and structurizr, as in "domainbook export json"'
    );
  });

  it("refuses when there is no book", () => {
    const [line] = failed("export", "json");
    expect(line).toContain("no book here");
  });

  it("refuses a book that does not validate", () => {
    ran("init");
    const feature = "domainbook/domains/tickets/features/sell.md";
    ran("new", "domain", "tickets");
    writeFileSync(
      at(feature),
      "---\nid: sell\nname: Sell\nstatus: shipped\n---\n\n## Story\n\nAs a fan\nI want a ticket\nSo that I attend\n\n## Rule: one\n\n```gherkin\nExample: buy\n  Given a fan\n  When they pay\n  Then a ticket\n```\n\n## Open Questions\n\nNone.\n"
    );
    const [line] = failed("export", "json");
    expect(line).toContain("does not validate");
    expect(existsSync(at("domainbook/build"))).toBe(false);
  });

  it("writes under build/<target>/ with a self-ignoring gitignore", () => {
    ran("init");
    const [line] = ran("export", "json");
    expect(line).toBe("wrote domainbook/build/json/");
    expect(existsSync(at("domainbook/build/json/book.json"))).toBe(true);
    expect(readFileSync(at("domainbook/build/.gitignore"), "utf8")).toBe("*\n");
  });

  it("leaves validate counting the same book after an export", () => {
    ran("init");
    const before = ran("validate");
    ran("export", "json");
    expect(ran("validate")).toEqual(before);
  });

  it("reports an empty context map", () => {
    ran("init");
    ran("new", "domain", "solo");
    expect(ran("export", "mermaid")).toContain("1 domain, 0 relationships");
  });

  it("clears stale output on a re-run", () => {
    ran("init");
    ran("export", "json");
    const stale = at("domainbook/build/json/stale.json");
    writeFileSync(stale, "{}");
    ran("export", "json");
    expect(existsSync(stale)).toBe(false);
  });
});
