import { describe, expect, it } from "vitest";
import {
  type Book,
  type Change,
  checkChange,
  configSchema,
  type DebtRecord,
  type DomainRecord,
} from "../src/index.js";

function claiming(id: string, ...code: string[]): DomainRecord {
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
      ...(code.length === 0 ? {} : { code }),
    },
    lines: {},
    features: [],
    decisions: [],
    decisionFiles: [],
    debt: [],
    debtFiles: [],
  };
}

function owed(
  number: number,
  status: "open" | "accepted" | "repaid",
  code: string[],
  id?: string
): DebtRecord {
  const log = id === undefined ? "book/debt" : `book/domains/${id}/debt`;
  return {
    file: `${log}/${String(number).padStart(4, "0")}-swept-by-hand.md`,
    number,
    title: "Swept by hand",
    domain: id,
    frontmatter: {
      status,
      date: "2026-04-27",
      severity: "low",
      quadrant: "deliberate-prudent",
      code,
    },
    lines: {},
  };
}

function book(domains: DomainRecord[], debt: DebtRecord[] = []): Book {
  return {
    root: "book",
    config: configSchema.parse({}),
    decisions: [],
    decisionFiles: [],
    debt: debt.filter((one) => one.domain === undefined),
    debtFiles: [],
    domains: domains.map((domain) => ({
      ...domain,
      debt: debt.filter((one) => one.domain === domain.id),
    })),
  };
}

function changed(one: Book, ...paths: string[]): Change {
  return checkChange(one, "book", paths);
}

const two = [
  claiming("ticketing", "src/ticketing/**"),
  claiming("billing", "src/billing/**"),
];

describe("what a change leaves stale", () => {
  it("names the domain whose code changed and whose book did not", () => {
    const found = changed(book(two), "src/ticketing/hold.ts");
    expect(found.checked).toEqual(["ticketing"]);
    expect(found.stale).toEqual([
      { id: "ticketing", paths: ["src/ticketing/hold.ts"] },
    ]);
  });

  it("takes any file under the domain's folder as the book being written", () => {
    const found = changed(
      book(two),
      "src/ticketing/hold.ts",
      "book/domains/ticketing/features/place-a-hold.md"
    );
    expect(found.stale).toEqual([]);
    expect(found.checked).toEqual(["ticketing"]);
  });

  it("leaves a path no domain claims out of the reckoning entirely", () => {
    const found = changed(book(two), "README.md", "scripts/release.sh");
    expect(found.checked).toEqual([]);
    expect(found.stale).toEqual([]);
  });

  it("never blocks for a domain that declares no code", () => {
    const found = changed(
      book([claiming("reporting")]),
      "src/reporting/export.ts"
    );
    expect(found.checked).toEqual([]);
    expect(found.stale).toEqual([]);
  });

  it("treats the book itself as documentation rather than code", () => {
    const found = changed(
      book([claiming("ticketing", "**/*.md")]),
      "book/domains/ticketing/index.md"
    );
    expect(found.checked).toEqual([]);
  });

  it("blocks on the second domain when only the first book was written", () => {
    const found = changed(
      book(two),
      "src/ticketing/hold.ts",
      "src/billing/refund.ts",
      "book/domains/ticketing/changelog.md"
    );
    expect(found.stale).toEqual([
      { id: "billing", paths: ["src/billing/refund.ts"] },
    ]);
  });

  it("clears every domain at once for a decision at the book root", () => {
    const found = changed(
      book(two),
      "src/ticketing/hold.ts",
      "src/billing/refund.ts",
      "book/decisions/0014-charge-on-capture.md"
    );
    expect(found.stale).toEqual([]);
    expect(found.checked).toEqual(["ticketing", "billing"]);
  });

  it("clears every domain at once for a changelog entry at the book root", () => {
    const found = changed(
      book(two),
      "src/ticketing/hold.ts",
      "src/billing/refund.ts",
      "book/changelog.md"
    );
    expect(found.stale).toEqual([]);
  });

  it("does not read another root artifact as a cross-cutting record", () => {
    const found = changed(
      book(two),
      "src/ticketing/hold.ts",
      "src/billing/refund.ts",
      "book/glossary.md"
    );
    expect(found.stale.map((one) => one.id)).toEqual(["ticketing", "billing"]);
  });

  it("asks both books when two domains claim the same path", () => {
    const found = changed(
      book([
        claiming("ticketing", "src/checkout/**"),
        claiming("billing", "src/checkout/**"),
      ]),
      "src/checkout/total.ts",
      "book/domains/billing/changelog.md"
    );
    expect(found.stale).toEqual([
      { id: "ticketing", paths: ["src/checkout/total.ts"] },
    ]);
  });

  it("sorts and de-duplicates the paths it names", () => {
    const found = changed(
      book(two),
      "src/ticketing/row.ts",
      "src/ticketing/hold.ts",
      "src/ticketing/hold.ts",
      "src/ticketing/expiry.ts"
    );
    expect(found.stale[0]?.paths).toEqual([
      "src/ticketing/expiry.ts",
      "src/ticketing/hold.ts",
      "src/ticketing/row.ts",
    ]);
  });
});

describe("the debt a change walks into", () => {
  it("names open debt over a changed path, and nothing else", () => {
    const found = changed(
      book(two, [
        owed(1, "repaid", ["src/ticketing/**"], "ticketing"),
        owed(2, "open", ["src/ticketing/**"], "ticketing"),
        owed(3, "accepted", ["src/ticketing/**"], "ticketing"),
      ]),
      "src/ticketing/hold.ts",
      "book/domains/ticketing/changelog.md"
    );
    expect(found.stale).toEqual([]);
    expect(found.debt).toEqual([
      {
        ref: "TDR-0002",
        file: "book/domains/ticketing/debt/0002-swept-by-hand.md",
        paths: ["src/ticketing/hold.ts"],
      },
    ]);
  });

  it("tells two records that share a number apart by the file, not the reference", () => {
    const found = changed(
      book(two, [
        owed(1, "open", ["src/ticketing/**"], "ticketing"),
        owed(1, "open", ["src/ticketing/**"]),
      ]),
      "src/ticketing/hold.ts"
    );
    expect(found.debt.map((one) => one.ref)).toEqual(["TDR-0001", "TDR-0001"]);
    expect(found.debt.map((one) => one.file)).toEqual([
      "book/debt/0001-swept-by-hand.md",
      "book/domains/ticketing/debt/0001-swept-by-hand.md",
    ]);
  });

  it("writes a record at the book root without a domain in front of it", () => {
    const found = changed(
      book(two, [owed(7, "open", ["src/billing/**"])]),
      "src/billing/refund.ts"
    );
    expect(found.debt.map((one) => one.ref)).toEqual(["TDR-0007"]);
  });

  it("says nothing about debt over a path the change did not touch", () => {
    const found = changed(
      book(two, [owed(2, "open", ["src/billing/**"], "billing")]),
      "src/ticketing/hold.ts"
    );
    expect(found.debt).toEqual([]);
  });
});
