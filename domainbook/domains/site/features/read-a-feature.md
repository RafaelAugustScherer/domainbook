---
id: read-a-feature
name: Read a feature
status: implemented
owners: [RafaelAugustScherer]
terms: [feature, rule, artifact, decision, ubiquitous-language]
decisions: [format/ADR-0008, site/ADR-0001]
---

## Story

As someone who needs to know how a part of the system is supposed to behave
I want the story, the rules and the concrete examples on one page
So that I can read the agreed behaviour without reading the test code that happens to check it

## Rule: A feature reads as its story, its rules and its examples, in the order it is written

```gherkin
Example: The page follows the file
  Given a feature Place a hold holding a story and three rules
  When a reader opens it
  Then the story reads first
  And the three rules follow in the order the file has them
  And each rule's examples read under it

Example: The story reads as the three lines it is
  Given a feature whose story is an As a, an I want and a So that
  When a reader opens it
  Then all three lines read
  And they are not run together into a paragraph

Example: A rule is addressable on its own
  Given a feature holding a rule A hold expires ten minutes after it is placed
  When a reader opens the feature
  Then that rule has an address of its own
  And following it opens the feature at that rule
```

## Rule: Gherkin is highlighted, and it is text — nothing on the page runs it

```gherkin
Example: The keywords are set apart from the prose
  Given a rule whose example holds Given, When, Then and And steps
  When a reader opens the feature
  Then each keyword is set apart from the step that follows it
  And the step text reads as written

Example: There is nothing to run
  Given a feature holding six examples
  When a reader opens it
  Then no example offers to run
  And no example reports a pass or a fail

Example: An example is addressable, so it can be pointed at in a review
  Given a rule holding an example A hold placed at noon expires at ten past
  When a reader opens the feature
  Then that example has an address of its own
```

## Rule: The terms and decisions a feature names open from the page

```gherkin
Example: A term in frontmatter is a link on the page
  Given a feature listing hold and settlement in its terms
  When a reader opens it
  Then both terms are named on the page
  And each opens its glossary entry

Example: A decision in frontmatter is a link on the page
  Given a feature listing ticketing/ADR-0004 and ADR-0006 in its decisions
  When a reader opens it
  Then both are named with their titles
  And ticketing/ADR-0004 opens ticketing's own log
  And ADR-0006 opens the book's log

Example: A feature naming neither shows neither
  Given a feature with no terms and no decisions in its frontmatter
  When a reader opens it
  Then there is no empty term list
  And there is no empty decision list
```

## Rule: Status is on the feature and in the list it appears in

```gherkin
Example: Each of the four statuses reads
  Given a ticketing domain holding a draft, a ready, an implemented and a deprecated feature
  When a reader opens ticketing
  Then each feature is listed with its status
  And each feature's own page carries the same status

Example: A draft feature is marked as behaviour not yet built
  Given a feature with status draft
  When a reader opens it
  Then it reads: this feature is a draft — the behaviour on this page is proposed, not built
```

## Rule: Open Questions closes the page, and reads None when there is nothing

```gherkin
Example: The section is last, whatever else the feature holds
  Given a feature holding a story, four rules and an Open Questions section
  When a reader opens it
  Then Open Questions is the last section on the page

Example: A feature with nothing open says so rather than hiding the section
  Given a feature whose Open Questions section reads None.
  When a reader opens it
  Then Open Questions reads None.
```

## Open Questions

None.
