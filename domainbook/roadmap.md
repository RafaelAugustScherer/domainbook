---
id: domainbook
milestones:
  - { id: phase-0, name: Foundations and spec, status: done }
  - { id: phase-1, name: Core and CLI, status: done }
  - { id: phase-1-1, name: Technical debt records, status: done }
  - { id: phase-2, name: Enforcement loop, status: done }
  - { id: phase-3, name: MCP server, status: done }
  - { id: phase-4, name: Website, status: done }
  - { id: phase-5, name: Migration and agent authoring, status: in-progress }
  - { id: phase-6, name: Exports and interop, status: planned }
  - { id: phase-7, name: Release and distribution, status: planned }
---

# domainbook roadmap

Living documentation for codebases worked on by agents. Markdown in-repo, git-versioned,
explorable as a website, queryable over MCP, and — the differentiator — **enforced**: every
code change must update the book or carry an explicit, auditable waiver.

This file is itself the first domainbook artifact: a `roadmap`, with a machine-readable
milestone index in frontmatter and prose in the body — the same pattern every other
artifact type follows. domainbook documents itself with its own format from the first
commit onward.

## Design principles

- **Domain-centric**: bounded contexts, ubiquitous language, feature scenarios, and
  decisions — the knowledge an agent needs to work on *any* app, regardless of
  architecture style.
- **Feature scenarios are first-class**: behaviour is documented as stories, rules, and
  concrete Gherkin examples, not left implicit in test code.
- **Enforcement, not hope**: agent instructions alone are steering; the guarantee comes
  from a three-layer loop (in-session agent hook → git hook → CI) with waivers recorded
  as git commit trailers, permanently auditable.
- **Standards all the way down**: an artifact adopts an existing versioned format
  wherever one exists (MADR 4.0, Bounded Context Canvas, Context Mapper vocabulary,
  Gherkin, Keep a Changelog) so data exports field-for-field into existing tools. Two
  of the seven have no standard to adopt — the roadmap (`format/ADR-0009`) and debt
  (`ADR-0013`) — and each says so in its own record rather than claiming a lineage.
- **Free and open** (MIT), including the MCP server.

