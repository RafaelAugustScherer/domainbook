---
status: accepted
date: 2026-07-29
decision-makers: [RafaelAugustScherer]
---

# Read markdown with a line scanner, not an AST library

## Context and Problem Statement

Half of what `validate` checks is body structure: the eight canvas sections in
canvas order, a glossary term's one bullet list, a feature's Story and rules,
MADR's headings, a changelog's releases. Reading that needs something that turns
markdown into things the checkers can walk, and every issue it produces has to
carry the line in the file as saved — the number a person pastes into an editor
and an agent uses to find the text again.

The instructions this context is built under named remark for the job, on the
argument that sharing Astro's toolchain would make the CLI and the site parse
identically.

## Decision Drivers

- The grammar that has to be read is fixed and tiny: H1 to H3 headings, fenced
  blocks with an info string, top-level `- ` bullets, and paragraphs
  (`format/ADR-0003`).
- This parser sits under every read of the book — CLI, MCP server, site — which
  is the same driver that moved frontmatter parsing in-house
  (`format/ADR-0011`).
- Line numbers have to survive the frontmatter block above the body, and a
  Gherkin error inside a fenced block has to come back out as a line in the
  markdown file.

## Considered Options

- A line scanner of our own.
- remark, with unified and the mdast utilities.
- markdown-it, reading its token stream instead of a tree.

## Decision Outcome

Chosen option: "A line scanner of our own". `body/markdown.ts` is about ninety
lines and returns three kinds of node — heading, fence, text — each carrying the
line it was read from, offset by the frontmatter above it. It splits on `\r?\n`,
so a book checked out with CRLF endings reads the same as one with LF.

remark is the better markdown parser and would have been the honest choice for a
tool that renders markdown. Its mdast nodes carry positions, so line numbers
were never the argument against it. The argument is proportion: it brings a tree
of packages to answer a question with four cases in it, under every read of
every book, and the tree it hands back is far larger than the grammar the format
allows. markdown-it has the same shape of cost with a smaller tree.

### Consequences

- Good, because reading the book costs no dependency, and what counts as a
  heading here is a question answered by one short file.
- Good, because a Gherkin block's parse error is reported at the markdown line
  it sits on, clamped to the closing fence, rather than at a line in the wrapped
  text handed to the Gherkin parser.
- Bad, because this is not a markdown parser and does not pretend to be
  CommonMark. Setext headings, indented code blocks, and headings inside HTML
  blocks are invisible to it, and a book that uses them is read wrong with no
  error at all.
- Bad, because nested bullets flatten: a `  - ` line is folded into the bullet
  above it rather than read as its own, so a glossary term with a nested list
  silently becomes one long bullet.
- Bad, because what a library gives away for free is ours to remember. Line
  endings are the proof: as first written the scanner split on `\n` alone, so a
  trailing `\r` stayed on the end of every line and nothing was a heading any
  more — a whole book condemned as shapeless, on a Windows checkout with git's
  default `core.autocrlf=true`. The fix is one character, which is the point: a
  markdown library would never have had the bug, and the next such gap will also
  be found by whoever hits it rather than by us.
- Bad, because `@domainbook/site` is an Astro app and Astro parses markdown with
  remark. The site may well end up with a second parser over the same files, and
  then two things answer "what is a heading here" with nothing testing that they
  agree. That is a Phase 4 decision to take on its own terms, not a reason to
  take remark now.
- Bad, because the instruction that named remark has to be corrected, or the
  next agent to touch the loader writes the dependency back in.

### Confirmation

The scanner's own tests cover a heading inside a fenced block, which must not be
read as a heading, and body lines counted from the line the body actually starts
on. The feature parser's tests map a Gherkin parse error back to the markdown
line, which is the case that the offset has to get right.

Line endings are checked by comparison rather than against written-out
expectations. A CRLF copy of every artifact type in the golden fixture book has
to scan into the same nodes as its LF copy, and the domain, decision, and feature
parsers built on those nodes have to reach the same title, the same rules, and
the same issues (`packages/core/test/body.test.ts`, "a body written with CRLF
line endings"). No message is quoted anywhere in it, so it keeps its meaning as
the messages change. Each parser case also asserts what it is comparing — the
decision's title, three rules whose first example still holds `Given`, and no
issues — so the two sides cannot agree by both being empty. Putting
`split("\n")` back fails nine of them: six scanner cases and three parser cases.
