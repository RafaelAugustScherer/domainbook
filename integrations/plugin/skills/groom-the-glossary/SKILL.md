---
name: groom-the-glossary
description: Bring a domain's glossary back in line with the words its code uses — add missing terms, reconcile a word used two ways, deprecate an abandoned one. Use when code and vocabulary have drifted, or when asked to tidy or review the glossary.
---

# Groom the glossary

Find where the code and the glossary disagree, and put each disagreement to the
maintainer. You report and propose; they resolve. Change no glossary file before
they answer, and say what you looked at — the paths you read and the glossary you
compared them against.

## 1. Propose a term only when it earns a place

A word earns a term when the repo already uses it and a reader could reasonably
read it two ways. A word with one obvious meaning is not proposed. A word from the
maintainer's own vocabulary that no file uses is not proposed either — ask whether
the code should be using it. A word two contexts read differently is proposed to
each of their own glossaries, never merged into the book's.

## 2. Put a term where the word lives

A word one context uses goes in that context's `glossary.md`; a word every context
uses the same way goes in the book's. If the owning context has no glossary yet,
create `domains/<id>/glossary.md` rather than filing the term in the wrong place.

## 3. Keep a moved word findable

- A renamed word: propose the new term, add the old name as an alias, and do not
  delete the old term unless the maintainer says to.
- A `draft` definition the maintainer corrects becomes `validated`.
- A word the maintainer confirms is abandoned becomes `deprecated` and stays in
  the glossary — reported, never silently removed.

## 4. Leave the book validating

Run `domainbook validate` and report its output. If you renamed a term a feature
points at, update that feature's `terms:` list in the same pass, so nothing is
left dangling.
