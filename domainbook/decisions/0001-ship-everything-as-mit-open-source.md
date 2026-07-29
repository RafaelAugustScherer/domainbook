---
status: accepted
date: 2026-07-28
decision-makers: [rafael]
---

# Ship everything as MIT open source

## Context and Problem Statement

domainbook is meant to be installed in other people's repos and to run in their
CI. Its promise — a change either updates the book or records a waiver — only
holds if every layer of the loop runs everywhere the code runs, including the
parts agents talk to. A licence that holds part of the tool back turns the
promise into a promise for paying repos.

## Decision Drivers

- Enforcement runs in someone else's CI; a licence check there is friction that
  gets the tool removed rather than paid for.
- The agent-facing surface (MCP server, hooks, skills) is the whole point, not an
  upsell.
- A tool that documents a repo has to be auditable by the people whose repo it
  is.

## Considered Options

- MIT for the whole product, MCP server included.
- Open core: MIT library and CLI, commercial MCP server and CI enforcement.
- Source-available for the tool, with a commercial grant for company use.

## Decision Outcome

Chosen option: "MIT for the whole product, MCP server included", because the
enforcement loop and the MCP server are the reasons to adopt domainbook, and a
tool whose reason to exist sits behind a licence gate cannot be evaluated by the
people who would adopt it.

### Consequences

- Good, because a repo can adopt it, run it in CI, and vendor it without asking
  anyone.
- Good, because forks and audits are legal, which matters for something that
  blocks commits.
- Bad, because there is no revenue path from the tool itself; sustaining it is
  maintainer time, and that is a real limit on scope.
- Bad, because MIT permits a closed derivative, including one that competes.

### Confirmation

`LICENSE` at the repo root is MIT, every `package.json` declares `"license":
"MIT"`, and no package carries a different header. A package that ever needs a
different licence needs a new ADR first.
