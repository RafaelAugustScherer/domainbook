---
id: explain-a-term
name: Explain a term
status: implemented
owners: [RafaelAugustScherer]
terms: [ubiquitous-language, slug, feature, domain]
decisions: [format/ADR-0005, ADR-0005, mcp/ADR-0002]
---

## Story

As an agent about to write code in a context whose words I do not know
I want what this context means by them, and where they are already used
So that I write the name the book has rather than inventing a second one for the same thing

## Rule: A term comes back with what it means here and what it touches

```gherkin
Example: A term defined in one context
  Given a book whose billing glossary defines settlement
  And two billing features whose terms list holds settlement
  When the client calls explain_terms with names ["settlement"]
  Then the answer holds the definition as written in domainbook/domains/billing/glossary.md
  And it names billing as the context that defines it
  And it names both features by id and by the file they live in
  And it carries the term's status and its examples

Example: A term with aliases carries them
  Given a book whose ticketing glossary defines seat map with the alias seating chart
  When the client calls explain_terms with names ["seat map"]
  Then the answer carries seating chart as an alias

Example: An alias finds the term it is an alias for
  Given a book whose ticketing glossary defines seat map with the alias seating chart
  When the client calls explain_terms with names ["seating chart"]
  Then the answer holds the definition of seat map
  And it says seating chart is an alias of it

Example: A term defined at the book root belongs to no context
  Given a book whose root glossary defines waiver
  When the client calls explain_terms with names ["waiver"]
  Then the answer holds the definition from domainbook/glossary.md
  And it names no context as its owner

Example: A term no feature references is still a term
  Given a book whose ticketing glossary defines row lock
  And no feature whose terms list holds row lock
  When the client calls explain_terms with names ["row lock"]
  Then the answer holds the definition
  And it says no feature references it
```

## Rule: A word two contexts define comes back twice, and neither wins

```gherkin
Example: One word, two meanings, both returned
  Given a book whose ticketing glossary defines sale and whose billing glossary defines sale differently
  When the client calls explain_terms with names ["sale"]
  Then the answer holds both definitions
  And each is named by the context that wrote it
  And neither is marked as the right one

Example: Asking within a context answers with that context's word
  Given a book whose ticketing glossary defines sale and whose billing glossary defines sale differently
  When the client calls explain_terms with names ["sale"] and domain "billing"
  Then the answer holds only the billing definition

Example: A context's own word wins over the root's for that context, and both are shown
  Given a book whose root glossary defines hold and whose ticketing glossary defines hold differently
  When the client calls explain_terms with names ["hold"] and domain "ticketing"
  Then the answer holds the ticketing definition first
  And it holds the root definition after it, named as the book's
```

## Rule: A word the book does not define is answered as one it does not have

```gherkin
Example: An unknown word is not guessed at
  Given a book whose ticketing glossary defines hold and seat map
  When the client calls explain_terms with names ["reservation"]
  Then it answers with: no "reservation" in this book
  And it names hold and seat map as the terms this book does define near it
  And it holds no definition of reservation

Example: A word off by a capital or an accent still finds its term
  Given a book whose billing glossary defines café order
  When the client calls explain_terms with names ["Café Order"]
  Then the answer holds the definition of café order

Example: A book with no glossary at all says so
  Given a book whose domains keep no glossary and whose root glossary is absent
  When the client calls explain_terms with names ["settlement"]
  Then it answers with: this book has no glossary yet — "domainbook new domain" writes one per context, and domainbook/glossary.md holds the words every context shares
```

## Rule: Several words are one call, not several

```gherkin
Example: Three words asked at once come back in one answer
  Given a book whose billing glossary defines settlement, chargeback and capture
  When the client calls explain_terms with names ["settlement", "chargeback", "capture"]
  Then the answer holds all three definitions
  And each is named by the word that was asked for

Example: One unknown word among three does not lose the other two
  Given a book whose billing glossary defines settlement and capture
  When the client calls explain_terms with names ["settlement", "reservation", "capture"]
  Then the answer holds settlement and capture
  And it says reservation is not in this book
```

## Rule: A deprecated term says so rather than being hidden

```gherkin
Example: A deprecated term is answered, marked
  Given a book whose ticketing glossary defines booking with the status deprecated
  When the client calls explain_terms with names ["booking"]
  Then the answer holds the definition
  And it says the term is deprecated

Example: A draft term is answered, marked
  Given a book whose ticketing glossary defines row lock with the status draft
  When the client calls explain_terms with names ["row lock"]
  Then the answer says the term is a draft
```

## Open Questions

None.
