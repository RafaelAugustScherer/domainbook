---
id: refuse-an-unclaimed-artifact
name: Refuse an unclaimed artifact
status: implemented
owners: [RafaelAugustScherer]
terms: [claim, remote, sync, waiver, peer, draft]
decisions: [ADR-0015, format/ADR-0021]
---

## Story

As a developer or an agent about to commit a new decision, debt record, feature, or domain
I want the commit refused while its number or id is claimed by nobody on the remote
So that a number never leaves this machine unless it is mine

## Rule: A staged new artifact is claimed on the spot, or the commit is refused

```gherkin
Example: Online, the hook claims what new could not
  Given domainbook/decisions/0004-use-an-outbox.md is staged with its claim pending
  And origin can be reached
  When domainbook check --staged runs
  Then origin holds refs/domainbook/claims/decisions/0004
  And it prints: domainbook: claimed ADR-0004 on origin
  And it exits 0

Example: Offline, the commit waits for the claim
  Given domainbook/decisions/0004-use-an-outbox.md is staged with its claim pending
  And origin cannot be reached
  When domainbook check --staged runs
  Then it prints: domainbook/decisions/0004-use-an-outbox.md carries ADR-0004, which is not claimed on origin (could not reach it) — run "domainbook sync" with the network up and commit again; if the number is taken by then, sync renumbers the file and says so
  And it exits 1

Example: A number a peer took meanwhile is refused with the fix
  Given domainbook/decisions/0004-use-an-outbox.md is staged with its claim pending
  And origin holds bob@example.com's claim for decisions/0004, taken on feat/webhooks
  When domainbook check --staged runs
  Then it prints: ADR-0004 is claimed by bob@example.com on feat/webhooks — run "domainbook sync" to move domainbook/decisions/0004-use-an-outbox.md to the next free number, then commit again
  And it exits 1
```

## Rule: A hand-written artifact is claimed like a generated one

```gherkin
Example: A decision written without new is claimed at commit
  Given domainbook/decisions/0004-use-an-outbox.md was written by hand and staged
  And no claim for decisions/0004 exists anywhere
  When domainbook check --staged runs
  Then origin holds refs/domainbook/claims/decisions/0004
  And it prints: domainbook: claimed ADR-0004 on origin
  And it exits 0

Example: A hand-written feature whose id a peer holds is refused
  Given domainbook/domains/billing/features/refund-order.md was written by hand and staged
  And bob@example.com's draft on feat/refunds holds that path
  When domainbook check --staged runs
  Then it prints: refund-order is already being written by bob@example.com on feat/refunds — read it with "domainbook status domains/billing/features/refund-order.md", then rename this one or continue on that branch
  And it exits 1
```

## Rule: An artifact already on the default branch, or already claimed here, is not asked again

```gherkin
Example: Editing a merged decision claims nothing
  Given domainbook/decisions/0002-*.md is on main and staged with a status change
  When domainbook check --staged runs
  Then no claim is made
  And nothing about claims is printed

Example: An artifact new already claimed passes silently
  Given domainbook/decisions/0004-use-an-outbox.md was written by new with its claim pushed
  When domainbook check --staged runs
  Then nothing about claims is printed
```

## Rule: A waiver does not stand in for a claim

```gherkin
Example: Skip-Docs waives stale documentation, not identity
  Given domainbook/decisions/0004-use-an-outbox.md is staged with its claim pending
  And origin cannot be reached
  And the commit message carries a "Skip-Docs: offline" trailer
  When domainbook check --staged runs
  Then it prints the unclaimed line
  And it exits 1
```

## Rule: Skipping the hook does not skip CI

```gherkin
Example: The second of two branches carrying one number fails its check in CI
  Given branch feat/outbox merged with domainbook/decisions/0004-use-an-outbox.md
  And branch feat/webhooks, committed with --no-verify, holds domainbook/decisions/0004-retry-webhooks.md
  When the Action runs domainbook check on feat/webhooks merged with main
  Then it prints: ADR-0004 is already domainbook/decisions/0004-use-an-outbox.md — decision numbers are never reused; renumber this one to 0005
  And it exits 1
```

## Rule: The Stop hook publishes the session's book before the session ends

```gherkin
Example: Edits made in a session reach peers when it stops
  Given a Claude Code session edited domainbook/domains/billing/features/refund-order.md
  When the Stop hook runs
  Then the branch's draft on origin holds that edit

Example: A remote out of reach never blocks a stop
  Given origin cannot be reached
  When the Stop hook runs
  Then the session stops
  And the hook's output carries sync's own line: could not reach origin (git@github.com:acme/shop.git, then https://github.com/acme/shop.git): <git's reason>
```

## Open Questions

None.
