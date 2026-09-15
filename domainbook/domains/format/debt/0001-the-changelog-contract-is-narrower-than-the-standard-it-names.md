---
status: open
date: 2026-07-30
severity: medium
quadrant: inadvertent-prudent
code:
  - packages/core/src/schemas/changelog.ts
  - packages/core/src/body/changelog.ts
decisions: [format/ADR-0003]
---

# The changelog contract is narrower than the standard it names

## Debt

The README and the roadmap both say the changelog artifact is the "Keep a
Changelog 1.1.0 content format". The parser and the schema cover most of it and
two parts of it not at all, and nothing says which.

**Ordering is checked by date and never by version.** `checkOrder` compares
`release.date` between neighbours and stops there, so two releases sharing a
date pass in either order. This book proves it: 0.2.1 and 0.3.0 are both dated
2026-07-30, and swapping them validates clean. Keep a Changelog's fifth guiding
principle is that the latest *version* comes first. The interesting case is a
backport — 1.9.1 shipped after 2.0.0 — where version order and date order
genuinely disagree and this format has no answer at all.

**Version links are neither required, checked, nor modelled.** Keep a Changelog's
fourth principle is that versions and sections must be linkable, and its
structure puts a link-reference block at the end of the file. `Changelog` has no
field for one. A link naming a release that does not exist passes; a release with
no link passes; and because the links are outside the model, an exporter or the
site would drop them. This book carries none.

## Impact

The ordering gap is small but live, and it is the kind that surfaces as a wrong
answer rather than as an error: a reader — or an agent asking what shipped most
recently — trusts the order of the file, and the tool that promised to check the
file did not check that.

The links gap costs more later than now. Phase 3 serves the changelog scoped by
release (`mcp/ADR-0003`) and Phase 4 renders a timeline; both read the model, and
what the model does not hold cannot be served or rendered. A book that writes
conformant link blocks today would have them silently discarded on the first
export, which is worse than having refused them.

Underneath both is a claim that outruns the code. Every other artifact in this
book records where it departs from the standard it adopts — `separate-ways` has
no Context Mapper production and says so, MADR's frontmatter is narrowed by
`format/ADR-0004`, the debt record is *derived from* rather than conformant to
Stal's template. The changelog claims conformance with no such note, so a reader
comparing the two has no way to tell deliberate narrowing from an oversight.

## Remedy

Two independent halves, and the first is cheap.

Ordering: compare versions when two releases share a date, and decide what the
format says about a backport — either that order follows the version and dates
may go backwards, or that order follows the date and a backport is expected to
sit out of version order. Either answer is defensible; the absence of one is
not. This wants a sentence in a decision before it wants code.

Links: pick one of two, and record it. Either model them — a field on the
release, resolved against the releases in the file so a link naming nothing is an
issue — or state that domainbook's changelog is a narrowing that drops them,
because a book lives beside the git history that would answer the same question.
The second is likely right for an in-repo book and costs only the sentence that
says so, in the README's table and in a format decision.

Until one of them lands, the honest fix is the smallest: stop claiming
unqualified conformance in the README and the roadmap.
