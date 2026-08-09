---
name: document-this-change
description: Write the book change a commit or a Stop-hook block is asking for. Use when domainbook blocked a change, when a commit is refused for a stale domain book, or before committing a change to code a domain claims.
---

# Document this change

A check blocked because code a domain claims changed and that domain's book did
not. Turn the block into the book change it was asking for, while the change is
still in context.

## 1. Start from what the block named

The block names the context and the paths that changed. Call `where_to_document`
with those paths to learn which book files answer, and read the diff before you
write a word — what you write describes the behaviour that changed, not the files
that changed. If there is no block behind you, ask which change is being
documented before writing anything.

## 2. Let what changed choose the artifact

- Changed behaviour a user can observe → an example in the feature that owns it.
- A new word the code now uses → a term in that context's glossary.
- A shortcut taken knowingly → a debt record naming the shortcut, its cost, and
  what repayment looks like.
- A user-visible behaviour change → an entry under the right bucket in that
  context's changelog. A change nobody outside the repo can observe gets none.
- A choice with a cost to reverse → hand it to `record-a-decision`; do not write
  the decision here.

## 3. Do not game the block

The check clears when any file under the domain's folder changes — so it can be
cleared without documenting anything. Do not. No whitespace, no editing an
unrelated stale line: what you write is the change that was blocked. When two
contexts are blocked, write into both, unless the change is genuinely
cross-cutting, in which case one record at the book root clears both.

## 4. A waiver is proposed, never taken

If a change truly documents nothing — a private rename, a patch bump — propose a
`Skip-Docs` trailer whose reason names *this* change and what makes it safe. Say
what you would waive and why, and leave the commit without a trailer until the
person answers; a waiver outlives the session, so it is theirs to take. Never
offer a reason that would fit any commit, and never propose a waiver to hide a
change you could not describe — say you cannot describe it, and ask.

## 5. Clear the block by re-running the check

Re-run the check over the change and report its own output. If it still names a
context, name it too and keep going — the block is not cleared by declaring it
cleared. If your own edit left `domainbook validate` reporting an issue, fix it in
the same pass.
