# @domainbook/mcp

## 3.0.0

### Major Changes

- 776358e: Drop the changelog from the book. A book holds no `changelog.md`: `domainbook validate` refuses one and `domainbook validate --fix` deletes it, and `init` and `new domain` write none. The MCP server no longer offers `get_changelog`, the site has no changelog pages, the JSON export and model schema have no `changelog` field, and a book changelog no longer clears the commit check — a change across domains clears with a decision at the book root. A project that keeps a changelog keeps it outside the book.

### Patch Changes

- Updated dependencies [776358e]
  - @domainbook/core@3.0.0

## 2.0.2

### Patch Changes

- 9469db5: Drop the `mcpName` field: the server is no longer listed on the MCP Registry and ships through npm only.

## 2.0.1

### Patch Changes

- 15bbeaa: Update zod to 4.6.7, `@modelcontextprotocol/server` to 2.4.0, and astro to 7.4.1
  to clear the advisories `npm audit` reports against the previous pins (zod memory
  exhaustion on oversized collections, the MCP server SDK's cross-client message
  delivery and unbounded validation, and astro's JSX/MDX and View Transitions
  injection). Transitive fixes ride the lockfile.
- Updated dependencies [15bbeaa]
  - @domainbook/core@2.0.1

## 2.0.0

### Major Changes

- cdf78ae: Collaboration through the git remote, with no server (`ADR-0015`). `domainbook new`
  claims a number or an id on the remote before it writes and publishes the branch's
  draft; `domainbook sync` and `domainbook status` are new; every MCP tool that reads the
  book answers with peers' in-progress artifacts, marked as unmerged; the commit hook
  refuses an unclaimed artifact; the config gains `collaboration.enabled` and
  `collaboration.remote`; a log may have gaps and still never reuses a number
  (`format/ADR-0021`).
  
  BREAKING CHANGE: collaboration is on by default (`collaboration.enabled: true`), so on
  a repo with a remote, `domainbook new`, `domainbook check`, and the commit-msg and Stop
  hooks now reach the network to fetch, claim, and publish the branch's draft under
  `refs/domainbook/`. Behaviour is unchanged for a repo with no remote, and can be turned
  off with `collaboration.enabled: false`. See MIGRATING.md.

### Patch Changes

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

### Minor Changes

- 68cbee8: Serve the book over MCP. `domainbook serve mcp [root]` answers eight read-only
  tools — `search_book`, `explain_terms`, `get_domain`, `get_context_map`,
  `get_feature`, `get_decisions`, `get_changelog`, and `where_to_document` — and
  exposes every artifact as a resource. Retrieval is scoped by default and
  indexed rather than whole, and `where_to_document` runs the same check the
  commit hook does. `init` and `domainbook instructions` write `.mcp.json` and
  print the block to paste for Cursor, VS Code, Codex and Gemini CLI.

### Patch Changes

- Updated dependencies [fa73d5b]
- Updated dependencies [e6c1613]
- Updated dependencies [4def62b]
- Updated dependencies [a10e957]
- Updated dependencies [81454f9]
- Updated dependencies [68cbee8]
  - @domainbook/core@1.0.0
