---
id: scaffold-a-book
name: Scaffold a book
status: implemented
owners: [RafaelAugustScherer]
terms: [book, book-root, artifact]
decisions: [format/ADR-0003, format/ADR-0010]
---

## Story

As a developer adopting domainbook in a repo that has none
I want the tool to write the first artifacts and the pages I add after them
So that the first thing I edit is already the right shape and already validates

## Rule: A book written by init validates before anything is edited

```gherkin
Example: init writes a roadmap, a glossary, a changelog and a config, and the book is valid
  Given a repo with no book
  When domainbook init runs
  Then it prints: wrote domainbook/roadmap.md, domainbook/glossary.md, domainbook/changelog.md, domainbook/domainbook.config.yaml and .mcp.json
  And domainbook validate prints: domainbook is a valid book — 0 domains, 0 features, 0 decisions, 1 term, 0 debt records

Example: The book root is the last argument, and it defaults to domainbook
  Given domainbook init docs/book has written a book
  When domainbook new domain ticketing docs/book runs
  Then domainbook validate docs/book prints: docs/book is a valid book — 1 domain, 0 features, 0 decisions, 2 terms, 0 debt records
```

## Rule: Every generator writes a page that still validates

```gherkin
Example: A domain, a feature and a decision written one after another
  Given a book written by domainbook init
  When domainbook new domain ticketing runs
  And domainbook new feature hold-seats-during-checkout --domain ticketing runs
  And domainbook new decision "Expire holds after ten minutes" --domain ticketing runs
  Then domainbook validate prints: domainbook is a valid book — 1 domain, 1 feature, 1 decision, 2 terms, 0 debt records
  And each command has printed what is left to fill in on the page it wrote
```

## Rule: A new domain is scaffolded as every artifact a domain holds

```gherkin
Example: new domain writes the canvas, the glossary, the changelog and the three logs
  Given a book written by domainbook init
  When domainbook new domain ticketing runs
  Then it prints: wrote domainbook/domains/ticketing/ — index.md, glossary.md, changelog.md, features/, decisions/ and debt/
  And it prints: next: set the three classification axes, fill in the eight canvas sections, and replace the placeholder term in glossary.md, then "domainbook validate"
  And domainbook validate prints: domainbook is a valid book — 1 domain, 0 features, 0 decisions, 2 terms, 0 debt records

Example: The scaffolded glossary carries one term, because a glossary with none does not validate
  Given domainbook new domain ticketing has run
  Then domainbook/domains/ticketing/glossary.md has one H2, reading: ## <Term>
  And that term carries: - **Status:** draft
  And the prose above it names the other two statuses, validated and deprecated

Example: The scaffolded changelog is open and holds no release
  Given domainbook new domain ticketing has run
  Then domainbook/domains/ticketing/changelog.md has one H2, reading: ## [Unreleased]
  And the prose above it shows a release heading, written: "## [1.2.0] - 2026-06-30"

Example: The three log folders reach the reader who clones rather than the one who scaffolded
  Given domainbook new domain ticketing has run
  When everything under domainbook is committed
  Then git ls-files lists domainbook/domains/ticketing/features/.gitkeep, domainbook/domains/ticketing/decisions/.gitkeep and domainbook/domains/ticketing/debt/.gitkeep
  And domainbook validate prints: domainbook is a valid book — 1 domain, 0 features, 0 decisions, 2 terms, 0 debt records
```

## Rule: A generated value a YAML parser could read as something else is quoted

```gherkin
Example: An id that reads as a boolean keeps its quotes
  Given a book written by domainbook init
  When domainbook new domain no runs
  Then domainbook/domains/no/index.md reads: id: "no"
  And the next line reads: name: "No"

Example: An id that starts with a digit keeps its quotes
  Given a book written by domainbook init
  When domainbook new domain 9 runs
  Then domainbook/domains/9/index.md reads: id: "9"

Example: An ordinary id is written bare
  Given a book written by domainbook init
  When domainbook new domain ticketing runs
  Then domainbook/domains/ticketing/index.md reads: id: ticketing
  And domainbook validate prints: domainbook is a valid book — 1 domain, 0 features, 0 decisions, 2 terms, 0 debt records
```

## Rule: init refuses a root that is not an empty folder

```gherkin
Example: A second init names what is already there
  Given a book already written at domainbook
  When domainbook init runs again
  Then it refuses with: "domainbook" is not empty — it holds "changelog.md"; "domainbook init" writes a new book into an empty folder, so pass another root, or edit the book that is already here
  And it exits 1

Example: A file where a book root should be
  Given a file called notes.md
  When domainbook init notes.md runs
  Then it refuses with: "notes.md" is a file — a book root is a folder; pass one that is empty, or one that does not exist yet
  And it exits 1
```

## Rule: A generator that cannot write says what to write instead

```gherkin
Example: An id that is not a slug comes back as the slug it should have been
  Given a book written by domainbook init
  When domainbook new domain "Access Control" runs
  Then it refuses with: "Access Control" is not a domain id — write words joined by single hyphens, where a word starts with a letter or digit in any script and carries no capitals, as in "access-control"

Example: An id a second spelling would also produce is refused before it is written
  Given a book written by domainbook init
  When domainbook new domain "ｓｅａｔ-ｍａｐ" runs, typed in fullwidth Latin
  Then it refuses with: the domain id "ｓｅａｔ-ｍａｐ" folds to "seat-map" under NFKC — character 1 is U+FF53, a compatibility form; write "seat-map" instead, or this and the domain id it looks like are two different names

Example: A domain that does not exist is answered with the ones that do
  Given a book whose only domain is ticketing
  When domainbook new feature hold-seats --domain billing runs
  Then it refuses with: no domain "billing" in domainbook — run "domainbook new domain billing" first, or name one of ticketing

Example: A page that is already there is never written over
  Given a book whose ticketing page exists
  When domainbook new domain ticketing runs
  Then it refuses with: domainbook/domains/ticketing/index.md already exists — edit what is there, or pick another id

Example: A glossary left behind by a deleted canvas is named rather than overwritten
  Given a ticketing folder holding a glossary and no index.md
  When domainbook new domain ticketing runs
  Then it refuses with: domainbook/domains/ticketing/glossary.md already exists — edit what is there, or pick another id
  And domainbook/domains/ticketing/glossary.md is unchanged
```

## Rule: A generator writes into a book or writes nothing

```gherkin
Example: A folder with no roadmap is not a book, and no half-book is left behind
  Given an empty folder called docs/book
  When domainbook new domain ticketing docs/book runs
  Then it refuses with: no book in docs/book — every book has a roadmap.md; run "domainbook init docs/book" to write one, or pass the root of the book you meant
  And docs/book is still empty

Example: A path the shell cannot write to is named rather than thrown
  Given a book at book whose folder this shell may not write to
  When domainbook new domain ticketing book runs
  Then it refuses with: book/domains/ticketing cannot be opened — this shell has no permission for it; change what that path allows, or pass a root you own
  And it exits 1 with no stack trace
```

## Open Questions

- The generated domain page carries placeholder classification axes. Should
  validate say anything about a page that still holds them?

A scaffolded glossary term nobody replaces is counted by `validate` and returned
by `explain_terms`. That cost was weighed in `TDR-0005` in
`domains/core/debt/` and taken over
relaxing the schema to let a glossary hold no terms, so it is not reopened here.
