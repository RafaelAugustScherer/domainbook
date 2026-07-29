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
