---
id: core
name: Core
classification:
  domain: core-domain
  business-model: engagement-creator
  evolution: custom-built
owners: [RafaelAugustScherer]
code:
  - packages/core/src/body/**
  - packages/core/src/change.ts
  - packages/core/src/check.ts
  - packages/core/src/check/**
  - packages/core/src/index.ts
  - packages/core/src/issue.ts
  - packages/core/src/load.ts
  - packages/core/src/load/**
  - packages/core/src/log.ts
  - packages/core/src/map.ts
  - packages/core/src/model.ts
  - packages/core/src/read.ts
  - packages/core/src/ref.ts
  - packages/core/src/unicode.ts
  - packages/core/src/validate.ts
  - packages/core/test/*.ts
  - packages/cli/**
relationships:
  - with: format
    type: customer-supplier
    direction: downstream
    patterns: [CF]
---

## Purpose

Turn a folder of markdown into a typed model, and say in one line a person can
act on what is wrong with it. Everything else reads the book through here, and
the CLI is where a person or an agent meets domainbook at all.

## Domain Roles

- Execution context: it runs format's spec. Nothing here decides what an
  artifact is; everything here decides what happens when a file is not one.
- Service context: the loader is the only way into the book, so enforcement, the
  MCP server, and the site share one parser and one model instead of three.
- User-facing context: `init`, `new`, and `validate` are the surface, and what
  they print is the product's voice.

## Inbound Communication

| Message            | Collaborator            | Type    |
| ------------------ | ----------------------- | ------- |
| `ValidateBook`     | developer, agent, CI    | Command |
| `InitBook`         | developer, agent        | Command |
| `WriteArtifact`    | developer, agent        | Command |
| `LoadBook`         | enforcement, mcp, site  | Query   |
| `MatchPathsToBook` | enforcement, mcp        | Query   |

## Outbound Communication

| Message            | Collaborator         | Type    |
| ------------------ | -------------------- | ------- |
| `ValidateArtifact` | format               | Command |
| `BuildSite`        | site                 | Command |
| `ValidationFailed` | developer, agent, CI | Event   |

## Business Decisions

- The runtime and the CLI are one context; format keeps the spec (`ADR-0011`).
- Validation is three layers and all of them are here: schema conformance,
  referential integrity, convention checks. A rule that cannot survive into the
  published JSON Schema runs here instead (`format/ADR-0002`).
- The published CLI carries no runtime dependency but `@domainbook/core`
  (`core/ADR-0001`).
- Markdown is read by a line scanner of our own rather than an AST library,
  because every issue has to carry the line it is about (`core/ADR-0002`).
- One mistake gets one message, and a message names the file, the field, and the
  fix (`core/ADR-0003`).
- One broken file stays one broken file. A domain whose `index.md` cannot be read
  or does not fit the schema keeps the id its folder gives it, and its glossary,
  changelog, features, decisions and debt load anyway; a log — decisions and debt
  alike — is numbered over every numbered file in it, not only the ones whose
  frontmatter parsed. Dropping a record makes the records around it look wrong —
  a deleted domain breaks other domains' relationships, a skipped file reads as a
  hole in a log — which is the cascade `core/ADR-0003` exists to prevent.
- Nothing reaches a reader as a stack trace. A path that cannot be read, written,
  or opened comes back as an issue from the loader or a refusal from the CLI, and
  either way it names the path and what to do about it.
- The generators write only what validates: `init`, then `new domain`, then
  `new feature`, then `new decision`, then `new debt`, and `validate` passes with
  nothing edited. That is why an id or a decision title that is not in NFC, that
  folds under NFKC, or that would give a filename over 247 bytes is refused
  before anything is written, naming the code point at fault and the form to
  write instead (`format/ADR-0016`).
- The slug rules are computed once. `divergence`, `overlong`, and `slugBytes`
  are core exports; `validate` and the generators both read them and word their
  own messages, so the two cannot disagree about the same id (`core/ADR-0006`).
- `--version` is a property of the program, not of a command. `domainbook
  --version` (short `-v`) prints `domainbook <version>` and exits 0, reading the
  version from the installed package's own `package.json` at runtime
  (`core/ADR-0001`); `<command> --version` is refused, because domainbook has one
  version and not one per command. `--help` stays global and still answers after
  a command — the asymmetry is deliberate: help is a property of whatever is
  being asked about, a version is a property of the program.
- `new` writes into a book or writes nothing. A root with no `roadmap.md` is not
  a book, so it is refused rather than filled with a second half-book that the
  next command then rejects.
- Generated YAML quotes any scalar a parser could read as something else, so a
  legal id like `9` or `no` survives the round trip (`core/ADR-0005`).

## Assumptions

- A book is small enough to read whole on every command. There is no cache and
  no daemon, so two runs a second apart cannot disagree.
- The reader of a message is as often an agent as a person, so the message has
  to carry the fix rather than only the fault.
- The book root is an argument, not a setting (`format/ADR-0010`), so every
  command takes it as a trailing positional and defaults to `domainbook`.
- The body grammar is small and fixed (`format/ADR-0003`), so a scanner that
  knows headings, fences, and bullets can read all of it.

## Verification Metrics

- Broken books that produce more than one message, or a message that names no
  fix. Both should stay at zero; every broken fixture asserts a single line.
- Files the generators write that `validate` then rejects — zero, and the CLI
  tests run the whole flow rather than each command alone.
- Runtime dependencies of the published CLI. It is one, and it moves only with a
  decision.
- How long `validate` takes on this book as the book grows.

## Open Questions

- Phase 2's `check --staged` lands in this context's code while enforcement owns
  the policy it applies. Which book does a change to that file have to update?
- `packages/core/src/index.ts` is this context's file but re-exports format's
  schemas. Should the published surface be split per context, or is one entry
  point right?
- `packages/core/package.json` belongs to no context, because it holds both
  contexts' dependencies. Should manifests be mapped at all, and to whom?
- Every issue fails the run today. Is a warning level worth the ambiguity of a
  book that is valid with reservations?
- `init` names the book after the folder that *contains* the book root, which is
  right for the default `domainbook/` sitting at a repo root and wrong as soon as
  the root moves: `init .` puts the book in the repo folder itself, so the id
  becomes the repo's parent, and `init docs/book` yields `docs`. It is a one-line
  edit in `roadmap.md` either way. Should `init` find the repo root instead — the
  nearest folder holding `.git` — or stop guessing and ask?
