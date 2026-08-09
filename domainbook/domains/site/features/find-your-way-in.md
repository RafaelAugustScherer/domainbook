---
id: find-your-way-in
name: Find your way in
status: implemented
owners: [RafaelAugustScherer]
terms: [book, artifact, domain, ubiquitous-language]
decisions: [site/ADR-0001]
---

## Story

As someone who opens this book twice a year
I want a front page that says what is in it and a box that finds any word in it
So that I can reach what I came for without first learning how a book is organised

## Rule: The front page is what the book holds, not the plan for writing it

```gherkin
Example: What the book holds is counted in one line
  Given a book holding five domains, twenty-nine features, forty-nine decisions, eighteen terms and six debt records
  When a reader opens the overview
  Then it reads: This book holds 5 domains, 29 features, 49 decisions, 18 terms, 6 debt records.

Example: The roadmap's prose is a page of its own
  Given a book whose roadmap.md opens "# domainbook roadmap" and carries a body
  When a reader opens the overview
  Then that body is not on it
  And the roadmap page reads it as written, under one heading rather than two
  And no summary of it was made at build time

Example: The front page names where the work is, and the roadmap opens from there
  Given a roadmap whose milestones run from phase-0 done to phase-7 planned, with phase-4 in-progress
  When a reader opens the overview
  Then it names phase-4 and reads in-progress
  And the whole roadmap opens from that line
  And the milestones that are not phase-4 are not on the overview

Example: A roadmap with nothing left in progress says so
  Given a roadmap whose every milestone reads done
  When a reader opens the overview
  Then it reads: Every milestone on the roadmap is done.

Example: The milestones read with the status the roadmap gives them
  Given a roadmap whose milestones run from phase-0 done to phase-7 planned
  When a reader opens the roadmap page
  Then each milestone reads with its name and its status

Example: Every context is listed with enough to choose between them
  Given a book holding ticketing, billing and reporting
  When a reader opens the overview
  Then each is listed with its name
  And each carries its three classification axes
  And each carries the opening sentence of its Purpose
  And each opens its domain page

Example: What each context holds is counted, not listed
  Given a ticketing domain holding four features, eleven decisions, two debt records and nine terms
  When a reader opens the overview
  Then ticketing reads as four features, eleven decisions, two debt records and nine terms
  And none of their titles is on the overview

Example: A context whose canvas does not read is still listed
  Given a ticketing domain whose index.md carries no classification.evolution
  When a reader opens the overview
  Then ticketing is listed
  And in place of its three axes it reads: its canvas does not read
  And the count of issues on it opens ticketing's page
  And every other context reads as it did
```

## Rule: The front page offers only what the book actually holds

```gherkin
Example: A book with no glossary does not offer one
  Given a book with no glossary.md at its root and none in any domain
  When a reader opens the overview
  Then there is no glossary to open

Example: A book with no debt does not offer a register
  Given a book holding no debt records
  When a reader opens the overview
  Then there is no debt register to open

Example: A book written by init and not edited says what to do next
  Given a book holding a roadmap and nothing else
  When a reader opens the overview
  Then it reads: this book has no domains yet — "domainbook new domain <id>" writes the first one
```

## Rule: One box searches every page, and a result says what it found

```gherkin
Example: A word in a feature comes back as that feature
  Given a book whose ticketing feature Place a hold uses the word settlement
  When a reader searches for settlement
  Then Place a hold is a result
  And the result says it is a feature in ticketing
  And it carries the line the word was found in

Example: The same word in two contexts comes back twice, each said apart
  Given ticketing and billing both define settlement in their own glossary
  When a reader searches for settlement
  Then both terms are results
  And each says which context it belongs to

Example: Every artifact type is searchable, not only prose
  Given a book holding a decision, a debt record, a changelog entry and a canvas that each use the word sweep
  When a reader searches for sweep
  Then all four come back
  And each says which artifact type it is

Example: A result opens the page it was found on
  Given a reader has searched for settlement
  When they follow the result for Place a hold
  Then Place a hold's page opens

Example: A result opens under the path the book publishes to
  Given a book whose domainbook.config.yaml carries site.base "/domainbook/"
  And the built site is served at https://example.test/domainbook/
  When a reader searches for settlement and follows the result for Place a hold
  Then https://example.test/domainbook/domains/ticketing/features/place-a-hold/ opens
  And the path is on it once, not twice
```

## Rule: A word the book does not use is answered with the language it does

```gherkin
Example: Nothing found points at the glossary rather than stopping
  Given a book that never uses the word customer
  When a reader searches for customer
  Then it reads: nothing in this book says "customer" — the glossary is where its language is defined
  And the glossary opens from that line

Example: A word only an alias uses still finds the term
  Given a term Debt record whose aliases include TDR
  When a reader searches for TDR
  Then Debt record is a result
```

## Rule: The nav is beside the page, never on top of it

```gherkin
Example: On a wide screen the nav holds its place while the page scrolls
  Given a reader on a screen wider than sixty rem
  When they scroll a long page
  Then the nav stays where it is, in its own column beside the page
  And no part of it is over the page's text

Example: On a narrow screen the nav is above the page and leaves with it
  Given a reader on a screen sixty rem or narrower, where the nav sits above the page
  When they scroll a long page
  Then the nav scrolls away with it
  And no part of it is over the page's text
```

## Open Questions

None.
