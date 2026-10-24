---
status: accepted
date: 2026-07-28
decision-makers: [RafaelAugustScherer]
---

# Build the toolchain in TypeScript on Node

## Context and Problem Statement

One product has to run in four places: a library that parses the book, a CLI, a
git hook fast enough to sit on every commit, an MCP server, and a static site.
Picking one language for all of it, or splitting, decides how much of the model
gets written twice.

## Decision Drivers

- The site is Astro, so JavaScript is in the stack whatever else is chosen.
- Schemas are authored in zod (`format/ADR-0001`); Astro content collections
  consume zod schemas directly, so one language means no port and no drift.
- The MCP SDK the server is built on is TypeScript-first
  (`mcp/ADR-0001`).
- Contributors to a docs tool for agent-assisted repos already have Node.

## Considered Options

- TypeScript on Node, end to end, ESM-only.
- A compiled single binary (Rust or Go) for the CLI and hooks, with the site in
  JavaScript.
- Python for the CLI and hooks, JavaScript for the site.

## Decision Outcome

Chosen option: "TypeScript on Node, end to end, ESM-only". A compiled binary
would give faster hooks and no runtime prerequisite, but it splits the model in
two: the schemas would be authored once for the binary and again for the site,
and the two would drift exactly where correctness matters.

The Node floor is `>=24.0.0`. It is a floor, not a statement that only the active
LTS is supported: bumping it every time a new major reaches LTS would drop
repos still running a release that upstream still supports. The rule is to raise
the floor when the previous floor goes end-of-life.

### Consequences

- Good, because the zod schemas, the validator, the MCP server, and the site's
  build-time validation are the same code.
- Good, because `npm install` is the whole prerequisite for contributors.
- Bad, because every commit in an adopting repo pays Node's startup cost in the
  git hook — small, but not zero, and it is paid by people who never chose Node.
- Bad, because ESM-only rules out CommonJS consumers of `@domainbook/core`.
- Bad, because a repo with no Node toolchain has to install one to use the local
  hooks; only the CI backstop is free of that.

### Confirmation

Every `package.json` declares `"type": "module"` and `engines.node`
`">=24.0.0"`. The floor changes only when the current floor is end-of-life, and
the change is a changelog entry because it can break an install.

## More Information

Versions of the toolchain itself are a separate decision: `ADR-0004` pins
TypeScript, and `format/ADR-0011` picks the YAML parser.
