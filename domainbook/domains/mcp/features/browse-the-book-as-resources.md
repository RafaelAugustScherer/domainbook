---
id: browse-the-book-as-resources
name: Browse the book as resources
status: implemented
owners: [RafaelAugustScherer]
terms: [artifact, book, book-root, decision]
decisions: [mcp/ADR-0001, mcp/ADR-0002, format/ADR-0003]
---

## Story

As a person in an MCP client who would rather look than ask
I want the book's files offered as things I can @-mention and open
So that browsing to an artifact and pasting it into a session is one step, not a shell and a path

## Rule: Every artifact in the book is offered as a resource, addressed by where it lives

```gherkin
Example: The whole book is listable
  Given a book holding a roadmap, a glossary, a changelog, two domains, four features, eleven decisions and two debt records
  When the client lists resources
  Then every one of those files is offered
  And nothing outside the book root is

Example: A resource is addressed by its path inside the book
  Given a book at domainbook holding domains/ticketing/index.md
  When the client lists resources
  Then that resource's uri reads domainbook://domains/ticketing/index.md

Example: A book somewhere else keeps the same addresses
  Given a book at docs/book holding domains/ticketing/index.md
  When a client launches domainbook serve mcp docs/book and lists resources
  Then that resource's uri still reads domainbook://domains/ticketing/index.md

Example: A resource says what it is before it is opened
  Given a book holding domains/ticketing/features/hold-seats-during-checkout.md
  When the client lists resources
  Then that resource carries the name of the feature and the artifact type
  And it carries the mime type of markdown

Example: Reading a resource gives the file as written
  Given a book holding domains/ticketing/index.md
  When the client reads domainbook://domains/ticketing/index.md
  Then the answer is that file byte for byte, frontmatter and all
```

## Rule: A record the book has retired is not on the list, and is still readable

```gherkin
Example: A superseded decision is not offered
  Given a book whose ticketing ADR-0004 reads "superseded by ticketing/ADR-0009"
  When the client lists resources
  Then no resource is domains/ticketing/decisions/0004-hold-for-an-hour.md

Example: A superseded decision opens when its address is known
  Given a book whose ticketing ADR-0004 reads "superseded by ticketing/ADR-0009"
  When the client reads domainbook://domains/ticketing/decisions/0004-hold-for-an-hour.md
  Then the answer is that file as written

Example: A rejected decision is left off the list the same way
  Given a book whose ticketing ADR-0007 reads "rejected"
  When the client lists resources
  Then no resource is that file
```

## Rule: A resource carries a cache hint short enough to survive the session that edits it

```gherkin
Example: The hint is private and lapses in seconds
  Given a book holding domains/ticketing/glossary.md
  When the client reads domainbook://domains/ticketing/glossary.md
  Then the answer carries a cache hint whose scope is private
  And its lifetime is 5 seconds

Example: A file edited during the session is served fresh on the next turn
  Given a running server and a client that has read domainbook://domains/ticketing/glossary.md
  When seat map is added to that file on disk
  And the client reads it again a turn later
  Then the answer holds seat map

Example: A resource carries the moment its file last changed
  Given a book holding domains/ticketing/glossary.md
  When the client lists resources
  Then that resource carries the file's last modified time

Example: The hint is there for a burst of reads, not for a slow disk
  Given a book holding domains/ticketing/glossary.md
  When the client reads that resource four times inside one turn
  Then the file is read from disk once
  And it is read again on the next turn, because a book on local disk is never worth serving stale
```

## Rule: A book the server cannot trust offers nothing

```gherkin
Example: A book that does not validate lists no resources
  Given a book whose ticketing domain page declares an id that does not match its folder
  When the client lists resources
  Then the list is empty
  And it says this book does not validate, and names what validate would name

Example: No book at all lists nothing and says why
  Given a repo with no book
  When the client lists resources
  Then the list is empty
  And it says there is no book here and names "domainbook init domainbook"
```

## Open Questions

None.
