import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  type Book,
  checkBook,
  configSchema,
  type DebtRecord,
  type DecisionRecord,
  type DomainRecord,
  formatIssue,
  type GlossaryRecord,
  sortIssues,
  termSlug,
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
    debt: [],
    debtFiles: [],
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

function owed(number: number, title: string, id?: string): DebtRecord {
  const log = id === undefined ? "book/debt" : `book/domains/${id}/debt`;
  return {
    file: `${log}/${String(number).padStart(4, "0")}-${termSlug(title)}.md`,
    number,
    title,
    frontmatter: {
      status: "open",
      date: "2026-04-27",
      severity: "low",
      quadrant: "deliberate-prudent",
    },
    lines: {},
  };
}

function globbed(pattern: string, id?: string): DebtRecord {
  const record = owed(1, "Holds are swept by hand", id);
  return {
    ...record,
    frontmatter: { ...record.frontmatter, code: [pattern] },
  };
}

function globbedPage(pattern: string): DomainRecord {
  const domain = related("ticketing");
  return {
    ...domain,
    frontmatter: { ...domain.frontmatter!, code: [pattern] },
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
    debt: [],
    debtFiles: [],
  };
}

function checked(book: Book): string[] {
  return sortIssues(checkBook(book)).map((issue) => issue.message);
}

function glossed(name: string): GlossaryRecord {
  return {
    file: "book/glossary.md",
    terms: [
      {
        name,
        definition: "A claim on seats.",
        status: "draft",
        slug: termSlug(name),
        line: 3,
      },
    ],
  };
}

function featured(terms: string[]): DomainRecord {
  return {
    ...related("ticketing"),
    features: [
      {
        file: "book/domains/ticketing/features/hold-seats.md",
        domain: "ticketing",
        frontmatter: {
          id: "hold-seats",
          name: "Hold seats",
          status: "draft",
          terms,
        },
        story: "",
        rules: [],
        lines: {},
      },
    ],
  };
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
      "B9",
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
      "C8",
      "C9",
      "C10",
      "C11",
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
          decisions: [{ ...record, title: "???" }],
          decisionFiles: [{ file: record.file, number: 1 }],
        })
      )
    ).toEqual([
      'the title "???" gives no filename — a decision filename is its number and its title in letters and digits, so rename to "0001-your-title-here.md"',
    ]);
  });

  it("asks for the filename the title's own script gives", () => {
    const record = recorded(1, "seat-map");
    expect(
      checked(
        assembled({
          decisions: [{ ...record, title: "座席表を保存する" }],
          decisionFiles: [{ file: record.file, number: 1 }],
        })
      )
    ).toEqual([
      'the filename does not match the title "座席表を保存する" — rename to "0001-座席表を保存する.md"',
    ]);
  });
});

describe("debt numbering over every file in the log", () => {
  it("names a gap in the debt log as a TDR", () => {
    expect(
      checked(
        assembled({
          debtFiles: [
            { file: "book/debt/0001-holds-are-swept-by-hand.md", number: 1 },
            { file: "book/debt/0003-door-scanners.md", number: 3 },
          ],
        })
      )
    ).toEqual([
      "TDR-0002 is missing from debt/ — debt record numbers run from 0001 with no gaps, and a debt record is never deleted",
    ]);
  });

  it("claims no gap for a debt number whose file failed its schema", () => {
    expect(
      checked(
        assembled({
          debt: [owed(2, "Door scanners")],
          debtFiles: [
            { file: "book/debt/0001-holds-are-swept-by-hand.md", number: 1 },
            { file: "book/debt/0002-door-scanners.md", number: 2 },
          ],
        })
      )
    ).toEqual([]);
  });

  it("asks for the filename a debt record's own title gives", () => {
    const record = owed(1, "Holds are swept by hand");
    expect(
      checked(
        assembled({
          debt: [{ ...record, title: "Holds are swept nightly" }],
          debtFiles: [{ file: record.file, number: 1 }],
        })
      )
    ).toEqual([
      'the filename does not match the title "Holds are swept nightly" — rename to "0001-holds-are-swept-nightly.md"',
    ]);
  });
});

