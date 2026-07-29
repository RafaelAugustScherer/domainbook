---
status: accepted
date: 2026-07-29
decision-makers: [RafaelAugustScherer]
---

# Ship the CLI with no dependency but core

## Context and Problem Statement

`domainbook` is the package a stranger installs. It parses a handful of
arguments — a command, sometimes a second word, an optional book root, and two
options — and prints lines. Every CLI framework in the ecosystem does that and
much more, and taking one is the default move.

What a published CLI carries is not free: every dependency is a version to
track, an advisory to read (`ADR-0009`), and a reason a Node upgrade can be
blocked (`ADR-0002`). The question was whether this particular surface is worth
any of that.

## Decision Drivers

- `domainbook` is installed by people who have not chosen us yet; the install is
  the first thing they experience.
- The argument surface is fixed and small: three commands, three `new`
  artifacts, two options, one optional positional.
- A framework's value is what it does that we would otherwise write. Here that
  is dispatch, help text, and exit codes.

## Considered Options

- `node:util` `parseArgs` from the standard library, with our own dispatch and
  help text.
- commander 15.0.0.
- citty 0.2.2.
- cac 7.0.0.
- clipanion, which has been a release candidate since 2024.

## Decision Outcome

Chosen option: "`parseArgs`". commander was the strong candidate and deserves
saying so: it has no dependencies of its own, it is ESM-only, it is downloaded
around 469 million times a week, and it gets exit codes and generated help right
without being asked. Nothing about it is wrong. citty and cac are smaller and
younger; clipanion has been a release candidate for two years, which is a fine
place for a library to live and a poor one for a floor to sit on.

It was rejected anyway, because a published CLI that carries nothing at all is
worth roughly 150 lines of hand-written dispatch and help text. `parseArgs` is
in the standard library, so the install is `domainbook` and `@domainbook/core`
and nothing else, and there is no third party between a user's `npx` and our
code.

### Consequences

- Good, because installing the CLI adds no third-party code to a user's machine,
  and there is no dependency here that a Node release or an advisory can strand.
- Good, because `parseArgs` is strict by default, so an unknown option throws
  rather than being ignored, and the message we print for it is ours to write.
- Bad, because the dispatch is now ours: a nested `if` chain over positionals in
  `run.ts`, which every new command extends by hand. commander would have grown
  by a `.command()` call.
- Bad, because `parseArgs` generates no help. The usage lines, the command list,
  and the option list are hand-written and can drift from what the code accepts;
  only a test keeps them together.
- Bad, because `parseArgs` reports its own errors in its own words, so every one
  of them has to be caught and re-worded to sound like the rest of the tool.
- Bad, because this cost is paid again by every command Phases 2 to 6 add —
  `check`, `hooks install`, `export`, `mcp`, `dev`, `build`. If the dispatch
  stops reading straight through, that is the signal to revisit this, and
  revisiting it means a new decision.

### Confirmation

The CLI's `dependencies` holds exactly `@domainbook/core`. The tests cover what
a framework would have given us for free — an unknown command, a mistyped
option, an option with no value, an option on a command that does not take it,
a spare positional, and `--help` — because none of that is anyone else's code
now.
