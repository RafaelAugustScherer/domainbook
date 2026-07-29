# Changelog

All notable changes to domainbook are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

Nothing is published yet — there is no installable CLI, and none of this is
usable from outside the repo. What is listed below is the spec you would be
adopting if you started writing a book today, and it is stable enough to write
against: the schemas are committed, and this book validates against them.

## [Unreleased]

### Added

- Schemas for all six artifact types and the config file, authored in zod, with
  JSON Schema (draft 2020-12) generated and committed under
  `packages/core/schema`. Four artifacts carry frontmatter — roadmap, domain,
  feature, decision — and for those, plus the config file, pointing an editor at
  the schema means frontmatter is checked as it is typed. The glossary and the
  changelog have no frontmatter (`format/ADR-0003`); their schemas describe the
  parsed body, so they are for tools reading a book rather than for an editor.
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