describe("a code glob the format cannot read", () => {
  const rejected: Array<[string, string]> = [
    [
      " ",
      '" " names no path — write a path under the repo root, like "src/**"',
    ],
    [
      "src/app}/**",
      '"src/app}/**" holds a "}" that nothing opened — write "{" before it, or drop the "}"',
    ],
    [
      "src/[ab/**",
      '"src/[ab/**" leaves "[" unclosed — close the character class with "]", as in "src/[ab]*.ts"',
    ],
    [
      "src/ab]/**",
      '"src/ab]/**" holds a "]" that nothing opened — write "[" before it, or drop the "]"',
    ],
  ];

  const rewritten: Array<[string, string]> = [
    [
      "\\src\\billing\\**",
      '"\\src\\billing\\**" separates folders with "\\" — a code path uses "/", so write "src/billing/**"',
    ],
    [
      "/src//billing/**",
      '"/src//billing/**" starts at the filesystem root — a code path is relative to the repo root, so write "src/billing/**"',
    ],
    [
      "src//billing//**",
      '"src//billing//**" has an empty path segment — remove the extra "/", so write "src/billing/**"',
    ],
  ];

  const accepted = [
    "packages/*/src/**/*.ts",
    "app/\\[locale\\]/**",
    "src/\\[ab/**",
    "src/{app,web}/**",
  ];

  it.each([...rejected, ...rewritten])(
    "names what is wrong with %j",
    (pattern, message) => {
      expect(checked(assembled({ debt: [globbed(pattern)] }))).toEqual([
        message,
      ]);
    }
  );

  it("offers a pattern the check itself accepts", () => {
    for (const [pattern] of rewritten) {
      const [message = ""] = checked(assembled({ debt: [globbed(pattern)] }));
      const fixed = /so write "(.+)"$/u.exec(message)?.[1] ?? "";
      expect(checked(assembled({ debt: [globbed(fixed)] }))).toEqual([]);
    }
  });

  it.each(accepted)(
    "reads %j on a domain page and on a debt record",
    (pattern) => {
      expect(
        checked(
          assembled({
            debt: [globbed(pattern)],
            domains: [globbedPage(pattern)],
          })
        )
      ).toEqual([]);
    }
  );

  it("names a bad glob on a domain's own debt record", () => {
    expect(
      checked(
        assembled({
          domains: [
            {
              ...related("ticketing"),
              debt: [globbed("/src/**", "ticketing")],
            },
          ],
        })
      )
    ).toEqual([
      '"/src/**" starts at the filesystem root — a code path is relative to the repo root, so write "src/**"',
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

describe("a name that is not in Unicode NFC", () => {
  it("names the code points a decomposed term reference holds", () => {
    const reference = "café-order".normalize("NFD");
    expect(checked(assembled({ domains: [featured([reference])] }))).toEqual([
      `"${reference}" is not in Unicode NFC — at character 4 it holds U+0065 U+0301 where NFC holds U+00E9; write the NFC form, or this and the same text written elsewhere will not match`,
    ]);
  });

  it("names a term whose heading holds a precomposed character NFC does not keep", () => {
    const name = `कॉ${String.fromCodePoint(0x095e)}ी`;
    expect(checked(assembled({ glossary: glossed(name) }))).toEqual([
      `"${name}" is not in Unicode NFC — at character 3 it holds U+095E U+0940 where NFC holds U+092B U+093C U+0940; write the NFC form, or this and the same text written elsewhere will not match`,
    ]);
  });

  it("names a decision file whose name on disk is decomposed", () => {
    const file = "book/decisions/0001-café.md".normalize("NFD");
    expect(
      checked(
        assembled({
          decisions: [{ ...recorded(1, "café"), file, title: "Café" }],
          decisionFiles: [{ file, number: 1 }],
        })
      )
    ).toEqual([
      `"${"0001-café.md".normalize(
        "NFD"
      )}" is not in Unicode NFC — at character 9 it holds U+0065 U+0301 where NFC holds U+00E9; write the NFC form, or this and the same text written elsewhere will not match`,
    ]);
  });

  it("blames the folder, not the id, when only the folder is decomposed", () => {
    const id = "café";
    const domain = related(id);
    expect(
      checked(
        assembled({
          domains: [
            {
              ...domain,
              id: id.normalize("NFD"),
              file: `book/domains/${id.normalize("NFD")}/index.md`,
            },
          ],
        })
      )
    ).toEqual([
      `"${id.normalize(
        "NFD"
      )}" is not in Unicode NFC — at character 4 it holds U+0065 U+0301 where NFC holds U+00E9; write the NFC form, or this and the same text written elsewhere will not match`,
    ]);
  });
});

describe("a slug written in a compatibility form", () => {
  it("folds a fullwidth reference onto the slug it looks like", () => {
    expect(
      checked(assembled({ domains: [featured(["ｓｅａｔ-ｍａｐ"])] }))
    ).toEqual([
      '"ｓｅａｔ-ｍａｐ" folds to "seat-map" under NFKC — character 1 is U+FF53, a compatibility form; write the folded form, or this and the slug it looks like are two different names',
    ]);
  });

  it("folds halfwidth katakana in a term's slug onto full-width katakana", () => {
    expect(checked(assembled({ glossary: glossed("ｺｰﾋｰ豆") }))).toEqual([
      '"ｺｰﾋｰ豆" folds to "コーヒー豆" under NFKC — character 1 is U+FF7A, a compatibility form; write the folded form, or this and the slug it looks like are two different names',
    ]);
  });

  it("blames the title before the filename the title gives", () => {
    const file = "book/decisions/0001-ｓｅａｔ-ｍａｐ.md";
    expect(
      checked(
        assembled({
          decisions: [{ ...recorded(1, "x"), file, title: "ＳＥＡＴ Ｍａｐ" }],
          decisionFiles: [{ file, number: 1 }],
        })
      )
    ).toEqual([
      '"ｓｅａｔ-ｍａｐ" folds to "seat-map" under NFKC — character 1 is U+FF53, a compatibility form; write the folded form, or this and the slug it looks like are two different names',
    ]);
  });

  it("blames the filename when the title is already plain", () => {
    const file = "book/decisions/0001-ｓｅａｔ-ｍａｐ.md";
    expect(
      checked(
        assembled({
          decisions: [{ ...recorded(1, "x"), file, title: "Seat map" }],
          decisionFiles: [{ file, number: 1 }],
        })
      )
    ).toEqual([
      '"0001-ｓｅａｔ-ｍａｐ.md" folds to "0001-seat-map.md" under NFKC — character 6 is U+FF53, a compatibility form; write the folded form, or this and the slug it looks like are two different names',
    ]);
  });

  it("leaves a term whose name folds but whose slug does not", () => {
    expect(checked(assembled({ glossary: glossed("座席表 ①") }))).toEqual([]);
  });
});

describe("a slug too long for a filename", () => {
  const long = "注".repeat(83);

  it("counts a milestone id in bytes, not characters", () => {
    expect(
      checked(
        assembled({
          roadmap: {
            file: "book/roadmap.md",
            frontmatter: {
              id: "boxoffice",
              milestones: [{ id: long, name: "Start", status: "done" }],
            },
            lines: {},
          },
        })
      )
    ).toEqual([
      `"${long}" is 249 bytes as UTF-8 — a slug holds at most 247, so that "NNNN-<slug>.md" fits the 255 bytes ext4 and APFS give a filename; shorten it`,
    ]);
  });

  it("measures a term by the slug its name gives", () => {
    expect(checked(assembled({ glossary: glossed(long) }))).toEqual([
      `"${long}" is 249 bytes as UTF-8 — a slug holds at most 247, so that "NNNN-<slug>.md" fits the 255 bytes ext4 and APFS give a filename; shorten it`,
    ]);
  });

  it("asks for a shorter decision title instead of an unwritable filename", () => {
    const record = recorded(1, "seat-map");
    expect(
      checked(
        assembled({
          decisions: [{ ...record, title: long }],
          decisionFiles: [{ file: record.file, number: 1 }],
        })
      )
    ).toEqual([
      `"${long}" is 249 bytes as UTF-8 — a slug holds at most 247, so that "NNNN-<slug>.md" fits the 255 bytes ext4 and APFS give a filename; shorten it`,
    ]);
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
