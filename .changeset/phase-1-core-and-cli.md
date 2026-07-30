---
"@domainbook/core": minor
"domainbook": minor
---

Read a book into a typed model, and scaffold one from nothing.

`@domainbook/core` gains the loader, the model graph, reference resolution, and
validation in three layers: schema conformance, referential integrity, and
convention checks. Every issue it reports names the file, the line, and the
field, and one mistake produces one message.

`domainbook` is the CLI over it: `init` writes a book into any repo, `validate`
prints every issue one per line and exits 1 if there is one, and
`new domain|feature|decision` writes pages that already validate —
`new decision --supersedes N` also sets the old record's status and changes
nothing else in that file. The book root is a trailing argument that defaults to
`domainbook`, and the package's only dependency is `@domainbook/core`.
`domainbook --version` prints the version of the package it is installed from.

An id, a term reference and a decision title may be written in any script. A
slug is words joined by single hyphens, where a word starts with a letter or
digit in any script and carries no capitals, so `注文履行`, `تنفيذ-الطلب` and
`café-order` are all names a book can use. Three rules come with that: the text
must be in Unicode NFC, it must equal its own NFKC form so a fullwidth
look-alike cannot pass for its ASCII twin, and a slug is capped at 247 UTF-8
bytes so the filename it forms fits what a filesystem gives one. Every ASCII
slug that was legal before is still legal, but a name that used to fold — a
glossary term `Café Order` was reachable as `cafe-order` — now keeps its
letters, so a reference to it has to be written `café-order`.

The published JSON Schema states that grammar with Unicode property escapes,
which is a departure worth knowing about before you consume it: the pattern
needs the ECMA-262 `u` flag. Ajv supplies it by default and every JavaScript
validator tested agrees with the runtime, but Python's `jsonschema` rejects the
schema outright, and a consumer that compiles the pattern without `u` gets no
error and the opposite meaning. Every pattern in the schema carries a
description saying so.
