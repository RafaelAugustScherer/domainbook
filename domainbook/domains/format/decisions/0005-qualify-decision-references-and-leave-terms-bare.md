---
status: accepted
date: 2026-07-28
decision-makers: [rafael]
---

# Qualify decision references and leave terms bare

## Context and Problem Statement

A book holds several decision logs — one at the book root and one per domain that
wants its own — and several glossaries, on the same terms. So both kinds of
reference can be ambiguous: `ADR-0001` exists in every log, and a term like
"sale" can be defined both in the book glossary and in a domain's. A single rule
for both would have to be wrong about one of them.

## Decision Drivers

- Decision numbers collide across logs by design: each log numbers from 0001, and
  renumbering to make them unique would break the "numbers are never reused"
  rule.
- Term shadowing is the opposite: in DDD a context meaning something narrower by
  a shared word is a fact worth keeping, not a collision to resolve.
- References are typed by hand, in prose and in frontmatter.

## Considered Options

- Qualify both: `<domain-id>/ADR-NNNN` and `<domain-id>/term`.
- Qualify decisions, leave terms bare and resolve them by scope.
- Qualify neither, and require globally unique numbers and term names.

## Decision Outcome

Chosen option: "Qualify decisions, leave terms bare". A decision reference names
one file, so it must be unambiguous: `ADR-NNNN` means the book-level log and
`<domain-id>/ADR-NNNN` means that domain's. A term reference is a slug with no
prefix, and resolution is own-domain-first — a domain page's reference to `sale`
means its own `sale` if it has one, otherwise the book's.

Own-domain-first resolution is Phase 1's work; this decision fixes the syntax it
resolves.

### Consequences

- Good, because every domain keeps its own numbering and nothing has to be
  renumbered when a domain is added.
- Good, because a domain that redefines a shared word gets the narrower meaning
  automatically wherever that domain is talking.
- Bad, because a bare `ADR-0007` written inside a domain's own log means the
  book-level ADR-0007, which is exactly the mistake a writer will make; the
  validator has to catch it, since both files usually exist.
- Bad, because a term reference read out of context is ambiguous to a human even
  though it resolves for the tool.
- Bad, because there is no syntax for referring to another domain's term at all;
  if that turns out to be needed, it is a new decision.

### Confirmation

The feature fixture carries both forms in one field —
`decisions: [ticketing/ADR-0001, ADR-0001]` — pointing at two different files.
