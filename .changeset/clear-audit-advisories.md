---
"@domainbook/core": patch
"@domainbook/mcp": patch
"@domainbook/site": patch
---

Update zod to 4.6.7, `@modelcontextprotocol/server` to 2.4.0, and astro to 7.4.1
to clear the advisories `npm audit` reports against the previous pins (zod memory
exhaustion on oversized collections, the MCP server SDK's cross-client message
delivery and unbounded validation, and astro's JSX/MDX and View Transitions
injection). Transitive fixes ride the lockfile.
