---
status: accepted
date: 2026-07-29
decision-makers: [RafaelAugustScherer]
---

# Raise the Node floor to the current security patch

## Context and Problem Statement

Node 24.17.0 was a security release: the batch published on 2026-06-18 fixed
twelve CVEs across the 22, 24, and 26 lines, two of them rated high — a WebCrypto
integer overflow that aborts the process remotely, and a TLS wildcard-depth
authentication bypass. `engines: >=24.0.0` admits every 24.x published before
that fix, and npm treats a violated `engines` field as a warning rather than an
error, so the floor recorded in `ADR-0002` neither excluded a Node carrying those
bugs nor stopped an install on one.

Whether the floor may move at all is the question this record has to answer,
because `ADR-0002` says the floor rises when the previous floor goes end-of-life,
and 24.0.0 is not end-of-life.

## Decision Drivers

- `ADR-0002`'s rule is about which release line the project sits on. The harm it
  names is dropping repos still running a release upstream supports — and
  upstream supports one patch per line. A repo on 24.15.0 is told by Node to move
  to 24.18.0, not to stay, so a patch floor inside the active line drops nobody
  who is current.
- The patch level has a different trigger from the line: a security release, not
  an end-of-life date. Nothing in `ADR-0002` weighs that trigger.
- A floor npm only warns about is not a floor.
- CI and contributors read different sources for the version. The workflow's
  `node-version: '24'` resolved to whatever 24.x the runner image shipped that
  week, which is not a version anyone chose.
- 24.18.0 is the newest v24 and one patch past the security release; there is no
  24.19.x. Node 24 is active LTS until 2026-10-20 and supported until 2028-04-30,
  so the line is not the thing in question.

## Considered Options

- Raise the floor to `>=24.18.0`, keep the version in `.nvmrc`, and make the
  floor binding with `engine-strict=true`.
- Leave the floor at `>=24.0.0` and treat the patch level as each contributor's
  own business.
- Raise the floor but leave it advisory — `.nvmrc` and `engines`, no `.npmrc`.
- Pin one exact version instead of a floor.

## Decision Outcome

Chosen option: "Raise the floor to `>=24.18.0` and make it binding". Both
`package.json` files declare it, `.nvmrc` holds `24.18.0` as the one place the
version is written, CI's `setup-node` reads `node-version-file: '.nvmrc'`, and a
root `.npmrc` sets `engine-strict=true` so a violating Node fails the install
instead of printing `EBADENGINE` and carrying on. Advisory-only was rejected
because it leaves open exactly the gap this record opened with. An exact pin was
rejected because there is no reason to forbid a newer Node: `ADR-0004` pins the
compiler for a reason — the emitted output changes — that does not apply to the
runtime.

This record does not supersede `ADR-0002` and does not change its rule.
`ADR-0002` decides which release line the floor sits on and moves it when that
line goes end-of-life. The line is still 24, and 24 is still supported. What
`ADR-0002` is silent on is the patch within a line, and that is what this record
fixes: **the floor moves to the newest patch of the line it already sits on when
a security release lands on that line, and not otherwise.** Two rules, two
triggers, one floor. Chasing every patch release instead would put an
install-breaking change on the calendar every few weeks for no stated reason.

`ADR-0002`'s Confirmation quotes `">=24.0.0"`. That number was the state of the
repo on the day the decision was taken; this record replaces the number and
leaves the end-of-life rule standing. Superseding `ADR-0002` would retire far
more than a number — TypeScript over a compiled binary, ESM-only, and the
line rule itself — and none of that is being reversed.

### Consequences

- Good, because `npm install` now stops on a Node that predates the June 2026
  security release instead of warning about it.
- Good, because the version is written once. CI resolves it from `.nvmrc`, so a
  change to the runner image cannot quietly move the version the tests ran on.
- Bad, because `engine-strict` turns a warning into a stop: a contributor on an
  older 24.x cannot install to run the tests until they upgrade, and npm's
  message names the range it wanted, not what to do about it.
- Bad, because the trigger is a person noticing a security release. `ADR-0009`
  gates the lockfile and the runtime is not in the lockfile, so nothing in CI
  will notice the next one.
- Bad, because the floor will move again on the same rule, and every move breaks
  an install for someone and costs a changelog entry.
- Bad, because `engine-strict` is a setting of this repo, not of the published
  packages: someone installing `@domainbook/core` on an older 24.x gets npm's
  warning unless they set the same option themselves.

### Confirmation

`.nvmrc` reads `24.18.0`, both `package.json` files read `">=24.18.0"`, `.npmrc`
reads `engine-strict=true`, and the workflow's `setup-node` step reads
`node-version-file: '.nvmrc'`. `npm install` on an older 24.x exits non-zero with
`EBADENGINE`. The floor moves next when a security release lands on the line it
sits on — announced at `nodejs.org/en/blog/vulnerability` — and moves to another
line when this one ends on 2028-04-30, which is `ADR-0002`'s rule and not this
one's.

## More Information

`ADR-0002` decides the runtime and the release line. `ADR-0009` fails the build
on advisories in the lockfile: the same concern one layer down, and it does not
reach the runtime.
