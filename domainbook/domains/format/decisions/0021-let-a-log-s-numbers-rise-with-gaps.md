---
status: accepted
date: 2026-09-13
decision-makers: [RafaelAugustScherer]
---

# Let a log's numbers rise with gaps

## Context and Problem Statement

`format/ADR-0015` requires a log's numbers to run from 0001 with no gaps, and
records the cost: two people writing at once both take the next number, and one
renumbers before merge. `ADR-0015` at the book root now reserves a number on the
remote before it is committed. A reservation never followed by a merge — a
branch abandoned, a decision withdrawn — leaves a number nobody will ever use,
because a number is never reused. Under the no-gaps rule, every abandoned claim
would fail every clone's `validate` forever.

The question is which of the two rules gives way: never reused, or no gaps.

## Decision Drivers

- A number is an identity. Reusing one makes an old reference point at a new
  record, silently.
- A gap is what an abandoned decision looks like, and an honest log shows it.
- `new decision --supersedes`, the site's chains, and the MCP index read a log by
  number, not by position; none needs the sequence dense.
- Imported MADR logs already carry gaps, an import cost `format/ADR-0015` records
  and this rule removes.

## Considered Options

- Keep no gaps, and let `sync` release an abandoned claim so its number is taken
  again.
- Keep never reused, and let numbers rise with gaps.
- Keep both, and fill a gap with a placeholder record at merge.

## Decision Outcome

Chosen option: "Keep never reused, and let numbers rise with gaps". This record
supersedes `format/ADR-0015` and keeps two of its three rules as they were:

- A decision opens with its title as an H1, above
  `## Context and Problem Statement`.
- `### Consequences` is required, as an H3 under Decision Outcome.
- A log's numbers are unique and rising. The first may be 0001 or anything after
  it; a missing number is not an issue. A number used twice in one log is still
  one message naming both files. The rule applies to both logs the machinery
  serves, decisions and debt (`core/ADR-0007`, `format/ADR-0017`).

`new` still takes the next number after the highest it knows, so a log written
by one person on one branch stays dense as before.

### Consequences

- Good, because an abandoned claim costs nothing but a number.
- Good, because a MADR log imported with gaps validates as it is.
- Good, because the reference grammar, the site's chains, and the MCP index do
  not change at all — none reads a log as a dense sequence.
- Bad, because a deleted record is no longer caught by the log itself. A
  reference to it still fails to resolve, so what is lost is the message that
  named the missing number rather than the dead reference.
- Bad, because the length of a log is even less a count of its decisions than
  before, which `format/ADR-0015` already accepted for rejected records.

### Confirmation

The `decision-number-gap` broken fixture becomes a passing book with 0001 and
0003. The reuse fixture keeps reporting one message. `domainbook validate` on
this repo's book passes with a gap in a log, once one exists.
