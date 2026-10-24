---
id: site
name: Site
classification:
  domain: supporting-domain
  business-model: engagement-creator
  evolution: product
owners: [RafaelAugustScherer]
code:
  - packages/site/**
relationships:
  - with: format
    type: upstream-downstream
    direction: downstream
    patterns: [CF]
  - with: core
    type: upstream-downstream
    direction: downstream
    patterns: [CF]
---

## Purpose

Make the book readable by people who are not in an editor — browse the contexts,
search the language, follow a decision chain, and see the context map that the
relationships already describe.

## Domain Roles

- Presentation context: it derives every page from the book and authors nothing.
- Analysis context: the context map, supersede chains, and term usage are views
  computed from the model, not documents someone maintains.

## Inbound Communication

| Message      | Collaborator | Type    |
| ------------ | ------------ | ------- |
| `BuildSite`  | core         | Command |
| `ServeSite`  | core         | Command |

## Outbound Communication

| Message      | Collaborator | Type  |
| ------------ | ------------ | ----- |
| `LoadBook`   | core         | Query |
| `BuildFailed`| core, CI     | Event |

## Business Decisions

- A custom Astro app whose content collections use the shared zod schemas, so a
  build applies the same rules as `domainbook validate` (`site/ADR-0001`).
- The book is read through core's loader, and the schemas the content
  collections declare are format's. That is why this context depends on both,
  and why a page can only show what the model already holds (`ADR-0011`).
- The context map is generated from `relationships:` frontmatter. The site draws
  it as SVG at build time and prints the derived Mermaid source beside it, rather
  than shipping Mermaid to the reader (`site/ADR-0003`). There is no hand-drawn
  diagram and no visual editor — a map that disagrees with the book cannot exist.
- Static-first output, deployable to any static host. Where that host mounts it
  is a key in the book's own config rather than an argument to the command, so
  the local site and the published one agree (`site/ADR-0002`).
- A `separate-ways` edge is drawn, because it was declared — dashed, labelled,
  and without an arrowhead, so it cannot be read as a channel. The alternative,
  leaving it off, would make the map disagree with the book.
- The decision log's `deprecated` badge reads `not current`. The status cannot
  tell "the choice was reversed" from "the record was retired" apart, so the
  badge says only what both senses share and the record's own words settle it.

## Assumptions

- Books stay small enough that generating every page at build time and indexing
  it with Pagefind is faster than rendering on request.
- Readers arrive looking for a term or a feature, so search matters more than
  navigation depth.

## Verification Metrics

- Build failures caused by content that `domainbook validate` accepted — should
  be zero, since both read the same schemas.
- Build time on this book, tracked as the book grows.
- Searches that return nothing, as a proxy for language the book is missing.

## Open Questions

None.
