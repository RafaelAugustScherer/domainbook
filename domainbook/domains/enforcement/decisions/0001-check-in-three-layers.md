---
status: accepted
date: 2026-07-28
decision-makers: [RafaelAugustScherer]
---

# Check in three layers

## Context and Problem Statement

Every docs-as-code tool asks people to keep documentation current, and the asking
is where they stop. An agent told to update the docs updates them until the task
gets long. The difference between a convention and a guarantee is whether
something refuses to proceed, and where that refusal sits decides both how strong
it is and how much it hurts.

## Decision Drivers

- The cheapest moment to document a change is while the author still has it in
  context; the most reliable moment to catch it is where nobody can skip the
  check.
- Those are not the same moment, and neither works alone.
- A check that only runs late produces documentation written by someone
  reconstructing a change from a diff.

## Considered Options

- Instructions only: an AGENTS.md rule and a good skill.
- CI only: one server-side gate on the pull request.
- A git hook only: block at commit time.
- All three, running one check: agent hook in session, git hook at commit, CI as
  the backstop.

## Decision Outcome

Chosen option: "All three, running one check". Each layer covers the layer before
it: the agent hook catches the change while the context is warm but can be turned
off; the git hook catches every commit but can be bypassed with `--no-verify`;
CI cannot be bypassed but only sees the change once it is finished. The
instruction layer sits alongside them as steering — generated AGENTS.md text and
path-scoped rules — and is deliberately not counted as one of the three, because
nothing about it can stop anything.

All three run the same check over the same globs, so a change blocked in one
place is blocked in all of them, and a change that passes locally passes in CI.

### Consequences

- Good, because the guarantee does not depend on the agent, the editor, or the
  developer's discipline.
- Good, because most blocks happen at the moment they are cheapest to fix.
- Bad, because three hosts means three ways to be misconfigured, and a repo with
  the hook uninstalled looks fine until the pull request.
- Bad, because an in-session block is a loop risk by construction; it is only
  safe while the condition is clearable, the retries are capped, and the message
  names files.
- Bad, because every layer is a place a false positive can appear, and a false
  positive in a commit hook is felt immediately by everyone.

### Confirmation

The exit test is a single change proving all three: a commit touching mapped code
with no book change and no waiver fails locally and in CI, and an agent session
gets blocked at the end, updates the book, and completes.
