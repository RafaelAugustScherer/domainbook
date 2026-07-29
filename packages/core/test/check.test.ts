import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  type Book,
  checkBook,
  configSchema,
  type DecisionRecord,
  type DomainRecord,
  formatIssue,
  sortIssues,
  validateBook,
} from "../src/index.js";
import {
  brokenBooks,
  brokenBooksDir,
} from "./fixtures/broken-books/manifest.js";
import { validBooks, validBooksDir } from "./fixtures/valid-books/manifest.js";
import { bookDir } from "./paths.js";

const ownBook = fileURLToPath(new URL("../../../domainbook/", import.meta.url));

function reported(root: string): string[] {
  return sortIssues(validateBook(root).issues).map(formatIssue);
}

function assembled(parts: Partial<Book>): Book {
  return {
    root: "book",
    config: configSchema.parse({}),
    decisions: [],
    decisionFiles: [],
    domains: [],
    ...parts,
  };
}

function recorded(number: number, title: string): DecisionRecord {
  return {
    file: `book/decisions/${String(number).padStart(4, "0")}-${title}.md`,
    number,
    title: "",
    frontmatter: { status: "accepted", date: "2026-04-02" },
    lines: {},
  };
}

function related(
  id: string,
  ...relationships: Array<[string, string]>
): DomainRecord {
  return {
    id,
    file: `book/domains/${id}/index.md`,
    frontmatter: {
      id,
      name: id,
      classification: {
        domain: "core-domain",
        "business-model": "revenue-generator",
        evolution: "custom-built",
      },
      relationships: relationships.map(([one, type]) => ({
        with: one,
        type: type as "partnership" | "shared-kernel" | "separate-ways",
      })),
    },
    lines: {},
    features: [],
    decisions: [],
    decisionFiles: [],
  };
}

function checked(book: Book): string[] {
  return sortIssues(checkBook(book)).map((issue) => issue.message);
}

describe("every broken book", () => {
  it.each(brokenBooks)("$dir fails $rule and nothing else", (broken) => {
    const root = join(brokenBooksDir, broken.dir);
    expect(
      sortIssues(validateBook(root).issues).map((issue) =>
        formatIssue({ ...issue, file: relative(root, resolve(issue.file)) })
      )
    ).toEqual([broken.expect]);
  });

  it("covers every rule the catalogue names", () => {
    expect([...new Set(brokenBooks.map((broken) => broken.rule))]).toEqual([
      "L2",
      "L3",
      "L4",
      "L5",
      "L6",
      "L7",
      "S1",
      "B1",
      "B2",
      "B3",
      "B4",
      "B5",
      "B6",
      "B7",
      "B8",
      "R1",
      "R2",
      "R3",
      "R4",
      "R5",
      "R6",
      "R7",
      "C1",
      "C2",
      "C3",
      "C4",
      "C5",
      "C6",
      "C7",
    ]);
  });
});

describe("every whole book", () => {
  it.each(validBooks)("$dir loads clean, and $proves", (valid) => {
    expect(reported(join(validBooksDir, valid.dir))).toEqual([]);
  });

  it("the golden fixture book has no issues", () => {
    expect(reported(bookDir)).toEqual([]);
  });

  it("this repo's own book has no issues", () => {
    expect(reported(ownBook)).toEqual([]);
  });
});

