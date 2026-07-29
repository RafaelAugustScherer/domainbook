---
status: accepted
date: 2026-07-28
decision-makers: [rafael]
---

# Read frontmatter with yaml, not gray-matter

## Context and Problem Statement

Every artifact except the glossary and changelog starts with YAML frontmatter, so
the loader needs a way to split the fence and parse it. gray-matter is the
default choice in this space and was named in the roadmap. Two properties of it
turned out to be disqualifying, one of them structural.

## Decision Drivers

- The committed JSON Schema is generated from the zod schemas
  (`format/ADR-0001`), so anything that makes generation throw is not a
  preference, it is a blocker.
- The parser sits under every read of the book — CLI, MCP server, and site.
- Dependencies that block a Node upgrade block the whole toolchain
  (`ADR-0002`).

## Considered Options

- `yaml` (2.9.0), with a small frontmatter split in our own code.
- `gray-matter`.
- Hand-rolled YAML parsing.

## Decision Outcome

Chosen option: "`yaml`, with our own fence split". The fence split is a few lines
of regex; the parser is the part worth taking from someone else.

gray-matter was rejected on two counts. It is unmaintained — no code change since
2021, CommonJS only, and pinned to the legacy js-yaml 3.x line. And it returns
YAML dates as JavaScript `Date` objects, which forces the schema to declare
`z.date()`, which *throws* inside `z.toJSONSchema()`. That makes it structurally
incompatible with committing generated JSON Schema: not a rough edge, a
contradiction with a decision already taken. `yaml` returns strings, so a date is
validated as an ISO date string and generates cleanly.

### Consequences

- Good, because `date: 2026-07-28` in frontmatter arrives as a string and is
  checked as an ISO date, in both the runtime validator and the published schema.
- Good, because the dependency is maintained, ESM, and current.
- Bad, because splitting the fence is now our code, including the edge cases
  gray-matter had already met — CRLF, a body that starts with `---`, an empty
  frontmatter block.
- Bad, because `yaml`'s default parse returns plain values with no schema
  knowledge, so anything typed relies entirely on zod afterwards. There is no
  second opinion.

### Confirmation

`parseFrontmatter` is a single exported function with its own tests, and the
schema generator runs in CI — an accidental `z.date()` fails the build rather
than the release.
