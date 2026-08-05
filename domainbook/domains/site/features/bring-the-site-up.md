---
id: bring-the-site-up
name: Bring the site up
status: implemented
owners: [RafaelAugustScherer]
terms: [book, book-root, artifact, issue]
decisions: [site/ADR-0001]
---

## Story

As someone reading a book in a repo I have checked out
I want one command that opens it in a browser and follows the files I am editing
So that nothing stands between the artifact I just changed and the page that shows it

## Rule: serve brings up both, and each target can be asked for on its own

```gherkin
Example: serve on its own answers a person and an agent at the same time
  Given a git repo with a book at domainbook
  When domainbook serve runs
  Then it speaks MCP on stdio
  And nothing reaches stdout that is not the protocol
  And it says on stderr: the book at domainbook is at http://localhost:4321 — press Ctrl+C to stop
  And the overview reads at http://localhost:4321/

Example: web is the site on its own
  Given a git repo with a book at domainbook
  When domainbook serve web runs
  Then it prints: the book at domainbook is at http://localhost:4321 — press Ctrl+C to stop
  And the overview reads at http://localhost:4321/
  And nothing speaks MCP on stdio

Example: mcp is the protocol on its own
  Given a git repo with a book at domainbook
  When domainbook serve mcp runs
  Then it speaks MCP on stdio
  And nothing reaches stdout that is not the protocol
  And no site comes up

Example: A book somewhere else is served from where it is
  Given a git repo with a book at docs/book
  When domainbook serve web docs/book runs
  Then it prints: the book at docs/book is at http://localhost:4321 — press Ctrl+C to stop

Example: A book published under a path reads under it locally too
  Given a book whose domainbook.config.yaml carries site.base "/domainbook/"
  When domainbook serve web runs
  Then it prints: the book at domainbook is at http://localhost:4321/domainbook/ — press Ctrl+C to stop
  And what reads there is what publishes

Example: A port already taken is worked around rather than refused
  Given something else is listening on 4321
  And a git repo with a book at domainbook
  When domainbook serve web runs
  Then it prints: 4321 was taken, so the book at domainbook is at http://localhost:4322 — press Ctrl+C to stop
  And the site reads at that port
```

## Rule: The pages are the files on disk, so an edit lands without a restart

```gherkin
Example: Editing an artifact changes the page that shows it
  Given the site is up and the ticketing domain page is open in a browser
  When the Purpose section of domainbook/domains/ticketing/index.md is rewritten and saved
  Then the open page shows the rewritten Purpose
  And nothing was restarted

Example: A new artifact appears where it belongs
  Given the site is up
  When domainbook new feature refund-order --domain ticketing writes a file
  Then ticketing's page lists Refund order
  And Refund order has a page of its own

Example: A deleted artifact stops being served
  Given the site is up and ticketing holds four features
  When one of those four files is deleted
  Then ticketing's page lists three features
  And the deleted feature has no page

Example: An artifact written since the site came up can be searched for
  Given the site is up
  When a decision is written into domainbook/domains/ticketing/decisions/
  Then searching for a phrase from its Context and Problem Statement finds it
```

## Rule: A book that does not validate has no site, and says so in validate's own words

```gherkin
Example: Starting against a broken book refuses rather than serving half of it
  Given a book whose ticketing domain page carries no classification.evolution
  When domainbook serve web runs
  Then no site comes up
  And it prints the line domainbook validate prints for that file
  And it prints: the site cannot be built from a book with issues — "domainbook serve mcp" serves it over MCP regardless
  And it exits 1

Example: Every issue is reported, not the first one
  Given a book with three issues in three different files
  When domainbook serve web runs
  Then it prints three lines above that one
  And they are the three domainbook validate prints, in that order

Example: The protocol is held to the same answer when both were asked for
  Given a book whose ticketing domain page carries no classification.evolution
  When domainbook serve runs
  Then no site comes up
  And nothing speaks MCP on stdio
  And it prints the issue and the line naming "domainbook serve mcp"
  And it exits 1

Example: MCP alone still serves a book with issues in it
  Given a book whose ticketing domain page carries no classification.evolution
  When domainbook serve mcp runs
  Then it speaks MCP on stdio
  And the book answers over it

Example: Breaking an artifact while the site is up shows the issue instead of killing the server
  Given the site is up
  When domainbook/domains/ticketing/index.md is saved with classification.evolution removed
  Then that domain's page shows the issue as domainbook validate words it
  And every other page still reads
  And the process stays up

Example: Fixing it clears the page without a restart
  Given the site is up and ticketing's page is showing an issue
  When classification.evolution is put back and the file saved
  Then ticketing's page shows the canvas again
```

## Rule: No book is a refusal that names init

```gherkin
Example: A repo with no book
  Given a git repo with no domainbook folder
  When domainbook serve runs
  Then it refuses with: domainbook: no book here — run "domainbook init domainbook" to write one
  And it exits 1

Example: A root that is not a book
  Given a git repo whose docs/book folder holds no roadmap.md
  When domainbook serve web docs/book runs
  Then it refuses with: docs/book: no book here — run "domainbook init docs/book" to write one
  And it exits 1
```

## Open Questions

None.
