---
id: sync-with-the-remote
name: Sync with the remote
status: implemented
owners: [RafaelAugustScherer]
terms: [sync, remote, claim, draft, peer]
decisions: [ADR-0015]
---

## Story

As an agent running any domainbook command
I want the exchange with the remote to happen underneath the command, over whichever transport works
So that I never learn a sync protocol and never lose a session to a push that failed

## Rule: A sync fetches, pushes what is pending, refreshes the draft, and releases what merged

```gherkin
Example: A sync with work to do reports each thing it did
  Given a pending claim for decisions/0004
  And the working tree's book is newer than the draft on origin
  And origin holds a claim for decisions/0002 and main holds domainbook/decisions/0002-*.md
  And two peers have work in progress
  When domainbook sync runs
  Then it fetches refs/domainbook/* and origin's branches, pruning what origin no longer has
  And it pushes the claim for decisions/0004
  And it replaces the draft with the working tree's book
  And it deletes refs/domainbook/claims/decisions/0002 on origin
  And it prints: domainbook: synced with origin — 1 claim pushed, draft published, 1 claim released, 2 peers in progress

Example: A sync with nothing to do says so in one line
  Given nothing pending and a draft that matches the working tree
  When domainbook sync runs
  Then it prints: domainbook: synced with origin — nothing pending, 2 peers in progress

Example: A claim is released by whoever syncs first once its file is on main
  Given origin holds bob@example.com's claim for decisions/0004
  And main holds domainbook/decisions/0004-retry-webhooks.md
  When alice@example.com runs domainbook sync
  Then refs/domainbook/claims/decisions/0004 is deleted on origin
```

## Rule: A pending claim whose number was taken renumbers the file, if it is still uncommitted

```gherkin
Example: The uncommitted file and its references move to the next free number
  Given a pending claim for decisions/0004 behind domainbook/decisions/0004-use-an-outbox.md, not committed
  And domainbook/domains/billing/features/refund-order.md, not committed, lists ADR-0004 under decisions
  And origin now holds bob@example.com's claim for decisions/0004, taken on feat/webhooks
  When domainbook sync runs
  Then it claims decisions/0005 on origin
  And domainbook/decisions/0004-use-an-outbox.md is now domainbook/decisions/0005-use-an-outbox.md
  And refund-order.md lists ADR-0005
  And it prints: ADR-0004 was taken by bob@example.com on feat/webhooks while this clone was offline — 0004-use-an-outbox.md is now 0005-use-an-outbox.md, and 1 reference to it was rewritten

Example: A released claim is not a free number
  Given a pending claim for decisions/0004 behind an uncommitted file
  And bob@example.com's claim for decisions/0004 was released because main now holds domainbook/decisions/0004-retry-webhooks.md
  When domainbook sync runs
  Then it does not push the claim for decisions/0004
  And it renumbers the file to the next free number, as above

Example: A reference that could point at a pulled record is listed, not rewritten
  Given a pending claim for decisions/0004 behind domainbook/decisions/0004-use-an-outbox.md, not committed
  And HEAD holds domainbook/decisions/0004-retry-webhooks.md, pulled from main since the file was written
  And domainbook/domains/billing/features/refund-order.md lists ADR-0004 under decisions
  When domainbook sync runs
  Then domainbook/decisions/0004-use-an-outbox.md is now domainbook/decisions/0005-use-an-outbox.md
  And refund-order.md still lists ADR-0004
  And it prints: 0004-use-an-outbox.md is now 0005-use-an-outbox.md — ADR-0004 also names a record on main, so 1 reference was left for you to settle: domainbook/domains/billing/features/refund-order.md:7

Example: A committed file is reported, not renamed
  Given a pending claim for decisions/0004 behind a file committed with --no-verify
  And origin now holds bob@example.com's claim for decisions/0004, taken on feat/webhooks
  When domainbook sync runs
  Then it refuses with: ADR-0004 is committed here and claimed by bob@example.com on feat/webhooks — the next free number is 0005; rename 0004-use-an-outbox.md, rewrite its references, and commit before this branch is pushed
  And no file is changed
  And it exits 1
```

## Rule: A push that fails over the remote's URL is retried over its other form

```gherkin
Example: SSH refused, HTTPS taken
  Given origin's URL is git@github.com:acme/shop.git
  And ssh to github.com answers "Permission denied (publickey)"
  When domainbook sync runs
  Then the fetch and the push are retried against https://github.com/acme/shop.git
  And they succeed
  And it prints: origin over ssh was not reachable (Permission denied (publickey)) — synced over https://github.com/acme/shop.git instead
  And git remote get-url origin still prints git@github.com:acme/shop.git

Example: HTTPS refused, SSH taken
  Given origin's URL is https://gitlab.com/acme/shop.git
  And https to gitlab.com answers "Authentication failed"
  When domainbook sync runs
  Then the fetch and the push are retried against git@gitlab.com:acme/shop.git

Example: The form that worked last time is tried first
  Given the last sync went over https because ssh failed
  When domainbook sync runs
  Then https is tried first
  And ssh is tried only if https fails

Example: A URL with no other form has no fallback
  Given origin's URL is /srv/git/shop.git
  And it cannot be reached
  When domainbook sync runs
  Then nothing is retried
  And it prints: could not reach origin (/srv/git/shop.git): <git's reason> — 1 claim still pending

Example: A rejected ref is not a transport failure
  Given a claim push rejected because origin already holds that ref
  When domainbook new decision "Use an outbox" runs
  Then the push is not retried over the other form
  And the next number is claimed instead
```

## Rule: A sync a command runs for itself is throttled; one asked for is not

```gherkin
Example: Two checks within a minute fetch once
  Given a sync ran 20 seconds ago
  When domainbook check --staged runs
  Then it does not fetch
  And it uses what the last sync fetched

Example: An explicit sync always fetches
  Given a sync ran 20 seconds ago
  When domainbook sync runs
  Then it fetches

Example: new always fetches before it takes a number
  Given a sync ran 20 seconds ago
  When domainbook new decision "Use an outbox" runs
  Then it fetches before it allocates
```

## Rule: A remote out of reach is a warning under every command but sync itself

```gherkin
Example: A command carries on with what it has
  Given origin cannot be reached
  And nothing is pending
  When domainbook check --staged runs
  Then it prints: domainbook: origin not reachable, using what was fetched 3 minutes ago
  And its exit code is whatever the check decides

Example: sync itself exits 1
  Given origin cannot be reached over either form of its URL
  When domainbook sync runs
  Then it prints: could not reach origin (git@github.com:acme/shop.git, then https://github.com/acme/shop.git): <git's reason>
  And it exits 1
```

## Open Questions

None.
