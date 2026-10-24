---
status: accepted
date: 2026-08-03
decision-makers: [RafaelAugustScherer]
---

# Reserve build/ inside a book root for generated output

## Context and Problem Statement

A book root is a closed set. `loadBook` walks it and raises an issue for anything
it does not recognise — "the format does not know this folder" — which is what
stops a book from silently accumulating files nothing reads. Phase 4 needed
somewhere to put the built site, and `site/ADR-0002` had already settled that
where the site *publishes* is config; where it *lands on disk* was still a
constant in the CLI, `domainbook-site` at the working directory.

That name was chosen to avoid a collision: `dist/` and `build/` at a repo root
are the two names a front-end app in the same repo already owns. It worked, and
it left a folder at the repo root that belongs to neither the book nor the app,
and that every repo has to learn to ignore.

## Decision Drivers

- A book root that accepts arbitrary folders stops being a format. The closed set
  is the reason `validate` can say a book is complete rather than merely
  parseable.
- Generated output next to hand-written artifacts is a hazard: it is the kind of
  thing that gets committed, reviewed, and eventually edited by someone who
  cannot tell which is which.
- `domainbook check` treats a change under `domains/<id>/` as that domain's book
  being updated. Anything writable inside the book is a candidate for clearing
  the enforcement gate by accident.
- One `.gitignore` line per repo is a cost paid by every reader, forever, and
  forgotten by some of them.

## Considered Options

- Reserve `build/` inside the book root, and write the site to `<book>/build/site`.
- Keep the output outside the book, at `<cwd>/domainbook-site`.
- Take a `site.out` config key and let each repo choose.

## Decision Outcome

Chosen option: "Reserve `build/` inside the book root". `buildDir` is exported
from core, `loadBook` skips it the way it skips `decisions/`, `debt/` and
`domains/`, and `domainbook build` writes `<book>/build/site` — so a book at
`docs/book` builds into `docs/book/build/site` and the repo root is never
touched.

`build/` is reserved, not adopted. It is named in the root-holds message as what
`domainbook build` writes and *read by nothing*, because a reader who sees it
listed beside `roadmap.md` would reasonably ask what goes in it. Nothing in the
loader descends into it, nothing counts it, and no artifact may live there.

The folder writes its own `.gitignore` holding `*` when the build creates it, so
the output is ignored by the repo that produced it without anybody editing a
`.gitignore`. That is the same trick `site/ADR-0004` uses for the staged Astro
project, and it is what makes generated output inside the artifact tree safe
rather than merely convenient.

A config key was not taken. It is a real option and it would have settled the
collision question for every repo at once, but nothing has asked for it: the
collision `domainbook-site` was avoiding does not exist once the output is inside
the book, because the book root is domainbook's own namespace already. Adding the
key when someone needs it is a smaller decision than removing it once every book
carries one.

### Consequences

- Good, because the repo root gains nothing. A repo that adopts domainbook grows
  one folder, `domainbook/`, and everything the tool generates is under it.
- Good, because the output travels with the book. `docs/book` and its site are
  one subtree to move, archive or delete.
- Good, because nobody has to write a `.gitignore` line, and nobody can forget
  to.
- Bad, because the artifact tree now holds something that is not an artifact.
  `find domainbook -name '*.md'` was a complete list of the book and is no longer
  — `build/site` holds no markdown today, but nothing guarantees that.
- Bad, because the closed set has an exception in it, and an exception invites the
  next one. The bar for a second reserved name is this record plus a reason the
  folder cannot live outside the book.
- Bad, because a reader who deletes `domainbook/build/` while a dev server is
  running gets no warning; the next build simply writes it again.

### Confirmation

`domainbook build` writes `domainbook/build/site`, `domainbook validate` reports
the same counts as before it ran, and `git status` names nothing under
`domainbook/build/`. `loadBook` over a root holding `build/site/index.html`
raises no issue, which is a test in `packages/core/test/load.test.ts` rather than
a claim here.
