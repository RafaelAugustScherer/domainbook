# domainbook

Living documentation for codebases worked on by agents. Markdown in-repo, git-versioned,
explorable as a website, queryable over MCP, and — the differentiator — **enforced**:
every code change must update the book or carry an explicit, auditable waiver.

**Status: early development.** Phase 0 (foundations and spec) is the first milestone;
there is no installable CLI yet. The build plan lives in
[domainbook/roadmap.md](domainbook/roadmap.md), and domainbook documents itself with its
own format under [domainbook/](domainbook/).

## The book

One folder per repo (default `domainbook/`). Six artifact types, each adopting an
existing versioned standard so exports are mechanical:

| Artifact | Standard |
|---|---|
| Domain page | Bounded Context Canvas V5 + Context Mapper relationship vocabulary |
| Glossary | heading-per-term, Contextive-exportable |
| Feature | Example Mapping structure with Gherkin examples |
| Decision | MADR 4.0 |
| Changelog | Keep a Changelog 1.1.0 |
| Roadmap | milestone index in frontmatter |

Schemas are authored in zod; JSON Schema (draft 2020-12) files are generated from them and
committed under `packages/core/schema`, so editors and non-JS tools consume the same spec
without drift. Roadmap, domain, feature and decision pages carry their machine-readable
part in frontmatter; the glossary and changelog carry theirs in the body, and their
schemas describe the parsed result.

## Packages

| Package | Contents |
|---|---|
| `@domainbook/core` | zod schemas, generated JSON Schema, frontmatter parsing |

The CLI, MCP server, and site packages arrive in their own phases.

## Development

```bash
npm install
npm test
npm run schemas   # regenerate the committed JSON Schema files
```

Requires Node 24 or newer.

## License

MIT
