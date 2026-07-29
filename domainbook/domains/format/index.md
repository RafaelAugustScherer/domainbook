---
id: format
name: Format
classification:
  domain: core-domain
  business-model: engagement-creator
  evolution: custom-built
owners: [rafael]
code:
  - packages/core/src/index.ts
  - packages/core/src/schemas/**
  - packages/core/src/frontmatter.ts
  - packages/core/schema/**
  - packages/core/scripts/**
  - packages/core/test/**
  - fixtures/**
---

## Purpose

Say what a book is — which artifacts it holds, what their frontmatter carries, and
what their body must look like — so enforcement, MCP, and the site all read one
model instead of three parsers.

## Domain Roles

- Specification context: it owns the shape of every artifact; no other context
  invents a field.
- Published language context: the generated JSON Schema files are committed, so
  editors and non-JS tools read the same spec the CLI reads.

## Inbound Communication

| Message              | Collaborator            | Type    |
| -------------------- | ----------------------- | ------- |
| `ValidateArtifact`   | CLI                     | Command |
| `LoadBook`           | enforcement, mcp, site  | Query   |
| `GenerateJsonSchema` | build script            | Command |

## Outbound Communication

| Message            | Collaborator           | Type  |
| ------------------ | ---------------------- | ----- |
| `ValidationFailed` | CLI, CI                | Event |
| `SchemaChanged`    | enforcement, mcp, site | Event |

## Business Decisions

- Schemas are authored once in zod; JSON Schema is generated from them and
  committed, never hand-edited (`format/ADR-0001`).
- Structure is expressed with types and discriminated unions; cross-field rules
  live only in the CLI, so an editor accepts files `validate` rejects
  (`format/ADR-0002`).
- Every artifact adopts an existing standard at a pinned version — MADR 4.0,
  Bounded Context Canvas V5, Keep a Changelog 1.1.0, Context Mapper relationship
  vocabulary, Gherkin — and narrowing a standard is recorded, not assumed
  (`format/ADR-0004`).
- Frontmatter carries what a machine reads; the body carries what a person reads.
  A canvas section that a tool needs to index moves to frontmatter rather than
  being scraped out of prose.

## Assumptions

- A repo's book is small enough to load whole; nothing needs incremental parsing.
- Frontmatter keys are a closed set, so a misspelled key is an error rather than
  data quietly ignored.
- Repos adopting domainbook write their books by hand or by agent, not by
  generating them from code — the format optimises for reading and reviewing, not
  for machine round-tripping.

## Verification Metrics

- Every artifact in this book validates; every broken fixture fails for the
  reason it was written to fail for.
- Drift between the zod schemas and the committed JSON Schema — CI fails on any
  diff, so the healthy number is zero.
- How many rules exist only in the CLI and not in the published JSON Schema. It
  grows only with a recorded reason.

## Open Questions

- How does a domain page declare a relationship with a context that has no page
  in this book — a third-party service, or another repo's book?
- Should the roadmap artifact carry dates or links per milestone, or stay the
  three-field index it is today?
- Does the book need a format version field so a future schema change can migrate
  older books, or is the git history enough?
