---
"@domainbook/core": major
"@domainbook/mcp": major
"domainbook": major
---

Collaboration through the git remote, with no server (`ADR-0015`). `domainbook new`
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
