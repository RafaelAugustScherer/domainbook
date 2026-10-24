---
id: serve-the-book-over-stdio
name: Serve the book over stdio
status: implemented
owners: [RafaelAugustScherer]
terms: [book, book-root, artifact, issue]
decisions: [mcp/ADR-0001, format/ADR-0010, core/ADR-0003]
---

## Story

As an agent whose client launches local tools
I want the book answerable over the transport my client already speaks
So that asking it a question costs me one call rather than a checkout and a folder walk

## Rule: domainbook serve mcp speaks the protocol on stdout and nothing else

```gherkin
Example: A client connects and the server introduces itself
  Given a repo with a valid book at domainbook
  When a client launches domainbook serve mcp and initializes
  Then the server answers with its name and version
  And the connection stays open

Example: Nothing but protocol reaches stdout
  Given a repo with a valid book at domainbook
  When a client launches domainbook serve mcp and initializes
  Then every byte on stdout is protocol
  And anything the server has to say for a person is on stderr

Example: The server lists the questions it can answer
  Given a repo with a valid book at domainbook
  When a client asks for the tools
  Then it is offered search_book, get_domain, get_context_map, explain_terms, get_feature, get_decisions, get_changelog and where_to_document
  And each says what it answers and what it needs
  And each says it only reads

Example: The book root is the last argument, and it defaults to domainbook
  Given a repo whose book is at docs/book
  When a client launches domainbook serve mcp docs/book
  Then get_domain answers from docs/book
```

## Rule: serve takes what to serve, and mcp is the only one there is yet

```gherkin
Example: Saying nothing serves the book over MCP
  Given a repo with a valid book at domainbook
  When a client launches domainbook serve
  Then it serves the same thing domainbook serve mcp serves

Example: A root on its own is still a root
  Given a repo whose book is at docs/book
  When a client launches domainbook serve docs/book
  Then get_domain answers from docs/book

Example: The site is named and not yet built
  Given a repo with a valid book at domainbook
  When domainbook serve web runs
  Then it refuses with: "web" is not something "domainbook serve" does yet — the site comes in a later phase; "domainbook serve mcp" is the one that works today
  And it exits 1
```

## Rule: Every tool gives the same answer about a book that cannot be trusted

```gherkin
Example: No book is a refusal naming init, and the server still runs
  Given a repo with no book
  When a client launches domainbook serve mcp and calls get_context_map
  Then it answers with the error: domainbook: no book here — run "domainbook init domainbook" to write one
  And the connection stays open

Example: A book that does not validate is refused rather than answered from
  Given a book whose ticketing domain page declares an id that does not match its folder
  When a client calls get_domain with id "ticketing"
  Then it answers with the error: this book does not validate, so what it says cannot be trusted — run "domainbook validate" and fix what it names
  And it names the issues validate would name
  And no answer holds any part of the book

Example: The refusal is the same whichever tool was called
  Given a book whose ticketing domain page declares an id that does not match its folder
  When a client calls search_book, explain_terms or where_to_document
  Then each answers with the same refusal

Example: A book fixed on disk is answered without restarting the server
  Given a running server whose book does not validate
  When the book is fixed on disk
  And a client calls get_domain with id "ticketing"
  Then the answer holds the domain
```

## Rule: An answer is the book as it is on disk when the question is asked

```gherkin
Example: A term added mid-session is answerable in the same session
  Given a running server and a book whose ticketing glossary defines hold
  When seat map is added to that glossary on disk
  And a client calls explain_terms with names ["seat map"]
  Then the answer holds the definition of seat map

Example: A term deleted mid-session stops being answerable
  Given a running server and a book whose ticketing glossary defines hold and seat map
  When seat map is deleted from that glossary on disk
  And a client calls explain_terms with names ["seat map"]
  Then it says seat map is not in this book
```

## Rule: The server reads the book and never writes it

```gherkin
Example: No tool offered can change a file
  Given a repo with a valid book at domainbook
  When a client asks for the tools
  Then none of them writes, creates, moves or deletes anything

Example: A session of questions leaves the book byte for byte as it was
  Given a repo with a valid book at domainbook
  When a client calls every tool the server offers
  Then git status reports no change under domainbook
```

## Open Questions

None.
