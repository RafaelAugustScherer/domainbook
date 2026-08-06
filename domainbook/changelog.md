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

- `@domainbook/site`, which reads a book as a website. A custom Astro app whose
  content collections load the book through core's loader and validate it with
  the same zod schemas `validate` applies, so a page that renders is a page whose
  content passed the same rules (`site/ADR-0001`). Every artifact has a page: an
  overview counting what the book holds and naming the milestone in progress, the
  roadmap's own prose on a page of its own, a domain page laying the canvas out
  in canvas order with the context's own glossary where the canvas puts it and
  its logs reachable on their own, a feature with its story, rules and each
  Gherkin example separately addressable and highlighted, a decision log with
  supersede chains readable in both directions, a debt register worst first, and
  a changelog timeline. Pagefind indexes the book itself rather than the built
  HTML, so the same index serves a running site and a published one.
- Any decision reference in any prose the book holds opens that record — a
  canvas section, a feature's story, a decision's own body, a debt record, a
  changelog entry. A bare `ADR-NNNN` is the book's log and a qualified one is a
  context's, the grammar `format/ADR-0005` already set; a reference no record
  answers to is left as text, and one inside a Gherkin example is left alone.
  There is no `<domain-id>/TDR-NNNN` to link, because `format/ADR-0017` says
  there is no such reference to write: a debt record reads `TDR-NNNN` and the
  page names the log it sits in.
- An artifact that stops validating while the site is up puts `validate`'s own
  line on that artifact's page instead of taking the page away. The overview
  keeps listing the context and says its canvas does not read; every other page
  is untouched; fixing the file clears it without a restart.
- The Astro project is staged into `.astro/` in the repo being read rather than
  run from inside `node_modules`, because Vite treats everything under
  `node_modules` as immutable and an edit reached the page 2 times in 9 from an
  installed package against 2 in 2 from a checkout. It is 10 in 10 now
  (`site/ADR-0004`). The folder carries its own `.gitignore` of `*`, and the watcher
  ignores any path with a dot-segment in it, so neither the staged folder nor `.git`
  can look like an edit to the book.
- `serve` serves the search bundle under the path the book publishes to. Vite strips
  `site.base` from a request before the middleware sees it, so the one prefix the
  middleware matched could never match and search was dead for the whole session on any
  book carrying a `site.base`. The built site was never affected.
- The debt register says what a quadrant is, rather than leaving `inadvertent-prudent`
  on the page as a word with no meaning attached.
- `domainbook serve` brings the site up beside the MCP server and `domainbook
  build` writes the static site into `<book>/build/site`. `build/` is reserved
  inside a book root and read by nothing (`format/ADR-0020`); it writes its own
  `.gitignore` of `*`, so the output never reaches a commit and no repo has to
  learn to ignore it. The site reads the book from disk, so an artifact edited,
  added or deleted while it is up reaches the page without a restart. Where the site is published is `site.base` in the
  book's config rather than an argument, so what reads locally is what publishes
  (`site/ADR-0002`).
- The context map is drawn as SVG at build time, with the Mermaid it derives from
  published beside it and every relationship in a table — no Mermaid shipped to
  the reader, and nothing to see only after JavaScript runs (`site/ADR-0003`). A
  `separate-ways` edge is drawn, because it was declared: dashed, labelled, and
  without an arrowhead, so it cannot be read as a channel. Contexts are laid out
  in rows by which way the arrows point, and every edge is routed around what
  sits between its two ends rather than straight through it, so no edge crosses
  a node and no label is drawn over another.
- The decision log's `deprecated` badge reads `not current`. The status cannot
  tell "the choice was reversed" from "the record was retired" apart, so the
  badge says only what both senses share and the record's own words settle it.
- `@domainbook/mcp`, which serves the book to an agent's own client over MCP.
  `domainbook serve mcp [root]` speaks the protocol on stdio and nothing else
  reaches stdout. Eight tools, every one of them read-only: `search_book`,
  `explain_terms`, `get_domain`, `get_context_map`, `get_feature`,
  `get_decisions`, `get_changelog`, and `where_to_document`. Built on
  `@modelcontextprotocol/server` 2.0.0, pinned (`mcp/ADR-0001`).
