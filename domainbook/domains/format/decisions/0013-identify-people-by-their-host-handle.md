---
status: accepted
date: 2026-07-29
decision-makers: [RafaelAugustScherer]
---

# Identify people by their host handle

## Context and Problem Statement

Four frontmatter fields name people: a domain page's `owners`, and a decision's
`decision-makers`, `consulted`, and `informed`. This book filled all of them with
a bare given name, which worked while one person wrote everything and identifies
nobody the moment a second contributor appears. "Who decided this" is one of the
few questions a decision log exists to answer, and `rafael` does not answer it in
a public repo.

## Decision Drivers

- The value is read years later by someone who was not there, and rendered by the
  site and served by the MCP server.
- It is typed by hand into YAML, so it must need no quoting, escaping, or
  explanation.
- domainbook is git-native and host-neutral everywhere else; whatever goes in
  here must still be readable by a tool that knows nothing about any host.

## Considered Options

- Bare given names, as the book had them.
- Display names — "Rafael Scherer".
- Email addresses, which is how git itself identifies an author.
- The handle from the host the repo lives on, stored bare.
- The same handle written with an `@` sigil.

## Decision Outcome

Chosen option: "the handle, stored bare" — `RafaelAugustScherer`. It is unique on
the host the repo is already on, it is how contributors are addressed in issues
and reviews, and it is enough for the site to build a link out of. Display names
are neither unique nor stable. Emails are unique but publishing one in every
decision file is a cost paid by the person, not by the book.

The `@` is dropped deliberately, and this is the part worth writing down because
the next person will try to add it: `@` is a reserved indicator in YAML, so both
`owners: [@RafaelAugustScherer]` and a `- @RafaelAugustScherer` sequence item
fail to parse with the pinned `yaml` 2.9.0 (`format/ADR-0011`) — "Plain value
cannot start with reserved character @". Only the quoted form parses. A field
that must be quoted to be written correctly is a trap in a hand-edited file, and
the sigil is presentation anyway: whatever renders the handle can prefix it.

No schema change follows from this. `people` is already an array of non-empty
strings, and narrowing it to one host's username grammar would write GitHub into
the format.

### Consequences

- Good, because a reader can find the person, and the site can link them without
  a lookup table mapping names to accounts.
- Good, because there is nothing to quote, escape, or configure.
- Bad, because the value is host-shaped in a format that is otherwise host-
  neutral. The book stores an opaque string: nothing in the schema knows it is a
  GitHub handle, and rendering it as a link is the site's choice, not a rule. A
  book on another host, or a contributor with no account anywhere, stores
  whatever identifies them there and still validates.
- Bad, because handles get renamed and deleted while an accepted decision is
  immutable (`format/ADR-0004`). A contributor who renames leaves stale handles
  behind in records nobody may rewrite, and the fix is a note in a newer record,
  not an edit.
- Bad, because nothing checks that a handle exists or is spelled right. A typo
  reads as a person.

### Confirmation

Every people field in this book carries a handle; no artifact stores a bare given
name. That is checked by eye at review, like the immutability rule it sits next
to — the schema accepts either. The fixture book keeps its own fictional people
(`ada`, `kwame`): it documents a fictional repo whose contributors are its own,
and it validates unchanged, which is the point of leaving the schema alone.
