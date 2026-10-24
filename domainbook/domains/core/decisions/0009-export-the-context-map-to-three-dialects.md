---
status: accepted
date: 2026-08-14
decision-makers: [RafaelAugustScherer]
authored-by: agent
---

# Export the context map to three dialects

## Context and Problem Statement

Phase 6 exports the context map — the union of `relationships:` declarations that
`contextMap` already derives — to three tools that read it differently: Mermaid
for a diagram, Context Mapper (CML) for a strategic model, and Structurizr for a
system landscape. The map is one graph, but each tool's grammar constrains how it
can be written, and the constraints do not agree. Two of them are load-bearing.
An identifier in CML and in Structurizr is alphanumeric — neither accepts the
hyphen a domainbook id carries, so `access-control` is not a legal name in either.
And `separate-ways`, which the map can state, has no faithful form in a modelling
tool whose every relationship is an integration. Mermaid already has a renderer,
in the site (`site/ADR-0003`), so `export mermaid` has to decide whether to be
that renderer or a second one.

## Considered Options

- Lift the site's Mermaid renderer into core; fold hyphenated ids to alphanumeric
  identifiers for CML and Structurizr; draw `separate-ways` in Mermaid and
  skip-and-name it in the two modelling dialects; map a context to a Structurizr
  `softwareSystem` in a landscape view.
- Write a fresh Mermaid renderer in the export path and leave the site's alone.
- Refuse to export a book whose ids carry hyphens, rather than fold them.
- Map a context to a Structurizr container — the canonical C4 level for a bounded
  context — rather than a software system.

## Decision Outcome

Chosen option: lift the renderer, fold the identifiers, and coarsen per tool.

- Mermaid is a lift, not new work, as `site/ADR-0003` anticipated. `mermaidSource`
  and `labelOf` moved from `@domainbook/site` into core and the site imports them
  back, so the graph the site publishes and the graph `export mermaid` writes are
  one derivation. The export omits the site's per-node `click` links: a portable
  `.mmd` has nowhere to navigate to.
- CML and Structurizr identifiers are the id with its hyphens folded to camelCase
  — `access-control` becomes `accessControl` — because their grammars accept
  nothing else. This is lossy: the exact id is not in the file, only a
  deterministic rendering of it. Mermaid keeps the id and shows the context's name.
- `separate-ways` is drawn in Mermaid, dashed and without an arrowhead, because a
  diagram can say "these deliberately do not integrate." CML has no production for
  it (`ADR-0007`) and a Structurizr relationship is directional, so neither can;
  both skip the edge and name it on the way out rather than dropping it in silence.
- A context becomes a Structurizr `softwareSystem` inside a `systemLandscape`
  view. That is the landscape zoom level — coarser than the container a bounded
  context maps to most naturally in C4. The export draws the map of contexts, not
  the inside of any one, so the landscape level fits; but it is a deliberate
  coarsening, not the canonical C4 equivalence.

### Consequences

- Good, because one derivation feeds both the site and the export, so a map
  cannot come to read two different ways.
- Good, because every dialect either carries a relationship or names what it could
  not, and a reader is never left to guess whether an edge was dropped.
- Bad, because a CML or Structurizr file does not carry the book's exact ids, so it
  is not a round-trip: exporting and re-importing would not reproduce them.
- Bad, because the Structurizr output invites the reading that a bounded context is
  a C4 software system, which it is not; someone modelling containers would draw
  the same contexts differently.

### Confirmation

The fixture book carries a `separate-ways` edge, hyphenated ids, and directed
relationships with patterns, so the three context-map exports meet every case in
the test suite, where each dialect's structure is asserted. Context Mapper and
Structurizr are JVM tools CI does not run, so "the file loads in the tool" is
shown in the phase walkthrough rather than the suite.
