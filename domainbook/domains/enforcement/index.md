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
  - action.yml
relationships:
  - with: format
    type: customer-supplier
    direction: downstream
    patterns: [CF]
  - with: core
    type: customer-supplier
    direction: downstream
    patterns: [CF]
---

## Purpose

Keep a repo's code and its book in step, from both ends. A change to mapped code
ends one of two ways — the owning domain's book was updated, or a waiver was
recorded that a person can read years later, and nothing else passes. And the
writing the gate demands has procedures behind it: how to adopt a book, document a
change, record a decision, and groom the glossary. The gate says a change is
undocumented; the skills are how it stops being so.

## Domain Roles

- Gatekeeper context: it decides whether a change may land — the three-layer check
  and the waiver. The gate blocks; it does not write the documentation itself.
- Authoring context: it ships the procedures an agent follows to write the book —
  migration and the three maintenance skills. They steer and never gate: nothing a
  skill does can block a change (`ADR-0005`).
- Execution context: it runs inside hosts it does not own — an agent session, a
  git hook, and CI — and must give the same verdict in the three that gate.

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
| `GetDomainGlobs`   | core                  | Query |

## Business Decisions

- The rule is checked in three layers — agent hook, git hook, CI — and the
  instruction layer is steering only (`enforcement/ADR-0001`).
- A waiver is a git commit trailer, and what it must contain depends on who is
  committing (`enforcement/ADR-0002`).
- A changelog entry is demanded only for user-visible behaviour changes, not for
  every commit (`enforcement/ADR-0003`).
- The book's own writing has procedures — a migration skill and three maintenance
  skills — shipped in the plugin as steering an agent follows, never as a gate
  (`ADR-0005`, `ADR-0007`).
- The domain `code:` globs are the only map from code to documentation. The
  field is format's spec and the parsed value comes from core's loader;
  enforcement keeps no second map of its own, which is why both contexts treat
  it as a customer.
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

None.
