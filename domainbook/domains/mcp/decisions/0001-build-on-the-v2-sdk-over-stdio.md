---
status: accepted
date: 2026-07-28
decision-makers: [rafael]
---

# Build on the v2 SDK over stdio

## Context and Problem Statement

The MCP server has to work in clients that track the spec closely and in clients
that lag it, and MCP itself is still moving. Two things had to be settled before
any tool is written: which SDK the server is built on, and which transport ships
first.

## Decision Drivers

- The clients agents actually run — editors and terminal agents — launch local
  servers over stdio.
- Spec churn is the main risk to this context, and it is absorbed cheaply by an
  SDK that speaks more than one era of the protocol.
- A remote transport brings authentication and deployment, neither of which the
  book needs to be read locally.

## Considered Options

- `@modelcontextprotocol/server` v2, stdio first, Streamable HTTP later.
- The v1 SDK, which the ecosystem has more examples for.
- A hand-rolled JSON-RPC implementation with no SDK.

## Decision Outcome

Chosen option: "v2 SDK, stdio first". Its dual-era default serves both current
clients and clients on the 2026 spec, which is the exact shape of the risk here.
Hand-rolling would put spec tracking on us permanently for no gain, since nothing
about serving a book is unusual.

The SDK version is pinned, deliberately: an SDK that absorbs protocol churn does
so by changing, and that change should arrive in a reviewed commit.

### Consequences

- Good, because a client on either era of the spec connects without a second
  server.
- Good, because stdio means no deployment, no auth, and no network for the common
  case — the server runs beside the repo it reads.
- Bad, because the book can only be served from a machine that has the repo
  checked out; a hosted book is not possible until Streamable HTTP ships.
- Bad, because pinning means protocol fixes arrive only when someone bumps the
  pin, and a client can break in the meantime.

### Confirmation

The exit test runs over stdio in the sample repo: an agent answers a question
about a term and the features that touch it, and `where_to_document` returns the
right files for a diff.
