---
status: accepted
date: 2026-08-15
decision-makers: [RafaelAugustScherer]
---

# Ship the CLI without the website

## Context and Problem Statement

Phase 7 publishes `domainbook`, and the install is now real: `npx domainbook
init` is the exit criterion the whole product is measured against. `domainbook
serve web` and `domainbook build` need `@domainbook/site`, which depends on
`astro` and `pagefind` — a large toolchain. Until now `@domainbook/site` sat in
the CLI's `dependencies`, so installing the CLI pulled that toolchain onto every
machine, including one that only ever runs `init` and `validate`.

`core/ADR-0008` let the CLI carry `@domainbook/mcp` for the same shape of reason
in reverse, and its Confirmation says the CLI holds "`@domainbook/core` and
`@domainbook/mcp` and nothing else." Phase 4 added the site to the CLI's
dependencies without a decision, and against that line. Phase 7 is where the cost
lands, so it is where the choice gets made.

## Decision Drivers

- The install is the first thing a stranger experiences, and it is the exit
  criterion: `npx domainbook init` should be light.
- `astro` and `pagefind` are a large tree, an order of magnitude heavier than the
  MCP SDK `ADR-0008` chose to carry.
- `serve web` and `build` are the two rarest commands; `init`, `validate`,
  `check`, `new`, and `serve mcp` never touch the site.
- `core/ADR-0001`'s ethos: there is no third party between a user's `npx` and our
  code unless a command needs it.

## Considered Options

- `@domainbook/site` as a dependency of the CLI (the status quo since Phase 4).
- `@domainbook/site` as an optional peer the CLI names but does not install,
  with `serve web` and `build` printing an install line when it is absent.
- `@domainbook/site` ships its own binary, and `domainbook serve web` spawns it.
- Fold the site into the CLI package.

## Decision Outcome

Chosen option: "an optional peer the CLI names but does not install".
`packages/cli/src/bin.ts` reaches for `@domainbook/site` behind
`await import(...)` only in `serve web`, bare `serve`, and `build`; when the
package is not installed, the CLI refuses with a line naming what to install
rather than a stack trace.

This is the opposite of the choice `core/ADR-0008` made for the MCP server, and
deliberately so: the trade-off is not the same. `ADR-0008` rejected an optional
dependency because it "makes the common path fail on somebody's machine and not
on ours" — but the common path there is `serve mcp`, which every agent client
runs, over a light SDK. Here the path is `serve web` and `build`, which a person
runs occasionally, over a toolchain a hundred times the size; and the failure is
not a mystery but one actionable sentence. A package's weight and how often it is
reached decide whether the CLI carries it, and the website sits on the other side
of that line from the server.

Spawning a binary and folding the site into the CLI were rejected for the reasons
`ADR-0008` already gives: a spawn is a transport of our own in all but name, and
folding in undoes the package split `ADR-0003` made so a consumer can take one
part without the rest.

### Consequences

- Good, because `npx domainbook init` — and every command but `serve web`, bare
  `serve`, and `build` — installs no `astro` and no `pagefind`.
- Good, because the common paths a stranger and an agent take stay as light as
  `ADR-0001` intended.
- Bad, because reading the book as a website is now a second install, so someone
  who wants to explore has one more step; the CLI names it, but it is still a
  step.
- Bad, because bare `serve` asks for both the site and the server, so on a
  machine without the site it refuses instead of bringing the server up alone;
  `serve mcp` is the command that never needs the site.
- Neutral, because `@domainbook/mcp` stays a dependency: `ADR-0008` stands, and
  the server the common path depends on still arrives with the CLI.

### Confirmation

`packages/cli/package.json` holds `@domainbook/core` and `@domainbook/mcp` in
`dependencies`, and `@domainbook/site` only as an optional `peerDependencies`
entry. The scenarios in `domains/site/features/bring-the-site-up.md` and
`build-the-site.md` assert that `serve web` and `build` name the install when the
site is absent, and the CLI tests cover the message.

## More Information

The framework decision this keeps faith with is `core/ADR-0001`; the mirror-image
choice for the server is `core/ADR-0008`; the package split is `ADR-0003`.
