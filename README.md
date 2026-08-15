# domainbook

Living documentation for codebases worked on by agents. Markdown in-repo, git-versioned,
explorable as a website, queryable over MCP, and — the differentiator — **enforced**:
every code change must update the book or carry an explicit, auditable waiver.

## Quickstart

```bash
npx domainbook init            # write the first book into domainbook/
npx domainbook new domain billing
npx domainbook validate        # schema + references + conventions, one line per issue
npx domainbook serve mcp       # answer an agent's questions over MCP
```

`init` scaffolds a book that already validates, wires the enforcement rule into your
agent instructions (`AGENTS.md`, `CLAUDE.md`, `.claude/rules/`), and writes an `.mcp.json`
so an agent client can query the book. From there you map code to domains and let the
hook keep the two in step: install it with `npx domainbook hooks install`, and a commit
that changes mapped code without updating that domain's book is refused until you fix the
book or waive it with a `Skip-Docs: <reason>` trailer.

## The book

One folder per repo (default `domainbook/`). domainbook invents as little as it can —
five of the seven artifact types adopt an existing, independently maintained standard,
so the data exports back into the tools those communities already use:

| Artifact | Standard | Maintained by |
|---|---|---|
| Domain page | [Bounded Context Canvas V5](https://github.com/ddd-crew/bounded-context-canvas) + [Context Mapper](https://contextmapper.org/docs/context-map/) relationship vocabulary | DDD Crew; Context Mapper |
| Glossary | heading-per-term, exports to [Contextive](https://contextive.tech/) | domainbook; Contextive |
| Feature | [Example Mapping](https://cucumber.io/blog/bdd/example-mapping-introduction/) structure with [Gherkin](https://cucumber.io/docs/gherkin/reference/) examples | Cucumber |
| Decision | [MADR 4.0](https://adr.github.io/madr/) | the MADR project |
| Debt | derived from [Technical Debt Records](https://github.com/ms1963/TechnicalDebtRecords) + [Fowler's Technical Debt Quadrant](https://martinfowler.com/bliki/TechnicalDebtQuadrant.html) | domainbook — derived, not adopted: the source is dormant and unversioned |
| Changelog | [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) | Olivier Lacan and contributors |
| Roadmap | milestone index in frontmatter | domainbook — no external standard |

Credit where it is due: those projects did the design work, and domainbook's job is to
keep faith with them field for field rather than to invent a parallel vocabulary. Where
we deviate, an ADR says so and why — for example `separate-ways` is standard DDD but has
no production in the Context Mapper grammar, so it is kept and recorded as lossy on
export.

Schemas are authored in zod; [JSON Schema draft 2020-12](https://json-schema.org/draft/2020-12/schema)
files are generated from them and committed under `packages/core/schema`, so editors and
non-JS tools read the same spec the CLI reads. One caveat: an id may be written in any
script, so its pattern uses Unicode property escapes, which JSON Schema does not guarantee
across implementations — Python's validators reject the schema, and a JavaScript consumer
compiling the pattern without the `u` flag gets no error and the wrong meaning. Every
pattern's `description` says so. Roadmap, domain, feature, decision and debt pages carry
their machine-readable part in frontmatter; the glossary and changelog carry theirs in the
body, and their schemas describe the parsed result.

## Packages

| Package | Contents |
|---|---|
| [`domainbook`](packages/cli) | the CLI: `init`, `validate`, `new`, `check`, `hooks`, `instructions`, `export`, `serve`, `build` |
| [`@domainbook/core`](packages/core) | zod schemas, generated JSON Schema, frontmatter parsing, the loader and model graph, reference resolution, validation, the staged-diff check |
| [`@domainbook/mcp`](packages/mcp) | the MCP server — eight read-only tools over `@modelcontextprotocol/server` |
| [`@domainbook/site`](packages/site) | the explorable website — an Astro app that reads the book from disk |

Install the CLI once with `npm i -g domainbook`, or reach for it per-command with `npx
domainbook <command>`. The MCP server comes with it. The website is heavier — Astro and a
search index — so the CLI names `@domainbook/site` but does not install it: add it when you
want `domainbook serve web` or `domainbook build` (`npm i -g domainbook @domainbook/site`).

## Enforcement, three layers plus a waiver

The steering is agent instructions; the guarantee is hooks and CI.

- **Git hook** (`domainbook hooks install`) — a `commit-msg` hook that refuses a commit
  which changes mapped code but leaves that domain's book behind.
- **Claude Code plugin** — a `Stop` hook that runs the same check over a session's changes,
  so the agent fixes the book while it still has the context. Add the marketplace and
  install it:

  ```
  /plugin marketplace add RafaelAugustScherer/domainbook
  /plugin install domainbook@domainbook
  ```
- **GitHub Action** — the server-side backstop, judging the whole PR as one change:

  ```yaml
  - uses: RafaelAugustScherer/domainbook@v1
  ```
- **Waiver** — `Skip-Docs: <reason>` as a commit trailer. Agents must give a reason; a
  human may bypass prose with `SKIP_DOCS=1 git commit …`, which the hook auto-stamps.
  Either way the trailer is in `git log` forever.

## Ask the book over MCP

`domainbook serve mcp` (or the `.mcp.json` that `init` writes) exposes eight read-only
tools — `search_book`, `get_domain`, `get_context_map`, `explain_terms`, `get_feature`,
`get_decisions`, `get_changelog`, and `where_to_document` — so an agent answers "what does
*settlement* mean and which features touch it?" or "which book files does this diff need?"
without reading the whole repo. `init` also writes install snippets for Cursor, VS Code,
Codex, and Gemini CLI.

## Export into other tools

`domainbook export <target>` writes the book in the formats other tools read, under
`<book>/build/<target>/`:

| Target | Output |
|---|---|
| `contextive` | a Contextive `*.glossary.yml` per glossary |
| `cml` | a Context Mapper DSL model |
| `structurizr` | a Structurizr system-landscape `.dsl` |
| `mermaid` | the context map as a Mermaid flowchart |
| `gherkin` | a Cucumber `.feature` per feature |
| `json` | the whole model as one JSON document, typed by a committed schema |

## How it compares

domainbook overlaps with several tools and, where it can, exports into them rather than
competing:

- **[EventCatalog](https://www.eventcatalog.dev/)** pioneered git-versioned architecture
  catalogs and centers on event-driven systems — services, messages, schemas. domainbook
  centers on domain knowledge, feature behaviour, and decisions, is agnostic to
  architecture style, and adds enforcement.
- **[Backstage](https://backstage.io/)** is a hosted developer portal with a software
  catalog and plugins. domainbook is plain markdown in the repo, versioned by git, with no
  service to run.
- **[Structurizr](https://structurizr.com/) / C4** and
  **[Context Mapper](https://contextmapper.org/)** model architecture and DDD context maps
  as code. domainbook derives its context map from `relationships:` frontmatter and
  exports to both, rather than being drawn by hand.
- **[MADR](https://adr.github.io/madr/)** and **[Contextive](https://contextive.tech/)**
  own the decision-record and IDE-glossary formats domainbook adopts and exports to.

What is distinct: domainbook treats **feature scenarios as first-class** artifacts, and it
is the one that **enforces** the documentation — a code change updates the book or carries
an audited waiver, checked by a git hook and a CI backstop.

## Development

```bash
npm install           # also installs this repo's own commit hook
npm test
npm run build         # tsc --build across the workspace
npm run schemas       # regenerate the committed JSON Schema files
npm run lint
npm run duplication   # jscpd copy/paste check
```

domainbook documents itself with its own format under [domainbook/](domainbook/); the
build plan is [domainbook/roadmap.md](domainbook/roadmap.md), and `CONTRIBUTING.md` is how
the code is written. The CLI runs from the build, and this repo's own book is what it reads
by default:

```bash
node packages/cli/dist/bin.js validate
```

Requires Node 24.18.1 or newer — the version in `.nvmrc` is what CI runs, and
`engine-strict` makes npm refuse to install under anything older.

## License

MIT
