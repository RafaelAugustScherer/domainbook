---
"@domainbook/core": minor
"domainbook": minor
---

Refuse a change that leaves a domain's book behind.

`domainbook check` matches the paths a change touches against every domain's
`code:` globs. A domain whose code changed while nothing under
`<root>/domains/<id>/` did is stale, and the check names the files and exits 1.
Any file under that folder clears it — the canvas, the glossary, the changelog, a
feature, a decision, or a debt record. A change across several domains updates
each of their books, or carries one record at the book root: a decision under
`decisions/` or an entry in `changelog.md`. A path no domain claims passes
without being mentioned, because a path nothing maps is a path nothing claims.

The same check reads a change three ways. `--staged` judges the commit about to
happen and takes `--message-file <path>` so it can read a waiver off the message
and stamp one into it. `--range <base>..<head>` judges everything a branch adds
as one change, so the book update may arrive in a later commit than the code and
CI is never stricter than the hook that let a commit through. `--session <path>`
judges the files an agent session touched, dropping the ones it edited and put
back.

A waiver is a commit trailer. `Skip-Docs: <reason>` on the commit clears it, and
`git log --format='%(trailers:key=Skip-Docs,valueonly)'` turns "what have we
waived and why" into one command. Git parses the trailer, so the same words in
the middle of a message are not one. An agent shell — `CLAUDECODE=1` — must
write a reason; a person may run `SKIP_DOCS=1 git commit`, which the check stamps
into the message as `Skip-Docs: human bypass`. `enforcement.trailer`,
`enforcement.mode`, and `enforcement.require_reason` move all three lines.

Open debt over a changed path is named on every run, blocked or not, and never
changes the verdict. A book that does not validate is refused rather than judged
against.

`domainbook hooks install [root]` writes the check into the repo's `commit-msg`
hook between `# domainbook:start` and `# domainbook:end`. A hook that is already
there is added to rather than replaced, and still decides first; one written in
another language, or ending in `exit 0` where an appended check would never run,
is handed back with the line to add yourself. lefthook gets the snippet and
`.git/hooks` is left alone, and `core.hooksPath` is honored rather than taken
over. `domainbook hooks uninstall` removes the block and nothing else.

`domainbook instructions [root]` writes the rule where agents already look:
`AGENTS.md` between markers, a `CLAUDE.md` that imports it, and one
`.claude/rules/domainbook-<domain>.md` per domain that claims code, scoped to
that domain's globs. It points at each domain's glossary rather than copying it,
so terms are pulled and the instructions never go stale against a glossary that
moved. Prose a person wrote around the markers survives; a rule file a person
wrote is never called stale, and one belonging to a domain that went away is
removed. `--check` says whether they are current, writes nothing, and exits 1 if
not. The Gemini CLI settings block is printed for a person to paste and never
written.

`@domainbook/core` exports `checkChange` and `Change`. It matches paths with
`node:path`'s `matchesGlob`, so nothing new is depended on.
