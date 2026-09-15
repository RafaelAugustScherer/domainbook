---
id: read-a-domain-page
name: Read a domain page
status: implemented
owners: [RafaelAugustScherer]
terms: [domain, canvas, ubiquitous-language, artifact, feature, decision, debt-record]
decisions: [format/ADR-0003, site/ADR-0001]
---

## Story

As someone about to change a part of a system I have not worked in
I want that context's canvas on one page, with everything it holds reachable from it
So that I learn what it is for and who it answers to before I touch a line of it

## Rule: The page is the canvas, in canvas order, under the name and classification

```gherkin
Example: The eight body sections read in canvas order
  Given a ticketing domain page whose body is complete
  When a reader opens ticketing
  Then the page reads Purpose, Domain Roles, Inbound Communication, Outbound Communication, Business Decisions, Assumptions, Verification Metrics and Open Questions
  And they are in that order
  And each section reads as it is written in domainbook/domains/ticketing/index.md

Example: The name and the classification come from frontmatter, above the canvas
  Given a ticketing domain page classified core-domain, revenue-generator, custom-built
  When a reader opens ticketing
  Then the page is headed Ticketing
  And all three classification axes read above the canvas
  And no H1 from the file is on the page, because the file has none

Example: A section the page cannot show is not left silently blank
  Given a ticketing domain page whose Verification Metrics section is empty
  When a reader opens ticketing
  Then Verification Metrics is on the page
  And it reads: this section is empty in domainbook/domains/ticketing/index.md
```

## Rule: The context's ubiquitous language sits where the canvas puts it

```gherkin
Example: The domain's own glossary reads as the canvas section it is
  Given ticketing has a glossary holding nine terms
  When a reader opens ticketing
  Then Ubiquitous Language reads between Strategic Classification and Purpose
  And all nine terms are named there
  And each opens its own entry

Example: A context with no glossary says so rather than dropping the section
  Given a ticketing domain with no glossary.md
  When a reader opens ticketing
  Then Ubiquitous Language reads: ticketing has no glossary yet — its terms are the book's
```

## Rule: The page lists what the context holds and opens each of them

```gherkin
Example: Features, decisions and debt are listed by title
  Given ticketing holds four features, eleven decisions and two debt records
  When a reader opens ticketing
  Then all four features are listed by name
  And all eleven decisions are listed by reference and title
  And both debt records are listed by reference and title
  And each of them opens its own page

Example: A context holding none of an artifact type does not list it
  Given a reporting domain holding no features and no debt records
  When a reader opens reporting
  Then there is no feature list on the page
  And there is no debt list on the page

Example: A context's own logs open as pages of their own
  Given ticketing holds eleven decisions and two debt records
  When a reader opens ticketing
  Then ticketing's decision log opens as a page holding those eleven and no others
  And ticketing's debt opens as a page holding those two and no others

Example: A feature, a decision and a debt record open the context that owns them
  Given a reader is on a ticketing feature, decision or debt record
  When they follow the context named on it
  Then ticketing's page opens
```

## Rule: The code the context claims is on the page

```gherkin
Example: The globs read as written
  Given a ticketing domain claiming src/ticketing/** and src/checkout/hold.ts
  When a reader opens ticketing
  Then both globs read on the page
  And it reads: changing code these globs match means updating this context's book in the same commit, or waiving it

Example: A context that claims no code says what that means
  Given a reporting domain with no code globs
  When a reader opens reporting
  Then it reads: reporting claims no code, so no change to the repo is checked against it
```

## Rule: The contexts it talks to are on the page, each one a link

```gherkin
Example: Every relationship the map holds for this context reads here
  Given ticketing declares a partnership with billing
  And ordering declares customer-supplier with ticketing, upstream
  When a reader opens ticketing
  Then both relationships read on the page
  And billing and ordering each open their own domain page

Example: A relationship the other side declared is not missing from this one
  Given ticketing declares no relationships
  And billing declares customer-supplier with ticketing, downstream
  When a reader opens ticketing
  Then that relationship reads on ticketing's page
  And it reads with billing downstream
```

## Open Questions

None.
