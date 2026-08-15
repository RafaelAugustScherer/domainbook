# Core changelog

The runtime that reads a book and the CLI that runs it. What a book may *contain*
is the `format` changelog; the reasoning behind any entry is in the decision it
references.

This context was carved out of format in 0.2.0 (`ADR-0011`), so it has no 0.1.0.
Versions match the book-wide changelog.

## [Unreleased]

### Added

- `domainbook export <target>` turns the loaded model into the formats other tools
  read — `contextive`, `cml`, `mermaid`, `structurizr`, `gherkin` and `json` —
  writing each under `<book>/build/<target>/` beside the built site, and refusing a
  book that does not validate. The transforms are pure functions on core's surface
  (`exportBook`, `exportTargets`), and the CLI writes what they return.
  `mermaidSource` and `labelOf` moved here from `@domainbook/site`, so `export
  mermaid` and the site draw the map from one renderer (`core/ADR-0009`). A `model`
  schema types the JSON export (`core/ADR-0010`).
- `domainbook build [root]` writes the book as a static site into
  `<book>/build/site`, so a book at `docs/book` builds into `docs/book/build/site`
  and the repo root is never touched (`format/ADR-0020`). The folder writes its
  own `.gitignore` of `*` as it is created. The command refuses a book that does
  not validate, in `validate`'s own words, and writes nothing in that case, so a
  previous build is left as it was.
- `buildDir` on core's surface, and `loadBook` reads past the folder it names
  the way it reads past `decisions/`, `debt/` and `domains/`. The root-holds
  message says what `build/` is for, because a folder listed beside `roadmap.md`
  with no explanation invites someone to put an artifact in it.
- Core exports `Context` and `supersededBy`, which the site needs to draw a
  context map and to walk a supersede chain in both directions.
- `domainbook new domain` scaffolds every artifact a domain holds rather than
  the canvas alone: `glossary.md` and `changelog.md` next to `index.md`, and
  `features/`, `decisions/` and `debt/` each holding a `.gitkeep` so the folder
  reaches the reader who clones instead of vanishing at the first commit. Each
  page names the fields it takes and the values they accept, so the first agent
  to open one fills it in without reading a schema (`TDR-0005` in
  `domains/core/debt/`).
- `domainbook init` writes `glossary.md` and `changelog.md` at the book root the
  same way. A fresh book now reports one term rather than none, because a
  glossary with no terms does not validate and the scaffolded one carries
  `<Term>` until somebody replaces it.

### Changed

- The published CLI no longer installs the website. `@domainbook/site` — and the
  `astro` and `pagefind` it pulls — moved from a dependency to an optional peer,
  so `npx domainbook init`, `validate`, `check`, `new`, and `serve mcp` install
  none of it (`core/ADR-0011`). `serve web`, bare `serve`, and `build` still use
  it, and when it is absent they refuse with a line that says to add
  `@domainbook/site` to the project — the same way the CLI itself is installed —
  rather than a stack trace. `@domainbook/mcp` stays a dependency, so the server
  the common path depends on still arrives with the CLI (`core/ADR-0008`).
- `domainbook serve` with no target brings up **both** the site and the MCP
  server: the protocol on stdio, the site on a port, and the line naming the URL
  on stderr so nothing but the protocol reaches stdout. `serve web` and
  `serve mcp` each bring up one of them. Every `.mcp.json` and client snippet
  domainbook writes already spells out `serve mcp`, so nothing it configured
  changes.
- `serve web` no longer refuses: the site it named is here.
- A book root is a folder holding `roadmap.md`, not any folder that happens to
  exist. Every command that asks "is there a book here" — `serve`, `build`,
  `check`, `hooks`, `instructions`, and the MCP server — now answers
  `docs/book: no book here — run "domainbook init docs/book" to write one` for a
  folder with no roadmap in it, where before it let the question through and
  reported whatever `validate` found inside. `validate` itself is unchanged: it
  still names the missing `roadmap.md`, because that is the question it was
  asked.

### Fixed

- `domainbook build` runs the site build in production mode whatever `NODE_ENV`
  says. A shell carrying `NODE_ENV=test` finished the build, wrote every page,
  and then never exited, because the bundler kept a handle open outside
  production — the command looked hung when its work was already done.
- `tdrRef` no longer qualifies a debt record with its domain, so `checkChange` and
  every message built from it name one the way `validate` always has: `TDR-0002`,
  with the record's file in the same sentence. `format/ADR-0017` settled that there
  is no `<domain-id>/TDR-NNNN` to write, and this function was the last thing still
  writing it. Two records in different logs can now share a reference, so
  `checkChange` orders debt by file where the references tie.
- `domainbook build` that dies part-way through takes its half-written output
  with it. The bundler had already put chunks in the output folder by then, so it
  was left holding no page and still looking like a site to publish.
- `new domain` refuses when any of the three pages it writes is already there,
  not `index.md` alone, so a glossary left behind by a deleted canvas is named
  rather than written over.
- `core/ADR-0005` and `core/ADR-0007` are retired under the bar in
  `CONTRIBUTING.md` and read `deprecated`. No code changed: generated scalars a
  YAML parser could misread are still quoted, and one descriptor still serves
  both logs. The
  quoting is now three scenarios in `scaffold-a-book`; the shared log machinery
  is internal structure and has no scenario, because nothing about it is visible
  from outside.
- `core/ADR-0006` is retired the same way. The slug rules still live in one
  module.

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
