import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  adrRef,
  contextMap,
  findDecision,
  live,
  loadBook,
  opening,
  sectionNamed,
  sectionsOf,
  tdrRef,
} from "../src/index.js";
import { supersededBy } from "../src/ref.js";
import { bookDir } from "./paths.js";

const { book } = loadBook(bookDir);

describe("reading a body back off disk", () => {
  it("gives a domain page its eight canvas sections in order", () => {
    const found = sectionsOf(join(bookDir, "domains/ticketing/index.md"));
    expect(found.map((one) => one.heading)).toEqual([
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

  it("carries the prose of a section and the line it starts on", () => {
    const [purpose] = sectionsOf(join(bookDir, "domains/ticketing/index.md"));
    expect(purpose?.text).not.toBe("");
    expect(purpose?.line).toBeGreaterThan(1);
  });

  it("names a section directly", () => {
    const outcome = sectionNamed(
      join(
        bookDir,
        "domains/ticketing/decisions/0001-expire-holds-after-ten-minutes.md"
      ),
      "Decision Outcome"
    );
    expect(outcome).toContain("Chosen option");
  });

  it("gives nothing for a section that is not there", () => {
    expect(sectionNamed(join(bookDir, "roadmap.md"), "Purpose")).toBe("");
  });

  it("gives nothing for a file that is not there", () => {
    expect(sectionsOf(join(bookDir, "nowhere.md"))).toEqual([]);
  });
});

describe("the opening sentence", () => {
  it("stops at the first full stop", () => {
    expect(opening("Chosen option: a scoped index. It is small.")).toBe(
      "Chosen option: a scoped index."
    );
  });

  it("keeps a full stop inside a version number", () => {
    expect(opening("Chosen option: v1.2 wins. Nothing else.")).toBe(
      "Chosen option: v1.2 wins."
    );
  });

  it("gives the whole thing back when there is no stop", () => {
    expect(opening("Chosen option: a scoped index")).toBe(
      "Chosen option: a scoped index"
    );
  });

  it("gives nothing back for nothing", () => {
    expect(opening("")).toBe("");
  });
});

describe("naming a record", () => {
  it("qualifies a domain's decision and leaves the book's bare", () => {
    const [rooted] = book.decisions;
    const [scoped] =
      book.domains.find((one) => one.id === "ticketing")?.decisions ?? [];
    expect(rooted && adrRef(rooted)).toBe("ADR-0001");
    expect(scoped && adrRef(scoped)).toBe("ticketing/ADR-0001");
  });

  it("never qualifies debt, whichever log it sits in", () => {
    const [rooted] = book.debt;
    const [scoped] =
      book.domains.find((one) => one.id === "ticketing")?.debt ?? [];
    expect(rooted && tdrRef(rooted)).toBe("TDR-0001");
    expect(scoped && tdrRef(scoped)).toBe("TDR-0001");
    expect(rooted?.file).not.toBe(scoped?.file);
  });
});

describe("finding a decision by reference", () => {
  it("finds one in the book's own log", () => {
    expect(findDecision(book, "ADR-0001")?.number).toBe(1);
  });

  it("finds one in a domain's log", () => {
    expect(findDecision(book, "ticketing/ADR-0002")?.title).toContain(
      "capture"
    );
  });

  it("finds nothing for a number that is not there", () => {
    expect(findDecision(book, "ticketing/ADR-0099")).toBeUndefined();
  });

  it("finds nothing for a domain that is not there", () => {
    expect(findDecision(book, "billing/ADR-0001")).toBeUndefined();
  });

  it("finds nothing for something that is not a reference", () => {
    expect(findDecision(book, "ADR-1")).toBeUndefined();
    expect(findDecision(book, "hold")).toBeUndefined();
  });
});

describe("which records are live", () => {
  it("reads a supersede phrase back", () => {
    const record = findDecision(book, "ticketing/ADR-0001");
    const superseded = {
      ...record!,
      frontmatter: {
        ...record!.frontmatter,
        status: "superseded by ticketing/ADR-0003" as const,
      },
    };
    expect(supersededBy(superseded)).toBe("ticketing/ADR-0003");
    expect(live(superseded)).toBe(false);
  });

  it("counts an accepted record as live and a rejected one as not", () => {
    const record = findDecision(book, "ADR-0001")!;
    expect(live(record)).toBe(true);
    expect(
      live({
        ...record,
        frontmatter: { ...record.frontmatter, status: "rejected" },
      })
    ).toBe(false);
  });
});

describe("the context map", () => {
  it("holds every context in the book", () => {
    expect(
      contextMap(book)
        .contexts.map((one) => one.id)
        .sort()
    ).toEqual(["access-control", "seating", "ticketing"]);
  });

  it("carries each context's name and classification", () => {
    const [first] = contextMap(book).contexts;
    expect(first?.name).not.toBe("");
    expect(first?.classification.domain).toBeDefined();
  });

  it("orients an asymmetric relationship and keeps the patterns", () => {
    const edge = contextMap(book).edges.find(
      (one) => one.between.join(" ") === "seating ticketing"
    );
    expect(edge?.type).toBe("upstream-downstream");
    expect(edge?.upstream).toBe("seating");
    expect(edge?.downstream).toBe("ticketing");
    expect(edge?.patterns).toEqual([{ by: "ticketing", names: ["ACL"] }]);
  });

  it("leaves a symmetric relationship without a direction or patterns", () => {
    const edge = contextMap(book).edges.find(
      (one) => one.between.join(" ") === "access-control seating"
    );
    expect(edge?.type).toBe("separate-ways");
    expect(edge?.upstream).toBeUndefined();
    expect(edge?.patterns).toEqual([]);
  });

  it("counts a mirrored declaration once", () => {
    const mirrored = {
      ...book,
      domains: book.domains.map((one) =>
        one.id !== "seating" || one.frontmatter === undefined
          ? one
          : {
              ...one,
              frontmatter: {
                ...one.frontmatter,
                relationships: [
                  ...(one.frontmatter.relationships ?? []),
                  {
                    with: "ticketing",
                    type: "upstream-downstream" as const,
                    direction: "upstream" as const,
                  },
                ],
              },
            }
      ),
    };
    const between = contextMap(mirrored).edges.filter(
      (one) => one.between.join(" ") === "seating ticketing"
    );
    expect(between).toHaveLength(1);
    expect(between[0]?.upstream).toBe("seating");
  });

  it("narrows to one context and its neighbours", () => {
    const near = contextMap(book, "seating");
    expect(near.contexts.map((one) => one.id).sort()).toEqual([
      "access-control",
      "seating",
      "ticketing",
    ]);
    expect(near.edges.every((one) => one.between.includes("seating"))).toBe(
      true
    );
  });

  it("gives a context that touches nothing back on its own", () => {
    const alone = { ...book, domains: book.domains.slice(0, 1) };
    const map = contextMap(alone, alone.domains[0]?.id);
    expect(map.contexts).toHaveLength(1);
    expect(map.edges).toEqual([]);
  });
});
