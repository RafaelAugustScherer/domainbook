# domainbook

## 1.0.0

### Major Changes

- e6c1613: domainbook 1.0 — the first public release. The CLI (`domainbook`), the shared model
  (`@domainbook/core`), the MCP server (`@domainbook/mcp`), and the website
  (`@domainbook/site`) publish to npm together, versioned with changesets and released from
  CI with npm provenance. The CLI installs `@domainbook/core` and `@domainbook/mcp`; the
  website is an optional peer it names but does not install (`core/ADR-0011`). A `server.json`
  describes the MCP server for the registry, the GitHub Action is listed from the repo root,
  and the Claude Code plugin ships from the marketplace manifest.

### Minor Changes

- 4def62b: Write known debt down where the code is.
  
  A book gains a seventh artifact type: `debt/NNNN-<slug>.md` at the root and
  inside each domain, the decision log's twin. Four required fields —
  `status: open | accepted | repaid`, `date`, `severity: low | medium | high |
  critical`, and `quadrant`, Fowler's four boxes — plus optional `owners`, `code:`
  globs tracing the debt to what carries it, and `decisions:` naming the ADR whose
  consequences incurred it. The body is Debt, what it costs in Impact, and what
  repayment looks like in Remedy. Unlike a decision, a debt record is living: it
  is edited in place and its status flipped, never superseded.
  `debt.schema.json` is generated and committed with the other schemas.
  
  `domainbook new debt "<title>" [root] [--domain <domain-id>]` writes one that
  already validates, taking the next free number in the log it lands in. There is
  no `--supersedes` here, and passing one is refused.
  
  `code:` globs are now checked for syntax wherever they appear — on a domain page
  as well as on a debt record. An absolute path, a `..` climbing out of the repo, a
  backslash separator, an empty segment, an unbalanced `{}` or `[]`, and a pattern
  naming no path each come back with the pattern to write instead. A domain page's
  globs were never checked before, so a book carrying `/src/billing/**` passed
  validation and quietly matched nothing; it now reports one issue per pattern.
  
  Inside `@domainbook/core` the two logs share one machine rather than a copy:
  `DecisionFile` is now `LogFile`, `DecisionRecord` and the new `DebtRecord` are
  both `LogRecord<T>`, and `debtSchema` and `Debt` join the exports. `validate`'s
  success line ends with a count of debt records, and the messages that list what
  a book root or a domain folder holds now name `debt/`.
- a10e957: Read a book into a typed model, and scaffold one from nothing.
  
  `@domainbook/core` gains the loader, the model graph, reference resolution, and
  validation in three layers: schema conformance, referential integrity, and
  convention checks. Every issue it reports names the file, the line, and the
  field, and one mistake produces one message.
  
  `domainbook` is the CLI over it: `init` writes a book into any repo, `validate`
  prints every issue one per line and exits 1 if there is one, and
  `new domain|feature|decision` writes pages that already validate —
  `new decision --supersedes N` also sets the old record's status and changes
  nothing else in that file. The book root is a trailing argument that defaults to
  `domainbook`, and the package's only dependency is `@domainbook/core`.
  `domainbook --version` prints the version of the package it is installed from.
  
  An id, a term reference and a decision title may be written in any script. A
  slug is words joined by single hyphens, where a word starts with a letter or
  digit in any script and carries no capitals, so `注文履行`, `تنفيذ-الطلب` and
  `café-order` are all names a book can use. Three rules come with that: the text
  must be in Unicode NFC, it must equal its own NFKC form so a fullwidth
  look-alike cannot pass for its ASCII twin, and a slug is capped at 247 UTF-8
  bytes so the filename it forms fits what a filesystem gives one. Every ASCII
  slug that was legal before is still legal, but a name that used to fold — a
  glossary term `Café Order` was reachable as `cafe-order` — now keeps its
  letters, so a reference to it has to be written `café-order`.
  
  The published JSON Schema states that grammar with Unicode property escapes,
  which is a departure worth knowing about before you consume it: the pattern
  needs the ECMA-262 `u` flag. Ajv supplies it by default and every JavaScript
  validator tested agrees with the runtime, but Python's `jsonschema` rejects the
  schema outright, and a consumer that compiles the pattern without `u` gets no
  error and the opposite meaning. Every pattern in the schema carries a
  description saying so.
