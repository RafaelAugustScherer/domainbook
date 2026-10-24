---
id: record-technical-debt
name: Record technical debt
status: implemented
owners: [RafaelAugustScherer]
terms: [debt-record, slug]
decisions: [ADR-0013, format/ADR-0017]
---

## Story

As an agent that has just found a shortcut it is not going to fix now
I want to write the debt down where the next agent will read it
So that the finding outlives the session instead of ending up in a PR body

## Rule: A new debt record takes the next free number in the log it is written to

```gherkin
Example: Each log counts from 0001 on its own
  Given a book whose ticketing debt log holds TDR-0001 and TDR-0002
  And a book-level debt log that holds nothing yet
  When domainbook new debt "Door scanners trust their own clock" runs
  Then it writes domainbook/debt/0001-door-scanners-trust-their-own-clock.md
  And a debt record written next with --domain ticketing becomes TDR-0003 in that log

Example: The decision log next door does not move the number
  Given a book whose ticketing decision log holds ADR-0001, ADR-0002 and ADR-0003
  And a ticketing debt log that holds nothing yet
  When domainbook new debt "Holds are swept by hand" --domain ticketing runs
  Then it writes domainbook/domains/ticketing/debt/0001-holds-are-swept-by-hand.md
```

## Rule: The filename is the number and the title in the title's own letters

```gherkin
Example: A title outside Latin gives a filename in its own script
  Given a book written by domainbook init
  When domainbook new debt "日本語" runs
  Then it writes domainbook/debt/0001-日本語.md

Example: A title that gives no filename is refused
  Given a book written by domainbook init
  When domainbook new debt "???" runs
  Then it refuses with: "???" gives no filename — a debt record filename is a four-digit number and the title in letters and digits, and this title has none; write one that has some
  And no debt record is written
```

## Rule: The record it writes validates as it stands

```gherkin
Example: The scaffold passes validate before anyone edits it
  Given a book written by domainbook init with one domain
  When domainbook new debt "Holds are swept by hand" --domain ticketing runs
  Then it says: next: set the severity and the quadrant, fill in the sections, then "domainbook validate"
  And domainbook validate exits 0
  And the file holds status open, today's date, severity medium and quadrant deliberate-prudent
  And the severity line carries a comment saying both are placeholders
```

## Rule: --supersedes is not an option on a debt record

```gherkin
Example: Superseding a debt record is refused, because it is edited in place
  Given the ticketing debt log holds TDR-0001, still open
  When domainbook new debt "Holds are swept by hand" --domain ticketing --supersedes 1 runs
  Then it refuses with: "--supersedes" is not an option here — usage: domainbook new debt "<title>" [root] [--domain <domain-id>]
  And no debt record is written
  And TDR-0001 is unchanged
```

## Open Questions

- Repaying debt means editing `status` to `repaid` by hand. Should there be a
  command for it, the way `--supersedes` writes the decision it replaces?
- `severity` and `quadrant` are written as placeholders that validate. Nothing
  distinguishes a record whose author set them from one that kept the scaffold's
  guess. Should a fresh record be `draft` until someone answers both?
- The marker outlives its own truth. `new debt` writes
  `severity: medium # severity and quadrant are placeholders — set them before
  anyone reads this`, and the moment the author writes `severity: high` that
  comment asserts something false and then sits in their book saying it forever.
  `format/ADR-0017` records that nothing checks whether anyone read the comment;
  this is the other half — nothing takes it back out. It is the repo's own
  reason for banning explanatory comments (`CONTRIBUTING.md`), arriving in
  output the tool writes on someone else's behalf. Should the scaffold write a
  marker the tool can remove, or write none?
