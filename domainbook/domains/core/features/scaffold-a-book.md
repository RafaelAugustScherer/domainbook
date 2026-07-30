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
Example: init writes a roadmap and a config, and the book is valid
  Given a repo with no book
  When domainbook init runs
  Then it writes domainbook/roadmap.md and domainbook/domainbook.config.yaml
  And domainbook validate prints: domainbook is a valid book — 0 domains, 0 features, 0 decisions, 0 terms, 0 debt records

Example: The book root is the last argument, and it defaults to domainbook
  Given domainbook init docs/book has written a book
  When domainbook new domain ticketing docs/book runs
  Then domainbook validate docs/book prints: docs/book is a valid book — 1 domain, 0 features, 0 decisions, 0 terms, 0 debt records
```

## Rule: Every generator writes a page that still validates

```gherkin
Example: A domain, a feature and a decision written one after another
  Given a book written by domainbook init
  When domainbook new domain ticketing runs
  And domainbook new feature hold-seats-during-checkout --domain ticketing runs
  And domainbook new decision "Expire holds after ten minutes" --domain ticketing runs
  Then domainbook validate prints: domainbook is a valid book — 1 domain, 1 feature, 1 decision, 0 terms, 0 debt records
  And each command has printed what is left to fill in on the page it wrote
```

## Rule: init refuses a root that is not an empty folder

```gherkin
Example: A second init names what is already there
  Given a book already written at domainbook
  When domainbook init runs again
  Then it refuses with: "domainbook" is not empty — it holds "domainbook.config.yaml"; "domainbook init" writes a new book into an empty folder, so pass another root, or edit the book that is already here
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

- init writes a roadmap and a config and nothing else. Should it also write a
  glossary and a changelog, or is an empty artifact worse than a missing one?
- The generated domain page carries placeholder classification axes. Should
  validate say anything about a page that still holds them?
