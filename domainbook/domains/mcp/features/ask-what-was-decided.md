---
id: ask-what-was-decided
name: Ask what was decided
status: implemented
owners: [RafaelAugustScherer]
terms: [decision, domain, book]
decisions: [mcp/ADR-0002, format/ADR-0004, format/ADR-0005]
---

## Story

As an agent starting a change in a context with years of decisions behind it
I want the few that bear on this change, not the log
So that I know what has already been settled without spending the session reading records about something else

## Rule: The answer is an index, and a body comes back only when it is asked for by id

```gherkin
Example: A scoped call answers with one line per record
  Given a book whose ticketing domain holds eleven accepted decisions
  When the client calls get_decisions with domain "ticketing"
  Then the answer holds eleven entries
  And each entry carries the title, the status, the date, the domain and the reference
  And each entry carries one line of outcome
  And no entry carries the record's body

Example: Bodies come back for the records named
  Given a book whose ticketing domain holds eleven accepted decisions
  When the client calls get_decisions with ids ["ticketing/ADR-0004", "ticketing/ADR-0009"]
  Then the answer holds those two records as written, body and all
  And no other record is in the answer

Example: The index is a fraction of the log it indexes
  Given a book whose ticketing domain holds eleven accepted decisions
  When the client calls get_decisions with domain "ticketing"
  Then the answer is smaller than a tenth of those eleven files on disk

Example: A reference that names no record is answered with the log it would be in
  Given a book whose ticketing domain holds eleven accepted decisions
  When the client calls get_decisions with ids ["ticketing/ADR-0099"]
  Then it answers with: no ADR-0099 in domainbook/domains/ticketing/decisions/ — that log runs to ADR-0011
```

## Rule: The answer is scoped, and the whole log has to be asked for out loud

```gherkin
Example: Scoping by changed paths answers with the owning context's records
  Given a book whose ticketing domain claims src/ticketing/** and whose billing domain claims src/billing/**
  And both domains hold decisions, and the book root holds decisions of its own
  When the client calls get_decisions with paths ["src/ticketing/hold.ts"]
  Then every entry is a ticketing record
  And no entry is a billing record

Example: The book's own log is not in a path-scoped answer
  Given a book whose ticketing domain claims src/ticketing/** and whose root log holds ADR-0006
  When the client calls get_decisions with paths ["src/ticketing/hold.ts"]
  Then no entry is ADR-0006
  And every entry is a ticketing record

Example: A folder is scope enough, and does not have to be a file inside it
  Given a book whose ticketing domain claims src/ticketing/**
  When the client calls get_decisions with paths ["src/ticketing"]
  Then every entry is a ticketing record

Example: Paths no domain claims are said to claim nothing
  Given a book whose ticketing domain claims src/ticketing/**
  When the client calls get_decisions with paths ["README.md"]
  Then it answers with: no domain claims those paths — name a domain instead, or pass all to read the whole book

Example: A call with no scope is refused rather than answered with everything
  Given a book holding four domains and forty decisions
  When the client calls get_decisions with no domain, no paths and no ids
  Then it answers with: name a domain, the paths you are changing, or the ids you want — or pass all to read every decision in the book

Example: The whole log comes back when it is asked for
  Given a book holding four domains and forty decisions
  When the client calls get_decisions with all
  Then the answer indexes every live record in the book
```

## Rule: A superseded or rejected record is not in a default answer, and is never gone

```gherkin
Example: Superseding a record takes it out of the answer without deleting it
  Given a book whose ticketing domain holds ADR-0004 reading "superseded by ticketing/ADR-0009"
  When the client calls get_decisions with domain "ticketing"
  Then no entry is ADR-0004
  And the entry for ADR-0009 is there

Example: A superseded record is still reachable by id
  Given a book whose ticketing domain holds ADR-0004 reading "superseded by ticketing/ADR-0009"
  When the client calls get_decisions with ids ["ticketing/ADR-0004"]
  Then the answer holds ADR-0004 as written
  And it carries its status

Example: A rejected record is left out the same way
  Given a book whose ticketing domain holds ADR-0007 reading "rejected"
  When the client calls get_decisions with domain "ticketing"
  Then no entry is ADR-0007

Example: A proposed or deprecated record stays in the answer
  Given a book whose ticketing domain holds ADR-0005 reading "proposed" and ADR-0006 reading "deprecated"
  When the client calls get_decisions with domain "ticketing"
  Then the answer holds ADR-0005 and ADR-0006
  And each entry carries its status
```

## Rule: The one line is the author's own sentence, never a summary made at serve time

```gherkin
Example: The line is the first sentence of the record's Decision Outcome
  Given a decision whose Decision Outcome opens "Chosen option: a scoped index by default."
  When the client calls get_decisions with domain "mcp"
  Then that entry's line reads: Chosen option: a scoped index by default.

Example: A record with no Decision Outcome sentence to lend says so rather than inventing one
  Given a decision whose Decision Outcome section is empty
  When the client calls get_decisions with domain "ticketing"
  Then that entry carries no outcome line
  And the entry is still in the answer with its title, status and date
```

## Open Questions

None.
