---
status: accepted
date: 2026-07-28
decision-makers: [RafaelAugustScherer]
---

# Narrow MADR frontmatter

## Context and Problem Statement

Decisions follow MADR 4.0. MADR makes all five frontmatter keys optional and
leaves `status` deliberately open — a project may write `accepted`, `proposed`,
`rejected`, or anything its process needs. That openness is right for a template
people fill in by hand and wrong for a format a tool has to reason about: a
decision log where status is a free string cannot be filtered, badged on a site,
or checked for a supersede chain.

## Decision Drivers

- The site shows status badges and supersede chains; the MCP server answers "what
  was decided and is it still current".
- A decision with no date cannot be ordered against the change it explains.
- MADR's own guidance treats `decision-makers` as prose ("the people involved"),
  which does not survive into a queryable field.

## Considered Options

- Adopt MADR 4.0 as published: all keys optional, status open.
- Narrow it: require `status` and `date`, close the status set, and require the
  people keys to be YAML sequences.
- Leave MADR behind and define a decision format of our own.

## Decision Outcome

Chosen option: "Narrow it". The body stays MADR 4.0 exactly — the same sections
in the same order, with Consequences and Confirmation as H3s nested under
Decision Outcome — so a MADR reader recognises the file. Only the frontmatter is
tightened:

- `status` is required and is one of `proposed`, `rejected`, `accepted`,
  `deprecated`, or the phrase `superseded by ADR-NNNN`.
- `date` is required, `YYYY-MM-DD`.
- `decision-makers`, `consulted`, and `informed` stay optional but must be YAML
  sequences, not prose.

domainbook adds one rule MADR does not have: an accepted ADR is immutable.
Changing course means a new ADR and marking the old one superseded. MADR's `date`
means "when the decision was last updated", which assumes editing; ours means the
date it was taken, because nothing is edited after acceptance.

### Consequences

- Good, because status and date are queryable, so supersede chains and "current
  decisions" are computable rather than read by eye.
- Good, because a reader of any MADR log can read ours without learning anything.
- Bad, and this one lands in Phase 5: existing MADR files imported from another
  repo will fail this schema whenever they carry no frontmatter, which is common.
  "MADR imports near-verbatim" is not true — the import has to add `status` and
  `date`, and it can only guess `date` from git history.
- Bad, because a project whose process uses a status we do not list (`draft`,
  `superseded` with no number, `accepted with reservations`) has to map it onto
  ours or change the schema.
- Bad, because immutability is a convention here, not a mechanism; nothing stops
  an edit except review.

### Confirmation

The broken fixtures cover a missing status, an unlisted status, and a malformed
date. The supersede phrase is validated by pattern, so `superseded by ADR-12` is
rejected as firmly as an unknown word.

## More Information

The body grammar of the other artifacts is `format/ADR-0003`. Reference syntax,
including the `ADR-NNNN` form used in the supersede phrase, is `format/ADR-0005`.
