---
status: accepted
date: 2026-08-02
decision-makers: [RafaelAugustScherer]
authored-by: agent
---

# Stage the app outside node_modules and run Astro from the reader's repo

## Context and Problem Statement

`site/ADR-0001` chose a custom Astro app over a theme, and the app shipped inside
the package: `root` and `srcDir` pointed at the installed folder, so the whole
Astro project lived under `node_modules`. The book never did — it is read from
`DOMAINBOOK_ROOT`, wherever the reader keeps it.

That was fine for `build`, which reads once and exits, and wrong for `serve`.
Measured against a scratch repo with the packages installed from `npm pack`, one
edit per server, seven seconds to settle: an edit reached the page **2 times in 9**
from an installed package and **2 in 2** from a checkout. Once a server missed an
edit it missed every later one. The parts that are ours were each ruled out
separately rather than argued away — `fs.watch` fired three events per edit, three
`buildIndex` calls in a row returned in 21ms, 10ms and 10ms, and `refreshContent`
did re-run the loader, seven collections becoming fourteen after one edit. What was
left is that Vite treats everything under `node_modules` as immutable: it is
excluded from the watcher and from invalidation, so the module that renders a page
was never rebuilt even once the content store held the new text.

The rule this broke is the one the phase exists for. A reader running
`domainbook serve web` saw the book as it was when the server started, with nothing
saying the page had stopped following the file.

## Considered Options

- Copy `app/` into `.astro/` in the reader's working directory at startup and point
  `root` and `srcDir` there.
- Keep the app where it is and tell Vite not to ignore it, through
  `vite.server.watch.ignored`.
- Publish the app as a template the reader copies once, the way a scaffolded
  front-end works.
- Leave it, and say in the docs that live reload wants a checkout.

## Decision Outcome

Chosen option: "Copy `app/` into `.astro/` at startup". `inlineConfig` clears and
rewrites `.astro/app` on every `dev` and `build`, writes a `package.json` holding
`{ "type": "module" }` and a `.gitignore` holding `*` beside it, and hands Astro a
root that is an ordinary project directory in the reader's repo.

The app reaches the package's code through the `@domainbook/site/app` export rather
than a relative path into `dist/`, so a copy anywhere on disk resolves the same. That
export is a second contract beside `.`: `.` is `dev` and `build` for whoever runs the
site, `./app` is the loader, the paths and the view helpers for the pages. They are
separate because `.` pulls in Astro and Pagefind, and none of that belongs in the
pages' own module graph.

Replacing the watcher ignore list was tried first and measured: it changed nothing,
because the watcher is not the only thing that skips `node_modules`. It was reverted
rather than left in on the theory that it might help.

### Consequences

- Good, because live reload holds where it is used: 10 of 10 servers from an
  installed package, and every scenario under `bring-the-site-up`'s second rule —
  edit, add, delete, break, fix, and search an artifact written since startup —
  passes there now.
- Good, because Astro is doing an ordinary thing in an ordinary place. Nothing about
  the setup depends on Vite's treatment of a directory it was never meant to build
  from.
- Bad, because a folder appears in the reader's repo that they did not ask for. It
  carries its own `.gitignore` of `*`, so it stays out of `git status` and out of
  commits, but it is there and it is theirs to delete.
- Bad, because the app is copied rather than read in place, so editing a page in
  this repo needs the dev server restarted to be seen. That cost lands on whoever
  works on domainbook itself, not on whoever reads a book with it, which is the way
  round to have it.
- Bad, because two `domainbook serve` or `domainbook build` runs in the same working
  directory now write the same staging folder. They already shared `domainbook-site`,
  so nothing new is broken, but nothing guards it either.
- The staged folder can land inside the book being watched — a book at the repo root,
  served with `domainbook serve web .` — and Astro's own writes under it then looked
  like edits to the book. The server reloaded itself about four times a second forever,
  burning 7 seconds of CPU every 20 idle. The watcher now ignores any path with a
  dot-segment in it, which is the staging folder, `.git`, and `.DS_Store`, and cannot be
  a book artifact. Idle reloads went from 61 in 15 seconds to none, and a `git add` in
  the watched tree no longer rebuilds the book either.

### Confirmation

The measurement in the Context section, run again after the change: ten servers, one
edit each, seven seconds, from a package installed by `npm pack`. Ten reloaded. The
same server then took five edits four-tenths of a second apart and ended on the fifth,
served a feature written after it started, stopped serving one that was deleted, put
`validate`'s own line on a domain whose canvas was broken while it was up, and cleared
it when the file was fixed.
