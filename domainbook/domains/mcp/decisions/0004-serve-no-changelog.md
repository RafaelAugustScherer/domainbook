---
status: accepted
date: 2026-10-24
decision-makers: [RafaelAugustScherer]
---

# Serve no changelog

## Context and Problem Statement

`mcp/ADR-0003` gave the server `get_changelog`: a book's changelog, scoped to a
domain or to changed paths and bounded by release. `ADR-0017` drops the
changelog from the book, so there is nothing left for the tool to read. The
question is what the server offers in its place.

## Considered Options

- Remove `get_changelog` and every mention of the changelog in the server.
- Keep `get_changelog`, answering from the git history of the book's features,
  decisions, terms and debt records instead of from a file.

## Decision Outcome

Chosen option: **remove `get_changelog`.** The server offers seven tools, and no
answer it gives — `where_to_document`, `get_domain`, `search_book`, the resources
— names a changelog. An agent asking what changed reads the decisions dated
since then with `get_decisions`, and `git log` over the book for the rest.

Answering from git history was rejected for the reason `ADR-0017` gives: it is a
second answer to a question `git log` already answers, and a tool for it is one
more surface to keep honest.

### Consequences

- Good, because the tool list is shorter and every tool reads something the book
  holds.
- Bad, because a client that called `get_changelog` gets an unknown-tool answer;
  that is a breaking change, and it ships in 3.0.0.

### Confirmation

A client asking for the tools is offered search_book, get_domain,
get_context_map, explain_terms, get_feature, get_decisions and where_to_document,
and no other.

## More Information

Supersedes `mcp/ADR-0003`. The book-wide decision is `ADR-0017`.
