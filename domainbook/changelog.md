# Changelog

All notable changes to domainbook are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Nothing is published to npm yet, so a version here marks the day a change reached
`main`, not a release you can install — the CLI is built and run from a checkout.
A released section records what shipped and is not edited afterwards; a
correction is an entry in the next version. The *why* behind a change lives in
the decision it references, not here (`ADR-0006`).

## [Unreleased]

### Added

- `authored-by: agent` on a decision, marking one an agent took without the
  people in `decision-makers` weighing it. Optional, absent by default, and
  `decision-makers` still names the people accountable (`format/ADR-0019`).

### Changed

- Four decision records are retired and now read `deprecated`: `core/ADR-0005`,
  `core/ADR-0006`, `core/ADR-0007`, and `format/ADR-0012`. The choices they
  describe still hold and the code is unchanged — it is the records that are
  retired, which is a sense `deprecated` does not carry in MADR. What was
  observable in two of them is now scenarios in `scaffold-a-book` and
  `validate-a-book`.

  The bar they failed lives in `CONTRIBUTING.md` under "What earns a decision":
  a choice a user can observe is behaviour and belongs in a feature file, and
  what is left earns a record only if reversing it would cost something. It is a
  working rule rather than a decision about the software, so it is written where
  the working rules are and not in this log; this entry is the dated record of
  what it retired.

## [0.3.0] - 2026-07-30

### Added

- Technical debt records, the seventh artifact type. `debt/NNNN-<slug>.md` sits
  at the book root and inside each domain, numbered the way a decision log is:
  from 0001, no gaps, never reused, never deleted. Required `status: open |
  accepted | repaid`, `date`, `severity`, and Fowler's `quadrant`; optional
  `owners`, `code:` globs, and `decisions:`. The body is the title as an H1 and
  three H2s — Debt, Impact, Remedy. Unlike a decision, a debt record is living:
  edited in place, never superseded (`ADR-0013`, `format/ADR-0017`).

  `TDR-0001` is how `validate` names a record in a message, and nothing in a book
  can point at one yet — there is no `debt:` field on any artifact and no
  qualified `<domain-id>/TDR-NNNN` reference (`format/ADR-0017`).
- `domainbook new debt "<title>" [root] [--domain <domain-id>]` writes a record
  that already validates, taking the next free number in its log. It has no
  `--supersedes`, and passing one is refused.
