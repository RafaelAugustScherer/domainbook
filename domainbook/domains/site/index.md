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
| `BuildSite`  | CLI          | Command |
| `ServeDev`   | CLI          | Command |

## Outbound Communication

| Message      | Collaborator | Type  |
| ------------ | ------------ | ----- |
| `LoadBook`   | format       | Query |
| `BuildFailed`| CLI, CI      | Event |

## Business Decisions

- A custom Astro app whose content collections use the shared zod schemas, so a
  build applies the same rules as `domainbook validate` (`site/ADR-0001`).
- The context map is generated from `relationships:` frontmatter as Mermaid.
  There is no hand-drawn diagram and no visual editor — a map that disagrees with
  the book cannot exist.
- Static-first output, deployable to any static host.

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

- How should a `separate-ways` edge be drawn? It is a real relationship with no
  export in Context Mapper's DSL (`format/ADR-0007`), and drawing an edge for
  "these two deliberately do not talk" may read as the opposite.
- Is the site published from the default branch only, or per release?
- Should Gherkin examples be runnable from the page, or is highlighted text
  enough?
