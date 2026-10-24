---
status: accepted
date: 2026-07-29
decision-makers: [RafaelAugustScherer]
---

# Reject a bare supersede reference inside a domain log

## Context and Problem Statement

`format/ADR-0005` fixed the reference syntax and, in its own Consequences, named
the mistake that syntax invites: a bare `ADR-0007` written inside a domain's own
log means the book-level ADR-0007, which is exactly what a writer will get
wrong, and both files usually exist so nothing looks broken.

Phase 1 built the validator that was supposed to catch it, which turned the
prediction into a question with an edge: a bare reference is legal syntax, and
it appears in two places — a decision's `status: superseded by …` and a
feature's `decisions:` list.

## Decision Drivers

- The mistake is silent only where the wrong file also exists and resolves. That
  is the supersede case: the writer is inside a domain log and the record they
  mean is almost always the next number in the same log.
- A feature's `decisions:` list cites decisions wherever they live, and a
  domain's feature citing a book-level decision is normal rather than a slip.
- A check that fires where the writer is usually right is a check people learn
  to work around.

## Considered Options

- Reject a bare reference only in `status: superseded by`, and only inside a
  domain's own log.
- Reject a bare reference anywhere inside a domain folder, including a feature's
  `decisions:` list.
- Accept it everywhere and resolve own-log-first, the way terms resolve
  own-domain-first.

## Decision Outcome

Chosen option: "Only in `status: superseded by`, only inside a domain log". The
message names the fix rather than the rule: write `ticketing/ADR-0002` if the
domain's own log is what was meant.

Own-log-first resolution was the tempting option, because term resolution
already works that way. It was rejected because `format/ADR-0005` draws that
line on purpose: a term is meant to shadow, so scope-based resolution is the
feature; a decision reference names exactly one file, and making the same string
mean different files depending on which folder it was typed in takes that away.

### Consequences

- Good, because the one case where the mistake is both likely and silent now
  fails, and fails with the corrected reference written out.
- Good, because features keep the mixed form: `decisions: [ticketing/ADR-0001,
  ADR-0001]` stays legal, pointing at two different files.
- Good, because the book-level log is untouched: a bare `superseded by ADR-0002`
  written there names that log and is how a book-level chain is meant to read.
  The rule is scoped, not a ban on the bare form.
- Bad, because a domain decision superseded by a book-level one cannot be
  written at all now — every bare reference in a domain log is refused,
  including the one that means what it says. If that turns out to be needed, it
  is a new decision.
- Bad, because one syntax now has two rules depending on which field it sits in,
  and a reader has to know which field they are in to know which rule applies.
- Bad, because the rule is about where the file sits: moving a decision from the
  book-level log into a domain's log turns a reference that was correct into an
  error.

### Confirmation

A broken book holds ADR-0002 in both the book-level log and a domain's, with a
domain record superseded by the bare form, and expects the message that names
both logs. The fixture book keeps both reference forms in one feature field, and
a valid book carries a book-level supersede chain written bare, so what the rule
refuses and what it deliberately still accepts each have a fixture of their own.

## More Information

The syntax itself, and why decisions are qualified while terms are not, is
`format/ADR-0005`.