- Retrieval is scoped rather than whole. `get_decisions` answers with an index —
  one line per record, carrying the author's own opening sentence from Decision
  Outcome — scoped to a domain or to the paths you are changing; bodies come
  back only for ids you name, and a whole log takes an explicit `all`
  (`mcp/ADR-0002`). `get_changelog` scopes the same way and bounds by release:
  the newest in scope plus `[Unreleased]`, with older ones reached by naming a
  version or a date (`mcp/ADR-0003`). A path-scoped answer holds the owning
  contexts' logs and not the book's own: a root record binds every context,
  which is what makes it noise for the few paths in front of a caller. A path
  that names a folder scopes by that folder, so `packages/mcp` answers for
  everything under it rather than matching nothing. Superseded and rejected
  decisions are out of every default answer — index, search and resources alike
  — and still readable when named.
- `where_to_document` answers which book files a change belongs in, from the
  same `checkChange` the commit hook runs, so the two cannot disagree. It takes
  repo-root-relative paths and says so when given anything else, and it names
  open debt over those paths without changing the answer.
- The book is exposed as MCP resources, addressed `domainbook://<path inside the
  book>` whatever the root is called, carrying each file's last modified time
  and a cache hint of five seconds, private. The hint is short on purpose: the
  agent reading this book is usually the agent editing it.
- `domainbook serve [mcp|web] [root]`. `mcp` is the only target there is; `web`
  is named and refused until the site phase.
- `init` and `domainbook instructions` write `.mcp.json` for Claude Code,
  merging into a file that already exists rather than replacing it, and print
  the block to paste for Cursor, VS Code, Codex and Gemini CLI — including that
  VS Code nests its server under `servers` where every other client uses
  `mcpServers`. `instructions --check` says when `.mcp.json` points somewhere
  the book no longer is.
- Core grew what retrieval needs: `sectionsOf` and `sectionNamed` read an
  artifact's H2 sections back off disk, `opening` takes a first sentence,
  `contextMap` turns relationship declarations into edges deduped across
  mirrored halves, `adrRef`/`tdrRef`/`findDecision`/`live` name and resolve a
  record, and `missingBook` moved here from the CLI so both
  packages give one answer to "there is no book here".
- The enforcement loop. `domainbook check` refuses a change that touches code a
  domain's `code:` globs claim while that domain's folder under the book stays
  untouched, and names the stale files. It reads a change three ways — `--staged`
  for a commit about to happen, `--range <base>..<head>` for everything a branch
  adds, and `--session <path>` for the files an agent session touched — and
  judges all three by the same rules (`enforcement/ADR-0001`).
- Waivers as commit trailers. `Skip-Docs: <reason>` on the commit clears it, and
  `git log --format='%(trailers:key=Skip-Docs,valueonly)'` reads back what has
  been waived and why. An agent shell must write a reason; a person may run
  `SKIP_DOCS=1 git commit`, which the check stamps into the message as
  `Skip-Docs: human bypass` so history reads the same either way. The key,
  `enforcement.mode`, and `enforcement.require_reason` are config
  (`enforcement/ADR-0002`).
- `domainbook hooks install` and `domainbook hooks uninstall`. Install writes the
  check into the repo's `commit-msg` hook between `# domainbook:start` and
  `# domainbook:end`, adding to a hook that is already there rather than
  replacing it, and hands the snippet back instead when lefthook owns
  `.git/hooks`. The block puts `node_modules/.bin` on its own `PATH` first, so a
  domainbook installed as a dependency is enough and nothing has to be installed
  globally. Uninstall removes the block and leaves every other line where it was.
- `domainbook instructions`, which writes the rule into `AGENTS.md`, a `CLAUDE.md`
  that imports it, and one `.claude/rules/domainbook-<domain>.md` per domain that
  claims code, scoped to that domain's globs. `--check` says whether they are
  current and writes nothing. The instructions point at each domain's glossary
  rather than copying it, so a glossary that moves on does not leave them wrong.
  They steer and stop nothing (`ADR-0005`).
- A Claude Code plugin under `integrations/claude-code-plugin/`: a silent
  `PostToolUse` hook that records the paths a session touched, a `Stop` hook that
  runs the same check over them and blocks with the stale files named, and a
  `PreToolUse` guard that denies an agent the two ways it could take a person's
  waiver tier. The Stop hook honors `stop_hook_active` and stops blocking after
  the third time, which it says out loud.
