---
status: accepted
date: 2026-07-28
decision-makers: [RafaelAugustScherer]
---

# Split the code into four npm-workspace packages

## Context and Problem Statement

The product ships several things people install separately — a CLI in a repo, an
MCP server in an agent client, a site generator — over one shared model of the
book. How the repo is divided decides what a user has to install to get one of
them, and what a contributor has to install to change anything.

## Decision Drivers

- An agent client installing the MCP server should not pull in an Astro site.
- The shared model must exist once, imported by everything else.
- Contributors should not need tooling beyond what the runtime decision already
  requires (`ADR-0002`).

## Considered Options

- npm workspaces, four packages: `@domainbook/core`, `domainbook` (CLI),
  `@domainbook/mcp`, `@domainbook/site`; releases via changesets.
- A single package with subpath exports.
- pnpm workspaces with a task-graph runner.

## Decision Outcome

Chosen option: "npm workspaces, four packages". A single package would make every
install carry the site; pnpm and a task runner would be faster on a repo this
size but adds a tool a drive-by contributor has to install before `npm test`
works, and the build ordering it would solve is already solved by TypeScript
project references.

`integrations/` stays a plain repo directory — the Claude Code plugin, agent
instruction templates, the GitHub Action, and the hook snippets are published
through their own channels, not through npm.

### Consequences

- Good, because installing the MCP server pulls the core model and nothing else.
- Good, because a clean clone needs only `npm ci` before `npm test` passes.
- Bad, because npm workspaces has no task graph; ordering lives in `tsc --build`
  and CI scripts, and a new package has to be wired into both.
- Bad, because npm hoisting can hide a dependency a package forgot to declare
  until it is published on its own.
- Bad, because four packages means four versions to reason about at release; that
  is what changesets is there to absorb.

### Confirmation

A clean clone with no global tooling runs `npm ci && npm test` successfully. Each
package's `exports` field names what it publishes, and CI publishes from
changesets rather than by hand.
