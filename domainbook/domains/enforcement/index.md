---
id: enforcement
name: Enforcement
classification:
  domain: core-domain
  business-model: compliance-enforcer
  evolution: custom-built
owners: [RafaelAugustScherer]
code:
  - integrations/**
relationships:
  - with: format
    type: customer-supplier
    direction: downstream
    patterns: [CF]
---

## Purpose

Make a change to mapped code end one of two ways: the owning domain's book was
updated, or a waiver was recorded that a person can read years later. Nothing
else passes.

## Domain Roles

- Gatekeeper context: it decides whether a change may land; it never writes
  documentation itself.
- Execution context: it runs inside three hosts it does not own — an agent
  session, a git hook, and CI — and must give the same verdict in all three.

## Inbound Communication

| Message           | Collaborator        | Type    |
| ----------------- | ------------------- | ------- |
| `CheckStaged`     | git commit-msg hook | Command |
| `CheckRange`      | GitHub Action       | Command |
| `SessionStopped`  | Claude Code plugin  | Event   |
| `PathsTouched`    | Claude Code plugin  | Event   |

## Outbound Communication

| Message            | Collaborator          | Type  |
| ------------------ | --------------------- | ----- |
| `ChangeBlocked`    | agent, developer, CI  | Event |
| `WaiverRecorded`   | git history           | Event |
| `GetDomainGlobs`   | format                | Query |

## Business Decisions

- The rule is checked in three layers — agent hook, git hook, CI — and the
  instruction layer is steering only (`enforcement/ADR-0001`).
- A waiver is a git commit trailer, and what it must contain depends on who is
  committing (`enforcement/ADR-0002`).
- A changelog entry is demanded only for user-visible behaviour changes, not for
  every commit (`enforcement/ADR-0003`).
- The domain `code:` globs are the only map from code to documentation.
  Enforcement asks format for the field it needs instead of keeping a second map
  of its own — which is why format treats this context as a customer.
- A block always names the concrete files that would clear it.

## Assumptions

- Agent shells export a marker in the environment (`CLAUDECODE=1` and the
  equivalents) and a human at a terminal does not, so the tier of the waiver can
  be decided without asking.
- Repos that squash-merge keep the squashed commits' messages in the merge body,
  so waiver trailers survive to the default branch and stay queryable.
- Book files are not code: no domain maps `domainbook/**`, so editing the book
  never triggers the check on itself.
- A developer who wants to bypass the local hooks can, which is why CI repeats
  the same check server-side.

## Verification Metrics

- Share of commits touching mapped code that carry a book change, a waiver, or
  neither — the last bucket should be empty.
- Waiver reasons that repeat verbatim across commits, which is what
  rubber-stamping looks like from the outside.
- Stop-hook blocks that clear on the first retry versus those that repeat, the
  early signal of a loop.
- False positives reported per week.

## Open Questions

- Which domain owns `packages/cli/**`? Its commands straddle all four contexts,
  so either the globs are split per command file or the CLI gets a context of its
  own. The same question is coming for `@domainbook/core`, which is entirely
  format's today and will hold this context's check logic tomorrow.
- One commit touches two domains and updates one book. Block, or accept a
  per-domain waiver?
- Should a domain with no `code:` globs ever block, or is an unmapped domain
  simply outside the loop?
- The CI backstop can treat an AI `Co-Authored-By:` trailer as agent authorship.
  Does that heuristic belong on by default, given a human who pairs with an agent
  gets held to the agent's bar?
