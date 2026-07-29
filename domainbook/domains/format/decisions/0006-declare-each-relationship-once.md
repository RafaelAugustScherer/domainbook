---
status: accepted
date: 2026-07-28
decision-makers: [RafaelAugustScherer]
---

# Declare each relationship once

## Context and Problem Statement

Every relationship in a context map has two ends. The book stores it as
frontmatter on a domain page, so the same relationship could be written on one
page, on both, or on a third document listing all of them. Written on both pages,
the two halves can disagree — one side claiming to be upstream while the other
claims the same.

## Decision Drivers

- The context map has to be derivable from the book, not drawn by hand.
- A relationship is usually obvious to one side and background to the other; the
  side that depends is the side that knows why.
- Nothing should have to be edited in two files to stay true.

## Considered Options

- Declare once, from either side; the map is the union of all declarations.
- Require both sides to declare, mirrored, and check that the halves agree.
- Keep relationships in a separate map document instead of on domain pages.

## Decision Outcome

Chosen option: "Declare once, from either side". Either end may hold the
declaration — whichever the writer finds natural — and the context map is the
union of every declaration in the book. A mirrored pair is legal, because
forbidding it would break books written by people who find both directions
natural, but the two halves must not contradict each other.

Checking for contradictions is Phase 1's work; this decision is what makes the
check well-defined.

### Consequences

- Good, because a relationship has one home and no synchronisation step.
- Good, because a domain page shows its dependencies where a reader looks for
  them.
- Bad, because reading a single domain page does not tell you everything about
  that domain's relationships — the other end may hold a declaration you cannot
  see from here. Only the derived map is complete.
- Bad, because until the contradiction check exists, a mirrored pair that
  disagrees validates cleanly and produces a wrong map.

### Confirmation

The fixture book declares `ticketing → seating` and `ticketing → access-control`
from ticketing, and `seating → access-control` from seating; no relationship is
written twice, and the three pages together describe the whole map.

## More Information

The vocabulary itself comes from Context Mapper. One of its values does not
export; see `format/ADR-0007`.
