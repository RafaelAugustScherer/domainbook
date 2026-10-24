# @domainbook/site

## 2.0.0

### Major Changes

- 776358e: Drop the changelog from the book. A book holds no `changelog.md`: `domainbook validate` refuses one and `domainbook validate --fix` deletes it, and `init` and `new domain` write none. The MCP server no longer offers `get_changelog`, the site has no changelog pages, the JSON export and model schema have no `changelog` field, and a book changelog no longer clears the commit check — a change across domains clears with a decision at the book root. A project that keeps a changelog keeps it outside the book.

### Patch Changes

- Updated dependencies [776358e]
  - @domainbook/core@3.0.0

## 1.0.2

### Patch Changes

- 15bbeaa: Update zod to 4.6.7, `@modelcontextprotocol/server` to 2.4.0, and astro to 7.4.1
  to clear the advisories `npm audit` reports against the previous pins (zod memory
  exhaustion on oversized collections, the MCP server SDK's cross-client message
  delivery and unbounded validation, and astro's JSX/MDX and View Transitions
  injection). Transitive fixes ride the lockfile.
- Updated dependencies [15bbeaa]
  - @domainbook/core@2.0.1

## 1.0.1

### Patch Changes

- f1d30a1: Update astro to 7.2.10 to clear a critical advisory (RCE via AVIF image
  optimization, GHSA-26w7-cxv4-gfx2) and a base-path authorization bypass
  (GHSA-376h-93r7-7g6f), and refresh its transitive sharp, svgo, and js-yaml to
  their patched releases. The test runner (vitest) is bumped to 4.1.11 across the
  workspace for the same reason; that change does not affect any published output.
- Updated dependencies [cdf78ae]
  - @domainbook/core@2.0.0

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
