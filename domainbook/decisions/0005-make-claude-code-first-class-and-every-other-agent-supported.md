---
status: accepted
date: 2026-07-28
decision-makers: [RafaelAugustScherer]
---

# Make Claude Code first-class and every other agent supported

## Context and Problem Statement

The strongest moment to fix documentation is while the agent still has the change
in context — before the commit, not after. Reaching that moment needs a hook
inside the agent's session, and agents differ: some expose lifecycle hooks, some
read an instructions file, some only speak MCP. Building for the one that hooks
best risks a tool that only works for its author.

## Decision Drivers

- The guarantee must not depend on which agent wrote the code, or a repo with
  mixed tooling has a hole in it.
- The in-session block is the difference between "the agent fixes the docs now"
  and "someone fixes them next week".
- Instruction files are advisory in every agent that reads them.

## Considered Options

- Claude Code only, hooks and skills, no baseline for others.
- Lowest common denominator: an instructions file and nothing agent-specific.
- Claude Code plugin as the deep integration, plus an AGENTS.md and MCP baseline
  every other agent can use.

## Decision Outcome

Chosen option: "Claude Code plugin plus an AGENTS.md and MCP baseline". The
guarantee lives in the git hook and CI (`enforcement/ADR-0001`), which are
agent-agnostic and do not care who typed the code; the in-session layer is an
improvement where the host supports it, never the thing being relied on.

### Consequences

- Good, because a repo using several agents, or none, gets the same guarantee.
- Good, because the deep integration can be as specific as it likes without
  becoming a dependency.
- Bad, because the best experience exists on one agent, and that asymmetry will
  read as favouritism regardless of how the baseline is documented.
- Bad, because the plugin is maintained against a host that moves; hook names and
  payloads change and the plugin breaks quietly.
- Bad, because AGENTS.md is steering an agent may ignore, so the instruction
  layer will get credit for blocks it did not cause and blame for changes it did
  not prevent.

### Confirmation

The check produces the same verdict from the git hook and from CI with no agent
present. The plugin is a convenience over that check, never a second
implementation of it.
