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
  Given a book at domainbook with one domain, one feature, three decisions and two debt records
  When domainbook validate runs
  Then it prints: domainbook is a valid book — 1 domain, 1 feature, 3 decisions, 0 terms, 2 debt records
  And it exits 0

Example: A book somewhere else is read from where it was named
  Given a book written at docs/book with one domain
  When domainbook validate docs/book runs
  Then it prints: docs/book is a valid book — 1 domain, 0 features, 0 decisions, 0 terms, 0 debt records
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

## Rule: An empty frontmatter block is a different mistake from no frontmatter

```gherkin
Example: A fence that declares nothing names the fences it sits between
  Given a domain page whose frontmatter block holds only blank lines
  When domainbook validate runs
  Then the line is at line 1
  And it says: frontmatter is empty — a domain page needs "id", "name", and "classification" between the --- fences

Example: A page with no fence at all is told to write one
  Given a domain page that opens straight into its Purpose
  When domainbook validate runs
  Then the line says: no frontmatter — a domain page needs "id", "name", and "classification" in a --- block at the top of the file

Example: An artifact that carries no frontmatter is told to delete the block
  Given a glossary that opens with a --- block
  When domainbook validate runs
  Then the line is at line 1
  And it says: a glossary carries no frontmatter — delete the --- block; a term is an H2 heading with its definition below it

Example: A glossary with no block at all is not an issue
  Given a glossary that opens with its first term
  When domainbook validate runs
  Then no line is about the glossary
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
