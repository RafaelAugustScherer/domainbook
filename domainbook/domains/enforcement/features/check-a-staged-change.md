---
id: check-a-staged-change
name: Check a staged change
status: implemented
owners: [RafaelAugustScherer]
terms: [waiver, book-root, debt-record, domain]
decisions: [enforcement/ADR-0001, enforcement/ADR-0003, format/ADR-0018]
---

## Story

As a developer or an agent about to commit
I want the commit refused when I changed code a domain claims and left that domain's book alone
So that the book is never one commit behind the code it describes

## Rule: Code a domain claims, with that domain's book untouched, blocks the commit

```gherkin
Example: One domain's code changed and its book did not
  Given a book whose ticketing domain claims src/ticketing/**
  And src/ticketing/hold.ts is staged
  And nothing under domainbook/domains/ticketing/ is staged
  When domainbook check --staged runs
  Then it prints: ticketing: src/ticketing/hold.ts changed and domainbook/domains/ticketing/ did not — update that domain's book (canvas, glossary, changelog, a feature, a decision, or a debt record), or waive this commit with a "Skip-Docs: <reason>" trailer
  And it exits 1

Example: The same change with the domain's book staged passes
  Given a book whose ticketing domain claims src/ticketing/**
  And src/ticketing/hold.ts is staged
  And domainbook/domains/ticketing/changelog.md is staged
  When domainbook check --staged runs
  Then it prints: domainbook: 1 domain checked, nothing stale
  And it exits 0

Example: Any file under the domain's folder clears it, not one named file
  Given a book whose ticketing domain claims src/ticketing/**
  And src/ticketing/hold.ts is staged
  And domainbook/domains/ticketing/features/place-a-hold.md is staged
  When domainbook check --staged runs
  Then it exits 0

Example: A book edit that was written but never staged is named as the near miss
  Given a book whose ticketing domain claims src/ticketing/**
  And src/ticketing/hold.ts is staged
  And domainbook/domains/ticketing/changelog.md is edited in the working tree and not staged
  When domainbook check --staged runs
  Then it prints the ticketing line
  And it prints: domainbook/domains/ticketing/changelog.md is edited but not staged — "git add domainbook/domains/ticketing/changelog.md" clears this
  And it exits 1

Example: Three or more stale files are named to three and counted after that
  Given a book whose ticketing domain claims src/ticketing/**
  And src/ticketing/hold.ts, src/ticketing/expiry.ts, src/ticketing/seat.ts and src/ticketing/row.ts are staged
  And nothing under domainbook/domains/ticketing/ is staged
  When domainbook check --staged runs
  Then the line reads: ticketing: src/ticketing/expiry.ts, src/ticketing/hold.ts, src/ticketing/row.ts and 1 more changed and domainbook/domains/ticketing/ did not — update that domain's book (canvas, glossary, changelog, a feature, a decision, or a debt record), or waive this commit with a "Skip-Docs: <reason>" trailer
```

## Rule: A path no domain claims is not the check's business

```gherkin
Example: An unmapped path passes without being mentioned
  Given a book whose ticketing domain claims src/ticketing/**
  And README.md and scripts/release.sh are staged
  When domainbook check --staged runs
  Then it prints: domainbook: nothing staged that a domain claims
  And it exits 0
  And no line names README.md or scripts/release.sh

Example: A domain that claims nothing never blocks
  Given a book whose reporting domain declares no code globs
  And src/reporting/export.ts is staged
  When domainbook check --staged runs
  Then it exits 0
  And no line names reporting

Example: The book itself is not code
  Given a book whose ticketing domain claims src/ticketing/**
  And only domainbook/domains/ticketing/index.md is staged
  When domainbook check --staged runs
  Then it exits 0
```

## Rule: A commit across two domains needs both books, or one record at the book root

