---
status: accepted
date: 2026-07-28
decision-makers: [RafaelAugustScherer]
---

# Write behaviour as markdown with fenced Gherkin

## Context and Problem Statement

Behaviour is the part of a codebase that goes undocumented most reliably: it
lives in test files, in the heads of the people who wrote them, and nowhere a
reader can find it. Putting it in the book means choosing a form that a person
will write, a reader will read, and a tool can parse.

## Decision Drivers

- The reader is often an agent about to change the behaviour, so the examples
  have to be concrete.
- Example Mapping (story, rules, examples, questions) is how teams already work
  through behaviour out loud.
- Gherkin has a parser, an export path, and a decade of shared vocabulary.

## Considered Options

- Markdown in Example Mapping structure, with examples in fenced `gherkin`
  blocks.
- Plain `.feature` files in the book, in Gherkin end to end.
- Prose only, with no machine-readable examples.

## Decision Outcome

Chosen option: "Markdown with fenced Gherkin". `.feature` files would parse
without any extra step but have no room for the story, the rules as prose, or the
open questions — the parts that explain why the examples are what they are.
Prose alone gives up the export and the precision.

Scenarios are declarative — what the system does, not which button is clicked —
so they survive a redesign.

### Consequences

- Good, because one file holds the reasoning and the examples, and a reader gets
  both.
- Good, because `export gherkin` produces real `.feature` files, and the examples
  can be executed by whatever the repo already uses.
- Bad, because `@cucumber/gherkin` does not parse a fenced block in markdown. The
  block has to be extracted and wrapped in a `Feature:` before it is handed to
  the parser, which means the line numbers in a parse error refer to the wrapped
  text and have to be mapped back before they are shown.
- Bad, because a feature file can hold Gherkin that parses and prose that
  contradicts it; nothing checks the two agree.
- Bad, because these examples are documentation by default. A repo that also runs
  them keeps them true; a repo that does not has examples that can rot exactly
  like any other prose.

### Confirmation

The fixture feature carries three rules with examples; a broken fixture carries a
Gherkin block that does not parse, so the extract-and-wrap step is exercised in
both directions.

## More Information

The H2 grammar this artifact follows is fixed in `format/ADR-0003`.
