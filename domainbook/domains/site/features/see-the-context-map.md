---
id: see-the-context-map
name: See the context map
status: implemented
owners: [RafaelAugustScherer]
terms: [domain, book, canvas]
decisions: [format/ADR-0006, format/ADR-0007, site/ADR-0001]
---

## Story

As someone meeting a system for the first time
I want a diagram of its contexts and how they answer to each other
So that I can see the shape of it without anyone having drawn it by hand

## Rule: The map is drawn from relationships frontmatter and nothing else

```gherkin
Example: A relationship declared by one side is on the map
  Given billing declares a customer-supplier relationship with ordering, downstream
  And ordering declares no relationships
  When a reader opens the context map
  Then there is one edge between billing and ordering
  And it reads customer-supplier, with billing downstream

Example: The same relationship declared by both sides is one edge, not two
  Given billing declares customer-supplier with ordering downstream
  And ordering declares customer-supplier with billing upstream
  When a reader opens the context map
  Then there is exactly one edge between billing and ordering

Example: Patterns are drawn on the side that declared them
  Given billing declares customer-supplier with ordering, downstream, patterns [ACL]
  When a reader opens the context map
  Then ACL reads on billing's end of that edge

Example: A symmetric relationship is drawn without a direction
  Given ticketing declares a partnership with billing
  When a reader opens the context map
  Then that edge reads partnership
  And it carries no arrowhead

Example: A context nobody names is still on the map
  Given a reporting domain that declares no relationships and that nobody declares against
  When a reader opens the context map
  Then reporting is on the map
  And it has no edges

Example: There is no diagram to edit and none to fall out of date
  Given a book whose ticketing domain drops its partnership with billing
  When a reader opens the context map
  Then that edge is gone
  And no file in the book had to be redrawn
```

## Rule: separate-ways is drawn as a dashed edge that says what it is

```gherkin
Example: The edge is drawn, because it was declared
  Given billing declares separate-ways with reporting
  When a reader opens the context map
  Then there is an edge between billing and reporting
  And it is dashed
  And it is labelled separate-ways

Example: It cannot be mistaken for a channel
  Given billing declares separate-ways with reporting
  And billing declares customer-supplier with ordering
  When a reader opens the context map
  Then the billing–reporting edge is dashed and the billing–ordering edge is not
  And the dashed edge carries no arrowhead

Example: The map says what a dashed edge means
  Given a book holding at least one separate-ways relationship
  When a reader opens the context map
  Then it reads: a dashed edge is separate-ways — the two contexts deliberately do not integrate
```

## Rule: Every context on the map carries its classification and opens its page

```gherkin
Example: A node says what kind of subdomain it is
  Given ticketing is classified core-domain, revenue-generator, custom-built
  When a reader opens the context map
  Then ticketing's node carries all three axes

Example: A node opens the canvas behind it
  Given a map holding ticketing
  When a reader follows ticketing on the map
  Then ticketing's domain page opens

Example: The map reads on the domain page too, narrowed to that context
  Given a book holding ticketing, billing, ordering and reporting
  And ticketing declares a partnership with billing and nothing else
  When a reader opens ticketing's domain page
  Then the map on it holds ticketing and billing
  And it holds neither ordering nor reporting
```

## Rule: The drawing stays readable whatever the book declares

```gherkin
Example: An edge between contexts with something between them goes around it
  Given seating is upstream of ticketing and ticketing upstream of access-control
  And seating declares separate-ways with access-control
  When a reader opens the context map
  Then the seating–access-control edge does not cross the ticketing node
  And no edge crosses any node

Example: Two edges into the same context arrive on their own
  Given format and core are both upstream of enforcement
  When a reader opens the context map
  Then the two edges reach enforcement at different points
  And neither is drawn on top of the other

Example: Every edge carries its label, and no label is drawn over another
  Given a book holding six relationships
  When a reader opens the context map
  Then six labels read
  And no two of them are drawn at the same place
```

## Rule: A book with no map to draw says so rather than drawing an empty one

```gherkin
Example: A book with no domains
  Given a book written by domainbook init and not edited
  When a reader opens the context map
  Then it reads: this book has no domains yet — "domainbook new domain <id>" writes the first one
  And no diagram is drawn

Example: A book with one domain is a map of one
  Given a book whose only domain is ticketing
  When a reader opens the context map
  Then ticketing is drawn
  And there are no edges
```

## Open Questions

None.