```gherkin
Example: Two domains changed and one book updated blocks on the other
  Given a book whose ticketing domain claims src/ticketing/** and whose billing domain claims src/billing/**
  And src/ticketing/hold.ts and src/billing/refund.ts are staged
  And domainbook/domains/ticketing/changelog.md is staged
  When domainbook check --staged runs
  Then it prints exactly one line
  And the line begins: billing: src/billing/refund.ts changed and domainbook/domains/billing/ did not
  And it exits 1

Example: A decision at the book root clears every domain at once
  Given a book whose ticketing domain claims src/ticketing/** and whose billing domain claims src/billing/**
  And src/ticketing/hold.ts and src/billing/refund.ts are staged
  And domainbook/decisions/0014-charge-on-capture.md is staged
  When domainbook check --staged runs
  Then it exits 0

Example: A changelog entry at the book root clears every domain at once
  Given a book whose ticketing domain claims src/ticketing/** and whose billing domain claims src/billing/**
  And src/ticketing/hold.ts and src/billing/refund.ts are staged
  And domainbook/changelog.md is staged
  When domainbook check --staged runs
  Then it exits 0

Example: Another root artifact is not a cross-cutting record
  Given a book whose ticketing domain claims src/ticketing/** and whose billing domain claims src/billing/**
  And src/ticketing/hold.ts and src/billing/refund.ts are staged
  And domainbook/glossary.md is staged
  When domainbook check --staged runs
  Then it prints two lines, one for billing and one for ticketing
  And it exits 1

Example: A file renamed out of one domain and into another is a change to both
  Given a book whose ticketing domain claims src/ticketing/** and whose billing domain claims src/billing/**
  And src/ticketing/refund.ts is staged as renamed to src/billing/refund.ts
  And neither domain's book is staged
  When domainbook check --staged runs
  Then it prints two lines, one for billing and one for ticketing
  And it exits 1

Example: One path claimed by two domains needs both of their books
  Given a book whose ticketing domain claims src/checkout/** and whose billing domain claims src/checkout/**
  And src/checkout/total.ts is staged
  And domainbook/domains/billing/changelog.md is staged
  When domainbook check --staged runs
  Then it prints exactly one line
  And the line begins: ticketing: src/checkout/total.ts changed and domainbook/domains/ticketing/ did not
```

## Rule: Advisory mode reports the same finding and lets the commit through

```gherkin
Example: warn prints the block it would have made and exits 0
  Given a book whose config sets enforcement.mode to warn
  And a book whose ticketing domain claims src/ticketing/**
  And src/ticketing/hold.ts is staged
  And nothing under domainbook/domains/ticketing/ is staged
  When domainbook check --staged runs
  Then the line begins: ticketing: src/ticketing/hold.ts changed and domainbook/domains/ticketing/ did not
  And it exits 0
```

## Rule: Open debt over the staged paths is named, and never changes the verdict

```gherkin
Example: A passing commit still hears about the debt it is walking into
  Given a book whose ticketing domain claims src/ticketing/**
  And TDR-0002 in domains/ticketing/debt/ is open and claims src/ticketing/**
  And src/ticketing/hold.ts and domainbook/domains/ticketing/changelog.md are staged
  When domainbook check --staged runs
  Then it prints: TDR-0002 is open over src/ticketing/hold.ts — read domainbook/domains/ticketing/debt/0002-holds-are-swept-by-hand.md before you change this
  And it exits 0

Example: Debt that is accepted or repaid is not raised
  Given a book whose ticketing domain claims src/ticketing/**
  And TDR-0001 in domains/ticketing/debt/ is repaid and claims src/ticketing/**
  And TDR-0003 in domains/ticketing/debt/ is accepted and claims src/ticketing/**
  And src/ticketing/hold.ts and domainbook/domains/ticketing/changelog.md are staged
  When domainbook check --staged runs
  Then no line names TDR-0001 or TDR-0003

Example: A blocked commit hears both, and the block is what decides the exit code
  Given a book whose ticketing domain claims src/ticketing/**
  And TDR-0002 in domains/ticketing/debt/ is open and claims src/ticketing/**
  And src/ticketing/hold.ts is staged
  And nothing under domainbook/domains/ticketing/ is staged
  When domainbook check --staged runs
  Then one line begins: ticketing: src/ticketing/hold.ts changed and domainbook/domains/ticketing/ did not
  And one line begins: TDR-0002 is open over src/ticketing/hold.ts
  And it exits 1
```

## Rule: A book that does not validate is not a book to check against

```gherkin
Example: The check refuses rather than judging a change against a broken map
  Given a book whose ticketing domain page declares an id that does not match its folder
  And src/ticketing/hold.ts is staged
  When domainbook check --staged runs
  Then it prints: domainbook: this book does not validate, so the code it claims cannot be trusted — run "domainbook validate" and fix what it names, then commit again
  And it exits 1
  And no line names ticketing
```

## Open Questions

None.
