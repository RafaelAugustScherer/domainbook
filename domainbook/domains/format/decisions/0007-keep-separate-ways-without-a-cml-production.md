---
status: accepted
date: 2026-07-28
decision-makers: [rafael]
---

# Keep separate-ways without a CML production

## Context and Problem Statement

The relationship vocabulary is Context Mapper's, chosen so `export cml` is a
mechanical translation. One value breaks that: `separate-ways` is standard DDD —
it is in Evans and in the DDD-Crew context mapping material — but Context
Mapper's DSL has no production for it. A book using it cannot be fully expressed
in CML.

## Decision Drivers

- "Every artifact adopts an existing standard so exports are mechanical" is a
  design principle; an export that silently drops data undermines it.
- "These two contexts deliberately do not integrate" is a real modelling
  statement, and often a hard-won one.
- Dropping the value would not remove the situation; it would only remove the
  book's word for it.

## Considered Options

- Keep `separate-ways` and accept that `export cml` is lossy for it.
- Drop `separate-ways` so the vocabulary matches CML exactly.
- Keep it and emit it as a CML comment or a custom annotation.

## Decision Outcome

Chosen option: "Keep `separate-ways` and accept a lossy CML export". The
vocabulary the book offers should be the vocabulary of the modelling practice,
not the subset one exporter happens to accept. Emitting a comment was rejected as
worse than an honest gap: a comment reads like data to a person and is invisible
to a tool.

The loss is recorded here so the exporter is written deliberately. `export cml`
must either translate a `separate-ways` edge or skip it and say so on the way
out — never drop it quietly.

### Consequences

- Good, because the book can state that two contexts are deliberately apart, and
  that statement survives in every other view.
- Good, because the exporter's gap is documented before the exporter exists,
  instead of being found by a user.
- Bad, because `export cml` is not a complete round-trip; a book with
  `separate-ways` edges and its CML are not the same model.
- Bad, because the site has to decide how to draw an edge that means "no
  integration", and drawing it at all may read as the opposite.

### Confirmation

The fixture book carries a `separate-ways` relationship, so any exporter written
against the fixtures meets the case immediately rather than in someone's repo.
