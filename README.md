# domainbook

Living documentation for codebases worked on by agents. Markdown in-repo, git-versioned,
explorable as a website, queryable over MCP, and — the differentiator — **enforced**:
every code change must update the book or carry an explicit, auditable waiver.

**Status: early development.** Phase 0 (foundations and spec), Phase 1 (core and CLI)
and Phase 1.1 (technical debt records) are done: the format is specified, and a CLI
scaffolds a book and validates one. Nothing is published to npm yet, so the tool runs
from a checkout. Enforcement, the MCP server, and the website are still ahead. The
build plan lives in
[domainbook/roadmap.md](domainbook/roadmap.md), and domainbook documents itself with its
own format under [domainbook/](domainbook/).

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
| `@domainbook/core` | zod schemas, generated JSON Schema, frontmatter parsing, the loader and model graph, reference resolution, validation |
| `domainbook` | the CLI: `init`, `validate`, and `new` for domains, features, decisions and debt records. Its only dependency is `@domainbook/core` |

The MCP server and site packages arrive in their own phases.

## Development

```bash
npm install
npm test
npm run build         # compile both packages
npm run schemas       # regenerate the committed JSON Schema files
npm run duplication   # jscpd copy/paste check
```

The CLI runs from the build, and this repo's own book is what it reads by default:

```bash
node packages/cli/dist/bin.js validate
```

Requires Node 24.18.0 or newer — the version in `.nvmrc` is what CI runs, and
`engine-strict` makes npm refuse to install under anything older.

## License

MIT
