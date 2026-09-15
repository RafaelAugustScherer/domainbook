---
id: publish-a-draft
name: Publish a draft
status: implemented
owners: [RafaelAugustScherer]
terms: [draft, remote, peer, sync, book-root]
decisions: [ADR-0015]
---

## Story

As an agent that has just written an artifact on a branch nobody has fetched
I want the book as it is on this disk published to the remote right then
So that peers read it before the branch is pushed, let alone merged

## Rule: new publishes the working tree's book as this branch's draft

```gherkin
Example: The draft holds the book root and nothing else, uncommitted edits included
  Given git's user.email is alice@example.com and the branch is feat/outbox
  And domainbook/domains/billing/glossary.md is edited and not committed
  When domainbook new decision "Use an outbox" runs
  Then origin holds refs/domainbook/drafts/alice@example.com/feat/outbox
  And that ref's tree holds domainbook/ exactly as the working tree holds it, the glossary edit and the new decision included
  And nothing outside domainbook/ is in that tree

Example: An edit made after new reaches the draft at the next sync
  Given the draft was published when the decision was written
  And the decision's body has been edited since
  When domainbook sync runs
  Then the draft on origin holds the edited body

Example: A draft is a snapshot, so the same content is not published twice
  Given the draft on origin already holds the book as the working tree has it
  When domainbook sync runs
  Then nothing is pushed
```

## Rule: A draft has one owner and is replaced, never merged

```gherkin
Example: The same author on the same branch from a second machine replaces the draft
  Given alice@example.com published a draft for feat/outbox from a laptop
  When alice runs domainbook sync on feat/outbox from a desktop
  Then refs/domainbook/drafts/alice@example.com/feat/outbox holds the desktop's book
  And the draft's commit has no parent
  And no merge commit is created

Example: The owner is git's email, made safe for a ref name
  Given git's user.email is "a~b:c@example.com"
  When domainbook new decision "Use an outbox" runs on feat/outbox
  Then the draft is published under refs/domainbook/drafts/a-b-c@example.com/feat/outbox
```

## Rule: A detached HEAD publishes nothing and says so

```gherkin
Example: A claim is made, a draft is not
  Given HEAD is detached
  When domainbook new decision "Use an outbox" runs
  Then it writes the file and claims its number
  And no draft is published
  And it prints: no branch is checked out, so this book is not published as a draft — check a branch out and run "domainbook sync" to publish it
```

## Rule: A draft is pruned by its owner once its branch is gone

```gherkin
Example: A merged and deleted branch takes its draft with it
  Given alice@example.com merged feat/outbox and deleted the branch locally
  When alice runs domainbook sync
  Then refs/domainbook/drafts/alice@example.com/feat/outbox is deleted on origin
  And it prints a line: draft for feat/outbox released — the branch is gone

Example: A peer never prunes another author's draft
  Given bob@example.com's draft for a branch origin no longer has
  When alice@example.com runs domainbook sync
  Then bob's draft remains on origin
```

## Rule: Publishing writes nothing into the repo

```gherkin
Example: git status shows only the artifact that was written
  Given a clean working tree
  When domainbook new decision "Use an outbox" runs
  Then git status --short lists domainbook/decisions/0004-use-an-outbox.md and nothing else
  And what domainbook remembers about the remote lives under .git/domainbook/, which git never tracks
```

## Open Questions

None.