domainbook draws inspiration from docs-as-code tools — notably [EventCatalog](https://www.eventcatalog.dev/),
which pioneered git-versioned architecture catalogs — and focuses on domain knowledge,
feature behaviour, and documentation enforcement.

## Locked decisions

Each row is now an ADR. The ADR is the record — its context, the options weighed,
and what the choice costs; this table is only an index into it. Decisions taken
since are in the same logs and not repeated here.

| Decision | Choice | Recorded in |
|---|---|---|
| Audience | Open-source product, installable in any repo | `ADR-0001` |
| Stack | TypeScript/Node end-to-end | `ADR-0002` |
| Agent targets | Claude Code first-class + AGENTS.md/MCP baseline for all others | `ADR-0005` |
| Enforcement | Layered: in-session agent hook + git hook + CI backstop; explicit waiver via commit trailer | `enforcement/ADR-0001` |
| Waiver | `Skip-Docs: <reason>` trailer — agents must justify; humans may skip prose via `SKIP_DOCS=1` (auto-stamped trailer). `enforcement.require_reason: agents \| always` | `enforcement/ADR-0002` |
| Scenario format | Markdown with Example Mapping structure + fenced ```gherkin blocks | `format/ADR-0008` |
| Website | Custom Astro app with content collections; the map is drawn as SVG and the derived Mermaid published beside it | `site/ADR-0001`, `site/ADR-0003` |
| Versioning | Git-native — no snapshot folders; changelog + ADR supersede chains carry history | `ADR-0006` |
| Migration | Interview-driven agent skill; CLI only scaffolds and validates | `ADR-0007` |
| Book root | `domainbook/` at repo root (a tool argument, not a config key) | `format/ADR-0010` |
| Runtime | ESM-only; `engines: >=24.18.0` as a floor. The release line moves when the previous one goes EOL, not on every new LTS (`ADR-0002`); the patch moves when a security release lands on that line (`ADR-0008`) | `ADR-0002`, `ADR-0008` |
| Package manager | npm workspaces — no extra tooling required of contributors | `ADR-0003` |
| Monorepo layout | 4 packages: `@domainbook/core`, `domainbook` (CLI), `@domainbook/mcp`, `@domainbook/site` | `ADR-0003` |
| Schema authoring | zod-first; JSON Schema (draft 2020-12) generated from zod and committed | `format/ADR-0001` |
| MCP SDK | `@modelcontextprotocol/server` v2 | `mcp/ADR-0001` |
| File naming | Lowercase inside the book (`roadmap.md`, `glossary.md`, `changelog.md`); uppercase reserved for repo-root ecosystem files (`README.md`, `AGENTS.md`, `LICENSE`) | `format/ADR-0003` |
| License | MIT, including the MCP server | `ADR-0001` |

## The book format

One folder per repo (default `domainbook/`). Seven artifact types, five adopting an
existing standard so exports are mechanical:

```
domainbook/
├── domainbook.config.yaml        # schema-validated config (optional)
├── roadmap.md                    # milestone index (frontmatter) + prose
├── glossary.md                   # shared terms (optional)
├── changelog.md                  # book-wide changes (optional)
├── decisions/                    # cross-domain ADRs (MADR 4.0)
│   └── 0001-record-title.md
├── debt/                         # cross-domain technical debt records
│   └── 0001-record-title.md
└── domains/
    └── billing/
        ├── index.md              # bounded context canvas
        ├── glossary.md           # ubiquitous language for this context
        ├── changelog.md          # Keep a Changelog 1.1.0 format, date-based
        ├── features/
        │   └── refund-order.md   # story + rules + gherkin examples
        ├── decisions/
        │   └── 0001-outbox.md    # domain-scoped MADR
        └── debt/
            └── 0001-manual-sweep.md   # domain-scoped debt record
```

**Domain (`index.md`)** — a Bounded Context Canvas V5 split between frontmatter and
body. Name and Strategic Classification are frontmatter, because tools index them;
Ubiquitous Language is the context's own `glossary.md`, so terms can be referenced and
exported one by one. The body is the remaining eight sections as H2s, in canvas order:
Purpose, Domain Roles, Inbound Communication, Outbound Communication, Business
Decisions, Assumptions, Verification Metrics, Open Questions. No H1 — the page's name is
in frontmatter.

```yaml
---
id: billing
name: Billing
classification:                      # all three axes are required
  domain: core-domain                # core-domain | supporting-domain | generic
  business-model: revenue-generator  # revenue-generator | engagement-creator |
                                     #   compliance-enforcer
  evolution: custom-built            # genesis | custom-built | product | commodity
owners: [RafaelAugustScherer]
code:                                # globs that map code changes to this domain
  - src/billing/**
relationships:                       # partnership | shared-kernel | separate-ways are
  - with: ordering                   #   symmetric: no direction, no patterns
    type: customer-supplier          # customer-supplier | upstream-downstream take a
    direction: downstream            #   direction; patterns are optional —
    patterns: [ACL]                  #   upstream: OHS, PL — downstream: ACL, CF
---
```

The `code:` globs make enforcement precise ("src/billing changed → Billing book
untouched → block"), and `relationships:` (Context Mapper vocabulary) makes the context
map derivable instead of hand-drawn. A relationship is declared once, by either side;
the map is the union of every declaration. One value is ours rather than Context
Mapper's: `separate-ways` is standard DDD but has no production in the CML grammar, so
`export cml` is lossy for it by design.

**Glossary (`glossary.md`)** — heading-per-term, each with definition, aliases, examples,
status (draft/validated/deprecated). Exports to Contextive `*.glossary.yml` for IDE hover
definitions.

**Feature (`features/*.md`)** — Example Mapping structure: frontmatter (id, name, status,
owners, related terms/decisions), then Story, one H2 per Rule with concrete examples as
fenced ```gherkin blocks, and an Open Questions section. Declarative scenarios (behaviour,
not UI clicks). `@cucumber/gherkin` does not read fenced blocks in markdown: each block
is extracted and wrapped in a `Feature:` before it is parsed, and error line numbers are
mapped back to the markdown file.

**Decision (`decisions/NNNN-*.md`)** — MADR 4.0 body, in MADR's own order: Context and
Problem Statement, optional Decision Drivers, Considered Options, Decision Outcome with
Consequences and optional Confirmation nested under it as H3s, then optional Pros and
Cons of the Options and More Information. The frontmatter is narrower than MADR's, which
leaves all five keys optional and the status set open: `status` and `date` are required,
status is one of `proposed | rejected | accepted | deprecated | superseded by ADR-NNNN`
— with the reference qualified as `<domain-id>/ADR-NNNN` when it points into a domain's
own log (`format/ADR-0005`) — and `decision-makers`/`consulted`/`informed` are YAML
sequences rather than prose. One key is ours rather than MADR's: the optional
`authored-by: agent`, set when an agent took the decision without the people in
`decision-makers` weighing it, so a record cannot claim a person who never read it
(`format/ADR-0019`).
4-digit sequential numbers, never reused. One rule is domainbook's alone: an accepted ADR
is immutable, so changing course is a new ADR that marks the old one superseded — where
MADR's `date` means "last updated", ours means the date the decision was taken.

A decision records a choice about the software, not about how the people and agents
building it work. Working practice — what earns a record, how a phase is run, which lint
rules are on — belongs in `CONTRIBUTING.md`, which is living and can be rewritten, rather
than in a log of immutable records. A record retired for failing that bar reads
`deprecated` in a sense MADR does not have: the choice stands, the record does not, and
the changelog carries the dated act.

**Debt (`debt/NNNN-*.md`)** — the decision log's twin, and the one living artifact in
the book: a known shortcut or gap, with `status: open | accepted | repaid`, `date`,
`severity`, and Fowler's `quadrant` in frontmatter, and Debt, Impact, Remedy as the
body. Optional `owners`, `code:` globs, and `decisions:` trace it to what carries it.
Derived from Michael Stal's Technical Debt Records rather than conformant to a
maintained spec (`ADR-0013`); the exact schema and body grammar are in
`format/ADR-0017`. Numbered like a decision log — from 0001, no gaps, never reused,
never deleted — but edited in place rather than superseded, and `TDR-NNNN` names one
in a message rather than in a reference an artifact can carry.

**Changelog (`changelog.md`)** — Keep a Changelog 1.1.0 content format with dated sections
and the six buckets (Added/Changed/Deprecated/Removed/Fixed/Security). Together with ADR
chains this carries decision history; git holds the full archive, so there are no
copy-on-version snapshot folders and none of the duplication and maintenance friction
they bring.

**Roadmap (`roadmap.md`)** — this file: milestone index in frontmatter
(`id`, `name`, `status: planned | in-progress | done`), detail per milestone in the body.

Schemas are authored once in zod; JSON Schema files (draft 2020-12) are generated from
them and committed, so editors and non-JS tools read the same spec the CLI reads. They do
not all agree with it: the slug accepts any script, so its pattern uses Unicode property
escapes, which JSON Schema does not guarantee — Python's validators fail loudly on it, and
a JavaScript consumer that compiles without the `u` flag fails silently, meaning the
opposite (`format/ADR-0016`). The
five artifacts with frontmatter — roadmap, domain, feature, decision, debt — have their
frontmatter described that way; the glossary and changelog carry none, so their schemas
describe the parsed body.

## Architecture

npm workspaces monorepo, changesets for releases:

| Package | Contents |
|---|---|
| `@domainbook/core` | zod schemas (JSON Schema generated at build), loader (`yaml` frontmatter + markdown body), model graph, reference resolution, validation, staged-diff check logic |
| `domainbook` (CLI) | `init`, `new`, `validate`, `check`, `hooks install`, `instructions`, `export`, `serve` (site and MCP together), `serve web`, `serve mcp`, `build` |
| `@domainbook/mcp` | MCP server on `@modelcontextprotocol/server` v2 |
| `@domainbook/site` | Custom Astro app (content collections share the zod schemas) |
| `integrations/` | Repo directory, not a published package: Claude Code plugin (hooks + skills), AGENTS.md/CLAUDE.md/Gemini templates, GitHub Action, lefthook snippet |

Development itself is agent-assisted: `.claude/agents/` defines the specialist
sub-agents that build domainbook — one engineer per package boundary
(format, core/CLI, enforcement, MCP, site) plus four cross-cutting roles
(book-keeper for domainbook's own book, research-scout for online verification,
spec-reviewer for adversarial review against the locked decisions, and
qa-engineer for acceptance verification and end-to-end proof of the book's
feature scenarios).

## Milestones

Ordering rationale: the gap being filled is *agents don't document their work* — so the
format, the enforcement loop, and the MCP server come before the website.

### Phase 0 — Foundations and spec

- Monorepo scaffold: npm workspaces, TypeScript (ESM, `engines: >=24.18.0`), vitest,
  changesets, CI.
- `@domainbook/core` schemas: zod definitions for the artifact types + config file, with
  generated JSON Schema files committed alongside.
- Self-documentation: expand this book — domains for domainbook's own bounded contexts
  (format, enforcement, mcp, site), glossary, and ADRs recording every locked decision
  above.
- Golden fixtures: one small valid example book + deliberately broken variants for tests.

Exit: schemas published internally; domainbook's own book validates against them.

### Phase 1 — Core and CLI

- `@domainbook/core`: parse the book into a typed model graph; resolve references
  (domain ids, term links, ADR links, feature↔term/decision links); validation = schema
  conformance + referential integrity + convention checks (ADR numbering, changelog
  format, gherkin blocks parse).
- `domainbook` CLI: `init` (scaffold book + config into any repo), `validate`,
  `new domain|feature|decision` generators (with `new decision --supersedes N` flow).

Exit: `domainbook validate` passes on this book and fails correctly on every broken
fixture.

### Phase 1.1 — Technical debt records

The between-phases review left its "fix later" findings in a PR body — exactly the
knowledge this tool exists to keep in the repo. Debt becomes the seventh artifact type
so the next agent can ask "what known debt touches the code I am about to change?".

No adopted standard exists to follow field for field: the ADR templates catalog lists
no debt template, and the nearest thing to convention is Michael Stal's
[Technical Debt Records](https://github.com/ms1963/TechnicalDebtRecords) — dormant
since late 2024, but reproduced nearly verbatim by the one other implementation that
exists. So this artifact is *derived from* Stal's TDR and credited as such, narrowed
to domainbook size the way MADR's frontmatter was (`format/ADR-0004`):

- **Log layout**: `debt/NNNN-<slug>.md` at the book root and per domain — the decision
  log's twin: 4-digit sequential numbers never reused, named `TDR-NNNN` in messages.
  The qualified `<domain-id>/TDR-NNNN` form this section originally planned was not
  built: nothing in a book can reference a debt record yet, so there is no grammar to
  resolve (`format/ADR-0017`).
- **Frontmatter**: required `status: open | accepted | repaid`, `date` (when the debt
  was recorded), `severity: low | medium | high | critical` (Stal's four levels), and
  `quadrant: deliberate-prudent | deliberate-reckless | inadvertent-prudent |
  inadvertent-reckless` ([Fowler's Technical Debt Quadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html)
  — the citable answer to "how did this happen"); optional `owners`, `code:` globs
  tracing the debt to the artifacts that carry it (the SEI traceability principle:
  debt that traces to nothing is an opinion), and `decisions:` naming the ADR whose
  consequences incurred it.
- **Body**: three H2s — Debt (the shortcut or gap, concretely), Impact (what it costs
  and when it bites), Remedy (what repayment looks like). Cost-of-delay and effort
  stay prose inside Impact and Remedy, not fields — numbers nobody measures are false
  precision.
- **Lifecycle**: unlike an ADR, a debt record is living — it is edited in place, and
  `status` flips to `repaid` (naming what repaid it) or `accepted` (a deliberate keep,
  with the reason). Never deleted; git carries the history.
- Deliverables: zod schema + generated JSON Schema, loader/model/validation in core
  (numbering, reference resolution, glob syntax), `domainbook new debt "<title>"
  [--domain <domain-id>]`, golden and broken fixtures, and this book dogfooding the
  format — the review's leftover findings become its first TDRs.
- Downstream, in their own phases: `check --staged` can warn when staged paths match
  an open debt's `code:` globs (Phase 2), MCP serves debt scoped by domain or changed
  paths (Phase 3), the site renders the register with severity badges (Phase 4),
  `export json` carries it (Phase 6).

Exit: this book records its own known debt as validated TDRs, and `domainbook new
debt` scaffolds a record that validates as written.

### Phase 2 — Enforcement loop

The differentiator, shipped before anything visual. Three layers plus a durable waiver:

1. **Waiver format**: git commit trailer — `Skip-Docs: <reason>` (key configurable) —
   following the established trailer convention (`Signed-off-by:`, GitLab's
   `Changelog:`). Machine-readable via `git log --format='%(trailers:...)'`, auditable
   forever. The requirement is tiered by actor: agent shells (detected via the
   environment markers agent CLIs export, e.g. `CLAUDECODE=1`) must supply a non-empty
   reason; a human at a terminal may waive without prose via `SKIP_DOCS=1 git commit …`,
   which the hook converts into an auto-stamped `Skip-Docs: human bypass`
   trailer — CI stays deterministic and the audit trail complete either way.
   Config: `enforcement.require_reason: agents | always`.
2. **`domainbook check --staged`**: staged paths matched against domain `code:` globs;
   mapped code changed + owning domain's book unchanged + no waiver trailer → exit 1
   with an actionable message naming the stale files. Installed as a `commit-msg` hook
   (`domainbook hooks install`; lefthook config offered for repos that use it).
   A commit touching several domains must update each of their books, or carry one
   record at the book root — a cross-cutting decision or changelog entry — which clears
   all of them, because that is where a change spanning contexts belongs. Staged paths
   matching no domain's globs pass silently and are not reported: a path nothing maps is
   a path nothing claims, and mapping is a deliberate act.
3. **Claude Code plugin**: a `Stop` hook running the same check over the session's
   accumulated changes — blocks completion with the actionable reason so the agent fixes
   docs *while it still has context*. Guards: honor `stop_hook_active`, cap retries,
   always name concrete files. A silent `PostToolUse` hook only accumulates touched
   paths — no per-edit nagging. A `PreToolUse` guard denies the human-only
   `SKIP_DOCS=1` escape and commands that unset agent markers — the two ways an agent
   could take a person's waiver tier. `--no-verify` is not guarded: it skips the hook
   rather than impersonating anyone, and CI is the layer that answers it.
4. **CI backstop**: GitHub Action — `domainbook validate` + re-run the paths/trailer
   check over the PR's commit range, judged as one change rather than commit by
   commit, so a book update may arrive in a later commit than the code it documents
   and CI is never stricter than the hook that let a commit through. Server-side,
   non-bypassable authority. It applies the same actor rules the hook does and no
   others: reading an AI `Co-Authored-By:` trailer as agent authorship was considered
   and rejected, because it holds a person who pairs with an agent to the agent's bar
   on the strength of a line the agent added.
5. **Instruction layer** (steering, not enforcement): generated `AGENTS.md` section with
   the rule + exact waiver syntax; `CLAUDE.md` containing `@AGENTS.md`; optional Gemini
   settings snippet; Claude Code `.claude/rules/` path-scoped rules generated from
   `code:` globs. It also tells an agent to look the domain's terms up before it writes
   code, rather than carrying the glossary inline: terms are pulled, not pushed, so the
   instructions never go stale against a glossary that moved (Phase 3).

Exit: in a sample repo — a commit touching mapped code without a book change and without
a trailer fails locally and in CI; a Claude Code session gets blocked at Stop, updates
the book, and completes; an agent waiver carries its reason, a human `SKIP_DOCS=1`
commit is auto-stamped, and both are queryable from git log.

### Phase 3 — MCP server

- `@domainbook/mcp` on `@modelcontextprotocol/server` v2 — stdio first (the SDK's
  dual-era default serves both current and 2026-spec clients), Streamable HTTP later.
- Tool surface modeled on established docs-serving MCP servers: search-first, get-by-id,
  small tool count — `search_book`, `get_domain`, `get_context_map`, `explain_terms`,
  `get_feature`, `get_decisions`, `get_changelog`, and `where_to_document` (given changed
  paths, returns which book files need updating — ties MCP into the enforcement loop).
- Retrieval is scoped: `get_decisions` returns an index — one line per record — scoped to
  a domain or to changed paths, with superseded and rejected records left out and bodies
  fetched by id; the whole log takes an explicit ask (`mcp/ADR-0002`). `get_changelog`
  scopes the same way and bounds by release rather than by entry count — the newest
  release in scope plus `[Unreleased]`, with older releases reached by naming a version
  or a date, and entries returned as written rather than summarized (`mcp/ADR-0003`).
- `explain_terms` is the one an agent is told to reach for first, by the instruction
  layer Phase 2 generates. Retrieval stays pull — nothing pushes the glossary into a
  session — so the tool has to be cheap to call and obvious to find, and the instructions
  have to name it rather than describe it.
- Same documents exposed as MCP resources for @-mention/browse UX, with cache hints.
- `init` writes `.mcp.json` (Claude Code project scope) + config snippets for Cursor,
  VS Code, Codex, and Gemini CLI.

Exit: in the sample repo, an agent answers "what does *settlement* mean and which
features touch it?" via MCP; `where_to_document` returns correct files for a diff.

### Phase 4 — Website

- `@domainbook/site`: custom Astro app; content collections with the shared zod schemas
  (build-time validation = same rules as the CLI).
- Views: overview; domain pages rendering the canvas; context map derived from
  `relationships:` frontmatter (no hand-drawn diagrams, no visual editor) — drawn
  as SVG at build time, with the Mermaid it derives from published beside it
  (`site/ADR-0003`); searchable glossary; feature browser with highlighted
  Gherkin; decision log with status badges and supersede chains; debt register
  with severity badges; changelog timeline. Pagefind full-text search.
- The decision log's status badge had a problem to solve rather than a value to render:
  `deprecated` means both "this decision no longer applies" and "this record was retired
  for failing the bar in `CONTRIBUTING.md` while the choice it describes still holds".
  The frontmatter cannot tell them apart, so the badge says less than the word does —
  it reads `not current`, true of both, and the record's own words settle which.
- Read for the person who opens it twice a year, not the one who lives in it: what
  matters is that every decision and every current rule of the business is there when
  someone finally goes looking.
- `domainbook serve` brings the site up beside the MCP server, reading the book from
  disk so an edit lands without a restart; `domainbook build` writes static output
  into `<book>/build/site`, deployable to GitHub Pages. Where the site is mounted is
  `site.base` in the book's config, not an argument (`site/ADR-0002`).

Exit: the site builds from any valid book; this book published as the live demo.

### Phase 5 — Migration and agent authoring

- **Init skill** (Claude Code skill in the plugin, markdown fallback for other agents):
  scan codebase + existing docs (READMEs, docs/ trees, existing ADR folders — a MADR
  body imports unchanged, but its frontmatter has to be filled in to satisfy the
  narrowed schema, `format/ADR-0004`), propose domains/glossary/features/decisions,
  interview the user to confirm boundaries and terms, write the book, run `validate`.
- **Maintenance skills**: "document this change" (used when the Stop hook blocks),
  "record a decision", "groom the glossary". "Record a decision" is where the bar in
  `CONTRIBUTING.md` and `format/ADR-0019` are actually applied: it refuses a choice that
  belongs in a
  feature file's scenarios, and it asks whether the person was in on the call before it
  decides whether to write `authored-by: agent`. A skill that writes a record without
  asking is the thing both of those decisions exist to stop.

Exit: an existing real-world repo goes from zero to a validated book through the
interview flow.

### Phase 6 — Exports and interop

- `domainbook export contextive` (glossary → `*.glossary.yml`), `export cml`
  (relationships → Context Mapper DSL), `export mermaid|structurizr` (context map),
  `export gherkin` (features → `.feature` files), `export json` (whole model,
  JSON-Schema-typed).
- Generated **Vale style** from the glossary — flags non-ubiquitous synonyms in prose
  (e.g. "user" where the book says "member").

Exit: each export validates in its target tool.

### Phase 7 — Release and distribution

- npm publish (`domainbook`, `create-domainbook` wrapper), versioned via changesets.
- Claude Code plugin published; GitHub Action on the marketplace; `server.json` to the
  MCP Registry.
- README, quickstart, demo repo, and a comparison page with related tools — written in
  a neutral, factual register.

Exit: a stranger can go from `npx domainbook init` to enforced, explorable, MCP-served
docs without reading the source.

## Risks

- **Stop-hook loops**: block only on a clearable condition (a real diff check), honor
  `stop_hook_active`, cap retries, always name concrete files. Advisory mode (`warn`)
  available in config.
- **False-positive fatigue**: the cheap explicit waiver (prose required only of agents)
  is the pressure valve — always available, always audited.
- **Instructions get ignored**: by design the instruction layer is steering only;
  guarantees live in hooks and CI.
- **MCP spec churn**: the v2 SDK's dual-era default absorbs it; pin the SDK.
- **Site scope creep**: derived Mermaid only, static-first, no visual editor in v1.

## Open items

The three items Phase 0 was to resolve are resolved: config is schema-validated YAML
inside the book (`format/ADR-0010`), `domainbook check` demands a changelog entry only
for user-visible behaviour changes (`enforcement/ADR-0003`), and the roadmap artifact has
a schema (`format/ADR-0009`).

What is still open is recorded where it belongs — in the Open Questions section of the
context that owns it, under `domains/`.
