# Changelog

All notable changes to domainbook are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Nothing is published to npm yet, so there is nothing to install. The CLI is
built and run from a checkout. What is listed below is the spec and the tool you
would be adopting if you started writing a book today, and both are stable
enough to write against: the schemas are committed, and this book validates
against them with the tool itself.

## [Unreleased]

### Added

- Technical debt records, the seventh artifact type. `debt/NNNN-<slug>.md` sits
  at the book root and inside each domain, numbered the way a decision log is:
  from 0001, no gaps, never reused, never deleted. Four required frontmatter
  fields — `status: open | accepted | repaid`, `date`, `severity: low | medium |
  high | critical`, and `quadrant: deliberate-prudent | deliberate-reckless |
  inadvertent-prudent | inadvertent-reckless` — and three optional ones:
  `owners`, `code:` globs tracing the debt to the code that carries it, and
  `decisions:` naming the ADR whose consequences incurred it. The body is the
  title as an H1 and three H2s: Debt, Impact, Remedy (`ADR-0013`,
  `format/ADR-0017`). Unlike a decision, a debt record is living — edited in
  place, its status flipped to `repaid` or `accepted`, never superseded.
  `packages/core/schema/debt.schema.json` is generated and committed with the
  rest, so an editor checks the frontmatter as it is typed.

  One thing the format does not yet do: `TDR-0001` is how `validate` names a
  record in a message, and nothing in a book can point at one. There is no
  `debt:` field on any artifact and no qualified `<domain-id>/TDR-NNNN`
  reference — writing one is a later decision, not a gap to fill in silently
  (`format/ADR-0017`).
- `domainbook new debt "<title>" [root] [--domain <domain-id>]` writes a debt
  record that already validates, taking the next free number in the log it is
  written to. It has no `--supersedes`, and passing one is refused: a debt
  record is edited in place, so there is nothing to supersede. `severity` and
  `quadrant` are written as placeholders with a comment on the line saying so.
