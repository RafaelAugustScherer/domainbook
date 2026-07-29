import { describe, expect, it } from "vitest";
import { changelogSchema, glossarySchema } from "../src/index.js";
import { bookDir, read } from "./fixtures.js";
import { changelogFrom, glossaryFrom } from "./transcribe.js";

const bookGlossary = glossaryFrom(read(bookDir, "glossary.md"));
const ticketingChangelog = changelogFrom(
  read(bookDir, "domains/ticketing/changelog.md")
);

describe("the glossary model", () => {
  it("holds what fixtures/book/glossary.md says", () => {
    expect(bookGlossary).toEqual({
      terms: [
        {
          name: "Event",
          definition:
            "A single performance at a single venue, starting at a single time. A run of six nights is six events.",
          aliases: ["performance"],
          status: "validated",
          examples: [
            "The Thursday and Friday shows of the same play are two events.",
          ],
        },
        {
          name: "Fan",
          definition:
            "A person who buys or holds a ticket. A fan is not required to have an account until payment.",
        },
        {
          name: "Venue",
          definition:
            "The building a fan walks into, and the seat map that describes it.",
          aliases: ["house"],
          status: "draft",
          examples: [
            "A venue with two balconies has one seat map covering all three levels.",
          ],
        },
      ],
    });
    expect(glossarySchema.safeParse(bookGlossary).error?.issues ?? []).toEqual(
      []
    );
  });

  it("defaults a term with no status line to draft", () => {
    const parsed = glossarySchema.parse(bookGlossary);
    expect(parsed.terms.map((term) => term.status)).toEqual([
      "validated",
      "draft",
      "draft",
    ]);
  });
});

describe("the changelog model", () => {
  it("holds what fixtures/book/domains/ticketing/changelog.md says", () => {
    expect(ticketingChangelog).toEqual({
      unreleased: {
        added: [
          "Queue position for fans whose hold expires on a sold-out event.",
        ],
      },
      releases: [
        {
          version: "1.2.0",
          date: "2026-06-30",
          added: [
            "Automatic refund when a payment is captured after the hold expired.",
          ],
          changed: [
            "A hold now lasts ten minutes for every event; the per-venue setting is gone.",
          ],
          removed: ["Per-venue hold duration."],
          fixed: [
            "Two fans could hold the same seat when a seat map changed mid-checkout.",
          ],
        },
        {
          version: "1.1.0",
          date: "2026-05-04",
          yanked: true,
          added: ["Per-venue hold duration."],
          security: [
            "Hold identifiers are no longer guessable from the seat number.",
          ],
        },
        {
          version: "1.0.0",
          date: "2026-04-02",
          added: [
            "Holds, payment capture, and ticket issuing for seated events.",
          ],
        },
      ],
    });
    expect(
      changelogSchema.safeParse(ticketingChangelog).error?.issues ?? []
    ).toEqual([]);
  });

  it("marks only the yanked release", () => {
    const parsed = changelogSchema.parse(ticketingChangelog);
    expect(parsed.releases.map((release) => release.yanked)).toEqual([
      false,
      true,
      false,
    ]);
  });
});
