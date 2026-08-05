---
id: ask-where-to-document
name: Ask where to document
status: implemented
owners: [RafaelAugustScherer]
terms: [book, domain, enforcement-loop, debt-record]
decisions: [ADR-0011, enforcement/ADR-0001, mcp/ADR-0002]
---

## Story

As an agent about to change code in a repo whose book I have not read
I want to be told which book files that change belongs in
So that I write them while the change is still in front of me, instead of when a hook stops me

## Rule: Given the paths of a change, it names the book each one belongs to

```gherkin
Example: One domain's code maps to that domain's book
  Given a book whose ticketing domain claims src/ticketing/**
  When the client calls where_to_document with paths ["src/ticketing/hold.ts"]
  Then the answer names ticketing
  And it names domainbook/domains/ticketing/ as the folder to write in
  And it names the canvas, the glossary, the changelog, a feature, a decision and a debt record as what counts as writing in it

Example: Two domains in one change are two answers, and one root record clears both
  Given a book whose ticketing domain claims src/ticketing/** and whose billing domain claims src/billing/**
  When the client calls where_to_document with paths ["src/ticketing/hold.ts", "src/billing/refund.ts"]
  Then the answer names ticketing and billing
  And it says a decision under domainbook/decisions/ or an entry in domainbook/changelog.md clears both at once

Example: A path no domain claims is not the tool's business
  Given a book whose ticketing domain claims src/ticketing/**
  When the client calls where_to_document with paths ["README.md", "scripts/release.sh"]
  Then the answer names no domain
  And it says nothing in this change is claimed by a domain
  And no line names README.md or scripts/release.sh

Example: A domain that claims nothing is never named
  Given a book whose reporting domain declares no code globs
  When the client calls where_to_document with paths ["src/reporting/export.ts"]
  Then no line names reporting

Example: A folder answers for everything under it
  Given a book whose ticketing domain claims src/ticketing/**
  When the client calls where_to_document with paths ["src/ticketing"]
  Then the answer names ticketing
```

## Rule: A book file already in the change is not asked for again

```gherkin
Example: The domain's book is in the change, so nothing is left to write
  Given a book whose ticketing domain claims src/ticketing/**
  When the client calls where_to_document with paths ["src/ticketing/hold.ts", "domainbook/domains/ticketing/changelog.md"]
  Then the answer names no domain as needing a change
  And it says the book already covers this change

Example: One domain written and another not leaves only the one that is not
  Given a book whose ticketing domain claims src/ticketing/** and whose billing domain claims src/billing/**
  When the client calls where_to_document with paths ["src/ticketing/hold.ts", "src/billing/refund.ts", "domainbook/domains/ticketing/changelog.md"]
  Then the answer names billing
  And no line names ticketing
```

## Rule: It reaches the same answer the commit hook would, because it runs the same check

```gherkin
Example: What the tool asks for is what the hook demands
  Given a book whose ticketing domain claims src/ticketing/**
  And src/ticketing/hold.ts is staged and nothing under domainbook/domains/ticketing/ is
  When the client calls where_to_document with the staged paths
  Then it names the domain domainbook check --staged names
  And writing any file it names makes domainbook check --staged exit 0

Example: A file renamed out of one domain and into another is a change to both
  Given a book whose ticketing domain claims src/ticketing/** and whose billing domain claims src/billing/**
  When the client calls where_to_document with paths ["src/ticketing/refund.ts", "src/billing/refund.ts"]
  Then the answer names ticketing and billing

Example: One path claimed by two domains needs both of their books
  Given a book whose ticketing domain claims src/checkout/** and whose billing domain claims src/checkout/**
  When the client calls where_to_document with paths ["src/checkout/total.ts"]
  Then the answer names ticketing and billing
```

## Rule: Open debt over the paths comes back with the answer

```gherkin
Example: The debt on the path is named alongside where to write
  Given a book whose ticketing domain claims src/ticketing/**
  And TDR-0002 in domains/ticketing/debt/ is open and claims src/ticketing/**
  When the client calls where_to_document with paths ["src/ticketing/hold.ts"]
  Then the answer names TDR-0002 and domainbook/domains/ticketing/debt/0002-holds-are-swept-by-hand.md
  And it says to read that record before changing this code

Example: Debt that is accepted or repaid is not raised
  Given a book whose ticketing domain claims src/ticketing/**
  And TDR-0001 in domains/ticketing/debt/ is repaid and claims src/ticketing/**
  And TDR-0003 in domains/ticketing/debt/ is accepted and claims src/ticketing/**
  When the client calls where_to_document with paths ["src/ticketing/hold.ts"]
  Then no line names TDR-0001 or TDR-0003

Example: Debt is named on a change the book already covers
  Given a book whose ticketing domain claims src/ticketing/**
  And TDR-0002 in domains/ticketing/debt/ is open and claims src/ticketing/**
  When the client calls where_to_document with paths ["src/ticketing/hold.ts", "domainbook/domains/ticketing/changelog.md"]
  Then the answer says the book already covers this change
  And it still names TDR-0002
```

## Rule: Paths are read from the repo root, and one that is not says so

```gherkin
Example: An absolute path is answered with the path to pass instead
  Given a book whose ticketing domain claims src/ticketing/**
  When the client calls where_to_document with paths ["/Users/dev/app/src/ticketing/hold.ts"]
  Then it answers with: paths are read from the repo root — pass "src/ticketing/hold.ts" rather than an absolute path
  And it names no domain

Example: A path climbing out of the repo is refused the same way
  Given a book whose ticketing domain claims src/ticketing/**
  When the client calls where_to_document with paths ["../other-repo/src/ticketing/hold.ts"]
  Then it answers with: paths are read from the repo root — "../other-repo/src/ticketing/hold.ts" climbs out of it

Example: No paths at all is a question with no answer, not an error
  Given a book whose ticketing domain claims src/ticketing/**
  When the client calls where_to_document with paths []
  Then it says there are no paths to place
```

## Open Questions

None.
