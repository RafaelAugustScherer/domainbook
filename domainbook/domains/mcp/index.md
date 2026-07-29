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
  - with: format
    type: upstream-downstream
    direction: downstream
    patterns: [CF]
  - with: enforcement
    type: shared-kernel
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

| Message              | Collaborator | Type  |
| -------------------- | ------------ | ----- |
| `search_book`        | MCP client   | Query |
| `get_domain`         | MCP client   | Query |
| `get_context_map`    | MCP client   | Query |
| `explain_terms`      | MCP client   | Query |
| `get_feature`        | MCP client   | Query |
| `get_decisions`      | MCP client   | Query |
| `where_to_document`  | MCP client   | Query |

## Outbound Communication

| Message             | Collaborator | Type  |
| ------------------- | ------------ | ----- |
| `LoadBook`          | format       | Query |
| `MatchPathsToBook`  | enforcement  | Query |

## Business Decisions

- Built on `@modelcontextprotocol/server` v2, stdio first (`mcp/ADR-0001`).
- The tool surface stays small and search-first: find, then fetch by id. A tool
  is added only when search plus a getter cannot answer the question.
- Decision retrieval is scoped and indexed by default. `get_decisions` answers
  with an index — title, status, date, domain, one-line outcome — scoped to a
  domain or to changed paths, with superseded and rejected records left out and
  full bodies fetched by id (`mcp/ADR-0002`). A whole log is available and has to
  be asked for.
- `where_to_document` runs enforcement's path matching, not a second copy of it.
  The two contexts share that code, so an agent asking the MCP server and a hook
  blocking a commit can never disagree about which files are stale.
- The same documents are exposed as resources for @-mention and browse, so a
  client that prefers browsing does not need a different answer.

## Assumptions

- Clients speak stdio today; Streamable HTTP is a later transport, not a
  different server.
- A single artifact fits comfortably in one tool response. A whole log of them
  does not, and that gap grows with the book — which is why a collection is
  served as an index and never as a set of full records (`mcp/ADR-0002`).
- Clients cache resources when told to, so serving the whole glossary is cheap on
  repeat.

## Verification Metrics

- Number of tools exposed — it going up is the signal to look, not to celebrate.
- Share of questions answered in two calls or fewer.
- Size of a default answer measured against the size of the book behind it, as
  the book grows. Two calls that return an entire decision log is not a win, and
  the call count is blind to it.
- Disagreements between `where_to_document` and `domainbook check` on the same
  diff. Any is a bug in the shared kernel.

## Open Questions

- Does Streamable HTTP need to ship before release, or is stdio enough for the
  clients people actually use?
- Should write tools ("record this decision") live here, or stay in the agent
  skills where a person can review the wording before it lands?
- The server reads the book from disk. What happens for a client pointed at a
  repo it has not checked out?
