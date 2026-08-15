import {
  AstBuilder,
  GherkinClassicTokenMatcher,
  Parser,
} from "@cucumber/gherkin";
import { IdGenerator } from "@cucumber/messages";
import { describe, expect, it } from "vitest";
import { parse as parseYaml } from "yaml";
import type { ExportFile } from "../src/index.js";
import { exportBook, loadBook, type Model, modelSchema } from "../src/index.js";
import { bookDir } from "./paths.js";

const { book } = loadBook(bookDir);

function content(files: ExportFile[], path: string): string {
  const file = files.find((one) => one.path === path);
  if (file === undefined)
    throw new Error(
      `no ${path} among ${files.map((one) => one.path).join(", ")}`
    );
  return file.content;
}

type ContextiveContext = {
  name: string;
  paths?: string[];
  terms: Array<{
    name: string;
    definition: string;
    aliases?: string[];
    examples?: string[];
  }>;
};

type ContextiveFile = { contexts: ContextiveContext[] };

function onlyContext(doc: ContextiveFile): ContextiveContext {
  const [context] = doc.contexts;
  if (context === undefined) throw new Error("no context in the glossary file");
  return context;
}

describe("export mermaid", () => {
  const { files, notices } = exportBook(book, "mermaid");
  const mmd = content(files, "context-map.mmd");

  it("writes one context-map.mmd", () => {
    expect(files.map((one) => one.path)).toEqual(["context-map.mmd"]);
  });

  it("opens a flowchart with a node per domain", () => {
    expect(mmd).toContain("flowchart LR");
    expect(mmd).toContain('["Access control"]');
    expect(mmd).toContain('["Seating"]');
    expect(mmd).toContain('["Ticketing"]');
  });

  it("draws the separate-ways edge dashed", () => {
    expect(mmd).toContain('-.-|"separate-ways"|');
  });

  it("carries none of the site's navigation links", () => {
    expect(mmd).not.toContain("click ");
  });

  it("counts the map", () => {
    expect(notices).toEqual(["3 domains, 3 relationships"]);
  });
});

describe("export cml", () => {
  const { files, notices } = exportBook(book, "cml");
  const cml = content(files, "context-map.cml");

  it("declares a bounded context per domain and contains each", () => {
    expect(cml).toContain("BoundedContext accessControl");
    expect(cml).toContain("BoundedContext seating");
    expect(cml).toContain("BoundedContext ticketing");
    expect(cml).toContain("\tcontains ticketing");
  });

  it("writes each upstream-downstream edge with its patterns", () => {
    expect(cml).toContain("ticketing [D,ACL]<-[U] seating");
    expect(cml).toContain("accessControl [D]<-[U,OHS,PL] ticketing");
  });

  it("skips the separate-ways edge and names it", () => {
    expect(cml.split("\n").filter((line) => line.includes("<-"))).toHaveLength(
      2
    );
    expect(notices).toContain(
      "skipped 1 separate-ways relationship Context Mapper has no production for: access-control — seating"
    );
  });
});

describe("export structurizr", () => {
  const { files, notices } = exportBook(book, "structurizr");
  const dsl = content(files, "context-map.dsl");

  it("wraps a workspace, model and a system landscape view", () => {
    expect(dsl).toContain("workspace {");
    expect(dsl).toContain("model {");
    expect(dsl).toContain('systemLandscape "landscape" {');
    expect(dsl).toContain("include *");
  });

  it("gives a hyphenated context a hyphen-free identifier and its own name", () => {
    expect(dsl).toContain('accessControl = softwareSystem "Access control"');
    expect(dsl).toContain('ticketing = softwareSystem "Ticketing"');
  });

  it("writes each relationship from downstream to upstream", () => {
    expect(dsl).toContain("accessControl -> ticketing");
    expect(dsl).toContain("ticketing -> seating");
    expect(
      dsl.split("\n").filter((line) => line.includes(" -> "))
    ).toHaveLength(2);
  });

  it("skips the separate-ways edge and names it", () => {
    expect(notices).toContain(
      "skipped 1 separate-ways relationship Structurizr has no non-directional edge for: access-control — seating"
    );
  });
});

describe("export contextive", () => {
  const { files, notices } = exportBook(book, "contextive");

  it("writes a glossary file per glossary", () => {
    const paths = files.map((one) => one.path);
    expect(paths).toContain("shared.glossary.yml");
    expect(paths).toContain("ticketing.glossary.yml");
    expect(paths).toContain("seating.glossary.yml");
  });

  it("scopes a domain context to its code and carries aliases and examples", () => {
    const doc = parseYaml(
      content(files, "ticketing.glossary.yml")
    ) as ContextiveFile;
    const context = onlyContext(doc);
    expect(context.name).toBe("Ticketing");
    expect(context.paths).toEqual(["src/ticketing/**"]);
    const hold = context.terms.find((term) => term.name === "Hold");
    expect(hold?.aliases).toEqual(["reservation", "lock"]);
    expect(hold?.examples?.length).toBe(2);
  });

  it("gives the book-level context no path scope", () => {
    const doc = parseYaml(
      content(files, "shared.glossary.yml")
    ) as ContextiveFile;
    expect(onlyContext(doc).paths).toBeUndefined();
  });

  it("leaves out deprecated terms and says how many", () => {
    const doc = parseYaml(
      content(files, "seating.glossary.yml")
    ) as ContextiveFile;
    const names = onlyContext(doc).terms.map((term) => term.name);
    expect(names).not.toContain("Blocked seat");
    expect(notices).toContain("left out 1 deprecated term");
  });
});

describe("export gherkin", () => {
  const { files } = exportBook(book, "gherkin");

  it("writes one feature file per feature, under its domain", () => {
    expect(files.map((one) => one.path)).toContain(
      "ticketing/hold-seats-during-checkout.feature"
    );
  });

  it("produces files that parse under the pinned parser", () => {
    for (const file of files) {
      const parser = new Parser(
        new AstBuilder(IdGenerator.incrementing()),
        new GherkinClassicTokenMatcher()
      );
      const document = parser.parse(file.content);
      const children = (document.feature?.children ?? []).flatMap((child) =>
        child.rule === undefined ? [child] : child.rule.children
      );
      expect(children.some((child) => child.scenario !== undefined)).toBe(true);
    }
  });

  it("carries the feature name, its rules and its story", () => {
    const feature = content(
      files,
      "ticketing/hold-seats-during-checkout.feature"
    );
    expect(feature).toContain("Feature: Hold seats during checkout");
    expect(feature).toContain(
      "Rule: A hold expires ten minutes after it is placed"
    );
    expect(feature).toContain("As a fan buying tickets");
  });
});

describe("export json", () => {
  const { files } = exportBook(book, "json");
  const model = JSON.parse(content(files, "book.json")) as Model;

  it("writes one book.json holding every artifact type", () => {
    expect(files.map((one) => one.path)).toEqual(["book.json"]);
    expect(Object.keys(model)).toEqual([
      "root",
      "roadmap",
      "glossary",
      "changelog",
      "decisions",
      "debt",
      "domains",
    ]);
  });

  it("validates against the model schema", () => {
    expect(modelSchema.safeParse(model).success).toBe(true);
  });

  it("resolves a feature's decision references to entries in the document", () => {
    const ticketing = model.domains.find((one) => one.id === "ticketing");
    const feature = ticketing?.features[0];
    const refs = [
      ...model.decisions,
      ...model.domains.flatMap((one) => one.decisions),
    ].map((one) => one.ref);
    for (const reference of feature?.decisions ?? [])
      expect(refs).toContain(reference);
  });
});
