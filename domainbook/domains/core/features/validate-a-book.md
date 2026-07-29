---
id: validate-a-book
name: Validate a book
status: implemented
owners: [RafaelAugustScherer]
terms: [book, book-root, issue, artifact]
decisions: [core/ADR-0003, format/ADR-0006]
---

## Story

As an agent that has just changed a repo
I want one command that reads the whole book and tells me everything wrong with it
So that I fix the book while I still know what I changed

## Rule: A book with nothing wrong prints one line and exits 0

```gherkin
Example: A valid book reports what it holds
  Given a book at domainbook with one domain, one feature and three decisions
  When domainbook validate runs
  Then it prints: domainbook is a valid book — 1 domain, 1 feature, 3 decisions, 0 terms
  And it exits 0

Example: A book somewhere else is read from where it was named
  Given a book written at docs/book with one domain
  When domainbook validate docs/book runs
  Then it prints: docs/book is a valid book — 1 domain, 0 features, 0 decisions, 0 terms
```

## Rule: Every issue is one line, and any issue at all exits 1

```gherkin
Example: Two issues in two files come back in file order
  Given a feature whose status reads shipped
  And a domain page in the folder ticketing whose id reads tickets
  When domainbook validate runs
  Then the first line is about the feature file, at line 4, field status
  And it says: must be one of "draft", "ready", "implemented", "deprecated"
  And the second line is about the domain page, at line 2, field id
  And it says: "tickets" does not match the folder "ticketing" — rename the folder to "tickets" or set id to "ticketing"
  And it exits 1

Example: No book at all is reported as no book
  Given a repo with no domainbook folder
  When domainbook validate runs
  Then it prints: domainbook: no book here — run "domainbook init domainbook" to write one
  And it exits 1
```

## Rule: One mistake gets one message

```gherkin
Example: Frontmatter that declares nothing is reported once, not once per key
  Given a decision whose frontmatter block is empty
  When domainbook validate runs
  Then it prints exactly one line
  And the line says: frontmatter is empty — a decision needs "status" and "date" between the --- fences
```

## Rule: A contradiction between two pages is filed on the first page that declares it

```gherkin
Example: Mirrored halves that disagree are one issue, not two
  Given seating declares a shared-kernel relationship with ticketing
  And ticketing declares a partnership relationship with seating
  When domainbook validate runs
  Then it prints exactly one line
  And the line is filed on domains/seating/index.md, field relationships[0].type
  And it says: "shared-kernel" contradicts "partnership" declared in domains/ticketing/index.md — mirrored declarations of the same relationship must agree
```

## Open Questions

- Should there be a way to validate only the artifacts a change touched, or is
  the whole book always the right unit to read?
