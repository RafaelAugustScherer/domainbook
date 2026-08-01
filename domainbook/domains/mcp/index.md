---
id: mcp
name: MCP
classification:
  domain: supporting-domain
  business-model: engagement-creator
  evolution: product
owners: [RafaelAugustScherer]
code:
  - packages/mcp/**
relationships:
  - with: core
    type: upstream-downstream
    direction: downstream
    patterns: [CF]
---

## Purpose

Answer an agent's questions about the book from inside its own client — what a
term means, which context owns a path, what was decided and why — without the
agent reading the whole repo.

## Domain Roles

- Gateway context: the only way into the book for a client that is not a shell in
  this repo.
- Read-only context: it serves the book, it never writes it. Authoring stays with
  the CLI and the agent skills.

## Inbound Communication

| Message             | Collaborator | Type  |
| ------------------- | ------------ | ----- |
| `search_book`       | MCP client   | Query |
| `get_domain`        | MCP client   | Query |
| `get_context_map`   | MCP client   | Query |
| `explain_terms`     | MCP client   | Query |
| `get_feature`       | MCP client   | Query |
| `get_decisions`     | MCP client   | Query |
| `get_changelog`     | MCP client   | Query |
| `where_to_document` | MCP client   | Query |
| `ReadResource`      | MCP client   | Query |

## Outbound Communication

| Message            | Collaborator | Type  |
| ------------------ | ------------ | ----- |
| `LoadBook`         | core         | Query |
| `ValidateBook`     | core         | Query |
| `MatchPathsToBook` | core         | Query |
| `ReadSections`     | core         | Query |
| `BuildContextMap`  | core         | Query |

## Business Decisions

- Built on `@modelcontextprotocol/server` v2, stdio first (`mcp/ADR-0001`).
- The tool surface stays small and search-first: find, then fetch by id. A tool
  is added only when search plus a getter cannot answer the question.
- Decision retrieval is scoped and indexed by default. `get_decisions` answers
  with an index — title, status, date, domain, one-line outcome — scoped to a
  domain or to changed paths, with superseded and rejected records left out and
  full bodies fetched by id (`mcp/ADR-0002`). A whole log is available and has to
  be asked for.
- `where_to_document` runs the path matching that lives in core, not a second
  copy of it. It is the same code the commit hook runs, so an agent asking the
  MCP server and a hook blocking a commit can never disagree about which files
  are stale. The rule being applied is enforcement's; only the implementation is
  shared (`ADR-0011`).
- Changelog retrieval is scoped the same way and bounded by release rather than
  by entry count: the newest release in scope plus `[Unreleased]`, with older
  releases reached by naming a version or a date (`mcp/ADR-0003`).
- A path-scoped answer holds the owning contexts' logs and not the book's own.
  A root record binds every context, which in the commit check is what makes it
  clear every domain at once — but in retrieval that same breadth is what makes
  it noise: a record that could bear on any context usually bears on none of the
  paths in front of the caller. The whole book stays one explicit ask away.
- A path that names a folder scopes by that folder. The `code:` globs are
  written against files, so `packages/mcp` matches nothing while
  `packages/mcp/**` matches everything under it; a caller who names a folder is
  answered for what is inside it rather than told it claims nothing. The commit
  check never sees a folder — git reports files — so this widening is retrieval's
  alone and cannot make the two disagree.
- The same documents are exposed as resources for @-mention and browse, so a
  client that prefers browsing does not need a different answer. The hint on
  them is short and private: the agent reading this book is often the agent
  editing it, so a resource that outlived a turn would serve back a copy the
  session itself has already changed.
- The server is reached as `domainbook serve mcp`, which is why the CLI carries
  this package (`core/ADR-0008`). `init` and `instructions` write `.mcp.json`
  for Claude Code and print the block for Cursor, VS Code, Codex and Gemini CLI
  rather than editing four settings files nobody asked us to touch.

## Assumptions

- Clients speak stdio today; Streamable HTTP is a later transport, not a
  different server.
- A single artifact fits comfortably in one tool response. A whole log of them
  does not, and that gap grows with the book — which is why a collection is
  served as an index and never as a set of full records (`mcp/ADR-0002`).
- Clients cache resources when told to, and a hint measured in seconds is long
  enough to collapse a burst of reads inside one turn. Nothing longer is worth
  taking: the book is small files on local disk, so the saving is not what the
  hint is for.
- The client launches the server from the repo root, which is the folder every
  path in an answer is relative to. A client that launches it somewhere else
  gets answers whose paths read from that folder instead.

## Verification Metrics

- Number of tools exposed — it going up is the signal to look, not to celebrate.
- Share of questions answered in two calls or fewer.
- Size of a default answer measured against the size of the book behind it, as
  the book grows. Two calls that return an entire decision log is not a win, and
  the call count is blind to it.
- Disagreements between `where_to_document` and `domainbook check` on the same
  diff. Any is a bug in core, since both call the same code.

## Open Questions

- Does Streamable HTTP need to ship before release, or is stdio enough for the
  clients people actually use? Stdio settled what happens to a client with no
  checkout — it is answered "no book here" — so this is now only about serving a
  book from somewhere other than the machine that holds it. Settled by knowing
  whether anyone asks for a hosted book.
- Should write tools ("record this decision") live here, or stay in the agent
  skills where a person can review the wording before it lands?
- `search_book` matches a substring against each line, with no ranking and no
  stemming, and returns the first three lines of each artifact it hits. Whether
  that finds what agents actually look for is a measurement, not a judgment:
  settled by the share of searches that lead to a `get_*` call in the next turn,
  once there are sessions to count.
