---
id: export-the-glossary-to-contextive
name: Export the glossary to Contextive
status: implemented
owners: [RafaelAugustScherer]
terms: [ubiquitous-language, domain]
---

## Story

As a developer who wants the book's terms to explain themselves in my editor
I want the glossary as Contextive definition files
So that "hold" or "settlement" hovers where I read the code, in the same words the book keeps

## Rule: Each glossary becomes a Contextive context

```gherkin
Example: A domain glossary is one context, scoped to that domain's code
  Given a ticketing domain whose code globs are src/ticketing/**
  And its glossary defines Hold and Seat map
  When domainbook export contextive runs
  Then domainbook/build/contextive/ticketing.glossary.yml declares one context
  And that context applies to src/ticketing/**
  And it holds a term for Hold and a term for Seat map

Example: The book-level glossary is a context that applies everywhere
  Given a book-level glossary defining Book and Waiver
  When domainbook export contextive runs
  Then domainbook/build/contextive/shared.glossary.yml declares a context with no path scope
  And it holds a term for Book and a term for Waiver
```

## Rule: A term carries its definition, its aliases and its examples

```gherkin
Example: Aliases and examples travel with the definition
  Given a Member term defined as a signed-in customer, with alias "user" and an example "a member holds seats"
  When domainbook export contextive runs
  Then the Member entry carries that definition
  And it lists "user" among its aliases
  And it lists "a member holds seats" among its examples
```

## Rule: A deprecated term is left out, and the run says how many

```gherkin
Example: A word the book has retired does not hover
  Given a glossary of three terms, one of them deprecated
  When domainbook export contextive runs
  Then the exported context holds two terms
  And it prints: left out 1 deprecated term
```

## Rule: A glossary with only its scaffold term still exports a valid context

```gherkin
Example: The one placeholder term a new book carries becomes one Contextive term
  Given a book written by domainbook init, its glossary holding the single scaffold term
  When domainbook export contextive runs
  Then domainbook/build/contextive/shared.glossary.yml declares a context with one term
  And the file loads as Contextive definitions
```

## Open Questions

None.
