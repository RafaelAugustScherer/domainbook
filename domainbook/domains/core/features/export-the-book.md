---
id: export-the-book
name: Export the book
status: ready
owners: [RafaelAugustScherer]
terms: [book, book-root, artifact]
decisions: [format/ADR-0020, core/ADR-0003]
---

## Story

As an agent that keeps a book other tools have to read
I want one command that turns the book into the formats those tools speak
So that the map, the glossary and the scenarios reach a modeller, an editor or a test runner without me copying them by hand

## Rule: Every export lands under the book's build folder, and the repo root never notices

```gherkin
Example: An export says where it wrote, under the book it read
  Given a book at domainbook
  When domainbook export json runs
  Then it prints: wrote domainbook/build/json/
  And every file it wrote is under domainbook/build/

Example: A book somewhere else exports beside itself
  Given a book at docs/book
  When domainbook export json docs/book runs
  Then it prints: wrote docs/book/build/json/
  And nothing outside docs/book is written

Example: The build folder ignores itself, so no export is ever committed by accident
  Given a book at domainbook
  When domainbook export json runs
  Then domainbook/build/.gitignore holds a single line reading: *
  And git status names nothing under domainbook/build/

Example: An export is not an artifact, so validate counts the same book after it as before
  Given domainbook validate prints: domainbook is a valid book — 1 domain, 1 feature, 0 decisions, 3 terms, 0 debt records
  When domainbook export json runs
  Then domainbook validate prints the same line

Example: A build folder the shell cannot write to is named, not thrown
  Given a book at domainbook whose build folder this shell may not write to
  When domainbook export json runs
  Then it refuses with: domainbook/build/json cannot be opened — this shell has no permission for it; change what that path allows, or export from a book you own
  And it exits 1 with no stack trace
```

## Rule: An export names one target, and an unknown one is answered with the ones that exist

```gherkin
Example: Naming no target lists the targets
  Given a book at domainbook
  When domainbook export runs
  Then it refuses with: export what? — the targets are contextive, cml, gherkin, json, mermaid and structurizr, as in "domainbook export json"
  And it exits 1

Example: A target that does not exist is answered with the ones that do
  Given a book at domainbook
  When domainbook export xml runs
  Then it refuses with: no export "xml" — the targets are contextive, cml, gherkin, json, mermaid and structurizr
  And it exits 1
```

## Rule: An export reads a book that validates, and refuses one that does not

```gherkin
Example: A book with an issue is not exported, and points at validate
  Given a book whose feature status reads shipped
  When domainbook export json runs
  Then it refuses with: domainbook does not validate — run "domainbook validate" to see what is wrong, fix it, then export again
  And nothing under domainbook/build/ is written
  And it exits 1

Example: No book at all is reported as no book
  Given a repo with no domainbook folder
  When domainbook export json runs
  Then it prints: domainbook: no book here — run "domainbook init domainbook" to write one
  And it exits 1
```

## Rule: Re-running an export replaces what it wrote before, leaving nothing stale

```gherkin
Example: A source removed between runs leaves no orphan behind
  Given a book whose ticketing domain holds two features, hold-a-seat and refund-an-order
  And domainbook export gherkin has written domainbook/build/gherkin/ticketing/hold-a-seat.feature and refund-an-order.feature
  When refund-an-order is deleted from the book
  And domainbook export gherkin runs again
  Then domainbook/build/gherkin/ticketing/ holds hold-a-seat.feature
  And it holds no file for refund-an-order
```

## Open Questions

None.
