---
status: accepted
date: 2026-07-29
decision-makers: [RafaelAugustScherer]
---

# Tell empty frontmatter apart from none

## Context and Problem Statement

`format/ADR-0011` took the fence split into our own code and named the edge cases
that came with it — CRLF, a body that starts with `---`, an empty frontmatter
block — but said only that they were now ours, not what any of them does. Two of
them were answered by accident rather than on purpose: an empty block returned
`undefined` or `null` depending on whether a blank line sat between the fences,
and the stray `---\n---` was left in the body, where markdown renders it as a
horizontal rule; a leading byte order mark defeated the `^---` anchor entirely,
so the whole file fell through as body with no frontmatter at all.

`parseFrontmatter` sits under every read of the book — CLI, MCP server, and site
— so what it returns at these edges decides what Phase 1's loader and `validate`
are able to say about a file that is wrong.

## Considered Options

- Return `{}` for an empty block, and nothing only when there is no fence at all.
- Collapse both to "no frontmatter" — one absent-frontmatter state, no
  distinction to keep.

## Decision Outcome

Chosen option: "return `{}` for an empty block". The two states carry different
information. "You opened a fence and declared nothing" is a different mistake
from "you wrote no fence", and for a glossary or a changelog — which carry no
frontmatter at all (`format/ADR-0003`) — only the first is a violation. `{}` is
also the return value that produces a usable error: zod reports the missing
required keys (`id`, `name`, …) instead of "expected object, received
undefined", which points nowhere near the cause.

Every way of writing an empty block — `---\n---`, blank lines between the
fences, comments only — returns `{}`, and the fence is consumed out of the body.
Collapsing the two states is simpler and was the real alternative; it was
rejected because it throws the distinction away at the only place that can still
see it, leaving Phase 1 no way to name the mistake precisely.

A byte order mark is stripped before the fence is looked for, so a file saved
with one is read like any other file.

### Consequences

- Good, because Phase 1's loader and `validate` can distinguish "no frontmatter"
  from "empty frontmatter" and report them differently.
- Good, because the site and the MCP server never receive a stray `---` fence in
  body content, which would render as a horizontal rule the author did not
  write.
- Good, because files authored on Windows or by an editor that emits a byte
  order mark parse the same as any other.
- Bad, because `undefined` and `{}` are now a distinction every caller has to
  keep straight; one that writes `data ?? {}` loses it without failing.
- Bad, because a markdown file whose body genuinely opens with two thematic
  breaks is indistinguishable from an empty frontmatter block, and loses them.
- Bad, because the returned body no longer matches the source byte for byte, so
  anything that reads a file and writes the body back drops the mark.

### Confirmation

`parseFrontmatter`'s tests name each edge on its own — an empty block with and
without a blank line, a byte order mark with and without frontmatter, CRLF, and
a `---` further down the body — so a regression fails as the specific case it
broke.
