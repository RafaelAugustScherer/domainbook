---
id: read-what-changed
name: Read what changed
status: implemented
owners: [RafaelAugustScherer]
terms: [book, domain, artifact, decision]
decisions: [ADR-0006, site/ADR-0001]
---

## Story

As someone coming back to a system after months away
I want the releases in order with what each one changed
So that I can catch up on what moved without reading a diff of every commit since

## Rule: The timeline reads newest first, with Unreleased at the top

```gherkin
Example: Releases read in reverse date order
  Given a changelog holding 0.4.0 dated 2026-07-30, 0.3.0 dated 2026-06-11 and 0.2.0 dated 2026-05-02
  When a reader opens the changelog
  Then they read 0.4.0, then 0.3.0, then 0.2.0
  And each carries its date

Example: Unreleased sits above every dated release, and says it is not one
  Given a changelog holding an Unreleased section and three dated releases
  When a reader opens the changelog
  Then Unreleased reads first
  And it reads: not released yet
  And it carries no date

Example: A release is addressable by its version
  Given a changelog holding 0.3.0
  When a reader opens the changelog
  Then 0.3.0 has an address of its own
  And following it opens the timeline at that release
```

## Rule: A release reads as the buckets it actually has

```gherkin
Example: Only the buckets with entries read
  Given a release holding Added and Fixed entries and nothing else
  When a reader opens the changelog
  Then Added and Fixed read under it
  And Changed, Deprecated, Removed and Security are not shown empty

Example: The buckets read in Keep a Changelog's order
  Given a release holding entries in all six buckets
  When a reader opens the changelog
  Then they read Added, Changed, Deprecated, Removed, Fixed, Security

Example: An entry reads as its author wrote it
  Given a release holding an Added entry of four sentences
  When a reader opens the changelog
  Then all four sentences read
  And nothing was shortened at build time
```

## Rule: A context's changelog reads on the context, and the book's on the book

```gherkin
Example: A domain's own changelog is on its page
  Given ticketing holds a changelog and billing does not
  When a reader opens ticketing
  Then ticketing's changelog reads there
  And it opens as a page of its own

Example: A context with no changelog does not offer one
  Given billing holds no changelog.md
  When a reader opens billing
  Then there is no changelog on the page

Example: The book's changelog does not swallow the contexts'
  Given the book holds a changelog and ticketing holds one of its own
  When a reader opens the book's changelog
  Then it reads the book's entries
  And ticketing's entries are not mixed into it
  And it says ticketing keeps a changelog of its own
```

## Rule: A decision named in an entry opens from it

```gherkin
Example: A qualified reference is a link
  Given an entry naming mcp/ADR-0002
  When a reader opens the changelog
  Then mcp/ADR-0002 opens the mcp log at that record

Example: A bare reference opens the book's log
  Given an entry naming ADR-0006
  When a reader opens the changelog
  Then ADR-0006 opens the book's log at that record

Example: A reference that names no record is left as text
  Given an entry naming ADR-0099, which is in no log
  When a reader opens the changelog
  Then ADR-0099 reads as written
  And it does not open anything
```

## Rule: A book with no changelog says so

```gherkin
Example: Nothing recorded yet
  Given a book with no changelog.md at its root and none in any context
  When a reader looks for the changelog
  Then there is no changelog to open
  And the overview does not offer one
```

## Open Questions

None.
