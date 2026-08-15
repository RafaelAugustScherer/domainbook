---
status: accepted
date: 2026-08-15
decision-makers: [RafaelAugustScherer]
---

# Publish domainbook 1.0, and keep release config at the book root

## Context and Problem Statement

Phase 7 is release and distribution. `ADR-0003` already chose changesets and four
npm packages, and `ADR-0006` chose git-native versioning. What was left open was
the release itself — which packages are public, what version they start at, and
how the MCP server and the GitHub Action reach their registries — and a question
`domains/core` had been carrying since Phase 3: `packages/*/package.json`, the
changeset config, the workflows, and the marketplace manifests map to no domain.
Who owns them?

## Decision Drivers

- The exit criterion is that a stranger goes from `npx domainbook init` to a
  working, enforced, explorable, MCP-served book, so the install has to be real.
- A published package name and a version are contracts that cannot be taken back.
- Release and packaging config is repo-wide: it is not about any one context, and
  forcing it into one would misrepresent it.

## Considered Options

For the version: start at 0.1.0 (pre-1.0, the API may still move) or 1.0.0 (a
stable-API commitment). For the release config's home: a new `distribution`
domain that owns the manifests and workflows; the book root, mapped to no domain;
or leave it unmapped and unrecorded.

## Decision Outcome

domainbook publishes at **1.0.0**. All four packages — `domainbook`,
`@domainbook/core`, `@domainbook/mcp`, `@domainbook/site` — go public together,
versioned by changesets and released from CI with npm provenance (the repo is
public, so the attestation is public too). The MCP server is described by a
`server.json` under the reverse-DNS name `io.github.RafaelAugustScherer/domainbook`
and published to the MCP Registry after npm; the GitHub Action is listed from a
root-level `action.yml`, because the Marketplace requires the metadata file at the
repo root; the Claude Code plugin ships from the marketplace manifest already in
the repo.

Release and packaging config — every `package.json`, `.changeset/`, the release
workflow, `server.json`, the marketplace manifests — **belongs to no domain, and
is recorded here at the book root.** This answers the question `domains/core` was
carrying: manifests are not core's, not format's, not anyone's; they are repo-wide
infrastructure, and a cross-cutting record is where a cross-cutting concern
belongs. A `distribution` domain was considered and rejected — it would be a
bounded context with no ubiquitous language of its own beyond standard packaging
terms, and the architecture names five domains, not six.

1.0.0 over 0.1.0 because the format, the enforcement loop, the server, and the
site are all built and documented: the product a stranger installs is the whole
product, and a version that said "0.x, may move" would undersell a contract we
mean to keep. The cost is that a breaking change now takes a 2.0.0, which is the
point of saying 1.0.

### Consequences

- Good, because `npx domainbook@1` resolves to a real, installable tool, and the
  exit criterion can actually be met.
- Good, because the manifest question is closed: a change to release config
  updates this record or the book-wide changelog, not a domain's book.
- Bad, because 1.0.0 is a promise — the CLI surface, the on-disk format, and the
  package exports are now under semver, and breaking any of them is a major
  release, not a quiet edit.
- Bad, because publishing to four places (npm, the MCP Registry, the GitHub
  Marketplace, a plugin marketplace) is more moving parts than one, each with its
  own account and auth; the runnable steps live in `CONTRIBUTING.md` so they stay
  in one place.
- Neutral, because how the release runs — the changeset gate, the workflow, the
  provenance flags — is working practice, so it is in `CONTRIBUTING.md`, not in a
  record meant to outlive the tooling that happens to implement it.

### Confirmation

`npm run release` builds and runs `changeset publish`; the release workflow opens
a version PR and publishes on merge with provenance. `changeset status` in CI
refuses a change to `packages/**` that carries no changeset. The four
`package.json` files declare `repository` and publish public, and
`@domainbook/mcp` carries an `mcpName` matching the name in `server.json`.

## More Information

The package split is `ADR-0003`; git-native versioning is `ADR-0006`; the CLI's
own dependency choices are `core/ADR-0001`, `core/ADR-0008`, and `core/ADR-0011`;
the `create-domainbook` wrapper the roadmap named for this phase was dropped in
favour of `npx domainbook init`, which the exit criterion already names.
