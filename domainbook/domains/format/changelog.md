# Format changelog

What a book may contain: the artifact types, their frontmatter, and their body
conventions. Changes to the tool that reads them are in the `core` changelog;
the reasoning behind any entry is in the decision it references.

Versions match the book-wide changelog, so an entry here lines up with the
release it shipped in.

## [Unreleased]

## [0.3.0] - 2026-07-30

### Added

- Technical debt, the seventh artifact type. `debt/NNNN-<slug>.md` at the book
  root and inside each domain, numbered like a decision log. Required `status:
  open | accepted | repaid`, `date`, `severity: low | medium | high | critical`,
  and `quadrant`, Fowler's four boxes; optional `owners`, `code:` globs, and
  `decisions:`. Body is the title as an H1 then Debt, Impact, Remedy. Derived
  from Michael Stal's Technical Debt Records rather than adopted from a
  maintained spec, and narrowed the way MADR's frontmatter was (`ADR-0013`,
  `format/ADR-0017`).
- `debt.schema.json` joins the generated JSON Schema files, so an editor checks
  debt frontmatter as it is typed. Five artifacts now carry frontmatter, up from
  four.
- `code:` has a syntax. An absolute path, a `..` climbing out of the repo, a
  backslash separator, an empty segment, an unbalanced `{}` or `[]`, and a
  pattern naming no path are all rejected; a backslash escapes `[ ] { } * ? \`,
  so a literal bracket can be named. The rule is checked in core rather than in
  the published schema, because the message has to carry the pattern to write
  (`format/ADR-0018`).

  **This can fail a book that passed before** — a domain page's `code:` list was
  never checked until now.

### Changed

- A debt record is living: edited in place, its `status` flipped to `repaid` or
  `accepted`, never superseded. That is the opposite of the accepted-decision
  immutability rule, so two logs that look alike follow opposite lifecycles
  (`ADR-0013`).
- `TDR-NNNN` names a debt record in a message and nothing more. No artifact
  gained a `debt:` field and no qualified `<domain-id>/TDR-NNNN` reference
  resolves, so a debt record can be cited in prose only (`format/ADR-0017`).

## [0.2.0] - 2026-07-29

### Changed

- A slug is words joined by single hyphens in any script, not only in `a-z0-9`,
  so a team names its own contexts in its own language. Three rules come with it:
  NFC, NFKC-stable, and at most 247 UTF-8 bytes (`format/ADR-0016`).
- The published JSON Schema is no longer portable to every regex engine. The slug
  pattern uses Unicode property escapes, which JSON Schema does not guarantee —
  every pattern's `description` now names the `u` flag, and that sentence is the
  only warning a consumer gets (`format/ADR-0016`).
- Three narrowings past MADR 4.0: a decision opens with its title as an H1,
  carries `### Consequences`, and sits in a log numbered from 0001 with no gaps.
  An imported MADR log will usually fail at least one (`format/ADR-0015`).
- Inside a domain's own decision log, a bare `superseded by ADR-NNNN` is refused,
  because the bare form means the book-level log. A feature's `decisions:` list
  still takes both forms (`format/ADR-0014`).

## [0.1.0] - 2026-07-29

### Added

- Schemas for all six artifact types and the config file, authored in zod, with
  JSON Schema (draft 2020-12) generated from them and committed. Four artifacts
  carry frontmatter — roadmap, domain, feature, decision; the glossary and the
  changelog carry none, so their schemas describe the parsed body
  (`format/ADR-0001`, `format/ADR-0003`).
- Body conventions for domain pages, glossaries, and features: which headings a
  file carries, and in what order (`format/ADR-0003`).
- Reference syntax: `ADR-NNNN` for the book-level decision log,
  `<domain-id>/ADR-NNNN` for a domain's own, bare slugs for glossary terms
  (`format/ADR-0005`).
- A golden fixture book, and one deliberately broken file per rule. A fixture is
  a worked example of the spec, so the fixtures live in this context
  (`ADR-0011`).

### Changed

- Decision frontmatter is narrower than MADR 4.0: `status` and `date` are
  required and the status set is closed. Existing MADR files carrying no
  frontmatter will not validate as they stand (`format/ADR-0004`).
- Frontmatter is read with `yaml` rather than `gray-matter`, so a `date:` is
  checked as an ISO date string rather than as a JavaScript `Date`
  (`format/ADR-0011`).
