---
status: accepted
date: 2026-07-28
decision-makers: [rafael]
---

# Author schemas in zod and commit JSON Schema

## Context and Problem Statement

Three consumers need to agree on what a valid artifact is: the CLI that validates
a book, the editor a person types the frontmatter in, and any non-JavaScript tool
that wants to read the format. Written twice, those definitions drift, and the
drift shows up as a file an editor accepts and CI rejects.

## Decision Drivers

- The runtime validator has to produce good messages, in TypeScript, with types
  derived from the same definition (`format/ADR-0002`).
- Editors validate YAML frontmatter against JSON Schema, not against zod.
- A format claiming to be a standard has to be readable by tools that are not
  ours.

## Considered Options

- Author in zod; generate JSON Schema (draft 2020-12) at build and commit the
  output.
- Author JSON Schema by hand; derive runtime validation from it.
- Author in zod only, and publish no machine-readable spec.

## Decision Outcome

Chosen option: "Author in zod; generate and commit JSON Schema". Hand-written
JSON Schema gives up derived TypeScript types and readable errors; zod-only gives
up every consumer that is not this codebase.

The generated files are committed rather than built on demand, so a reader of the
repo and an editor resolving a `$schema` URL see the spec without running
anything.

### Consequences

- Good, because there is one definition, and the published spec cannot silently
  fall behind it.
- Good, because editors give frontmatter completion and inline errors from the
  committed files.
- Bad, because generated files in the tree can be edited by hand, so CI has to
  regenerate and fail on any diff — a check that will annoy someone who forgot to
  run the generator.
- Bad, because the format is now bounded by what zod can express in JSON Schema,
  which is the whole subject of `format/ADR-0002`.

### Confirmation

CI runs the generator and fails on a diff under `packages/core/schema`. Every
schema file in that folder has a zod source in `packages/core/src/schemas`.
