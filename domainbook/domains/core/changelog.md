# Core changelog

The runtime that reads a book and the CLI that runs it. What a book may *contain*
is the `format` changelog; the reasoning behind any entry is in the decision it
references.

This context was carved out of format in 0.2.0 (`ADR-0011`), so it has no 0.1.0.
Versions match the book-wide changelog.

## [Unreleased]

## [0.3.0] - 2026-07-30

### Added

- `domainbook new debt "<title>" [root] [--domain <domain-id>]` writes a debt
  record that already validates, taking the next free number in its log. There is
  no `--supersedes`, and passing one is refused: a debt record is edited in
  place, so there is nothing to supersede.
- The `code:` glob checker. Six faults, each answered with the pattern to write
  instead, and a suggested pattern always passes the check itself — the
  correction fixes every fault in the pattern rather than the one that fired
  (`format/ADR-0018`).

### Changed

- One log machinery serves both logs instead of two copies. `DecisionFile` is now
  `LogFile`, `DecisionRecord` and `DebtRecord` are both `LogRecord<T>`, and one
  loader plus one set of numbering and filename checks run over decisions and
  debt alike. The cost is that a message reworded for one log is reworded for the
  other (`core/ADR-0007`).
- Messages that name what a book holds now name debt: `validate`'s success line
  ends with a count of debt records, the root and domain folder listings gain
  `debt/*.md`, and `--help` gains a `new debt` usage line. The numbering gap
  message ends `and a decision is never deleted` where it said `and an ADR is
  never deleted`, because one sentence now serves both logs.

## [0.2.1] - 2026-07-30

### Added

- `divergence`, `overlong` and `slugBytes` on this package's surface.

### Changed

- The slug rules are computed once. `validate` and the generators read the same
  checker and word their own messages, so the two can no longer disagree about
  the same id (`core/ADR-0006`). No message changed.
- `load.ts` and `check.ts` are split into one file per artifact and per check
  family. Pure moves — no logic, message or contract changed.

### Fixed

- `new decision --supersedes N` over a record whose frontmatter does not parse as
  YAML crashed with the parser's own stack trace. It now refuses, names the file,
  and points at `domainbook validate`.

## [0.2.0] - 2026-07-29

### Added

- The `domainbook` CLI: `init`, `validate`, and `new domain|feature|decision`,
  with `new decision --supersedes N`. The book root is a trailing argument
  defaulting to `domainbook`, and the only dependency is `@domainbook/core`
  (`core/ADR-0001`).
- The loader and the model graph. A book is read into a typed model and checked
  in three layers: schema conformance, referential integrity, and conventions.
  Every issue names the file, the line, and the field, and one mistake produces
  one message rather than a cascade (`core/ADR-0003`).
- `domainbook --version` (short `-v`) prints the installed version and exits 0.
  It is a property of the program, so `<command> --version` is refused; `--help`
  still answers after a command.

### Changed

- The markdown body is read by a line scanner of our own rather than by remark,
  because every issue has to carry the line it is about. A book using setext
  headings or indented code blocks is read wrong rather than rejected
  (`core/ADR-0002`).
- The generators write only what validates. A root holding no `roadmap.md` is
  refused rather than filled with a headless half-book, and generated
  frontmatter quotes any scalar YAML could read as something else, so
  `new domain 9` writes `id: "9"` (`core/ADR-0005`).

### Fixed

- A book with CRLF line endings is read the same as one with LF. The scanner
  split on `\n` alone, so every heading kept a trailing `\r` and nothing was
  recognised — the default checkout on Windows, and no reader anywhere else.
- A domain with one bad key in its `index.md` no longer disappears. It was
  dropped from the model whole, so every *other* domain naming it in
  `relationships:` was reported as pointing at nothing. One typo produced a page
  of issues about files nobody had touched.
- A decision log is numbered over every numbered file in it, not only the files
  whose frontmatter parsed. A record with an unreadable `date:` was invisible to
  the numbering check, which then reported that number as missing.
- Reading a book never ends in a stack trace. A book root that turns out to be a
  file, or a folder this shell may not open, is an issue naming that path; a
  write that fails is a refusal naming the path and what to change.
