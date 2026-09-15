---
id: see-what-peers-are-writing
name: See what peers are writing
status: implemented
owners: [RafaelAugustScherer]
terms: [peer, draft, remote, sync, artifact]
decisions: [ADR-0015]
---

## Story

As a developer or an agent about to write in a context
I want what my peers are writing there now, not only what merged
So that I do not decide what someone is already deciding two branches over

## Rule: A peer's work is what their draft or branch holds that the default branch does not

```gherkin
Example: status lists each peer's added and changed artifacts, newest first
  Given main is origin's default branch
  And bob@example.com's draft on feat/refunds adds domainbook/domains/billing/features/refund-order.md and edits domainbook/domains/billing/glossary.md
  And origin's branch feat/outbox, pushed by carol@example.com two hours ago with no draft, adds domainbook/decisions/0004-use-an-outbox.md
  When domainbook status runs
  Then it prints:
    """
    domainbook: origin (git@github.com:acme/shop.git), synced 12 seconds ago
    in progress:
      bob@example.com on feat/refunds (draft, 3 minutes ago)
        + domains/billing/features/refund-order.md
        ~ domains/billing/glossary.md
      carol@example.com on feat/outbox (branch, 2 hours ago)
        + decisions/0004-use-an-outbox.md
    """

Example: A branch that holds the book as main holds it is not in progress
  Given origin's branch chore/deps changes nothing under domainbook/
  When domainbook status runs
  Then chore/deps is not listed

Example: A draft and a pushed branch of the same peer and branch are one entry
  Given bob@example.com's draft on feat/refunds and origin's branch feat/refunds
  And the draft is newer
  When domainbook status runs
  Then feat/refunds is listed once, from the draft

Example: This clone's own branch is not a peer
  Given this clone is alice@example.com on feat/outbox with a draft published
  When domainbook status runs
  Then feat/outbox by alice@example.com is not listed under in progress

Example: A deleted artifact is not in progress
  Given origin's branch cleanup/old deletes domainbook/decisions/0002-*.md and adds nothing
  When domainbook status runs
  Then cleanup/old is not listed
```

## Rule: A peer's artifact is read without a checkout

```gherkin
Example: status with a path prints the peer's file
  Given bob@example.com's draft on feat/refunds holds domainbook/domains/billing/features/refund-order.md
  When domainbook status domains/billing/features/refund-order.md runs
  Then it prints: domains/billing/features/refund-order.md — bob@example.com on feat/refunds (draft, 3 minutes ago)
  And then the file as the draft holds it

Example: A path several peers hold prints each
  Given two peers each hold a different domainbook/decisions/0004-*.md
  When domainbook status decisions/0004 runs
  Then it prints both, each under its peer's line

Example: A path nobody holds says so
  When domainbook status domains/billing/features/nothing.md runs
  Then it prints: no peer is writing domains/billing/features/nothing.md
  And it exits 1
```

## Rule: A peer's broken artifact is counted, not a failure here

```gherkin
Example: An unreadable draft file is marked and the rest listed
  Given bob@example.com's draft holds a decision whose frontmatter does not parse as YAML
  When domainbook status runs
  Then that file's line reads: ? decisions/0005-retry-webhooks.md (cannot be read yet)
  And domainbook validate on this clone's book exits 0
```

## Rule: Nothing a peer wrote enters the working tree

```gherkin
Example: git status is unchanged by looking
  Given a clean working tree and two peers in progress
  When domainbook sync and domainbook status run
  Then git status --short prints nothing
  And no file under domainbook/ was created or changed
  And .gitignore and .git/info/exclude are untouched
```

## Rule: Without a remote there are no peers

```gherkin
Example: A repo with no remote is working alone
  Given a repo with no git remote
  When domainbook status runs
  Then it prints: domainbook: no remote, working alone
  And it exits 0
```

## Open Questions

None.
