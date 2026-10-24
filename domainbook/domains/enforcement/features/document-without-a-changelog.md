---
id: document-without-a-changelog
name: Document without a changelog
status: ready
owners: [RafaelAugustScherer]
terms: [book, domain, artifact, decision]
decisions: [ADR-0017]
---

## Story

As an agent whose change a domain claims
I want the check, the instructions and the skills to name only what a book can hold
So that I document the change in a feature, a decision or the glossary, and never in a file the book refuses

## Rule: The block names what a domain's book holds, and no changelog

```gherkin
Example: The block message names five kinds of page
  Given a book whose ticketing domain claims src/ticketing/**
  And src/ticketing/hold.ts is staged
  And nothing under domainbook/domains/ticketing/ is staged
  When domainbook check --staged runs
  Then it prints: ticketing: src/ticketing/hold.ts changed and domainbook/domains/ticketing/ did not — update that domain's book (canvas, glossary, a feature, a decision, or a debt record), or waive this commit with a "Skip-Docs: <reason>" trailer
  And it exits 1

Example: A changelog staged in a domain does not clear it
  Given a book whose ticketing domain claims src/ticketing/**
  And src/ticketing/hold.ts and domainbook/domains/ticketing/changelog.md are staged
  When domainbook check --staged runs
  Then it prints the ticketing line
  And it prints: domainbook/domains/ticketing/changelog.md: a book holds no changelog — run "domainbook validate --fix" to delete it, or move it out of domainbook/ if the project keeps one
  And it exits 1
```

## Rule: A change across domains clears with a root decision, not a root changelog

```gherkin
Example: A decision at the book root clears every domain at once
  Given a book whose ticketing domain claims src/ticketing/** and whose billing domain claims src/billing/**
  And src/ticketing/hold.ts and src/billing/refund.ts are staged
  And a new decision under domainbook/decisions/ is staged
  When domainbook check --staged runs
  Then it exits 0

Example: A changelog at the book root clears nothing
  Given a book whose ticketing domain claims src/ticketing/** and whose billing domain claims src/billing/**
  And src/ticketing/hold.ts and src/billing/refund.ts are staged
  And domainbook/changelog.md is staged
  When domainbook check --staged runs
  Then it prints the ticketing line and the billing line
  And it exits 1
```

## Rule: The instructions and the skills name no changelog

```gherkin
Example: The generated instructions name the pages that clear a domain
  Given a book whose ticketing domain claims src/ticketing/**
  When domainbook instructions runs
  Then AGENTS.md says: Any file under a domain's folder clears the check for that domain — the canvas, the glossary, a feature, a decision, or a debt record. A change across several domains updates each of their books, or carries one decision at the book root, under `domainbook/decisions/`.
  And no file it writes mentions a changelog

Example: Instructions written before the removal are stale
  Given a book whose AGENTS.md still names the changelog among the pages that clear a domain
  When domainbook instructions --check runs
  Then it prints: AGENTS.md is out of date — run "domainbook instructions" to write it again
  And it exits 1

Example: document-this-change sends a user-visible change to a feature
  Given an agent running the document-this-change skill for a change to what a domain does
  When it decides what to write
  Then it updates the scenarios of the feature that covers the behaviour, or writes a new feature
  And it writes no changelog entry

Example: record-a-decision retires a record without a changelog
  Given an agent running the record-a-decision skill on a record that failed the bar
  When it retires the record
  Then the record's status is set to deprecated and the choice moves to CONTRIBUTING.md
  And it writes no changelog entry
```

## Open Questions

None.
