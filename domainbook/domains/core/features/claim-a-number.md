---
id: claim-a-number
name: Claim a number
status: implemented
owners: [RafaelAugustScherer]
terms: [claim, remote, draft, peer, sync, decision]
decisions: [ADR-0015, format/ADR-0021]
---

## Story

As an agent writing a decision on a branch no peer has fetched
I want the number I take reserved on the remote the moment I take it
So that a peer on another branch cannot take the same one

## Rule: The next number counts everything the remote knows, not only this working tree

```gherkin
Example: A number a peer's draft holds is skipped
  Given a book whose book-level log holds ADR-0001 to ADR-0003 on main
  And a peer's draft on origin holds domainbook/decisions/0004-retry-webhooks.md
  When domainbook new decision "Use an outbox" runs
  Then it writes domainbook/decisions/0005-use-an-outbox.md
  And origin holds refs/domainbook/claims/decisions/0005

Example: A claim with no file behind it yet counts the same
  Given a book whose book-level log holds ADR-0001 to ADR-0003 on main
  And origin holds refs/domainbook/claims/decisions/0004 and no branch or draft holds a file for it
  When domainbook new decision "Use an outbox" runs
  Then it writes domainbook/decisions/0005-use-an-outbox.md

Example: A number on a peer's pushed branch counts without a draft
  Given a book whose book-level log holds ADR-0001 to ADR-0003 on main
  And origin's branch feat/webhooks holds domainbook/decisions/0004-retry-webhooks.md and no draft
  When domainbook new decision "Use an outbox" runs
  Then it writes domainbook/decisions/0005-use-an-outbox.md

Example: Each log is claimed under its own key
  Given a book whose ticketing log holds ADR-0001 and ADR-0002
  When domainbook new decision "Expire holds after ten minutes" --domain ticketing runs
  Then it writes domainbook/domains/ticketing/decisions/0003-expire-holds-after-ten-minutes.md
  And origin holds refs/domainbook/claims/domains/ticketing/decisions/0003
  And the book-level log's next number is unchanged

Example: A debt record is claimed like a decision
  Given a book whose book-level debt log holds TDR-0001
  When domainbook new debt "Manual sweep of expired holds" runs
  Then it writes domainbook/debt/0002-manual-sweep-of-expired-holds.md
  And origin holds refs/domainbook/claims/debt/0002
```

## Rule: A claim is created once and never moved

```gherkin
Example: Two peers racing for one number each get a number of their own
  Given two clones of a repo whose book-level log holds ADR-0001 to ADR-0003 on main
  And neither clone has fetched since
  When both run domainbook new decision within the same second
  Then one writes 0004-*.md and the other writes 0005-*.md
  And origin holds one claim for decisions/0004 and one for decisions/0005
  And neither push was forced

Example: A claim that keeps losing the race is refused rather than forced
  Given a claim push rejected five times running because the number was taken each time
  When domainbook new decision "Use an outbox" runs
  Then it refuses with: could not claim a decision number on origin in 5 tries — a peer is claiming faster than this clone can fetch; run "domainbook sync" and try again
  And no file is written
```

## Rule: A claim says who took it, on which branch, and for what

```gherkin
Example: The claim is a root commit with an empty tree and the facts in its message
  Given git's user.email is alice@example.com and the branch is feat/outbox
  When domainbook new decision "Use an outbox" runs
  Then refs/domainbook/claims/decisions/0004 on origin is a commit authored by alice@example.com
  And the commit has no parent and an empty tree
  And its message reads:
    """
    claim decisions/0004

    branch: feat/outbox
    title: Use an outbox
    """
```

## Rule: A slug is claimed the same way, and a taken slug is refused

```gherkin
Example: A feature id a peer is already writing is refused with where to read it
  Given bob@example.com's draft on feat/refunds holds domainbook/domains/billing/features/refund-order.md
  When domainbook new feature refund-order --domain billing runs
  Then it refuses with: refund-order is already being written by bob@example.com on feat/refunds — read it with "domainbook status domains/billing/features/refund-order.md", then pick another id or continue on that branch
  And nothing is written

Example: A feature id is claimed under the path that identifies it
  Given no peer holds or claims domains/billing/features/refund-order
  When domainbook new feature refund-order --domain billing runs
  Then it writes domainbook/domains/billing/features/refund-order.md
  And origin holds refs/domainbook/claims/domains/billing/features/refund-order

Example: A domain id is claimed under its index, beside the records inside it
  When domainbook new domain billing runs
  Then origin holds refs/domainbook/claims/domains/billing/index
  And a later claim for domains/billing/decisions/0001 lands next to it
```

## Rule: With the remote out of reach, the number is taken locally and the claim waits

```gherkin
Example: An offline new writes the file and names what is still owed
  Given origin cannot be reached
  And the book-level log holds ADR-0001 to ADR-0003 as far as this clone knows
  When domainbook new decision "Use an outbox" runs
  Then it writes domainbook/decisions/0004-use-an-outbox.md
  And it prints: ADR-0004 is not claimed on origin (could not reach it) — the next "domainbook sync" with the network up claims it, and the commit hook refuses the file until then
  And .git/domainbook/pending names decisions/0004

Example: What this clone last fetched still counts while offline
  Given the last sync fetched a peer's claim for decisions/0004
  And origin cannot be reached now
  When domainbook new decision "Use an outbox" runs
  Then it writes domainbook/decisions/0005-use-an-outbox.md
```

## Rule: A repo with no remote numbers as it always has

```gherkin
Example: No remote, no claim, no message
  Given a repo with no git remote
  When domainbook new decision "Use an outbox" runs
  Then it writes domainbook/decisions/0004-use-an-outbox.md
  And it prints nothing about claims
  And no .git/domainbook/ folder is created

Example: Collaboration turned off in config behaves like no remote
  Given domainbook.config.yaml holds collaboration.enabled: false
  And origin exists
  When domainbook new decision "Use an outbox" runs
  Then it writes the file and touches origin not at all
```

## Open Questions

None.
