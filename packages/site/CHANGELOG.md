# @domainbook/site

## 1.0.0

### Major Changes

- e6c1613: domainbook 1.0 — the first public release. The CLI (`domainbook`), the shared model
  (`@domainbook/core`), the MCP server (`@domainbook/mcp`), and the website
  (`@domainbook/site`) publish to npm together, versioned with changesets and released from
  CI with npm provenance. The CLI installs `@domainbook/core` and `@domainbook/mcp`; the
  website is an optional peer it names but does not install (`core/ADR-0011`). A `server.json`
  describes the MCP server for the registry, the GitHub Action is listed from the repo root,
  and the Claude Code plugin ships from the marketplace manifest.

### Patch Changes

- Updated dependencies [fa73d5b]
- Updated dependencies [e6c1613]
- Updated dependencies [4def62b]
- Updated dependencies [a10e957]
- Updated dependencies [81454f9]
- Updated dependencies [68cbee8]
  - @domainbook/core@1.0.0
