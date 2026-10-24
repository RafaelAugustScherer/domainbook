# Enforcement changelog

The gate and the hosts it runs in: the git hook, the Claude Code plugin, the
GitHub Action, and the skills the plugin ships. What a book may contain is the
`format` changelog and the tool that reads it is the `core` changelog; the
reasoning behind any entry is in the decision it references.

Enforcement kept no changelog of its own before this one; its earlier entries
are in the book-wide changelog. Versions match the book-wide changelog.

## [Unreleased]

### Added

- The Claude Code plugin's Stop hook publishes the session's book whenever it does
  not block: after `domainbook check --session` clears, it runs `domainbook sync`, so
  the edits a session made are on origin as the branch's draft when the session
  ends rather than at the next command that happens to sync (`ADR-0015`). A
  remote out of reach never blocks the stop: the hook exits 0 and carries sync's
  first line, `could not reach origin …`, as a `systemMessage`, and the draft is
  published at the next sync. The stop that blocks does not sync; the stop after it,
  and a session past its three blocks, sync without checking again. A repo with no
  remote syncs silently, and a shell with no `domainbook` on PATH stops as it did.
