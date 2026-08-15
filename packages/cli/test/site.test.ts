import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { run } from "../src/index.js";
import { broke } from "../src/site.js";

let home = "";
let previous = "";

const canvas = "domainbook/domains/ticketing/index.md";

beforeEach(() => {
  previous = process.cwd();
  home = realpathSync(mkdtempSync(join(tmpdir(), "domainbook-site-")));
  process.chdir(home);
});

afterEach(() => {
  process.chdir(previous);
  rmSync(home, { recursive: true, force: true });
});

function book(): void {
  expect(run(["init"]).code).toBe(0);
  expect(run(["new", "domain", "ticketing"]).code).toBe(0);
}

function breakIt(): void {
  const held = readFileSync(canvas, "utf8");
  writeFileSync(canvas, held.replace(/^ +evolution: .*$/m, ""));
}

describe("what serve brings up", () => {
  it("answers a person and an agent at once when neither is named", () => {
    book();
    expect(run(["serve"])).toEqual({
      code: 0,
      lines: [],
      serve: { root: join(home, "domainbook"), mcp: true, web: true },
    });
  });

  it("brings up the site alone when web is named", () => {
    book();
    expect(run(["serve", "web"])?.serve).toEqual({
      root: join(home, "domainbook"),
      mcp: false,
      web: true,
    });
  });

  it("speaks the protocol alone when mcp is named", () => {
    book();
    expect(run(["serve", "mcp"])?.serve).toEqual({
      root: join(home, "domainbook"),
      mcp: true,
      web: false,
    });
  });

  it("serves a book somewhere else from where it is", () => {
    expect(run(["init", "docs/book"]).code).toBe(0);
    expect(run(["serve", "web", "docs/book"])?.serve?.root).toBe(
      join(home, "docs/book")
    );
  });

  it("names init when there is no book", () => {
    const result = run(["serve"]);
    expect(result.code).toBe(1);
    expect(result.lines).toEqual([
      'domainbook: no book here — run "domainbook init domainbook" to write one',
    ]);
  });

  it("names init for a folder that is there but holds no roadmap.md", () => {
    mkdirSync(join(home, "docs/book"), { recursive: true });
    const result = run(["serve", "web", "docs/book"]);
    expect(result.code).toBe(1);
    expect(result.serve).toBeUndefined();
    expect(result.lines).toEqual([
      'docs/book: no book here — run "domainbook init docs/book" to write one',
    ]);
  });
});

describe("what a book with issues in it gets", () => {
  it("has no site, and is told which command still serves it", () => {
    book();
    breakIt();
    const result = run(["serve", "web"]);
    expect(result.code).toBe(1);
    expect(result.serve).toBeUndefined();
    expect(result.lines.at(-1)).toBe(
      'the site cannot be built from a book with issues — "domainbook serve mcp" serves it over MCP regardless'
    );
    expect(result.lines[0]).toContain("classification.evolution");
  });

  it("holds the protocol to the same answer when both were asked for", () => {
    book();
    breakIt();
    const result = run(["serve"]);
    expect(result.code).toBe(1);
    expect(result.serve).toBeUndefined();
  });

  it("still serves it over MCP alone", () => {
    book();
    breakIt();
    expect(run(["serve", "mcp"])?.serve).toEqual({
      root: join(home, "domainbook"),
      mcp: true,
      web: false,
    });
  });

  it("reports every issue the same way validate does", () => {
    book();
    breakIt();
    const serving = run(["serve", "web"]).lines.slice(0, -1);
    expect(serving).toEqual(run(["validate"]).lines);
  });
});

describe("what build refuses before it writes", () => {
  it("builds a valid book", () => {
    book();
    expect(run(["build"])).toEqual({
      code: 0,
      lines: [],
      build: join(home, "domainbook"),
    });
  });

  it("writes nothing for a book with issues in it", () => {
    book();
    breakIt();
    const result = run(["build"]);
    expect(result.code).toBe(1);
    expect(result.build).toBeUndefined();
    expect(result.lines).toEqual(run(["validate"]).lines);
  });

  it("names init when there is no book", () => {
    const result = run(["build"]);
    expect(result.code).toBe(1);
    expect(result.lines).toEqual([
      'domainbook: no book here — run "domainbook init domainbook" to write one',
    ]);
  });

  it("takes no option of its own", () => {
    book();
    const result = run(["build", "--domain", "ticketing"]);
    expect(result.code).toBe(1);
    expect(result.lines[0]).toBe(
      '"--domain" is not an option here — usage: domainbook build [root]'
    );
  });
});

describe("what the config says about where the site publishes", () => {
  it("refuses a base that does not start with a slash", () => {
    book();
    writeFileSync("domainbook/domainbook.config.yaml", "site:\n  base: docs\n");
    const result = run(["build"]);
    expect(result.code).toBe(1);
    expect(result.lines[0]).toBe(
      'domainbook/domainbook.config.yaml:2 site.base: must start with "/" — write "/domainbook/" for a site published under that path'
    );
    expect(result.build).toBeUndefined();
  });

  it("takes a base that does", () => {
    book();
    writeFileSync(
      "domainbook/domainbook.config.yaml",
      "site:\n  base: /domainbook/\n"
    );
    expect(run(["build"]).code).toBe(0);
  });
});

describe("what the CLI says when the website is not installed", () => {
  function missing(pkg: string): Error {
    return Object.assign(
      new Error(`Cannot find package '${pkg}' imported from bin.js`),
      { code: "ERR_MODULE_NOT_FOUND" }
    );
  }

  it("names the install when @domainbook/site cannot be found", () => {
    expect(broke(missing("@domainbook/site"))).toBe(
      'the website is not installed — the CLI ships without it; add @domainbook/site to this project with "npm i -D @domainbook/site" (or "-g" if you installed domainbook globally), then try again'
    );
  });

  it("keeps the wrong-place message for another missing module", () => {
    expect(broke(missing("astro"))).toContain(
      "run this from the repo domainbook is installed in"
    );
  });
});
