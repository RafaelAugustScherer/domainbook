---
status: open
date: 2026-07-30
severity: low
quadrant: deliberate-prudent
code:
  - packages/core/src/index.ts
decisions: [ADR-0011]
---

# Core publishes exports that nothing outside it imports

## Debt

`packages/core/src/index.ts` publishes 57 specifiers — 29 values and 28 types.
Seven of the values have no consumer anywhere outside `packages/core/src`:
nothing in the CLI, in core's own tests, or in the generation scripts imports
`changelogReleaseSchema`, `decisionRef`, `people`, `classificationSchema`,
`relationshipSchema`, `glossaryTermSchema`, or `milestoneSchema`. Twenty-two
of the types are unread in the same way; only `Issue`, `Book`, `DebtRecord`,
`DecisionRecord`, `DomainRecord`, and `GlossaryRecord` are consumed as types.
Twenty-nine of fifty-seven names are published for nobody.

None of them is dead code. Every one is a sub-schema composed into a top-level
schema that is exported and used — `milestoneSchema` builds `roadmapSchema`,
`people` builds four artifacts' frontmatter, `classificationSchema` and
`relationshipSchema` build `domainSchema`. The symbols are live inside core. The
debt is the `export` line in `index.ts`, not the symbol behind it.

The one package that depends on core measures the gap plainly: the CLI imports
eleven values from `@domainbook/core` and not a single type.

## Impact

A package's contract is its `src/index.ts` — everything named there is what a
consumer may touch, and everything else is free to change. Twenty-nine names are
therefore held stable for readers who do not exist. Renaming
`relationshipSchema`, or changing what it accepts, reads as a breaking change to
the outside even though the only caller sits in the file beside it, and the
question "may this move?" has to be asked about each of the twenty-nine every
time the schemas are reshaped.

Nothing costs anything at runtime, and nothing is wrong today. The bill arrives
at Phase 7, when the first published version freezes the surface and every name
on it becomes a promise the version number has to keep. It also arrives sooner,
in small amounts, every time someone edits a schema and has to work out whether
they are editing an internal helper or a published one.

The measurement is what the context's own Open Question was missing. "Should the
published surface be split per context, or is one entry point right?" is easier
to answer knowing that most of the surface has no reader either way.

## Remedy

Delete the `export` line, keep the symbol. Each of the seven values and the
twenty-two types goes back to being internal to core, and the schemas that
compose them keep importing them as they do now. The rule to hold afterwards is
that a name reaches `index.ts` when a consumer asks for it, not when it is
written.

Two of the twenty-nine may earn their place rather than lose it: `decisionRef`
and `people` are the shapes a future artifact type reuses, and the site's
content collections (Phase 4) will import types this book cannot yet name.
Decide those two on evidence when the consumer appears, and let the count fall
to what is read in the meantime. Repaying this record and answering the
context's Open Question about splitting the surface are the same piece of work,
and doing them together costs less than doing either twice.
