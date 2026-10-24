---
status: accepted
date: 2026-10-24
decision-makers: [RafaelAugustScherer]
---

# Drop the changelog from the book

## Context and Problem Statement

A book holds a Keep a Changelog `changelog.md` at its root and one per domain,
and `ADR-0006` gave it a job: to say "what changed for a reader", the narrative
git cannot. In practice the job is done elsewhere. A feature's scenarios say what
the system does now, a decision says why it changed and when, the glossary says
which words moved, and `git log` on any of those files says exactly when. Most
changelog entries in this repo's own book restate a decision and cite it. What a
release shipped to a package's users is already written by the project's release
tool — changesets here — outside the book.

What is left is upkeep with no reader who needs it. Entries pile up under
`[Unreleased]` because nothing depends on them being cut: this repo held 1.0.0
through 2.0.1 uncut, and a repo with no numbered releases has no moment to cut at
all. Keeping the changelog would mean a grouping setting, tag detection, two
enforcement rules and ranged reads, all to maintain a file that repeats the rest
of the book.

The question is whether the changelog stays an artifact of the book.

## Decision Drivers

- Every artifact in the book should answer a question no other artifact answers.
- A release changelog for a project's users belongs to the project and its
  release tooling, not to documentation of its domains.
- A book that has one must be told plainly, not silently ignored and left stale.

## Considered Options

- Keep the changelog, grouped per book by release or by date, with the commit
  hook holding each grouping to its rule.
- Keep the changelog as an optional artifact, and add a view of what changed
  derived from the git history of features, decisions, terms and debt records.
- Drop the changelog from the book entirely.

## Decision Outcome

Chosen option: **drop the changelog from the book.** A book holds no
`changelog.md`, at its root or in a domain, and nothing in domainbook reads,
writes, serves, renders or exports one.

- `domainbook validate` refuses a book `changelog.md` and names
  `domainbook validate --fix`, which deletes it. A project that wants a changelog
  keeps one outside the book.
- `init` and `new domain` write none. The MCP server has no `get_changelog`, the
  site has no changelog page, and the JSON export has no `changelog` field.
- A change that spans several domains clears them all with a decision at the book
  root, or with an update to each domain's book. A root changelog entry no longer
  does.
- History stays in git, as `ADR-0006` chose: one copy of every page, no snapshot
  folders, and a reversed decision adds a new record marking the old one
  superseded. What changed is `git log` on the book's files; why is the decision
  it cites.

This supersedes `ADR-0006`, whose git-native choice it carries over unchanged.
The two domain records that decided how the changelog was served and when it was
owed an entry are superseded in their own logs, as the format requires:
`mcp/ADR-0003` by `mcp/ADR-0004`, and `enforcement/ADR-0003` by
`enforcement/ADR-0004`. Format's debt record 0001, "The changelog contract is
narrower than the standard it names", is repaid, because its subject no longer
exists.

Keeping it with a per-book grouping was rejected because every rule it needs
maintains a file nobody needs kept. Keeping it optional with a derived view was
rejected because two answers to "what changed" — one written, one derived — is
one more than the book should hold, and the derived one adds a tool for a
question `git log` already answers.

### Consequences

- Good, because the book holds only artifacts that say something no other one
  says, and there is no file whose upkeep depends on a step someone has to
  remember.
- Good, because a format, a parser, an MCP tool, a site page and their tests are
  gone, and with them every way they could disagree.
- Bad, because a reader who wants "what changed since I last looked" reads `git
  log` over the book, or the decisions dated since then, instead of one curated
  page.
- Bad, because a cross-domain change loses its lightest record: a one-line root
  changelog entry used to clear every domain, and now it takes a decision, an
  edit in each domain, or a waiver.
- Bad, because it breaks callers of `get_changelog`, of the changelog schema and
  of the JSON export's `changelog` field, so every package takes a major version
  — `domainbook` 3.0.0 — under the promise `ADR-0014` made and `ADR-0016` carried
  over.

### Confirmation

`domainbook validate` on a book holding `changelog.md` exits 1 and names `--fix`;
`--fix` deletes every book changelog and the book then validates. `init` and
`new domain` write no `changelog.md`. The MCP server's tool list holds no
`get_changelog`; the built site has no `changelog` route. A change across two
domains with only a root decision staged passes the check.

## More Information

Git-native history is `ADR-0006`, superseded here only to retire the changelog's
part in it. The release promise behind the major version is `ADR-0014`, carried
over by `ADR-0016`.