describe("decision numbering over every file in the log", () => {
  it("claims no gap for a number whose file failed its schema", () => {
    expect(
      checked(
        assembled({
          decisions: [recorded(2, "keep-the-clock")],
          decisionFiles: [
            { file: "book/decisions/0001-expire-holds.md", number: 1 },
            { file: "book/decisions/0002-keep-the-clock.md", number: 2 },
          ],
        })
      )
    ).toEqual([]);
  });

  it("catches a repeated number when one of the two failed its schema", () => {
    expect(
      checked(
        assembled({
          decisions: [recorded(1, "expire-holds")],
          decisionFiles: [
            { file: "book/decisions/0001-expire-holds.md", number: 1 },
            { file: "book/decisions/0001-keep-the-clock.md", number: 1 },
          ],
        })
      )
    ).toEqual([
      "ADR-0001 is already decisions/0001-expire-holds.md — decision numbers are never reused; renumber this one to 0002",
    ]);
  });

  it("renumbers onto a number no file in the log has taken", () => {
    expect(
      checked(
        assembled({
          decisionFiles: [
            { file: "book/decisions/0001-expire-holds.md", number: 1 },
            { file: "book/decisions/0002-keep-the-clock.md", number: 2 },
            { file: "book/decisions/0001-refund-a-late-capture.md", number: 1 },
          ],
        })
      )
    ).toEqual([
      "ADR-0001 is already decisions/0001-expire-holds.md — decision numbers are never reused; renumber this one to 0003",
    ]);
  });

  it("rejects a log numbered from 0000", () => {
    expect(
      checked(
        assembled({
          decisionFiles: [
            { file: "book/decisions/0000-expire-holds.md", number: 0 },
            { file: "book/decisions/0001-keep-the-clock.md", number: 1 },
          ],
        })
      )
    ).toEqual([
      "ADR-0000 is below 0001 — decision numbers run from 0001, so renumber this one to 0002",
    ]);
  });

  it("names a title that gives no filename", () => {
    const record = recorded(1, "seat-map");
    expect(
      checked(
        assembled({
          decisions: [{ ...record, title: "座席表を保存する" }],
          decisionFiles: [{ file: record.file, number: 1 }],
        })
      )
    ).toEqual([
      'the title "座席表を保存する" gives no filename — a decision filename is its number and its title in lowercase letters and digits, so rename to "0001-your-title-here.md"',
    ]);
  });
});

describe("a relationship declared more than twice", () => {
  it("names the page that declares it twice, not the mirror", () => {
    expect(
      checked(
        assembled({
          domains: [
            related("aaa", ["bbb", "partnership"]),
            related("bbb", ["aaa", "partnership"], ["aaa", "shared-kernel"]),
          ],
        })
      )
    ).toEqual([
      '"aaa" is declared twice on this page — a relationship is declared once',
    ]);
  });

  it("compares every pair of pages that declare it", () => {
    expect(
      checked(
        assembled({
          domains: [
            related("aaa", ["bbb", "partnership"]),
            related("bbb", ["aaa", "partnership"]),
            related("ccc"),
          ],
        })
      )
    ).toEqual([]);
  });
});

describe("reference resolution", () => {
  const { book } = validateBook(bookDir);
  const ticketing = book.domains.find((domain) => domain.id === "ticketing");
  const feature = ticketing?.features[0];

  it("resolves a shadowed term to the domain's own glossary", () => {
    expect(feature?.frontmatter.terms).toContain("event");
    expect(ticketing?.glossary?.terms.map((term) => term.slug)).toContain(
      "event"
    );
    expect(book.glossary?.terms.map((term) => term.slug)).toContain("event");
  });

  it("falls back to the book glossary for a term the domain does not define", () => {
    expect(feature?.frontmatter.terms).toContain("fan");
    expect(ticketing?.glossary?.terms.map((term) => term.slug)).not.toContain(
      "fan"
    );
    expect(book.glossary?.terms.map((term) => term.slug)).toContain("fan");
  });

  it("keeps a qualified and a bare decision reference in one field", () => {
    expect(feature?.frontmatter.decisions).toEqual([
      "ticketing/ADR-0001",
      "ADR-0001",
    ]);
    expect(ticketing?.decisions.map((one) => one.number)).toContain(1);
    expect(book.decisions.map((one) => one.number)).toContain(1);
  });

  it("reads a domain-qualified supersede chain", () => {
    const superseded = ticketing?.decisions.find((one) => one.number === 2);
    expect(superseded?.frontmatter.status).toBe(
      "superseded by ticketing/ADR-0003"
    );
  });
});
