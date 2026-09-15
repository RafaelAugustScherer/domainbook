---
id: install-the-server-in-a-client
name: Install the server in a client
status: implemented
owners: [RafaelAugustScherer]
terms: [book-root, instruction-layer, book]
decisions: [ADR-0005, mcp/ADR-0001, format/ADR-0010]
---

## Story

As a developer who has just put a book in a repo
I want my agent's client pointed at it without me learning five config formats
So that the next session in this repo can ask the book questions instead of reading it

## Rule: The Claude Code file is written, because it is the one domainbook owns

```gherkin
Example: A repo with no .mcp.json gets one
  Given a git repo with a book at domainbook and no .mcp.json
  When domainbook instructions runs
  Then it writes .mcp.json holding one server called domainbook
  And that server runs npx -y domainbook serve mcp
  And its type is stdio
  And it prints: .mcp.json is written — Claude Code in this repo can now ask the book questions

Example: A book somewhere else is in the command the client will run
  Given a git repo with a book at docs/book
  When domainbook instructions docs/book runs
  Then the server in .mcp.json runs npx -y domainbook serve mcp docs/book

Example: init writes it too, so a fresh repo needs no second command
  Given a repo with no book
  When domainbook init runs
  Then .mcp.json is written alongside the book

Example: Running again over an untouched repo changes nothing
  Given a repo where domainbook instructions has run
  When domainbook instructions runs again
  Then .mcp.json is unchanged
  And it prints that .mcp.json is up to date
```

## Rule: Another server in that file is not domainbook's to disturb

```gherkin
Example: A file holding someone else's server keeps it
  Given a .mcp.json holding a server called playwright
  When domainbook instructions runs
  Then .mcp.json holds playwright and domainbook
  And playwright's entry is unchanged
  And it prints: .mcp.json already existed, so the domainbook server was added to it

Example: A domainbook entry a person edited is replaced, and said so
  Given a .mcp.json whose domainbook server runs a command a person changed
  When domainbook instructions runs
  Then that entry runs npx -y domainbook serve mcp again
  And it prints that the domainbook entry was rewritten

Example: A .mcp.json that is not JSON is handed back rather than overwritten
  Given a .mcp.json that does not parse as JSON
  When domainbook instructions runs
  Then it refuses with: .mcp.json is not valid JSON, so it cannot be added to — fix it, or move it aside and run this again
  And .mcp.json is unchanged
  And it exits 1
```

## Rule: Every other client gets its snippet printed, never its file edited

```gherkin
Example: The four other clients are printed with the path each one wants
  Given a git repo with a book at domainbook
  When domainbook instructions runs
  Then it prints a block for .cursor/mcp.json
  And it prints a block for .vscode/mcp.json
  And it prints a block for .codex/config.toml
  And it prints a block for .gemini/settings.json
  And it prints: those blocks are yours to paste — domainbook does not edit a settings file it did not write

Example: The blocks carry the key each client actually reads
  Given a git repo with a book at domainbook
  When domainbook instructions runs
  Then the Cursor and Gemini blocks nest the server under mcpServers
  And the VS Code block nests it under servers
  And the Codex block is TOML opening with [mcp_servers.domainbook]

Example: No file but .mcp.json is written
  Given a git repo with a book at domainbook and none of those four files
  When domainbook instructions runs
  Then .cursor/mcp.json, .vscode/mcp.json, .codex/config.toml and .gemini/settings.json are all still absent
```

## Rule: --check says whether the file still points at this book

```gherkin
Example: A book that moved leaves .mcp.json stale, and --check names it
  Given a repo where domainbook instructions has run for a book at domainbook
  And the book has since moved to docs/book
  When domainbook instructions --check runs
  Then it prints: .mcp.json points at domainbook, which is not where the book is — run "domainbook instructions docs/book" to write it again
  And it writes nothing
  And it exits 1

Example: A file that matches what would be written is current
  Given a repo where domainbook instructions has run and the book has not moved
  When domainbook instructions --check runs
  Then no line names .mcp.json as out of date
  And it exits 0
```

## Open Questions

None.
