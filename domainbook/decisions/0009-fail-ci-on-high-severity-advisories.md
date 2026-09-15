---
status: deprecated
date: 2026-07-29
decision-makers: [RafaelAugustScherer]
---

# Fail CI on high-severity advisories

## Context and Problem Statement

The lockfile is the part of this repo nobody reads and every machine runs. It is
small today and every direct dependency is pinned, so an advisory against it
would be cheap to act on — but only if someone hears about it. With no check in
CI, the first notice is a mail nobody owns.

## Decision Drivers

- The tree is small enough that a strict gate costs nothing now, and it is worth
  more as the tree grows.
- A notification that does not stop a merge gets read after the merge.
- Anything below high is information. Stopping a merge for it teaches people to
  stop reading the failures.
- The check has to run from the committed lockfile, so it gives the same answer
  everywhere and does not need a successful install to have happened first.

## Considered Options

- `npm audit --audit-level=high --package-lock-only` as a required CI step.
- No gate in CI; rely on GitHub's Dependabot alerts.
- A third-party scanner with an allowlist file — osv-scanner, Snyk, Socket.

## Decision Outcome

Chosen option: "`npm audit --audit-level=high --package-lock-only` as a required
CI step". It needs nothing installed and nothing configured, it reads a lockfile
that is already committed, and it stops the build instead of filing a notice.
Dependabot alerts were rejected as the only line for that last reason: they never
block. A scanner with an allowlist would fix the flaw described below, at the
cost of an account, a config file, and another dependency for a tree this size —
a trade that gets better as the tree grows, and the reason to revisit this.

That flaw is why this is a decision record rather than a line in a workflow file.
`npm audit` sends the dependency set to the registry on every run and reports
what the registry knows at that moment, so the check is not a function of the
commit: a build that passed can fail on a rerun with nothing changed behind it.
npm offers no allowlist, no "as of" date, and no way to record that an advisory
was read and judged not to apply. When the step goes red the moves are to bump
the dependency, to raise `--audit-level`, or to take the step out. The first is
the one to try; the other two are commits that weaken the gate for everything
that comes after.

### Consequences

- Good, because a high advisory in the tree stops a merge instead of filing a
  notice.
- Good, because the check reads the committed lockfile, so it needs no install
  and cannot disagree with itself between machines.
- Bad, because CI stops being a function of the commit. The first time a green
  branch turns red with nothing pushed, it will read as a broken workflow rather
  than as news.
- Bad, because an advisory with no fix published, or one that plainly does not
  reach this code, cannot be recorded and passed over — the only answer available
  lowers the bar for everything else at the same time.
- Bad, because every run tells the registry what this repo depends on.
- Bad, because it sees the lockfile and nothing else: the runtime is not in there
  (`ADR-0008`), and neither is anything CI installs by another route.

### Confirmation

The workflow runs `npm audit --audit-level=high --package-lock-only` as a
required step, and it reports 0 vulnerabilities today. A red run on a branch
nobody touched is the expected failure mode of this gate, not a fault in it.

## More Information

`ADR-0008` sets the runtime floor, which this check cannot see. `ADR-0010` is the
other gate added to the same workflow and fails for an unrelated kind of reason.

The choice stands: CI still fails on a high or critical advisory, and the
workflow step is unchanged. What is retired is the record. A gate on this
repo's own pipeline is working practice, not a choice about the software
domainbook ships, and the roadmap now keeps practice out of the log. The step
and the thing worth knowing about it — that `npm audit` reports what the
registry knows at the moment it runs, so a red job may have nothing to do with
the commit — are in `CONTRIBUTING.md` under Checks, which can be rewritten when
the tree outgrows it.
