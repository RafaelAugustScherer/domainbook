---
status: accepted
date: 2026-07-28
decision-makers: [RafaelAugustScherer]
---

# Record waivers as commit trailers

## Context and Problem Statement

A check that cannot be waived gets disabled. There has to be a way to say "this
change genuinely does not need a book update" — and that way has to be recorded
somewhere permanent, or it is just a bypass with extra steps. It also has to
work for two very different authors: an agent, which can always produce a
sentence, and a person mid-commit, who will not.

## Decision Drivers

- The waiver must outlive the pull request that contained it and stay attached to
  the change.
- It must be machine-readable, so an audit is a query rather than a reading
  exercise.
- Friction aimed at a person who is typing a commit message is friction that gets
  the tool uninstalled.
- An agent producing a reason costs nothing and is exactly the evidence a
  reviewer needs.

## Considered Options

- A git commit trailer — `Skip-Docs: <reason>` — following the
  `Signed-off-by:` convention.
- A waiver file in the repo, listing exceptions.
- A pull request label or a magic phrase in the PR description.
- No waiver: the check is absolute.

## Decision Outcome

Chosen option: "A git commit trailer". Git parses trailers, history keeps them,
and `git log --format='%(trailers:...)'` turns "what have we waived and why" into
one command. A waiver file drifts from the changes it excuses; a PR label lives
on a platform and disappears if the repo moves.

The requirement is tiered by who is committing. An agent shell — detected through
the markers agent CLIs export, such as `CLAUDECODE=1` — must supply a non-empty
reason. A person at a terminal may waive without prose using
`SKIP_DOCS=1 git commit …`, which the hook turns into an auto-stamped
`Skip-Docs: waived interactively` trailer. Both paths end in a trailer, so CI
stays deterministic and the audit trail is complete either way.
`enforcement.require_reason: agents | always` moves the line for repos that want
prose from everyone. The trailer key is configurable; `Skip-Docs` is the default.

### Consequences

- Good, because every waiver is permanent, attributable, and queryable with git
  alone.
- Good, because the escape hatch a person reaches for is the same mechanism the
  audit reads, rather than a bypass that leaves no trace.
- Bad, because the environment marker is a heuristic. An agent that does not set
  one is treated as a person, and a person running inside an agent's shell is
  held to the agent's bar.
- Bad, because `SKIP_DOCS=1` with an auto-stamped reason records that a waiver
  happened but not why; the audit gets a count, not an explanation.
- Bad, because trailers live in commit messages, so a rebase or an amend can drop
  one and the change arrives looking unwaived.
- Bad, because nothing checks that a reason is a *good* reason. "n/a" satisfies
  the rule.

### Confirmation

Both paths are queryable from `git log` in the sample repo: an agent waiver
carrying its own reason and a human `SKIP_DOCS=1` commit carrying the stamped
one. A `PreToolUse` guard denies an agent the human-only escape, along with
`--no-verify` and anything that unsets the markers.
