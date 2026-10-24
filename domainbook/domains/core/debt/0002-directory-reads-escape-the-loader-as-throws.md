---
status: open
date: 2026-07-30
severity: high
quadrant: inadvertent-prudent
code:
  - packages/core/src/load/disk.ts
  - packages/core/src/load.ts
  - packages/core/src/validate.ts
decisions: [core/ADR-0003]
---

# Directory reads escape the loader as throws

## Debt

`entries` in `packages/core/src/load/disk.ts` guards with
`statSync(dir, { throwIfNoEntry: false })` and calls `readdirSync` once the path
answers `isDirectory()`. The guard is narrower than it looks: the flag suppresses
`ENOENT` and `ENOTDIR` and nothing else, which was checked against Node 24 rather
than assumed. `stat(2)` needs search permission on the parent folders and no
permission at all on the folder itself, so a directory this shell may traverse
but not read passes the guard, and `readdirSync` on the next line throws
`EACCES`. Reproduced against a real execute-but-not-read directory: `entries()`
threw `EACCES: permission denied, scandir`.

The same hole is in three other calls. `load.ts` asks whether the book root is a
folder with a bare `statSync`, and both `statSync` calls in `disk.ts` still throw
on `EACCES`, `ELOOP`, `ENAMETOOLONG`, and `EIO`.

`validateBook` calls `loadBook` with nothing around it, so the throw leaves the
package. That is the rule in `CONTRIBUTING.md` — errors are values, and nothing
throws across a package boundary — and it is what `core/ADR-0003` asks of the
loader: one mistake gets one message naming the file and the fix. A raw `EACCES`
is neither.

## Impact

No reader sees a stack trace. `packages/cli/src/bin.ts` catches whatever `run`
throws and routes it through `fsRefusal`, so a person running the binary gets an
ordinary refusal naming the path and exit 1. The severity is not in the crash.

It is in the report. One unreadable subdirectory replaces the whole `Issue[]`
with a single line, so every other fault in the book — a broken reference, a
missing section, a renumbered log — goes unmentioned until the permission is
fixed and the command is run again. A book with ten faults and one unreadable
folder reports one fault, and the reader has no way to tell a mostly-valid book
from a badly broken one. That is the cascade `core/ADR-0003` exists to prevent,
arriving through the one path the loader does not control.

It bites hardest where nobody is watching: a CI runner whose checkout has a
folder the job's user cannot read, and an agent that reads the single line, fixes
the permission, and believes the book is clean.

A consumer that imports `@domainbook/core` directly gets the raw throw with no
refusal around it, because `bin.ts` is the CLI's guard and not core's. The MCP
server and the site become those consumers in Phase 3 and Phase 4.

## Remedy

`entries` answers the way `readText` already answers: the entries, or an `Issue`
naming the folder and what to do about it. The read message in the same file is
the model — it ends `make it readable and run again`, which is the sentence this
one is missing. Callers push the issue and carry on with the rest of the book, so
one unreadable folder stays one unreadable folder and the other nine faults still
get reported. The book-root `statSync` in `load.ts` gets the same treatment.

Nothing about `validateBook`'s signature changes, because the answer is still
`Issue[]` — which is the point: the loader was always meant to return this, and
one call site was returning something else.

Repay this with `TDR-0003`, which has the CLI holding a second, wholly unguarded
copy of `entries`. Fixing core's and leaving the CLI's is fixing half of one bug.
