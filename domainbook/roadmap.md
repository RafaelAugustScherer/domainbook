---
id: domainbook
milestones:
  - { id: phase-0, name: Foundations and spec, status: planned }
  - { id: phase-1, name: Core and CLI, status: planned }
  - { id: phase-2, name: Enforcement loop, status: planned }
  - { id: phase-3, name: MCP server, status: planned }
  - { id: phase-4, name: Website, status: planned }
  - { id: phase-5, name: Migration and agent authoring, status: planned }
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
- **Feature scenarios are first-class**: behavior is documented as stories, rules, and
  concrete Gherkin examples, not left implicit in test code.
- **Enforcement, not hope**: agent instructions alone are steering; the guarantee comes
  from a three-layer loop (in-session agent hook → git hook → CI) with waivers recorded
  as git commit trailers, permanently auditable.
- **Standards all the way down**: every artifact adopts an existing versioned format
  (MADR 4.0, Bounded Context Canvas, Context Mapper vocabulary, Gherkin, Keep a
  Changelog) so data exports field-for-field into existing tools.
- **Free and open** (MIT), including the MCP server.

domainbook draws inspiration from docs-as-code tools — notably [EventCatalog](https://www.eventcatalog.dev/),
which pioneered git-versioned architecture catalogs — and focuses on domain knowledge,
feature behavior, and documentation enforcement.

## Locked decisions

Recorded here until Phase 0, when each becomes an ADR in this book.

| Decision | Choice |
|---|---|
| Audience | Open-source product, installable in any repo |
| Stack | TypeScript/Node end-to-end |
| Agent targets | Claude Code first-class + AGENTS.md/MCP baseline for all others |
| Enforcement | Layered: in-session agent hook + git hook + CI backstop; explicit waiver via commit trailer |
| Scenario format | Markdown with Example Mapping structure + fenced ```gherkin blocks |
| Website | Custom Astro app with content collections |
| Versioning | Git-native — no snapshot folders; changelog + ADR supersede chains carry history |
| Migration | Interview-driven agent skill; CLI only scaffolds and validates |
| Book root | `domainbook/` at repo root (configurable) |
| File naming | Lowercase inside the book (`roadmap.md`, `glossary.md`, `changelog.md`); uppercase reserved for repo-root ecosystem files (`README.md`, `AGENTS.md`, `LICENSE`) |
| License | MIT (confirm in Phase 0 ADR) |

## The book format

One folder per repo (default `domainbook/`). Six artifact types, each adopting an
existing standard so exports are mechanical:

```
domainbook/
├── domainbook.config.yaml        # schema-validated config
├── roadmap.md                    # milestone index (frontmatter) + prose
├── glossary.md                   # shared terms (optional)
├── decisions/                    # cross-domain ADRs (MADR 4.0)
│   └── 0001-record-title.md
└── domains/
    └── billing/
        ├── index.md              # bounded context canvas
        ├── glossary.md           # ubiquitous language for this context
        ├── changelog.md          # Keep a Changelog 1.1 format, date-based
        ├── features/
        │   └── refund-order.md   # story + rules + gherkin examples
        └── decisions/
            └── 0001-outbox.md    # domain-scoped MADR
```

**Domain (`index.md`)** — body renders the Bounded Context Canvas sections (Purpose,
Strategic Classification, Domain Roles, Inbound/Outbound Communication, Business
Decisions, Assumptions, Open Questions); the machine-readable part lives in frontmatter:

```yaml
---
id: billing
name: Billing
classification: { domain: core, evolution: custom }
owners: [rafael]
code:                              # globs that map code changes to this domain
  - src/billing/**
relationships:
  - with: ordering
    type: customer-supplier        # partnership | shared-kernel | customer-supplier |
    direction: downstream          #   upstream-downstream | separate-ways
    patterns: [ACL]                # upstream: OHS, PL — downstream: ACL, CF
---
```

The `code:` globs make enforcement precise ("src/billing changed → Billing book
untouched → block"), and `relationships:` (Context Mapper vocabulary) makes the context
map derivable instead of hand-drawn.

**Glossary (`glossary.md`)** — heading-per-term, each with definition, aliases, examples,
status (draft/validated/deprecated). Exports to Contextive `*.glossary.yml` for IDE hover
definitions.

**Feature (`features/*.md`)** — Example Mapping structure: frontmatter (id, status,
owners, related terms/decisions), then Story, one H2 per Rule with concrete examples as
fenced ```gherkin blocks, and an Open Questions section. Declarative scenarios (behavior,
not UI clicks). Parseable with `@cucumber/gherkin`.

**Decision (`decisions/NNNN-*.md`)** — MADR 4.0 verbatim: `status`, `date`,
`decision-makers` frontmatter; Context → Options → Decision Outcome → Consequences body;
4-digit sequential numbers never reused; accepted ADRs are immutable — changes are a new
ADR that marks the old one `superseded by ADR-NNNN`.

**Changelog (`changelog.md`)** — Keep a Changelog 1.1 content format with dated sections
and the six buckets (Added/Changed/Deprecated/Removed/Fixed/Security). Together with ADR
chains this carries decision history; git holds the full archive, so there are no
copy-on-version snapshot folders and none of the duplication and maintenance friction
they bring.

**Roadmap (`roadmap.md`)** — this file: milestone index in frontmatter
(`id`, `name`, `status: planned | in-progress | done`), detail per milestone in the body.

JSON Schema files (draft 2020-12) are the source of truth for all frontmatter; zod
mirrors are a consumer convenience for the site and CLI.

## Architecture

pnpm workspace monorepo, changesets for releases:

| Package | Contents |
|---|---|
| `@domainbook/schemas` | JSON Schemas per artifact + zod mirrors. Everything else depends on this. |
| `@domainbook/core` | Loader (remark/gray-matter), model graph, reference resolution, validation, staged-diff check logic |
| `domainbook` (CLI) | `init`, `new`, `validate`, `check`, `hooks install`, `export`, `mcp`, `dev`/`build` (delegates to site) |
| `@domainbook/mcp` | MCP server on `@modelcontextprotocol/server` v2 |
| `@domainbook/site` | Custom Astro app (content collections share the zod schemas) |
| `integrations/` | Claude Code plugin (hooks + skills), AGENTS.md/CLAUDE.md/Gemini templates, GitHub Action, lefthook snippet |

## Milestones

Ordering rationale: the gap being filled is *agents don't document their work* — so the
format, the enforcement loop, and the MCP server come before the website.

### Phase 0 — Foundations and spec

- Monorepo scaffold: pnpm workspaces, TypeScript (ESM, Node ≥ 20), vitest, changesets, CI.
- `@domainbook/schemas`: JSON Schemas for the artifact types + config file.
- Dogfood: expand this book — domains for domainbook's own bounded contexts (format,
  enforcement, mcp, site), glossary, and ADRs recording every locked decision above.
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

### Phase 2 — Enforcement loop

The differentiator, shipped before anything visual. Three layers plus a durable waiver:

1. **Waiver format**: git commit trailer — `Docs-Skip: <reason>` (key configurable) —
   following the established trailer convention (`Signed-off-by:`, GitLab's
   `Changelog:`). Machine-readable via `git log --format='%(trailers:...)'`, auditable
   forever.
2. **`domainbook check --staged`**: staged paths matched against domain `code:` globs;
   mapped code changed + owning domain's book unchanged + no waiver trailer → exit 1
   with an actionable message naming the stale files. Installed as a `commit-msg` hook
   (`domainbook hooks install`; lefthook config offered for repos that use it).
3. **Claude Code plugin**: a `Stop` hook running the same check over the session's
   accumulated changes — blocks completion with the actionable reason so the agent fixes
   docs *while it still has context*. Guards: honor `stop_hook_active`, cap retries,
   always name concrete files. A silent `PostToolUse` hook only accumulates touched
   paths — no per-edit nagging. Optional `PreToolUse` guard for `git commit --no-verify`.
4. **CI backstop**: GitHub Action — `domainbook validate` + re-run the paths/trailer
   check over the PR's commit range. Server-side, non-bypassable authority.
5. **Instruction layer** (steering, not enforcement): generated `AGENTS.md` section with
   the rule + exact waiver syntax; `CLAUDE.md` containing `@AGENTS.md`; optional Gemini
   settings snippet; Claude Code `.claude/rules/` path-scoped rules generated from
   `code:` globs.

Exit: in a sample repo — a commit touching mapped code without a book change and without
a trailer fails locally and in CI; a Claude Code session gets blocked at Stop, updates
the book, and completes; a waived commit passes and is queryable from git log.

### Phase 3 — MCP server

- `@domainbook/mcp` on `@modelcontextprotocol/server` v2 — stdio first (the SDK's
  dual-era default serves both current and 2026-spec clients), Streamable HTTP later.
- Tool surface modeled on established docs-serving MCP servers: search-first, get-by-id,
  small tool count — `search_book`, `get_domain`, `get_context_map`, `explain_terms`,
  `get_feature`, `get_decisions`, and `where_to_document` (given changed paths, returns
  which book files need updating — ties MCP into the enforcement loop).
- Same documents exposed as MCP resources for @-mention/browse UX, with cache hints.
- `llms.txt` / `llms-full.txt` generation (`domainbook export llms`).
- `init` writes `.mcp.json` (Claude Code project scope) + config snippets for Cursor,
  VS Code, Codex, and Gemini CLI.

Exit: in the sample repo, an agent answers "what does *settlement* mean and which
features touch it?" via MCP; `where_to_document` returns correct files for a diff.

### Phase 4 — Website

- `@domainbook/site`: custom Astro app; content collections with the shared zod schemas
  (build-time validation = same rules as the CLI).
- Views: overview; domain pages rendering the canvas; context map derived from
  `relationships:` frontmatter as Mermaid (no hand-drawn diagrams, no visual editor);
  searchable glossary; feature browser with highlighted Gherkin; decision log with
  status badges and supersede chains; changelog timeline. Pagefind full-text search.
- `domainbook dev` / `domainbook build` → static-first output, deployable to GitHub
  Pages.

Exit: the site builds from any valid book; this book published as the live demo.

### Phase 5 — Migration and agent authoring

- **Init skill** (Claude Code skill in the plugin, markdown fallback for other agents):
  scan codebase + existing docs (READMEs, docs/ trees, existing ADR folders — MADR
  imports near-verbatim), propose domains/glossary/features/decisions, interview the
  user to confirm boundaries and terms, write the book, run `validate`.
- **Maintenance skills**: "document this change" (used when the Stop hook blocks),
  "record a decision", "groom the glossary".

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
- **False-positive fatigue**: the cheap explicit waiver with a required reason is the
  pressure valve — always available, always audited.
- **Instructions get ignored**: by design the instruction layer is steering only;
  guarantees live in hooks and CI.
- **MCP spec churn**: the v2 SDK's dual-era default absorbs it; pin the SDK.
- **Site scope creep**: derived Mermaid only, static-first, no visual editor in v1.

## Open items (resolve as Phase 0 ADRs)

- Trailer key name: `Docs-Skip` vs `Book-Skip` vs `Domainbook-Skip`.
- Config format: YAML (schema-validated, recommended) vs JS.
- Whether `domainbook check` also demands a `changelog.md` entry per change, or only for
  user-visible behavior changes.
- Formalize the `roadmap` artifact schema (this file is the prototype).
