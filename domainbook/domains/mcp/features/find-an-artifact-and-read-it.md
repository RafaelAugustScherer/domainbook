---
id: find-an-artifact-and-read-it
name: Find an artifact and read it
status: implemented
owners: [RafaelAugustScherer]
terms: [artifact, book, feature, rule, decision]
decisions: [mcp/ADR-0002, format/ADR-0008, mcp/ADR-0001]
---

## Story

As an agent with a question the book probably answers somewhere
I want to find the artifact first and read it second
So that one bad guess costs me a line of results instead of a folder of files

## Rule: A hit says what it is and how to fetch it, and is never the artifact itself

```gherkin
Example: A search returns locators, not bodies
  Given a book where the phrase "ten minutes" appears in a ticketing feature and in a ticketing decision
  When the client calls search_book with query "ten minutes"
  Then the answer holds two hits
  And each carries the artifact type, the domain, the file and the id to fetch it by
  And each carries the line the phrase was found on and enough of it to recognise
  And neither carries the artifact's body

Example: The number of hits is bounded, and the answer says when it cut
  Given a book where "hold" appears in forty artifacts
  When the client calls search_book with query "hold"
  Then the answer holds no more than twenty hits
  And it says how many artifacts matched in all

Example: Nothing found is said plainly
  Given a book that nowhere mentions escrow
  When the client calls search_book with query "escrow"
  Then it answers with: nothing in this book matches "escrow"
  And it holds no hits
```

## Rule: Search reaches every artifact type, and can be narrowed to one

```gherkin
Example: Every type is searched by default
  Given a book whose roadmap, glossary, changelog, canvas, feature, decision and debt record all hold the word settlement
  When the client calls search_book with query "settlement"
  Then the answer holds a hit of each of those seven types

Example: Narrowing by type answers with that type only
  Given a book whose ticketing feature and ticketing decision both hold the word settlement
  When the client calls search_book with query "settlement" and type "feature"
  Then every hit is a feature

Example: Narrowing by domain answers within that context
  Given a book where settlement appears in a ticketing artifact and in a billing artifact
  When the client calls search_book with query "settlement" and domain "billing"
  Then every hit is a billing artifact
```

## Rule: A record the book has retired is not in results

```gherkin
Example: A superseded decision does not come back from search
  Given a book whose ticketing ADR-0004 reads "superseded by ticketing/ADR-0009" and holds the word settlement
  When the client calls search_book with query "settlement"
  Then no hit is ticketing/ADR-0004

Example: A rejected decision does not come back either
  Given a book whose ticketing ADR-0007 reads "rejected" and holds the word settlement
  When the client calls search_book with query "settlement"
  Then no hit is ticketing/ADR-0007

Example: A retired record is still reachable when it is named
  Given a book whose ticketing ADR-0004 reads "superseded by ticketing/ADR-0009"
  When the client calls get_decisions with ids ["ticketing/ADR-0004"]
  Then the answer holds it
```

## Rule: A feature comes back whole, because its examples are the thing worth reading

```gherkin
Example: The story, the rules and the examples come back as written
  Given a ticketing feature holding a story, three rules and seven gherkin examples
  When the client calls get_feature with id "hold-seats-during-checkout"
  Then the answer holds the story
  And it holds all three rules with their examples under them
  And the gherkin reads exactly as it is written in the file

Example: The frontmatter comes with it
  Given a ticketing feature whose status is implemented and whose terms list holds hold and seat map
  When the client calls get_feature with id "hold-seats-during-checkout"
  Then the answer carries the status implemented
  And it names hold and seat map
  And it names the decisions the feature references

Example: Two features with the same id in different contexts are told apart
  Given a book where ticketing and billing each hold a feature with the id refund-an-order
  When the client calls get_feature with id "refund-an-order"
  Then it answers with: two contexts hold a feature "refund-an-order" — pass domain "billing" or domain "ticketing"

Example: A feature that is not there is answered with the ones that are
  Given a ticketing domain holding hold-seats-during-checkout and expire-a-hold
  When the client calls get_feature with id "cancel-a-hold" and domain "ticketing"
  Then it answers with: no feature "cancel-a-hold" in ticketing — it holds expire-a-hold and hold-seats-during-checkout

Example: An open question on a feature comes back with it
  Given a ticketing feature whose Open Questions section holds two questions
  When the client calls get_feature with id "hold-seats-during-checkout"
  Then the answer holds both questions
```

## Open Questions

None.
