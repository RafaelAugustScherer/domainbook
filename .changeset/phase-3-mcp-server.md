---
"@domainbook/core": minor
"@domainbook/mcp": minor
"domainbook": minor
---

Serve the book over MCP. `domainbook serve mcp [root]` answers eight read-only
tools — `search_book`, `explain_terms`, `get_domain`, `get_context_map`,
`get_feature`, `get_decisions`, `get_changelog`, and `where_to_document` — and
exposes every artifact as a resource. Retrieval is scoped by default and
indexed rather than whole, and `where_to_document` runs the same check the
commit hook does. `init` and `domainbook instructions` write `.mcp.json` and
print the block to paste for Cursor, VS Code, Codex and Gemini CLI.
