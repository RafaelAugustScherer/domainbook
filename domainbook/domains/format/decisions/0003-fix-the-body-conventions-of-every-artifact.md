---
status: accepted
date: 2026-07-28
decision-makers: [RafaelAugustScherer]
---

# Fix the body conventions of every artifact

## Context and Problem Statement

Frontmatter is validated by schema, but most of a book is body prose, and the
body is what the site renders, the MCP server searches, and the exporters read. A
body with no agreed structure can only be shown as a blob of markdown. A body
with too much structure stops being writable by hand.

## Decision Drivers

- Exports have to be mechanical: Contextive needs term, aliases, and examples as
  fields, not as sentences.
- Anyone editing the book uses a plain markdown editor with no plugin.
- Structure that a reader would write anyway costs nothing; structure invented
  for the parser costs every writer, every time.

## Considered Options

- Fix a small grammar per artifact: known H2s in a known order, and one bullet
  shape inside a glossary term.
- Keep the body free prose and move anything a tool needs into frontmatter.
- Require a stricter markup — a table or embedded YAML per section.

## Decision Outcome

Chosen option: "Fix a small grammar per artifact". Free prose would push the
canvas into YAML, which nobody wants to read; stricter markup would make the book
unwritable outside a generator.

The grammar:

- **Domain page.** No H1. The body is exactly the eight remaining canvas sections
  as H2s, in canvas order: Purpose, Domain Roles, Inbound Communication, Outbound
  Communication, Business Decisions, Assumptions, Verification Metrics, Open
  Questions. Canvas Name and Strategic Classification are frontmatter; Ubiquitous
  Language is the domain's `glossary.md`.
- **Glossary.** No frontmatter. An optional `#` title and intro, then one `##`
  per term: first paragraph is the definition, followed by at most one bullet
  list using the labels `**Aliases:**` (comma-separated), `**Status:**` (once,
  defaulting to `draft`), and `**Example:**` (repeatable). Nothing else in a term
  section.
- **Feature.** `## Story`, then one `## Rule: …` per rule with its examples in
  fenced Gherkin, then `## Open Questions` (`format/ADR-0008`).
- **File names** are lowercase inside the book. Uppercase is reserved for the
  repo-root files ecosystems expect — `README.md`, `AGENTS.md`, `LICENSE`.

### Consequences

- Good, because every artifact can be parsed into fields without an author
  learning a markup.
- Good, because a domain page reads in canvas order, so a reader who knows the
  canvas knows the page.
- Bad, because the ordering is a rule to enforce and to explain; a page with the
  right sections in the wrong order is an error that will feel pedantic.
- Bad, because a term needing anything a bullet list cannot hold — a table, a
  diagram — has nowhere to put it, and the answer will be "write another
  sentence".
- Bad, because renaming a canvas section upstream in a future canvas version
  breaks every book at once.

### Confirmation

The fixture book uses each grammar once, and the broken fixtures carry one
violation each. A convention that no fixture exercises is not a convention.
