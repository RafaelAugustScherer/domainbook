---
"@domainbook/core": minor
"@domainbook/mcp": minor
"domainbook": minor
---

Collaboration through the git remote, with no server (`ADR-0015`). `domainbook new`
claims a number or an id on the remote before it writes and publishes the branch's
draft; `domainbook sync` and `domainbook status` are new; every MCP tool that reads the
book answers with peers' in-progress artifacts, marked as unmerged; the commit hook
refuses an unclaimed artifact; the config gains `collaboration.enabled` and
`collaboration.remote`; a log may have gaps and still never reuses a number
(`format/ADR-0021`).