- 81454f9: Refuse a change that leaves a domain's book behind.
  
  `domainbook check` matches the paths a change touches against every domain's
  `code:` globs. A domain whose code changed while nothing under
  `<root>/domains/<id>/` did is stale, and the check names the files and exits 1.
  Any file under that folder clears it — the canvas, the glossary, the changelog, a
  feature, a decision, or a debt record. A change across several domains updates
  each of their books, or carries one record at the book root: a decision under
  `decisions/` or an entry in `changelog.md`. A path no domain claims passes
  without being mentioned, because a path nothing maps is a path nothing claims.
  
  The same check reads a change three ways. `--staged` judges the commit about to
  happen and takes `--message-file <path>` so it can read a waiver off the message
  and stamp one into it. `--range <base>..<head>` judges everything a branch adds
  as one change, so the book update may arrive in a later commit than the code and
  CI is never stricter than the hook that let a commit through. `--session <path>`
  judges the files an agent session touched, dropping the ones it edited and put
  back.
  
  A waiver is a commit trailer. `Skip-Docs: <reason>` on the commit clears it, and
  `git log --format='%(trailers:key=Skip-Docs,valueonly)'` turns "what have we
  waived and why" into one command. Git parses the trailer, so the same words in
  the middle of a message are not one. An agent shell — `CLAUDECODE=1` — must
  write a reason; a person may run `SKIP_DOCS=1 git commit`, which the check stamps
  into the message as `Skip-Docs: human bypass`. `enforcement.trailer`,
  `enforcement.mode`, and `enforcement.require_reason` move all three lines.
  
  Open debt over a changed path is named on every run, blocked or not, and never
  changes the verdict. A book that does not validate is refused rather than judged
  against.
  
  `domainbook hooks install [root]` writes the check into the repo's `commit-msg`
  hook between `# domainbook:start` and `# domainbook:end`. A hook that is already
  there is added to rather than replaced, and still decides first; one written in
  another language, or ending in `exit 0` where an appended check would never run,
  is handed back with the line to add yourself. lefthook gets the snippet and
  `.git/hooks` is left alone, and `core.hooksPath` is honored rather than taken
  over. `domainbook hooks uninstall` removes the block and nothing else.
  
  `domainbook instructions [root]` writes the rule where agents already look:
  `AGENTS.md` between markers, a `CLAUDE.md` that imports it, and one
  `.claude/rules/domainbook-<domain>.md` per domain that claims code, scoped to
  that domain's globs. It points at each domain's glossary rather than copying it,
  so terms are pulled and the instructions never go stale against a glossary that
  moved. Prose a person wrote around the markers survives; a rule file a person
  wrote is never called stale, and one belonging to a domain that went away is
  removed. `--check` says whether they are current, writes nothing, and exits 1 if
  not. The Gemini CLI settings block is printed for a person to paste and never
  written.
  
  `@domainbook/core` exports `checkChange` and `Change`. It matches paths with
  `node:path`'s `matchesGlob`, so nothing new is depended on.
- 68cbee8: Serve the book over MCP. `domainbook serve mcp [root]` answers eight read-only
  tools — `search_book`, `explain_terms`, `get_domain`, `get_context_map`,
  `get_feature`, `get_decisions`, `get_changelog`, and `where_to_document` — and
  exposes every artifact as a resource. Retrieval is scoped by default and
  indexed rather than whole, and `where_to_document` runs the same check the
  commit hook does. `init` and `domainbook instructions` write `.mcp.json` and
  print the block to paste for Cursor, VS Code, Codex and Gemini CLI.

### Patch Changes

- Updated dependencies [fa73d5b]
- Updated dependencies [e6c1613]
- Updated dependencies [4def62b]
- Updated dependencies [a10e957]
- Updated dependencies [81454f9]
- Updated dependencies [68cbee8]
  - @domainbook/core@1.0.0
  - @domainbook/mcp@1.0.0
  - @domainbook/site@1.0.0