- A GitHub Action under `integrations/action/`, which validates the book and runs
  the check over the pull request's range. Stale generated instruction files are
  printed and never fail the run.
- Open technical debt over a changed path is named on every run, and never
  changes the verdict.
- `authored-by: agent` on a decision, marking one an agent took without the
  people in `decision-makers` weighing it. Optional, absent by default, and
  `decision-makers` still names the people accountable (`format/ADR-0019`).

### Changed

- A debt record is named `TDR-NNNN` everywhere, never `<domain-id>/TDR-NNNN`.
  `format/ADR-0017` ruled that grammar out in Phase 1.1 — nothing resolves a debt
  reference, no artifact has a field that takes one — and 0.3.0 published the rule,
  but `tdrRef` went on qualifying the way `adrRef` does, so `domainbook check` and
  `where_to_document` printed a form the book says does not exist and nothing
  accepts. Both already name the record's file in the same sentence, so no message
  became less precise: `TDR-0002 is open over src/ticketing/hold.ts — read
  domains/ticketing/debt/0002-….md before you change this`. `validate` and the site
  said it correctly and are unchanged.
- The instruction layer names the tool instead of pointing at a file. `AGENTS.md`
  and each `.claude/rules/domainbook-<domain>.md` now tell an agent to call
  `explain_terms` with the words it is about to use and `where_to_document` with
  the paths it is about to change, and a domain's `glossary.md` is offered only
  as the way to read the words without MCP — and only when that file exists.
  Before this, every domain that claimed code got the line "look the domain's
  terms up in `<book>/domains/<id>/glossary.md`" whether or not there was one;
  in this repo that was five domains and five files that do not exist. This is
  what the roadmap meant by terms being pulled rather than pushed
  (`mcp/ADR-0002`).
- The CLI's dependencies are now `@domainbook/core` and `@domainbook/mcp`. The
  server is imported only when `serve` runs, so no other command pays for it at
  startup — but installing `domainbook` installs it (`core/ADR-0008`). This
  narrows `core/ADR-0001`, whose Confirmation says the CLI depends on core
  alone; that record stands as written and this one corrects it.
- `llms.txt` and `llms-full.txt` generation is off the roadmap. It was a Phase 3
  bullet and never built.
- This repo's own pull requests now run the check. `.github/workflows/ci.yml`
  calls the action over the pull request's range, so the rule `CONTRIBUTING.md`
  states — a change in behaviour, format, or a decision updates the book in the
  same pull request, or carries an explicit waiver — is enforced here rather than
  agreed to.

- Seven decision records are retired and now read `deprecated`. In every case the
  choice still holds, the code is unchanged, and it is the record that is retired
  — a sense `deprecated` does not carry in MADR, and one only this entry and the
  record's own More Information can explain.
- Four of them failed a bar on what earns a record at all: `core/ADR-0005`,
  `core/ADR-0006`, `core/ADR-0007`, and `format/ADR-0012`. A choice a user can
  observe is behaviour and belongs in a feature file; what is left earns a record
  only if reversing it would cost something. What was observable in two of them
  is now scenarios in `scaffold-a-book` and `validate-a-book`. The bar itself is
  in `CONTRIBUTING.md` under "What earns a decision" — it is a working rule
  rather than a decision about the software, so it is written where the working
  rules are and not in this log.
- The other three are about how this repo is developed rather than about the
  software, and a decision log is for the software: `ADR-0009` (fail CI on
  high-severity advisories), `ADR-0010` (scope the duplication gate) and
  `ADR-0012` (write the working rules down and lint for them). Every gate they
  describe is still in force and no workflow changed. What was only in them is
  now in `CONTRIBUTING.md` under Checks: the audit step, the duplication gate's
  scope, the rule that a gate is adopted clean rather than grandfathered, and the
  warning that `npm audit` reads the registry at the moment it runs, so a red job
  may have nothing to do with the commit.
- Records elsewhere in the book still cite the seven, and those citations are
  left as they are. The records exist and can still be read; an accepted record
  is not edited to chase a status change (`format/ADR-0013`).

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
