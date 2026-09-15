---
id: read-a-domain-and-its-map
name: Read a domain and its map
status: implemented
owners: [RafaelAugustScherer]
terms: [domain, canvas, book, ubiquitous-language]
decisions: [format/ADR-0006, format/ADR-0007, mcp/ADR-0002]
---

## Story

As an agent handed a task in a context I have never worked in
I want that context's canvas and the contexts it talks to
So that I know what it is for and who it answers to before I change a line of it

## Rule: A domain comes back as its canvas, with an index of what it holds

```gherkin
Example: The canvas comes back as written, in canvas order
  Given a book whose ticketing domain page is complete
  When the client calls get_domain with id "ticketing"
  Then the answer holds Purpose, Domain Roles, Inbound Communication, Outbound Communication, Business Decisions, Assumptions, Verification Metrics and Open Questions
  And they are in that order
  And each section reads as it is written in domainbook/domains/ticketing/index.md

Example: The name and the classification come from frontmatter
  Given a ticketing domain page classified core-domain, revenue-generator, custom-built
  When the client calls get_domain with id "ticketing"
  Then the answer carries the name Ticketing
  And it carries all three classification axes

Example: The code it claims is part of the answer
  Given a book whose ticketing domain claims src/ticketing/** and src/checkout/hold.ts
  When the client calls get_domain with id "ticketing"
  Then the answer names both globs

Example: What the domain holds comes back as a list, not as bodies
  Given a ticketing domain holding four features, eleven decisions, two debt records and a glossary of nine terms
  When the client calls get_domain with id "ticketing"
  Then the answer names the four features by id
  And it says there are eleven decisions, two debt records and nine terms
  And it holds none of their bodies
  And it names get_feature, get_decisions and explain_terms as the way to read them

Example: A domain that is not in the book is answered with the ones that are
  Given a book whose domains are ticketing and billing
  When the client calls get_domain with id "shipping"
  Then it answers with: no domain "shipping" in this book — it holds billing and ticketing
```

## Rule: The map is the union of what both sides declared, and each relationship appears once

```gherkin
Example: A relationship declared by one side is on the map
  Given a book where billing declares a customer-supplier relationship with ordering, downstream
  And ordering declares no relationships
  When the client calls get_context_map
  Then the map holds one relationship between billing and ordering
  And it reads customer-supplier, with billing downstream

Example: The same relationship declared by both sides is one edge, not two
  Given a book where billing declares customer-supplier with ordering downstream
  And ordering declares customer-supplier with billing upstream
  When the client calls get_context_map
  Then the map holds exactly one relationship between billing and ordering

Example: Patterns come back on the side that declared them
  Given a book where billing declares customer-supplier with ordering, downstream, patterns [ACL]
  When the client calls get_context_map
  Then the map carries ACL on billing's side of that relationship

Example: A symmetric relationship carries no direction and no patterns
  Given a book where ticketing declares a partnership with billing
  When the client calls get_context_map
  Then that relationship reads partnership
  And it carries no direction
  And it carries no patterns

Example: A context that declares nothing is still on the map
  Given a book whose reporting domain declares no relationships and nobody names it
  When the client calls get_context_map
  Then the map holds reporting
  And it says reporting is connected to nothing

Example: Every context on the map carries its classification
  Given a book holding ticketing, billing and reporting
  When the client calls get_context_map
  Then each carries its three classification axes
  And each carries its name
```

## Rule: The map answers the whole book, and can be narrowed to one context's neighbours

```gherkin
Example: Narrowing to one context gives it and what it touches
  Given a book holding ticketing, billing, ordering and reporting
  And ticketing declares a partnership with billing and nothing else
  When the client calls get_context_map with domain "ticketing"
  Then the map holds ticketing and billing
  And it holds neither ordering nor reporting

Example: A book with one domain is a map of one
  Given a book whose only domain is ticketing
  When the client calls get_context_map
  Then the map holds ticketing and no relationships

Example: A book with no domains says so
  Given a book written by domainbook init and not edited
  When the client calls get_context_map
  Then it answers with: this book has no domains yet — "domainbook new domain <id>" writes the first one
```

## Open Questions

None.
