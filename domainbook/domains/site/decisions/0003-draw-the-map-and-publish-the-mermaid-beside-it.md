---
status: accepted
date: 2026-08-02
decision-makers: [RafaelAugustScherer]
---

# Draw the map, and publish the Mermaid beside it

## Context and Problem Statement

The roadmap and this context's canvas both said the map is rendered "as
Mermaid". Mermaid is a browser library: it lays a graph out and paints it in the
page, so a static site that uses it ships the library and draws nothing until
the reader's JavaScript runs. Its cost was not weighed when the sentence was
written.

## Decision Drivers

- `site/ADR-0001` fixes static-first output and a small scope; the map is one
  page and part of another.
- `CONTRIBUTING.md` holds that every dependency must pay rent, checked against
  its current state rather than its reputation.
- The map has to stay derived — a diagram that can disagree with the
  `relationships:` frontmatter is the thing the whole approach exists to prevent.

## Considered Options

- Draw the map ourselves as SVG at build time, and print the derived Mermaid
  source beside it.
- Bundle Mermaid and render in the browser.
- Emit the Mermaid source and render nothing.

## Decision Outcome

Chosen option: "Draw the map ourselves, and print the derived Mermaid beside
it". Mermaid 11.16.0 unpacks to 83.5 MB across 1,171 files and pulls in d3,
cytoscape, katex and roughjs — more than Astro and Shiki together, and it would
become the largest thing installing domainbook downloads, for one diagram on two
pages. Server-side Mermaid without a headless browser exists only as young
third-party ports, none of which clears the same bar.

A context map is a small graph — contexts in layers, upstream above downstream —
and laying that out is tens of lines rather than a rendering engine. What is lost
is Mermaid's layout quality; what is gained is a diagram that needs no
JavaScript, no dependency, and no network.

The Mermaid is still derived and still published, on the map page, so it can be
pasted into any Mermaid renderer and so Phase 6's `export mermaid` is a lift
rather than new work. "As Mermaid" becomes "from the same source Mermaid would
take", which is what the sentence was protecting.

### Consequences

- Good, because the map reads with JavaScript off, in a print, and in a reader
  that blocks scripts.
- Good, because the site's dependency footprint stays Astro plus Pagefind.
- Bad, because the layout is ours to maintain, and a book with many crossing
  relationships will look worse than Mermaid would render it.
- Bad, because two representations of one map exist — the SVG and the Mermaid
  source — and both are generated from `contextMap`, so they can only disagree
  through a bug.

### Confirmation

The map page carries a drawn SVG and, beneath it, the Mermaid source and a table
of every relationship. A `separate-ways` edge is dashed and unarrowed in both.
Nothing on either page fetches a script.
