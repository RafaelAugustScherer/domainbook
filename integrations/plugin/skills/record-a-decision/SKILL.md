---
name: record-a-decision
description: Decide whether a choice earns a decision record, and write it if it does. Use before writing an ADR, when unsure whether a choice belongs in the decision log, or when changing course on a decision already recorded.
---

# Record a decision

Apply the bar before the record exists, so the log holds decisions with a cost and
not a diary of the work. Most choices do not earn a record; this decides, then
writes the ones that do.

## 1. Apply the bar — most choices are turned away

- **A user can observe it** → it is behaviour. Write no decision; name the feature
  whose scenarios it belongs in. What `validate` prints or `new` writes is
  behaviour, not a decision.
- **A refactor can undo it** → internal structure is its own record. Write no
  decision; the code is the record.
- **It is about how the work is done** → working practice. Write no decision; it
  belongs in `CONTRIBUTING.md`.
- **Reversing it would cost something** — a dependency, a package boundary, a
  format commitment, an enforcement rule, a published contract → it earns a
  record. Name what reversing it would cost.

## 2. Name the options that were actually weighed

A record needs the alternatives that were on the table — at least two. If only one
was considered, ask what else was; never write a Considered Options section with a
single entry, and never invent a third to fill it.

## 3. Ask who weighed it before writing the frontmatter

Ask whether the people you are about to name in `decision-makers` actually weighed
this choice:

- Nobody weighed it → set `authored-by: agent`; `decision-makers` still names who
  is accountable.
- They asked for the work and you chose within it → no `authored-by` key.
- You asked and got no answer → take the reading that claims less: `authored-by:
  agent`, and say you assumed nobody weighed it.

## 4. Write it, and change course without editing

Write with `domainbook new decision "<title>" [--domain <id>]`. An accepted record
is immutable: to change course, run it again with `--supersedes <n>` rather than
editing the old one's Decision Outcome. A record retired for failing the bar
(it turned out to be working practice) has its `status` set to `deprecated`, the
dated act written in the changelog, and the choice itself moved to
`CONTRIBUTING.md` rather than lost.

## 5. Put it in the log that owns the choice

A choice inside one context is that context's record (`domains/<id>/decisions/`);
a choice that spans contexts is the book's (`decisions/` at the root). Let the CLI
qualify supersede references — bare in the book's log, `<domain>/ADR-NNNN` inside
a context's.
