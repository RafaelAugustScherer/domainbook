---
id: read-the-debt-register
name: Read the debt register
status: implemented
owners: [RafaelAugustScherer]
terms: [debt-record, domain, book, decision]
decisions: [ADR-0013, format/ADR-0017, site/ADR-0001]
---

## Story

As someone planning what to work on next
I want every shortcut this system is carrying, worst first
So that a known gap costs a look at one page rather than a surprise in the middle of a change

## Rule: The register lists every record with what it costs and how it happened

```gherkin
Example: One line per record, carrying all four required fields
  Given a book holding six debt records
  When a reader opens the register
  Then six records are listed
  And each carries its reference, its title, its status, its severity, its quadrant and its date

Example: The quadrant reads as Fowler wrote it
  Given a debt record whose quadrant is deliberate-prudent
  When a reader opens the register
  Then that record reads deliberate-prudent
  And the page says the four quadrants answer how the debt happened

Example: The record reads as its three sections
  Given a debt record holding Debt, Impact and Remedy
  When a reader opens it
  Then all three sections read in that order
  And each reads as written

Example: A record is named TDR-NNNN, and only in the log it sits in
  Given a debt record 0001 in ticketing
  When a reader opens the register
  Then it reads TDR-0001
  And it says the log it sits in is domainbook/domains/ticketing/debt/
```

## Rule: The register reads worst first

```gherkin
Example: Severity orders the register
  Given open records of severity low, critical, medium and high
  When a reader opens the register
  Then they read critical, high, medium, low

Example: Records of the same severity keep their log order
  Given ticketing holds two open records of severity high, TDR-0002 and TDR-0005
  When a reader opens the register
  Then TDR-0002 reads before TDR-0005

Example: What is still owed reads before what is settled
  Given a book holding open, accepted and repaid records
  When a reader opens the register
  Then every open record reads before every accepted one
  And every accepted record reads before every repaid one
```

## Rule: A record that is no longer owed stays in the register and says so

```gherkin
Example: A repaid record is marked, not removed
  Given a debt record whose status is repaid
  When a reader opens the register
  Then it is listed
  And it is marked repaid
  And it is set apart from the records still open

Example: A deliberately kept record says it was accepted
  Given a debt record whose status is accepted
  When a reader opens the register
  Then it is marked accepted

Example: The register is a living page, so a record edited in place shows its current state
  Given a record listed as open
  When its status is edited to repaid and the file saved
  Then the register lists it as repaid
  And there is no second record for the same debt
```

## Rule: A record opens the code it claims and the decision it names

```gherkin
Example: The globs read on the record
  Given a debt record claiming src/ticketing/sweep.ts
  When a reader opens it
  Then that glob reads on the page

Example: A decision the record names opens from it
  Given a debt record naming ticketing/ADR-0004 in its decisions
  When a reader opens it
  Then ADR-0004 is named with its title
  And it opens from there

Example: A record tracing to nothing says what that costs
  Given a debt record with no code globs and no decisions
  When a reader opens it
  Then it reads: this record traces to no code and no decision, so nothing in the repo points back at it

Example: A context's register reads on its own domain page
  Given ticketing holds two debt records and billing holds one
  When a reader opens ticketing
  Then ticketing's two are listed there
  And billing's is not
```

## Rule: A book with no debt says so rather than showing an empty table

```gherkin
Example: Nothing recorded yet
  Given a book holding no debt records
  When a reader looks for the register
  Then there is no register to open
  And the overview does not offer one

Example: A context with no debt of its own
  Given a reporting domain holding no debt records
  When a reader opens reporting
  Then there is no debt list on the page
```

## Open Questions

None.
