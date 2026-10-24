---
id: ask-what-peers-are-writing
name: Ask what peers are writing
status: implemented
owners: [RafaelAugustScherer]
terms: [peer, draft, remote, sync, decision, book]
decisions: [ADR-0015]
---

## Story

As an agent asking the book before it decides
I want a peer's unmerged decision, term, or feature in the answer, marked as unmerged
So that I neither miss it nor mistake it for something settled

## Rule: Every tool that reads the book answers with peers' work, marked as in progress

```gherkin
Example: A decision index carries a peer's unmerged record
  Given main's billing log holds ADR-0001 to ADR-0003
  And carol@example.com's branch feat/outbox holds domainbook/domains/billing/decisions/0004-use-an-outbox.md, proposed
  When the client calls get_decisions with domain "billing"
  Then the answer holds four entries
  And the fourth reads billing/ADR-0004, proposed, and carries: in progress — carol@example.com on feat/outbox (branch, 2 hours ago)
  And the first three carry no such line

Example: A term only a peer has defined is explained, with where it comes from
  Given no glossary on main defines "chargeback"
  And bob@example.com's draft on feat/refunds defines it in domainbook/domains/billing/glossary.md
  When the client calls explain_terms with ["chargeback"]
  Then the answer explains chargeback as bob's draft does
  And it carries: in progress — bob@example.com on feat/refunds (draft, 3 minutes ago)

Example: A feature only a peer has written is returned, marked
  Given no feature refund-order on main
  And bob@example.com's draft holds domainbook/domains/billing/features/refund-order.md
  When the client calls get_feature with id "refund-order"
  Then the answer is that feature as the draft holds it
  And it carries the in-progress line

Example: search_book finds a peer's artifact
  Given carol@example.com's branch feat/outbox holds a decision titled "Use an outbox"
  When the client calls search_book with query "outbox"
  Then a locator for carol's decision is in the answer
  And it carries the in-progress line
```

## Rule: A merged artifact and a peer's unchanged copy of it are one answer

```gherkin
Example: A peer's copy of a merged record does not repeat it
  Given bob@example.com's draft carries main's billing/ADR-0002 byte for byte
  When the client calls get_decisions with domain "billing"
  Then billing/ADR-0002 is one entry, from main, with no in-progress line

Example: A peer's edit of a merged term is a second reading, not a replacement
  Given main defines "refund" in the billing glossary
  And bob@example.com's draft edits that definition
  When the client calls explain_terms with ["refund"]
  Then the answer carries main's definition first
  And then bob's, with the in-progress line
```

## Rule: The server syncs on its own, and never more than once a minute

```gherkin
Example: Two calls ten seconds apart fetch once
  Given the server synced 10 seconds ago
  When the client calls get_decisions
  Then no fetch runs
  And the answer is from what was last fetched

Example: A call after a minute fetches first
  Given the server synced 61 seconds ago
  When the client calls get_decisions
  Then a fetch runs before the answer

Example: A remote out of reach dates the answer instead of failing it
  Given origin cannot be reached
  When the client calls get_decisions
  Then the answer holds main's records and peers' as of the last fetch
  And it carries: peers as of 14:02 — origin not reachable
```

## Rule: A peer's broken artifact is never an error of this book

```gherkin
Example: An unreadable peer file is counted in the answer
  Given bob@example.com's draft holds a decision whose frontmatter does not parse
  When the client calls get_decisions with domain "billing"
  Then the answer holds main's records and the peer records that parse
  And it carries: 1 in-progress artifact from bob@example.com on feat/refunds cannot be read yet
```

## Rule: What a commit has to document does not change with peers

```gherkin
Example: where_to_document answers the same with peers in progress
  Given two peers in progress in the billing domain
  When the client calls where_to_document with ["src/billing/refund.ts"]
  Then the answer names domainbook/domains/billing/ as it would with no peers
```

## Open Questions

None.
