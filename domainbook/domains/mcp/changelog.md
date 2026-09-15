# MCP changelog

The server that answers an agent's questions about the book from inside its own
client. What a book may contain is the `format` changelog and the tool that
reads it is the `core` changelog; the reasoning behind any entry is in the
decision it references.

MCP kept no changelog of its own before this one; its earlier entries are in the
book-wide changelog. Versions match the book-wide changelog.

## [Unreleased]

### Added

- Every tool that reads the book answers with what peers have in progress,
  marked as unmerged (`ADR-0015`). `get_decisions` indexes a peer's added or
  changed records after main's, each under a line reading `in progress — <who>
  on <branch> (draft|branch, <when> ago)`, and serves one by id when this book
  lacks it. `explain_terms` appends a word only a peer defines, or a peer's
  edited definition as a second reading after main's. `get_feature` falls back
  to a peer's feature when this book has none by that id. `search_book` returns
  locators for a peer's artifacts, marked the same way, at the path the file
  will have once merged. A peer's unchanged copy of a merged artifact is never
  repeated. A peer file that cannot be read is counted in one line — `1
  in-progress artifact from <who> on <branch> cannot be read yet` — and never
  refuses this book. `where_to_document`, `get_domain`, `get_context_map`,
  `get_changelog` and the resources are unchanged.
- The server syncs with the remote before every answer, throttled to once a
  minute by core. A remote out of reach dates the answer instead of failing it:
  `peers as of HH:MM — origin not reachable`, or `peers unknown — origin not
  reachable` when nothing was ever fetched. A repo with no remote, or with
  `collaboration.enabled: false`, answers as before.
