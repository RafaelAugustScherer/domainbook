---
id: serve-the-book-without-a-changelog
name: Serve the book without a changelog
status: ready
owners: [RafaelAugustScherer]
terms: [book, domain, artifact]
decisions: [ADR-0017]
---

## Story

As an agent connected to a book over MCP
I want the server to offer only what the book holds
So that I never call for a changelog the book no longer keeps, and learn what changed from the decisions and git

## Rule: The server offers no changelog tool

```gherkin
Example: The tool list holds seven tools
  Given a repo with a valid book at domainbook
  When a client asks for the tools
  Then it is offered search_book, get_domain, get_context_map, explain_terms, get_feature, get_decisions and where_to_document
  And it is not offered get_changelog

Example: A call to the old tool is answered as an unknown tool
  Given a repo with a valid book at domainbook
  When the client calls get_changelog with domain "ticketing"
  Then the server answers that get_changelog is not a tool it offers
```

## Rule: Nothing the server answers points at a changelog

```gherkin
Example: where_to_document names what counts as writing in a domain
  Given a book whose ticketing domain claims src/ticketing/**
  When the client calls where_to_document with paths ["src/ticketing/hold.ts"]
  Then it names the canvas, the glossary, a feature, a decision and a debt record as what counts as writing in it

Example: Two domains in one change are cleared by one root decision
  Given a book whose ticketing domain claims src/ticketing/** and whose billing domain claims src/billing/**
  When the client calls where_to_document with paths ["src/ticketing/hold.ts", "src/billing/refund.ts"]
  Then it says a decision under domainbook/decisions/ clears both at once
  And it does not name domainbook/changelog.md

Example: A domain's answer lists no changelog
  Given a book whose ticketing domain is valid
  When the client calls get_domain with id "ticketing"
  Then the answer does not mention a changelog or get_changelog

Example: search_book has no changelog kind
  Given a repo with a valid book at domainbook
  When the client calls search_book with query "hold" and kind "changelog"
  Then it refuses the kind, naming the kinds it searches
  And none of them is changelog

Example: The resource list holds no changelog
  Given a repo with a valid book at domainbook
  When a client lists the resources
  Then no resource is a changelog
```

## Open Questions

None.