- `code:` globs are checked for syntax, on domain pages and debt records alike.
  Six faults — an absolute path, a `..` climbing out of the repo, a backslash
  separator, an empty segment, an unbalanced `{}` or `[]`, and a pattern naming
  no path — each answered with the pattern to write instead. A suggested pattern
  always passes the check itself. A backslash escapes `[ ] { } * ? \`, so
  `app/\[locale\]/**` names a literal bracket rather than a character class
  (`format/ADR-0018`).

  **This can fail a book that passed before.** A domain page's `code:` list was
  never checked, so `- /src/billing/**` or a pasted Windows path validated and
  then quietly matched nothing. The message carries the corrected pattern, so the
  fix is a paste.

### Changed

- The supported Node floor is `>=24.18.1`, up from `>=24.18.0`. 24.18.1 carries
  the security batch published on 2026-07-29, three of whose CVEs on the 24 line
  are rated high (`ADR-0008`).
- `@domainbook/core` exports one log machinery instead of two copies:
  `DecisionFile` is now `LogFile`, and `DecisionRecord` and the new `DebtRecord`
  are both `LogRecord<T>`. A rule about either log is written once — and a
  message reworded for one is reworded for both (`core/ADR-0007`). `debtSchema`
  and the `Debt` type join the exports.
- Messages that name what a book holds now name debt too. This matters only if
  you assert them: `validate`'s success line ends with a count of debt records;
  a book root holds `debt/*.md` and a domain folder does too; the numbering gap
  message ends `and a decision is never deleted` where it said `and an ADR is
  never deleted`; and `--help` gains a `new debt` usage line.

## [0.2.1] - 2026-07-30

### Added

- `CONTRIBUTING.md`, stating the rules the code already followed so they are
  inherited rather than rediscovered, and a lint gate that checks the mechanical
  half of them — `eslint`, `typescript-eslint` and `eslint-plugin-sonarjs`, all
  recommended sets, running in CI between typecheck and test (`ADR-0012`).
- `divergence`, `overlong` and `slugBytes` on `@domainbook/core`'s surface.

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

- The `domainbook` CLI. `init` writes a book into any repo, `validate` prints
  every issue one per line and exits 1 if there is one, and
  `new domain|feature|decision` writes pages that already validate.
  `new decision --supersedes N` sets the old record's status and touches nothing
  else in that file. The book root is a trailing argument defaulting to
  `domainbook`. Its only dependency is `@domainbook/core` (`core/ADR-0001`).
- `@domainbook/core` reads a book into a typed model and says what is wrong with
  it, in three layers: schema conformance, referential integrity, and convention
  checks. Every issue names the file, the line, and the field, and one mistake
  produces one message rather than a cascade (`core/ADR-0003`).
- `domainbook --version` (short `-v`) prints the version of the installed
  package and exits 0. It is a property of the program, so `<command> --version`
  is refused; `--help` still answers after a command.
- Whole-book fixtures. `broken-books/` holds one book per rule, each invalid in
  exactly one respect and each asserted to produce exactly one message;
  `valid-books/` holds books that must load clean.
- A `core` context in this book for the runtime and the CLI, with format keeping
  the spec and the `code:` globs split between them (`ADR-0011`). Its three
  features are the first feature artifacts this book carries about itself.

### Changed

- A slug is words joined by single hyphens in any script, not only in `a-z0-9`:
  "Café Order" is `café-order` and 日本語 is `日本語`, where both used to be an
  approximation or nothing at all. Every id that was legal before still is and
  still means the same thing (`format/ADR-0016`).

  **One thing breaks.** A term whose name carries an accent used to slug to the
  unaccented spelling, so `terms: [cafe-order]` resolved against a
  `## Café Order` heading. It no longer does; the term is `café-order`.

  Three rules come with it, checked by `validate` and refused by the generators
  before they write: a slug is in Unicode NFC and is never silently rewritten;
  it equals its own NFKC form, so fullwidth `ｓｅａｔ-ｍａｐ` cannot sit beside
  `seat-map`; and it is at most 247 UTF-8 bytes, so `NNNN-<slug>.md` fits the 255
  a filename gets.
- The published JSON Schema is no longer portable to every regex engine, and this
  is worth reading before pointing a tool at it. The slug pattern uses Unicode
  property escapes, which JSON Schema does not guarantee: Python's `jsonschema`
  rejects the schema outright, `fastjsonschema` will not compile it, and a
  consumer compiling without the `u` flag gets no error and the opposite meaning
  — accepting the literal `p{Ll}` and rejecting 注文履行. Every pattern's
  `description` now ends with a sentence naming the `u` flag, and that sentence
  is the only warning a consumer gets (`format/ADR-0016`).
- Generated frontmatter quotes any scalar a YAML parser could read as something
  other than text, so `new domain 9` writes `id: "9"` and the book still
  validates (`core/ADR-0005`).
- `new domain|feature|decision` refuses a root that holds no `roadmap.md`.
  Pointing a generator at the wrong folder used to report success and leave a
  headless half-book behind.
- A decision body must open with its title as an H1 and carry `### Consequences`,
  and a log's numbers must run from 0001 with no gaps. All three are narrower
  than MADR 4.0, and an imported MADR log will usually fail at least one
  (`format/ADR-0015`).
- Inside a domain's own decision log, `status: superseded by ADR-NNNN` is
  refused — the bare form means the book-level log, so write
  `<domain-id>/ADR-NNNN`. A feature's `decisions:` list still takes both forms
  (`format/ADR-0014`).
- The markdown body is read by a line scanner of our own rather than by remark,
  which the roadmap had named. A book using setext headings or indented code
  blocks is read wrong rather than rejected (`core/ADR-0002`).

### Fixed

- Two terms differing only by an accent are two terms. "Café Order" and "Cafe
  Order" both slugged to `cafe-order`, so a glossary defining both was rejected
  as defining one twice, and a feature referencing either got whichever came
  first.
- A book with CRLF line endings is read the same as one with LF. The scanner
  split on `\n` alone, so every heading kept a trailing `\r` and nothing was
  recognised as a heading — the default checkout on Windows, and no reader
  anywhere else (`core/ADR-0002`).
- A domain with one bad key in its `index.md` no longer disappears. It was
  dropped from the model whole, so every *other* domain naming it in
  `relationships:` was reported as pointing at nothing. One typo produced a page
  of issues about files nobody had touched.
- A decision log is numbered over every numbered file in it, not only the files
  whose frontmatter parsed. A record with an unreadable `date:` was invisible to
  the numbering check, which then reported that number as missing.
- Reading a book never ends in a stack trace. A book root that turns out to be a
  file, or a folder this shell may not open, is now an issue naming that path,
  and a write that fails is a refusal naming the path and what to change.

## [0.1.0] - 2026-07-29

### Added

- Schemas for all six artifact types and the config file, authored in zod, with
  JSON Schema (draft 2020-12) generated and committed under
  `packages/core/schema`. Four artifacts carry frontmatter — roadmap, domain,
  feature, decision — and for those, plus the config file, pointing an editor at
  the schema means frontmatter is checked as it is typed. The glossary and the
  changelog have none, so their schemas describe the parsed body
  (`format/ADR-0003`).
- Body conventions for domain pages, glossaries, and features: which headings a
  file carries, and in what order (`format/ADR-0003`).
- Reference syntax: `ADR-NNNN` for the book-level decision log,
  `<domain-id>/ADR-NNNN` for a domain's own, and bare slugs for glossary terms
  (`format/ADR-0005`).
- Decision records for every locked decision, in this book's `decisions/` folder
  and in the four domains' own logs.
- Domain pages for domainbook's own contexts — format, enforcement, mcp, site —
  with the relationships between them, and a glossary of the words this project
  uses about itself.
- A golden fixture book under `packages/core/test/fixtures/book/`, and one
  deliberately broken file per rule under `broken/`. The fixture book is the
  worked example of every convention.

### Changed

- Decision frontmatter is narrower than MADR 4.0: `status` and `date` are
  required and the status set is closed. Existing MADR files carrying no
  frontmatter will not validate as they stand (`format/ADR-0004`).
- Frontmatter is read with `yaml`, not `gray-matter` as the roadmap had named.
  YAML dates arrive as strings, so `date:` is checked as an ISO date rather than
  as a JavaScript `Date` (`format/ADR-0011`).
- The supported Node floor is `>=24.18.0`, up from `>=24.0.0`. Node 24.17.0
  carried the June 2026 security fixes, and the floor now moves to the newest
  patch of the line it sits on whenever a security release lands there
  (`ADR-0008`). The line itself moves only when the previous one goes
  end-of-life (`ADR-0002`). This repo also sets `engine-strict`, so an older Node
  fails `npm install` here rather than warning about it.