- `code:` globs are checked for syntax, on domain pages and debt records alike.
  An absolute path, a segment climbing out of the repo with `..`, a backslash
  separator, an empty segment, an unbalanced `{}` or `[]`, and a pattern naming
  no path are each refused with the pattern to write instead, as in
  `"src\ticketing\**" separates folders with "\" — a code path uses "/", so write "src/ticketing/**"`
  (`format/ADR-0018`).

  A pattern a message offers is a pattern the check accepts. The correction
  fixes every fault in the pattern rather than the one that fired, so pasting it
  ends the exchange: `\src\billing\**` is answered with `src/billing/**` and not
  the `/src/billing/**` that would fail the next rule, and `/src//x/**` with
  `src/x/**` and not `src//x/**`. The two faults no rewrite can repair — `..`
  and an unbalanced bracket — are reported ahead of the rest and answered in
  prose, so `..\shared\**` and `/../shared/**` both name climbing above the repo
  rather than a separator or a leading slash.

  A backslash escapes `[ ] { } * ? \`, which is the only way to name a literal
  bracket in a path: `app/\[locale\]/**` matches a Next.js route folder, and an
  escaped bracket does not count toward the `{}` and `[]` balance. Unescaped,
  `app/[locale]/**` is still a character class matching one letter out of
  `locale` — a glob, not that folder. A backslash before anything else is a
  Windows separator, and one of those settles the whole pattern: every backslash
  in it is then read as `/`, escapes included. That is what keeps
  `src\ticketing\**` answering `src/ticketing/**` instead of reading its
  trailing `\*` as an escaped star.

  **This can fail a book that passed before.** A domain page's `code:` list was
  never checked, so `- /src/billing/**` or a pasted Windows path validated and
  then quietly matched nothing. Each bad pattern is now one issue, and the
  message carries the corrected pattern, so the fix is a paste.
- `domainbook --version` (short `-v`) prints `domainbook <version>` and exits 0.
  The version is read from the installed package's own `package.json` when the
  command runs, so it is the version you actually have rather than one baked in
  at build time. It is a property of the program: `domainbook validate --version`
  and every other `<command> --version` is refused. `--help` is unchanged and
  still answers after a command.
- `@domainbook/core` reads a book into a typed model and says what is wrong with
  it, in three layers: schema conformance, referential integrity (domain ids,
  term references, decision references, supersede targets), and convention
  checks. The conventions checked are decision numbering — from 0001, no gaps,
  nothing below 0001, nothing reused — filenames against titles, canvas order,
  a feature's sections and that none of them is written twice, a changelog's
  releases and that nothing sits outside one or under a second H1, and that every
  fenced Gherkin block parses and documents at least one example. Fence tags are
  matched case-insensitively, so a ```` ```Gherkin ```` block is read and checked
  rather than skipped. Every issue names the file, the line, and the field, and
  one mistake produces one message rather than a cascade (`core/ADR-0003`).
- The `domainbook` CLI. `init` writes a book into any repo, `validate` prints
  every issue one per line and exits 1 if there is one, and
  `new domain|feature|decision` writes pages that already validate.
  `new decision --supersedes N` writes the new record and sets the old one's
  status, touching nothing else in that file. The book root is a trailing
  argument that defaults to `domainbook`. Installing the CLI adds no third-party
  code — its only dependency is `@domainbook/core` (`core/ADR-0001`).
- Whole-book fixtures. `packages/core/test/fixtures/broken-books/` holds one book
  per rule, each invalid in exactly one respect and each asserted to produce
  exactly one message; `valid-books/` holds books that must load clean, for the
  rules only a legal book can show. The single-artifact fixtures under `broken/`
  stay for the schema rules.
- A `core` context in this book for the runtime and the CLI, with format keeping
  the spec and the `code:` globs split between them (`ADR-0011`). Its three
  features — validating a book, scaffolding one, recording a decision — are the
  first feature artifacts this book carries about itself.
- Schemas for all seven artifact types and the config file, authored in zod, with
  JSON Schema (draft 2020-12) generated and committed under
  `packages/core/schema`. Five artifacts carry frontmatter — roadmap, domain,
  feature, decision, debt — and for those, plus the config file, pointing an
  editor at the schema means frontmatter is checked as it is typed. The glossary
  and the changelog have no frontmatter (`format/ADR-0003`); their schemas
  describe the parsed body, so they are for tools reading a book rather than for
  an editor.
- Body conventions for domain pages, glossaries, and features: which headings a
  file must carry, and in what order. Writing an artifact by hand is now a
  question with an answer (`format/ADR-0003`).
- Reference syntax: `ADR-NNNN` for the book-level decision log,
  `<domain-id>/ADR-NNNN` for a domain's own log, and bare slugs for glossary
  terms (`format/ADR-0005`).
- Decision records for every locked decision, in this book's `decisions/` folder
  and in the four domains' own logs.
- Domain pages for domainbook's own contexts — format, enforcement, mcp, site —
  with the relationships between them, and a glossary of the words this project
  uses about itself.
- A golden fixture book under `packages/core/test/fixtures/book/`, and one
  deliberately broken file per rule under `packages/core/test/fixtures/broken/`.
  The fixture book is the worked example of every convention.

### Changed

- Messages that name what a book holds now name debt too. This matters only if
  you assert them:
  - `validate`'s success line ends with a count of debt records:
    `domainbook is a valid book — 1 domain, 1 feature, 3 decisions, 0 terms, 2 debt records`.
  - a book root holds `decisions/*.md`, `debt/*.md`, and `domains/`; a domain
    folder holds `features/*.md`, `decisions/*.md`, and `debt/*.md`.
  - the numbering gap message ends `and a decision is never deleted` where it
    said `and an ADR is never deleted`. The two logs share one sentence now, and
    `an TDR` is not English (`core/ADR-0007`).
  - `domainbook new` with nothing after it, and with an artifact it does not
    know, both name a debt record alongside a domain, a feature, and a decision.
  - `--help` gains a `new debt` usage line, and the `new` and `--domain` lines
    mention debt records.
- `@domainbook/core` exports one log machinery instead of two copies:
  `DecisionFile` is now `LogFile`, and `DecisionRecord` and the new `DebtRecord`
  are both `LogRecord<T>`. One loader and one set of numbering and filename
  checks serve the decision log and the debt log, so a rule about either is
  written once — and, unavoidably, a message reworded for one is reworded for
  both (`core/ADR-0007`). `debtSchema` and the `Debt` type join the exports.
  Nothing is published, so the rename costs no one an import.
- A slug is words joined by single hyphens in any script, not only in `a-z0-9`. A
  word starts with a letter or digit and carries no capitals, and a name keeps its
  own letters instead of being folded towards ASCII: "Café Order" is `café-order`,
  "Naïve résumé" is `naïve-résumé`, and 日本語 is `日本語` where all three used to
  be an approximation or nothing at all. Every id that was legal before is still
  legal and still means the same thing (`format/ADR-0016`).

  **One thing breaks.** A term whose name carries an accent used to slug to the
  unaccented spelling, so a feature written as `terms: [cafe-order]` against a
  glossary heading `## Café Order` resolved. It no longer does: the term is now
  `café-order`, and `validate` reports the reference as pointing at nothing until
  you change it. Nothing else in a book has to move.

  Three rules come with it, all checked by `validate` and all refused by
  `new domain|feature|decision` before it writes: a slug is in Unicode NFC and is
  never silently rewritten, because the id is also a filename and macOS and Linux
  disagree about whether two normalizations are one file; a slug equals its own
  NFKC form, so fullwidth `ｓｅａｔ-ｍａｐ` — a default IME mode for Japanese input —
  cannot sit beside `seat-map` as a second id; and a slug is at most 247 bytes as
  UTF-8, counted in bytes and not characters, so that `NNNN-<slug>.md` fits the
  255 bytes ext4 and APFS give a filename.
- The published JSON Schema is no longer portable to every regex engine, and this
  is worth reading before you point a tool at it. The slug pattern now uses
  Unicode property escapes (`\p{Ll}` and its kind), which JSON Schema does not
  guarantee. Python's `jsonschema` rejects the schema outright and raises a bare
  `re.error` at validation time rather than a `ValidationError`; `fastjsonschema`
  will not compile it. Ajv is fine by default, but a consumer with
  `unicodeRegExp: false` — or anyone writing `new RegExp(pattern)` by hand —
  compiles it with no error and gets the opposite meaning, accepting the literal
  text `p{Ll}` and rejecting 注文履行. Every `description` on a pattern now ends
  with a sentence naming the `u` flag, and that sentence is the only warning a
  consumer gets (`format/ADR-0016`). Separately, and not new: `format: "date"`
  also throws under a bare Ajv, which ships no format implementations in core —
  `ajv-formats` is Ajv's own answer to that.
- Generated frontmatter quotes any scalar a YAML parser could read as something
  other than text, so `new domain 9` writes `id: "9"` and the book it wrote still
  validates. `9`, `no`, `true` and their kind are legal ids; unquoted they were
  a number, a boolean, a null (`core/ADR-0005`).
- `new domain|feature|decision` refuses a root that holds no `roadmap.md` instead
  of writing a page into it. Pointing a generator at the wrong folder used to
  report success and leave a second, headless half-book behind.
- A decision body must open with its title as an H1 and must carry
  `### Consequences`, and a log's numbers must run from 0001 with no gaps. MADR
  4.0 marks Consequences optional and ships the title as a placeholder in its
  template rather than as a rule. All three are narrower than `format/ADR-0004`
  claimed, and an imported MADR log will usually fail at least one of them
  (`format/ADR-0015`).
- Inside a domain's own decision log, `status: superseded by ADR-NNNN` is
  refused: write `superseded by <domain-id>/ADR-NNNN`, because the bare form
  means the book-level log. A feature's `decisions:` list still takes both forms
  (`format/ADR-0014`).
- The markdown body is read by a line scanner of our own rather than by remark,
  which the engineering instructions had named. Nothing changes
  for a book that stays inside the body grammar; a book using setext headings or
  indented code blocks is read wrong rather than rejected (`core/ADR-0002`).
- Decision frontmatter is narrower than MADR 4.0: `status` and `date` are
  required, and the status set is closed. Existing MADR files that carry no
  frontmatter will not validate as they stand (`format/ADR-0004`).
- Frontmatter is read with `yaml`, not `gray-matter` as the roadmap previously
  named. YAML dates arrive as strings, so a `date:` field is checked as an ISO
  date rather than as a JavaScript `Date` (`format/ADR-0011`).
- The supported Node floor is `>=24.18.0`, up from `>=24.0.0`. Node 24.17.0
  carried the June 2026 security fixes, and the floor now moves to the newest
  patch of the line it sits on whenever a security release lands there
  (`ADR-0008`). The line itself still moves only when the previous one goes
  end-of-life, not each time a new major reaches LTS (`ADR-0002`). This repo also
  sets `engine-strict`, so an older Node fails `npm install` here rather than
  warning about it.

### Fixed

- Two terms that differ only by an accent are two terms. "Café Order" and "Cafe
  Order" both slugged to `cafe-order`, so a glossary defining both was rejected
  as defining one term twice, and a feature referencing either got whichever came
  first. They are now `café-order` and `cafe-order` and neither can be mistaken
  for the other.
- A book with CRLF line endings is read the same as one with LF. The scanner
  split on `\n` alone, so every heading kept a trailing `\r`, nothing was
  recognised as a heading, and the whole book came back broken. That is the
  default checkout on Windows under git's `core.autocrlf=true`, so it affected
  every reader on that platform and no reader anywhere else (`core/ADR-0002`).
- A domain with one bad key in its `index.md` no longer disappears. The domain
  was dropped from the model whole — its glossary, changelog, features and
  decisions with it — and because it was gone, every *other* domain that named it
  in `relationships:` was reported as pointing at a domain that does not exist.
  One typo produced a page of issues about files nobody had touched. The domain
  now keeps the id its folder gives it and everything under it still loads, so
  the typo reports the typo.
- A decision log is numbered over every numbered file in it, not only the files
  whose frontmatter parsed. A record with an unreadable `date:` was invisible to
  the numbering check, which then reported the number as missing — telling you an
  ADR had been deleted while it sat in the folder in front of you.
- Reading a book never ends in a stack trace. A book root that turns out to be a
  file, or a folder this shell may not open, is now an issue naming that path.
  The generators answer the same way: a write that fails is a refusal naming the
  path and what to change, not a Node error. The last hole in that promise was
  `new decision --supersedes N` over a record whose frontmatter does not parse
  as YAML — it crashed with the parser's own stack trace; it now refuses, names
  the file, and points at `domainbook validate` to see what to fix.
