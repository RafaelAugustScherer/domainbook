---
status: accepted
date: 2026-07-29
decision-makers: [RafaelAugustScherer]
---

# Require a title, Consequences, and contiguous decision numbers

## Context and Problem Statement

`format/ADR-0004` narrowed MADR's frontmatter and said the body stays MADR 4.0
exactly. Phase 1's checkers had to answer three things that sentence leaves
open: whether a decision must open with its title, which body sections it must
carry, and whether a log may have holes in its numbering.

All three answers ended up narrower than the standard, and narrower than
ADR-0004 claimed. A narrowing that nobody records is one a future reader has to
reconstruct from an error message.

## Decision Drivers

- A decision's title is the record's name: the filename is built from it, the
  site heads the page with it, and a reader cites it. A file with no H1 has no
  name at all, only a number.
- Consequences is the section people skip and the section the format exists for.
  A record with no cost stated is a justification, not a decision.
- An accepted ADR is immutable and never deleted (`format/ADR-0004`), so a gap
  in a log is not a matter of style — it means a file is missing, most likely
  deleted or never committed.
- `new decision --supersedes`, the site's supersede chains, and the MCP server's
  decision index all read a log as a dense sequence.

## Considered Options

- Require the H1 title and `### Consequences`, and require numbers to run from
  0001 with no gaps.
- Require both sections, and let numbers be unique and rising with gaps allowed.
- Follow MADR as published, where the body's sections are optional and the title
  is a placeholder in a template rather than a rule.

## Decision Outcome

Chosen option: "Require all three".

- A decision opens with its title as an H1, above
  `## Context and Problem Statement`. MADR 4.0 ships
  `# short title of solved problem and solution` in its template and leaves it
  at that; here it is a rule, because everything else that names a decision
  reads the title from that line.
- `### Consequences` is required, as an H3 under Decision Outcome. MADR 4.0
  marks it optional. Confirmation stays optional, as do Decision Drivers, Pros
  and Cons of the Options, and More Information.
- Decision numbers run from 0001 with no gaps, checked per log. The book-level
  log and each domain's log number separately (`format/ADR-0005`), so each is
  its own sequence and each is checked on its own.

### Consequences

- Good, because every decision in a book has a name of its own and states what
  it costs, and neither can fall off by accident.
- Good, because a decision that opens with no H1 is told exactly that and
  nothing else: with no title there is nothing for the filename to be checked
  against, so the file reports one mistake rather than two (`core/ADR-0003`).
- Good, because a missing record is caught by the log itself rather than by a
  reader following a dead reference, with one message per missing number naming
  the log it is missing from.
- Bad, because an imported MADR log fails on all three counts — gaps left by
  deleted drafts, bodies written before Consequences was anyone's habit, and
  files that carry the title only in their name. Phase 5's import has to
  renumber, which breaks every existing reference, or write placeholder records.
  This sits on top of the import cost ADR-0004 already recorded.
- Bad, because contiguity turns a likely branch collision into a certain one:
  two people writing decisions at the same time both take the next free number,
  and one of them renumbers before merge. With gaps allowed, the second could
  have kept a higher number.
- Bad, because a required section can be satisfied by an empty one. Nothing
  checks that Consequences says anything.
- Bad, because a rejected decision still holds its number, which is intended and
  still means the length of a log is not a count of the decisions in force.

### Confirmation

One broken book per rule, each expected to report exactly one message:
`decision-number-gap` holds a log with 0001 and 0003 and names the missing 0002,
`decision-consequences-missing` holds a Decision Outcome with nothing under it,
and `decision-without-title` opens straight into Context and Problem Statement.
The last of those is also what proves the filename convention stays quiet when
there is no title to compare a filename with.
