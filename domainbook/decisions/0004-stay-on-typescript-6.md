---
status: accepted
date: 2026-07-28
decision-makers: [rafael]
---

# Stay on TypeScript 6

## Context and Problem Statement

TypeScript 7 is available and compiles far faster than the 6.x line. Adopting it
now would cost nothing in source changes — everything this repo runs today goes
through `tsc` on the command line — but it decides what tooling can be added
later. TypeScript 7.0 ships without a stable programmatic API, and a tool that
has to inspect types rather than only compile them has no other way in.
Microsoft's announcement of 7.0 says tooling "can only currently rely on
TypeScript 6.0", with the replacement API expected in 7.1.

## Decision Drivers

- 7.0 has no stable programmatic API at all, so the gap is not a matter of tools
  catching up on a version number; the API they are to use is announced for 7.1.
- The site is a custom Astro app (`site/ADR-0001`), and `@astrojs/check` 0.9.10
  declares a TypeScript peer range of `^5.0.0 || ^6.0.0` — Phase 4 cannot start
  on 7.x.
- The wider ecosystem is capped the same way and has not moved:
  `typescript-eslint` 8.65.0 declares `>=4.8.4 <6.1.0`, and 7.0.2 is about 6% of
  weekly `typescript` downloads.
- Compile speed on a repo this size is not a problem worth trading tooling for.

## Considered Options

- Pin TypeScript `6.0.3` and revisit at 7.1.
- Adopt 7.x now and drop or replace the tooling that depends on the programmatic
  API.
- Stay on the 5.x line.

## Decision Outcome

Chosen option: "Pin TypeScript `6.0.3` and revisit at 7.1". Adopting 7.x today
buys build speed the project does not need and costs the Astro tooling Phase 4
does need. Staying on 5.x costs the 6.x language features for no gain, since 5.x
is no less of a wait.

The version is pinned exactly, not ranged, so a compiler change is always a
deliberate commit.

### Consequences

- Good, because Astro tooling — and anything else that reads TypeScript through
  the programmatic API — can be added in a later phase without a compiler change
  going first.
- Good, because an exact pin makes a compiler upgrade reviewable, and a compiler
  upgrade is the kind of change that quietly alters emitted output.
- Bad, because the project forgoes 7.x compile speed until the revisit.
- Bad, because nothing reminds anyone to run the revisit check; it is cheap, but
  only if someone thinks to run it.

### Confirmation

The root `devDependencies` reads `"typescript": "6.0.3"` with no range. The
revisit is due when both of these hold, and each is one command:
`npm view typescript version` reports 7.1 or higher — the release meant to carry
the stable programmatic API — and `npm view @astrojs/check peerDependencies`
reports a range that admits it. Both, not either.
