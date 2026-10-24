---
status: accepted
date: 2026-08-01
decision-makers: [RafaelAugustScherer]
---

# Let the CLI carry the MCP server

## Context and Problem Statement

`domainbook serve mcp` runs a long-lived stdio server, and the server is
`@domainbook/mcp` — a separate package by `ADR-0003`, built on
`@modelcontextprotocol/server` and `zod`. `core/ADR-0001` chose `parseArgs` over
a CLI framework so that installing `domainbook` pulls in `@domainbook/core` and
nothing else, and its Confirmation says exactly that: "The CLI's `dependencies`
holds exactly `@domainbook/core`."

That sentence and this command cannot both stand. The clients that launch this
server launch it as `npx -y domainbook serve mcp`, so whatever `domainbook`
installs has to be enough to answer.

## Decision Drivers

- The install is the first thing a stranger experiences, and `CONTRIBUTING.md`
  puts that experience first.
- Most domainbook commands — `validate`, `check`, `new`, `hooks` — never touch
  MCP, and paying for the SDK on every one of them is the cost `core/ADR-0001`
  was avoiding.
- `core/ADR-0001` named this moment: "this cost is paid again by every command
  Phases 2 to 6 add — `check`, `hooks install`, `export`, `mcp`, `dev`, `build`.
  If the dispatch stops reading straight through, that is the signal to revisit
  this, and revisiting it means a new decision."
- A server the CLI cannot reach is a server nobody runs.

## Considered Options

- `@domainbook/mcp` as a dependency of the CLI, imported only when `serve` runs.
- `@domainbook/mcp` as an optional dependency, with `serve` printing an install
  line when it is absent.
- `@domainbook/mcp` ships its own binary, and `domainbook serve mcp` spawns it.
- Fold the server into the CLI package and drop `@domainbook/mcp`.

## Decision Outcome

Chosen option: "a dependency, imported only when `serve` runs". `bin.ts` reaches
for `@domainbook/mcp` behind `await import(...)`, so `domainbook validate` never
loads the SDK and its startup is unchanged; an install of `domainbook` carries
the server whether or not it is ever served.

An optional dependency was rejected because it makes the common path fail on
somebody's machine and not on ours — the worst shape a dependency decision can
take. Spawning a second process was rejected because the CLI would then have to
proxy stdio between a client and a child, which is a transport of our own in all
but name. Folding the server into the CLI was rejected because `ADR-0003` split
the packages so a consumer can take the server without the CLI, and a website
that never shells out still needs the reader underneath it.

`core/ADR-0001` stands as a decision about frameworks: there is still no
argument parser, no help generator, and no third party between `npx` and our
dispatch. What changes is its Confirmation, and only for this one name.

### Consequences

- Good, because `npx -y domainbook serve mcp` works from a cold machine with no
  second install and no flag, which is what every client's config will run.
- Good, because the dynamic import keeps the cost where the benefit is: no
  command but `serve` pays for the SDK at startup.
- Bad, because installing the CLI now installs `@modelcontextprotocol/server`
  and `zod` transitively, so an advisory against either can strand a user who
  only ever runs `validate` (`ADR-0009` is why that matters here).
- Bad, because `core/ADR-0001`'s Confirmation now reads as a claim this record
  has to correct, and a reader who finds that record first will believe it. It
  is not edited: an accepted decision stands as written (`format/ADR-0013`).
- Neutral, because the version of the SDK is pinned by `mcp/ADR-0001`, so what
  arrives transitively arrives in a reviewed commit rather than on its own.

### Confirmation

`packages/cli/package.json` holds `@domainbook/core` and `@domainbook/mcp` and
nothing else. `packages/cli/src/run.ts` imports neither the SDK nor the server;
the only reference is the `await import("@domainbook/mcp")` in `bin.ts`, reached
only when a `serve` result asks for it.

## More Information

The framework decision this narrows is `core/ADR-0001`; the package split is
`ADR-0003`; the SDK and its pin are `mcp/ADR-0001`.
