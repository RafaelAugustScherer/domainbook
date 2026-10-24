---
id: build-the-site
name: Build the site
status: implemented
owners: [RafaelAugustScherer]
terms: [book, book-root, artifact, issue]
decisions: [site/ADR-0001, ADR-0006, core/ADR-0011]
---

## Story

As the person publishing a book
I want a folder of files any static host will serve
So that a reader who will never clone the repo can still find the decision that explains why

## Rule: build writes the whole site into a folder of its own and says where

```gherkin
Example: A valid book builds and names the folder to publish
  Given a git repo with a book at domainbook
  When domainbook build runs
  Then it writes domainbook/build/site
  And it prints: the book at domainbook is built into domainbook/build/site — publish that folder
  And it exits 0

Example: Every artifact in the book has a page in the output
  Given a book holding two domains, seven features, twelve decisions, three debt records and a glossary
  When domainbook build runs
  Then domainbook/build/site holds a page for each of those artifacts
  And it holds the overview, the context map, the glossary and the changelog

Example: A book somewhere else builds inside itself, wherever it is
  Given a git repo with a book at docs/book
  When domainbook build docs/book runs
  Then it prints: the book at docs/book is built into docs/book/build/site — publish that folder
  And nothing is written at the repo root

Example: Building again replaces what was there rather than adding to it
  Given domainbook/build/site was built from a book holding four features
  When one of those features is deleted and domainbook build runs
  Then domainbook/build/site holds three feature pages
  And the deleted feature has no page left behind
```

## Rule: The output sits inside the book, so nothing else in the repo is touched

```gherkin
Example: A front-end app's own output is not written over
  Given a repo whose front end builds into dist and whose docs build into build
  When domainbook build runs
  Then dist is unchanged
  And the repo's own build is unchanged
  And the site is in domainbook/build/site

Example: The build folder is not an artifact, so validate reads past it
  Given a book that has been built
  When domainbook validate runs
  Then build/ raises no issue
  And it is not counted among what the book holds

Example: The output ignores itself, so a reader never commits it by accident
  Given a git repo with a book at domainbook
  When domainbook build runs
  Then domainbook/build/.gitignore reads: *
  And git status names nothing under domainbook/build/
```

## Rule: The book says where it publishes, and the build is made for there

```gherkin
Example: A book that says nothing is built for the root of a host
  Given a book whose domainbook.config.yaml carries no site.base
  And domainbook build has run
  When the built site is served at https://example.test/ and a reader follows the link to ticketing
  Then ticketing's page loads
  And its stylesheet, its search index and its context map load with it

Example: A book published under a path says so once, in its config
  Given a book whose domainbook.config.yaml carries site.base "/domainbook/"
  And domainbook build has run
  When the built site is served at https://example.test/domainbook/ and a reader follows the link to ticketing
  Then ticketing's page loads
  And every link and asset on it resolves under /domainbook/
  And the command was given nothing to say so

Example: The key is checked the way every other config key is
  Given a book whose domainbook.config.yaml carries site.base "domainbook"
  When domainbook build runs
  Then it prints: domainbook/domainbook.config.yaml:2 site.base: must start with "/" — write "/domainbook/" for a site published under that path
  And it exits 1
  And domainbook/build/site is not written

Example: Search works with no server behind it
  Given domainbook/build/site is served by a plain static file server
  When a reader searches for settlement
  Then the pages holding that word come back
```

## Rule: A book that does not validate is not built

```gherkin
Example: A broken book refuses with the issues, and writes nothing
  Given a book whose ticketing domain page carries no classification.evolution
  When domainbook build runs
  Then it prints the line domainbook validate prints for that file
  And it exits 1
  And domainbook/build/site is not written

Example: A previous build is left as it was
  Given domainbook/build/site holds a site built from a book that validated
  And the book has since been edited into a state that does not validate
  When domainbook build runs
  Then it exits 1
  And domainbook/build/site still holds the site that was built before
```

## Rule: No book is a refusal that names init

```gherkin
Example: A repo with no book
  Given a git repo with no domainbook folder
  When domainbook build runs
  Then it refuses with: domainbook: no book here — run "domainbook init domainbook" to write one
  And it exits 1
```

## Rule: The website is a separate install, and its absence is named

`build` renders the site, so it needs `@domainbook/site`, which the CLI does not
install (`core/ADR-0011`). When it is absent, `build` names what to install
rather than failing with a stack trace.

```gherkin
Example: build without the website installed names what to install
  Given a git repo with a book at domainbook, and @domainbook/site installed nowhere on it
  When domainbook build runs
  Then it refuses with: the website is not installed — the CLI ships without it; add @domainbook/site to this project with "npm i -D @domainbook/site" (or "-g" if you installed domainbook globally), then try again
  And it exits 1
```

## Open Questions

None.
