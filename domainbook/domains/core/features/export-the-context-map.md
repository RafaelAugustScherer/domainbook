---
id: export-the-context-map
name: Export the context map
status: ready
owners: [RafaelAugustScherer]
terms: [domain, book]
decisions: [format/ADR-0006, format/ADR-0007, site/ADR-0003]
---

## Story

As someone taking the book's boundaries into a modelling or diagramming tool
I want the context map in the dialect that tool reads
So that the map I review is the one the book declares, not one I redrew by hand

## Rule: The map is the union of every relationship the book declares

```gherkin
Example: A relationship declared once by either side is drawn once in every dialect
  Given ticketing declares an upstream-downstream relationship with seating, ticketing downstream
  And seating declares nothing about ticketing
  When domainbook export mermaid runs
  Then domainbook/build/mermaid/context-map.mmd holds one edge between ticketing and seating
  And a second edge between the same two contexts is not drawn
```

## Rule: export mermaid writes a flowchart that parses, from the site's own derivation

```gherkin
Example: A node per domain and an edge per relationship
  Given a book whose domains are ticketing, seating and access-control
  And ticketing is downstream of seating, and seating and access-control go separate ways
  When domainbook export mermaid runs
  Then domainbook/build/mermaid/context-map.mmd names a node for ticketing, seating and access-control
  And it draws the ticketing–seating edge and the seating–access-control edge
  And the file parses as a Mermaid flowchart

Example: The nodes and edges are the site's derivation, not a second one
  Given a book the site has built a context map for
  When domainbook export mermaid runs
  Then the nodes and edges it writes are the nodes and edges the site's map is built from
  And it does not carry the site-relative links the published map adds for its own navigation
```

## Rule: export cml writes Context Mapper DSL that parses, and says what it could not translate

```gherkin
Example: A customer-supplier edge becomes a bounded context pair and their relationship
  Given ordering declares a customer-supplier relationship with billing, ordering downstream
  When domainbook export cml runs
  Then domainbook/build/cml/context-map.cml declares a BoundedContext for ordering and one for billing
  And its ContextMap contains both and declares a Customer-Supplier relationship between them
  And Context Mapper reads the file without error
  And it exits 0

Example: A separate-ways edge is skipped and named, never dropped in silence
  Given seating and access-control declare a separate-ways relationship
  When domainbook export cml runs
  Then domainbook/build/cml/context-map.cml carries no edge between seating and access-control
  And it prints: skipped 1 separate-ways relationship Context Mapper has no production for: access-control — seating

Example: A map that is only separate-ways still writes a file and still reports the skip
  Given a book whose only relationship is a separate-ways edge between seating and access-control
  When domainbook export cml runs
  Then domainbook/build/cml/context-map.cml holds the two bounded contexts and no relationship
  And it prints: skipped 1 separate-ways relationship Context Mapper has no production for: access-control — seating
```

## Rule: export structurizr writes a system landscape that loads

```gherkin
Example: A workspace with a system per domain and a landscape view
  Given a book whose domains are ticketing and seating, ticketing downstream of seating
  When domainbook export structurizr runs
  Then domainbook/build/structurizr/context-map.dsl declares a workspace holding a model and views
  And the model declares a softwareSystem for ticketing and one for seating
  And it declares a relationship from ticketing to seating
  And the views declare a systemLandscape including every context
  And the file loads in Structurizr

Example: A hyphenated context name becomes a hyphen-free identifier
  Given a book whose domains include access-control and seating
  When domainbook export structurizr runs
  Then the softwareSystem for access-control carries the identifier accessControl, with no hyphen
  And its display name is the domain's own name
  And every relationship that names it uses accessControl, not access-control

Example: A separate-ways edge is skipped and named, as it is for Context Mapper
  Given seating and access-control declare a separate-ways relationship
  When domainbook export structurizr runs
  Then domainbook/build/structurizr/context-map.dsl carries no relationship between seating and access-control
  And it prints: skipped 1 separate-ways relationship Structurizr has no non-directional edge for: access-control — seating
```

## Rule: A book with no relationships exports the contexts and no edges, in every dialect

```gherkin
Example: mermaid draws the lone node and reports the count
  Given a book whose only domain is ticketing, declaring no relationships
  When domainbook export mermaid runs
  Then domainbook/build/mermaid/context-map.mmd names a node for ticketing and draws no edge
  And it prints: 1 domain, 0 relationships

Example: cml writes the bounded context and no relationship
  Given a book whose only domain is ticketing, declaring no relationships
  When domainbook export cml runs
  Then domainbook/build/cml/context-map.cml declares a BoundedContext for ticketing and no relationship
  And it prints: 1 domain, 0 relationships

Example: structurizr writes the softwareSystem and no relationship
  Given a book whose only domain is ticketing, declaring no relationships
  When domainbook export structurizr runs
  Then domainbook/build/structurizr/context-map.dsl declares a softwareSystem for ticketing and no relationship
  And it prints: 1 domain, 0 relationships
```

## Open Questions

None.
