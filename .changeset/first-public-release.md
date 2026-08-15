---
"@domainbook/core": major
"@domainbook/mcp": major
"@domainbook/site": major
"domainbook": major
---

domainbook 1.0 — the first public release. The CLI (`domainbook`), the shared model
(`@domainbook/core`), the MCP server (`@domainbook/mcp`), and the website
(`@domainbook/site`) publish to npm together, versioned with changesets and released from
CI with npm provenance. The CLI installs `@domainbook/core` and `@domainbook/mcp`; the
website is an optional peer it names but does not install (`core/ADR-0011`). A `server.json`
describes the MCP server for the registry, the GitHub Action is listed from the repo root,
and the Claude Code plugin ships from the marketplace manifest.
