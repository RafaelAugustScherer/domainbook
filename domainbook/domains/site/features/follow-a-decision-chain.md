---
id: follow-a-decision-chain
name: Follow a decision chain
status: implemented
owners: [RafaelAugustScherer]
terms: [decision, domain, book, artifact]
decisions: [ADR-0006, format/ADR-0004, format/ADR-0005, format/ADR-0019, site/ADR-0001]
---

## Story

As someone asking why a system is built the way it is
I want the record that settled it and every record that has replaced it since
So that I argue with the choice that is current instead of one that was reversed years ago

## Rule: The log lists every record with what a reader needs to pick one

```gherkin
Example: One line per record, in number order
  Given a ticketing log running from ADR-0001 to ADR-0011
  When a reader opens ticketing's decisions
  Then eleven records are listed
  And they read in number order
  And each carries its reference, its title, its status and its date

Example: A record's own sentence is the line that describes it
  Given a decision whose Decision Outcome opens "Chosen option: a scoped index by default."
  When a reader opens the log holding it
  Then that record's line reads: Chosen option: a scoped index by default.

Example: That sentence reads as markdown, the way it does on the record
  Given a decision whose Decision Outcome opens "Chosen option: `get_changelog`, built on the rules `mcp/ADR-0002` set"
  When a reader opens the log holding it
  Then get_changelog reads as code rather than between backticks
  And mcp/ADR-0002 opens that record from the line

Example: A record with no outcome sentence to lend is listed without one
  Given a decision whose Decision Outcome section is empty
  When a reader opens the log holding it
  Then that record is listed with its title, status and date
  And it carries no outcome line

Example: The book's log and a context's log are told apart
  Given a book holding thirteen root decisions and a ticketing log of eleven
  When a reader opens the book's decisions
  Then the thirteen root records are listed
  And they read as ADR-NNNN
  And ticketing's eleven are not in that list
```

## Rule: A superseded record is a chain that reads in both directions

```gherkin
Example: The old record points at the one that replaced it
  Given ticketing/ADR-0004 reads superseded by ticketing/ADR-0009
  When a reader opens ADR-0004
  Then it reads: superseded by ticketing/ADR-0009
  And ADR-0009 opens from that line

Example: The new record points back at what it replaced
  Given ticketing/ADR-0004 reads superseded by ticketing/ADR-0009
  When a reader opens ADR-0009
  Then it reads: supersedes ticketing/ADR-0004
  And ADR-0004 opens from that line

Example: A chain of three reads end to end
  Given ADR-0002 is superseded by ADR-0005, and ADR-0005 by ADR-0011
  When a reader opens ADR-0011
  Then the chain reads ADR-0002, then ADR-0005, then ADR-0011
  And each of them opens

Example: A superseded record stays in the log rather than disappearing from it
  Given ticketing/ADR-0004 reads superseded by ticketing/ADR-0009
  When a reader opens ticketing's decisions
  Then ADR-0004 is listed
  And it is marked as superseded
  And it is set apart from the records that are current
```

## Rule: A reference in any prose the book holds opens the record

```gherkin
Example: A reference in a canvas section opens the record
  Given ticketing's Business Decisions names format/ADR-0005
  When a reader opens ticketing
  Then format/ADR-0005 opens format's log at that record

Example: A reference in a decision's own body opens the record it names
  Given ADR-0009's Decision Drivers names ticketing/ADR-0004
  When a reader opens ADR-0009
  Then ticketing/ADR-0004 opens from there

Example: A bare reference is the book's log, wherever it is written
  Given a decision in ticketing's log whose body names ADR-0006
  When a reader opens that decision
  Then ADR-0006 opens the book's log at that record
  And it does not open ticketing/ADR-0006

Example: A reference no record answers to is left as text
  Given a canvas naming ADR-0099, which is in no log
  When a reader opens that canvas
  Then ADR-0099 reads as written
  And it does not open anything

Example: A reference inside a gherkin example is left alone
  Given a feature whose example names ADR-0006 inside its fenced block
  When a reader opens that feature
  Then ADR-0006 reads in the block as the example wrote it
  And it does not open anything
```

## Rule: The deprecated badge says less than the word does

```gherkin
Example: The badge is neutral, because the frontmatter cannot tell the two senses apart
  Given a decision whose status is deprecated
  When a reader opens the log holding it
  Then its badge reads: not current
  And the badge does not claim the choice was reversed
  And the badge does not claim the record was retired

Example: The record's own words say which it is
  Given a decision whose status is deprecated and whose More Information says the record was retired for failing the bar in CONTRIBUTING.md
  When a reader opens that record
  Then the badge reads: not current
  And More Information reads on the page as written

Example: A choice that was genuinely reversed reads the same badge and a different body
  Given a decision whose status is deprecated and whose More Information says the practice it describes was dropped
  When a reader opens that record
  Then the badge reads: not current
  And More Information reads on the page as written

Example: The badge says what it means on the record itself
  Given a record badged not current
  When a reader opens that record
  Then the page reads: not current — read this record to see whether the choice was reversed or the record was retired
  And a reader who cannot hover reads it all the same

Example: A record that is current explains nothing it does not need to
  Given a record badged accepted
  When a reader opens it
  Then no sentence under the badge explains the badge
```

## Rule: Every other status reads as itself

```gherkin
Example: A rejected record stays in the log and is marked
  Given ticketing/ADR-0007 reads rejected
  When a reader opens ticketing's decisions
  Then ADR-0007 is listed
  And it is marked rejected

Example: Accepted and proposed read as themselves
  Given a log holding an accepted record and a proposed one
  When a reader opens it
  Then one is marked accepted and the other proposed
```

## Rule: A record reads in MADR order, and says when an agent decided it alone

```gherkin
Example: The body reads in the order MADR sets
  Given a decision holding every optional section
  When a reader opens it
  Then it reads Context and Problem Statement, Decision Drivers, Considered Options, Decision Outcome, Pros and Cons of the Options and More Information
  And Consequences and Confirmation read under Decision Outcome

Example: The people are named
  Given a decision whose decision-makers, consulted and informed are all set
  When a reader opens it
  Then all three lists are named on the page

Example: A record an agent took alone says so
  Given a decision whose frontmatter carries authored-by agent
  When a reader opens it
  Then it reads: an agent took this decision without the decision-makers weighing it

Example: A record nobody flagged that way claims nothing
  Given a decision with no authored-by in its frontmatter
  When a reader opens it
  Then nothing on the page says who wrote it
  And decision-makers is still named
```

## Open Questions

None.
