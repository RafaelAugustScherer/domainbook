---
status: accepted
date: 2026-07-28
decision-makers: [RafaelAugustScherer]
---

# Build a custom Astro app

## Context and Problem Statement

The book has to be readable by people who will not clone the repo. Most of it is
markdown, which every documentation generator renders — but the parts worth
publishing are the parts that are not prose: a canvas laid out as a canvas, a
context map derived from frontmatter, a decision log with supersede chains, a
glossary that links to the features using each term. A generic site renders the
markdown and loses all of it.

## Decision Drivers

- The schemas are zod (`format/ADR-0001`), and Astro content collections take zod
  schemas directly — the site can validate at build with the same definitions the
  CLI uses.
- The derived views are the reason to publish at all.
- Site work is the last phase; it must not become the largest one.

## Considered Options

- A custom Astro app with content collections wired to the shared schemas.
- An off-the-shelf documentation theme, with the derived views bolted on.
- No site: the repo and the MCP server are the interfaces.

## Decision Outcome

Chosen option: "A custom Astro app". An off-the-shelf theme starts faster and
then fights every view that is not a markdown page; those views are the product.
Astro also removes a whole class of drift, because a page that renders is a page
whose content passed the same schema `validate` applies.

Scope is fixed in advance to keep this from becoming the biggest phase: static
output, Mermaid generated from `relationships:`, Pagefind for search, and no
visual editor. The site is a reader.

### Consequences

- Good, because build-time validation and CLI validation cannot disagree — they
  are the same schemas.
- Good, because the output is static, so publishing is a file copy and there is
  no server to run.
- Bad, because a custom app is ours to maintain: navigation, theming, and
  accessibility are now our work, not a theme's.
- Bad, because static generation ties build time to book size, and a very large
  book will find that limit before anyone plans for it.
- Bad, because a reader on the site sees one version of the book
  (`ADR-0006`), and the site cannot offer version switching without a build per
  tag.

### Confirmation

The site builds from any valid book, not only from this one, and this book is
published as the live demo — so a book that breaks the site is visible
immediately.
