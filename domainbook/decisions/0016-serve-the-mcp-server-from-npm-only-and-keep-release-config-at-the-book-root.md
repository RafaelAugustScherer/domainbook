---
status: accepted
date: 2026-10-24
decision-makers: [RafaelAugustScherer]
---

# Serve the MCP server from npm only, and keep release config at the book root

## Context and Problem Statement

`ADR-0014` published domainbook at 1.0.0, put release and packaging config at the
book root, and sent the MCP server to four places: npm, the MCP Registry, the
GitHub Marketplace, and a plugin marketplace. The MCP Registry step never ran —
nothing in the release workflow does it, and by 2.0.1 the server had no entry
there while `server.json` still described 1.0.0.

The registry hosts nothing. An entry is a public listing that points a client at
the npm package; the server runs on the user's machine either way. The server is
already reached that way without the registry: `domainbook init` writes a
`.mcp.json` that runs `npx -y domainbook serve mcp`, and `domainbook serve mcp`
starts it by hand. The question is whether a listing that adds discovery and
nothing else is worth a second publish on every release.

## Decision Drivers

- A user gets the server from the book they just made, through the `.mcp.json`
  that `init` writes — not by browsing a catalogue.
- Every place a release goes is another account, another login, and another
  manifest whose version has to move with the package.
- A step that has to be remembered by hand gets skipped, and a stale listing
  is worse than none.

## Considered Options

- Keep the MCP Registry: bump `server.json` with every release and run
  `mcp-publisher publish` after npm, by hand or from the release workflow.
- Drop the MCP Registry: npm is the only channel the server ships through, and
  `server.json` and the `mcpName` in `@domainbook/mcp` go.

## Decision Outcome

Chosen option: **drop the MCP Registry.** The MCP server ships through npm only,
as `@domainbook/mcp` and inside the `domainbook` CLI, and is reached through the
`.mcp.json` that `init` writes or through `domainbook serve mcp`. There is no
`server.json`, and `@domainbook/mcp` carries no `mcpName`.

The rest of `ADR-0014` stands unchanged. domainbook publishes at 1.0.0 and later
majors under semver; all four packages — `domainbook`, `@domainbook/core`,
`@domainbook/mcp`, `@domainbook/site` — go public together, versioned by
changesets and released from CI with npm provenance. The GitHub Action is listed
from a root-level `action.yml`, and the Claude Code plugin ships from the
marketplace manifest in the repo. Release and packaging config — every
`package.json`, `.changeset/`, the workflows, the marketplace manifests —
**belongs to no domain, and is recorded at the book root**; a `distribution`
domain was considered and rejected in `ADR-0014`, for the reasons it gives.

### Consequences

- Good, because a release publishes to three places, not four, and none of them
  needs a step by hand after the npm publish.
- Good, because no manifest in the repo describes a version that was never
  released.
- Bad, because the server is not listed where clients and catalogues that read
  the MCP Registry look; someone who has not heard of domainbook will not find it
  there. Listing it later means adding `server.json` and `mcpName` back, and the
  reverse-DNS name `io.github.RafaelAugustScherer/domainbook` is still free to
  claim.
- Neutral, because the 1.0.0 commitment and the home of release config are
  carried over from `ADR-0014` as they were.

### Confirmation

There is no `server.json` at the repo root, and `@domainbook/mcp`'s
`package.json` has no `mcpName`. `npm run release` builds and runs `changeset
publish`; the release workflow opens a version PR and publishes on merge with
provenance, and nothing after it publishes the server anywhere else.

## More Information

Supersedes `ADR-0014`. The package split is `ADR-0003`; git-native versioning is
`ADR-0006`.
