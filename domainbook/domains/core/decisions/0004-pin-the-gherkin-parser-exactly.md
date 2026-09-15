---
status: accepted
date: 2026-07-29
decision-makers: [RafaelAugustScherer]
---

# Pin the Gherkin parser exactly

## Context and Problem Statement

A feature's examples are fenced Gherkin (`format/ADR-0008`), and "the examples
parse" is one of the convention checks, so something has to parse Gherkin. The
obvious something is `@cucumber/gherkin` — the parser Cucumber itself uses, from
the project that owns the grammar.

It brings a second package with it. `@cucumber/gherkin` needs an id generator
from `@cucumber/messages`, and our code imports that generator by name. It
resolves without being declared, because npm hoists it.

## Decision Drivers

- `export gherkin` (Phase 6) has to produce `.feature` files that Cucumber
  accepts, so what we validate against must be what Cucumber validates against.
- An import that resolves only because a package manager hoisted someone else's
  dependency is a dependency that is not declared and cannot be pinned.
- Every other dependency in this repo is pinned exactly, and CI fails on
  high-severity advisories (`ADR-0009`), which is what makes an exact pin safe
  to hold.

## Considered Options

- Pin `@cucumber/gherkin` 42.0.0 and `@cucumber/messages` 34.2.0 exactly, and
  declare both.
- Declare `@cucumber/gherkin` only, and keep importing the id generator through
  hoisting.
- Take a caret range on both and let installs pick up minors.
- Parse a subset of Gherkin ourselves, the way markdown is read by our own
  scanner (`core/ADR-0002`).

## Decision Outcome

Chosen option: "Pin both exactly and declare both". This is where the argument
in `core/ADR-0002` stops: markdown, for our purposes, is four cases; Gherkin is a
specified grammar with keywords in dozens of languages and a conformance suite
behind it. A subset of our own would accept files Cucumber rejects and reject
files Cucumber accepts, which is the one thing the export cannot afford.

The floor is real rather than tidy: ESM landed in v40, and everything here is
ESM-only (`ADR-0002`), so the older lines are not an option to fall back to.

### Consequences

- Good, because the version that parses a book's examples is one we chose, and
  the id generator comes from a package we declared rather than from whatever
  hoisting produced this week.
- Good, because an install that resolves differently on someone else's machine
  cannot change what `validate` accepts.
- Bad, and this one is ongoing: the release train is polyglot. A new major ships
  roughly monthly for the whole Cucumber family and is usually a no-op for
  JavaScript, so every bump has to be read rather than trusted — and the bot
  that opens those pull requests cannot tell an irrelevant Ruby packaging change
  from a grammar change.
- Bad, because two pinned packages have to stay compatible with each other and
  nothing in the manifest says which pairs are legal; a mismatched bump fails in
  a test rather than at install.
- Bad, because a patch that fixes something we need is a commit here rather than
  an install away, which is the price of the exact pin everywhere in this repo.

### Confirmation

A broken book carries a Gherkin block that does not parse, and the feature
parser's tests map the parser's error back to the markdown line it came from. An
upgrade that changes the shape of a parse error fails those tests instead of
changing `validate`'s output quietly.
