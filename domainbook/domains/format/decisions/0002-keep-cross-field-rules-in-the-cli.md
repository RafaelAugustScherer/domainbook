---
status: accepted
date: 2026-07-28
decision-makers: [rafael]
---

# Keep cross-field rules in the CLI

## Context and Problem Statement

Some artifact rules are about a field on its own — a status is one of four
values, a date is a date. Others are about how fields relate: a symmetric
relationship must not carry a `direction`, an upstream relationship must not
carry downstream patterns. zod expresses the second kind with `.refine()`, and
`.refine()` produces nothing in generated JSON Schema — the generator drops it
silently. Committing generated JSON Schema (`format/ADR-0001`) therefore forces a
choice about where those rules live.

## Decision Drivers

- A rule that vanishes from the published spec is worse than a rule that was
  never claimed, because tools trust the spec.
- Editors are where frontmatter gets typed, so the more they can reject, the less
  the CLI has to.
- The relationship rules are the ones users get wrong, and they are exactly the
  cross-field kind.

## Considered Options

- Express structure with types and discriminated unions wherever possible, and
  accept that the remaining cross-field rules run only in the CLI.
- Hand-maintain JSON Schema alongside zod so both kinds of rule are published.
- Drop the cross-field rules entirely and accept looser validation everywhere.

## Decision Outcome

Chosen option: "Express structure with types and discriminated unions". A
discriminated union on `direction` survives generation, so the pattern rules that
matter most — upstream takes `OHS`/`PL`, downstream takes `ACL`/`CF`, symmetric
types take neither — are published, not just checked. What remains is genuinely
relational and stays in the CLI.

### Consequences

- Good, because the relationship rules users get wrong are visible in the editor
  and in the published spec.
- Good, because there is still one source for both the runtime validator and the
  published spec.
- Bad, and permanently: an editor is a weaker check than `domainbook validate`.
  A file can be green in the editor and fail validation, and that gap can only
  widen as rules are added.
- Bad, because schema authors must reach for unions where a `.refine()` would
  read more directly, which is a real cost in readability of the schema source.

### Confirmation

Every rule added to a schema is asked one question: does it survive
`z.toJSONSchema()`? If not, it needs a broken fixture proving the CLI catches it,
because nothing else will.
