---
"domainbook": major
"@domainbook/core": major
"@domainbook/mcp": major
"@domainbook/site": major
---

Drop the changelog from the book. A book holds no `changelog.md`: `domainbook validate` refuses one and `domainbook validate --fix` deletes it, and `init` and `new domain` write none. The MCP server no longer offers `get_changelog`, the site has no changelog pages, the JSON export and model schema have no `changelog` field, and a book changelog no longer clears the commit check — a change across domains clears with a decision at the book root. A project that keeps a changelog keeps it outside the book.
