---
id: record-a-decision
name: Record a decision
status: implemented
owners: [RafaelAugustScherer]
terms: [decision, slug]
decisions: [format/ADR-0004, format/ADR-0005, format/ADR-0015]
---

## Story

As an agent that has just taken a decision with a cost
I want to write the record and mark what it replaces in one command
So that the old record is superseded rather than quietly edited into the new one

## Rule: A new decision takes the next free number in the log it is written to

```gherkin
Example: Each log counts from 0001 on its own
  Given a book whose ticketing log holds ADR-0001 and ADR-0002
  And a book-level log that holds nothing yet
  When domainbook new decision "Store every timestamp in UTC" runs
  Then it writes domainbook/decisions/0001-store-every-timestamp-in-utc.md
  And a decision written next with --domain ticketing becomes ADR-0003 in that log
```

## Rule: The filename is the number and the title folded to lowercase letters and digits

```gherkin
Example: Accents fold to the letters underneath them
  Given a book written by domainbook init
  When domainbook new decision "Café Order handling" runs
  Then it writes domainbook/decisions/0001-cafe-order-handling.md

Example: A title that gives no filename is refused
  Given a book written by domainbook init
  When domainbook new decision "???" runs
  Then it refuses with: "???" gives no filename — a decision filename is a four-digit number and the title in lowercase letters and digits, and this title has none; write one that has some

Example: A title in a script the folding cannot reach is refused the same way
  Given a book written by domainbook init
  When domainbook new decision "日本語" runs
  Then it refuses with: "日本語" gives no filename — a decision filename is a four-digit number and the title in lowercase letters and digits, and this title has none; write one that has some
```

## Rule: --supersedes changes the old record's status line and nothing else

```gherkin
Example: Superseding rewrites one line of the old file
  Given the ticketing log holds ADR-0001, still proposed
  When domainbook new decision "Extend holds to fifteen minutes" --domain ticketing --supersedes 1 runs
  Then it writes 0002-extend-holds-to-fifteen-minutes.md
  And it says: domainbook/domains/ticketing/decisions/0001-expire-holds-after-ten-minutes.md is now "superseded by ticketing/ADR-0002"
  And every other line of ADR-0001 is unchanged, its date included
```

## Rule: A supersede reference is qualified only inside a domain's own log

```gherkin
Example: A book-level record supersedes with a bare reference
  Given a book-level log holding ADR-0001
  When domainbook new decision "Keep the clock on the server" --supersedes 1 runs
  Then ADR-0001 reads: status: superseded by ADR-0002

Example: A domain record supersedes with its domain in front
  Given the ticketing log holding ADR-0001
  When domainbook new decision "Extend holds to fifteen minutes" --domain ticketing --supersedes 1 runs
  Then ADR-0001 reads: status: superseded by ticketing/ADR-0002
```

## Rule: --supersedes that names no decision writes nothing

```gherkin
Example: A number the log does not hold is answered with the numbers it does
  Given the ticketing log holding only ADR-0001
  When domainbook new decision "Extend holds" --domain ticketing --supersedes 7 runs
  Then it refuses with: no ADR-0007 in domainbook/domains/ticketing/decisions/ — it holds ADR-0001
  And no new decision is written

Example: An empty log says so rather than listing nothing
  Given a book-level log that holds no decisions
  When domainbook new decision "Extend holds" --supersedes 1 runs
  Then it refuses with: no ADR-0001 in domainbook/decisions/ — that log holds no decisions yet, so there is nothing to supersede

Example: A reference where a number belongs is refused
  Given the ticketing log holding ADR-0001
  When domainbook new decision "Extend holds" --domain ticketing --supersedes ADR-0001 runs
  Then it refuses with: "--supersedes ADR-0001" is not a decision number — pass the number of the decision this one replaces, as in "--supersedes 3"
```

## Open Questions

- Two decisions can supersede the same record one after the other, and the old
  record's status only names the later one. Should the second be refused, or is
  a chain through one file enough?
- Nothing writes the reverse link: the new record does not say what it replaces
  unless its author writes it. Should the generator put it in More Information?
