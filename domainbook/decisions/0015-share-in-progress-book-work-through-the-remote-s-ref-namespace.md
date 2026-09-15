---
status: accepted
date: 2026-09-13
decision-makers: [RafaelAugustScherer]
---

# Share in-progress book work through the remote's ref namespace

## Context and Problem Statement

domainbook was designed for one developer on one branch. A team breaks it in two
places. A decision or debt number is the highest on disk plus one
(`core/ADR-0007`), so two people on two branches take the same number and one of
them renumbers before merge — a cost `format/ADR-0015` recorded and accepted.
And a branch's artifacts are invisible to everyone else until its pull request
merges, so the agent deciding in one context cannot know a peer is deciding the
same thing two branches over.

The question is how peers share numbers and in-progress artifacts without a
service anyone has to run, without a file a peer wrote ending up in another
peer's commit, and without an agent learning anything beyond the commands it
already runs.

## Decision Drivers

- No server. A team should get this from `npx domainbook` and the git remote it
  already has, not from a deployment.
- Nothing synced enters the working tree. A pull request holds its author's
  artifacts and no one else's.
- One command. The agent runs `domainbook new` and `domainbook sync`; the
  protocol stays underneath.
- Offline is a state, not a failure. An airplane must not stop a decision being
  written, only its number being final.
- Sequential numbers stay the identity. Every reference in every v1 book reads
  `ADR-NNNN`, and MADR's numbering is what readers expect.

## Considered Options

- A central server holding the artifacts, the way spec-hub does with Postgres
  and an MCP endpoint.
- Peer-to-peer between developer machines, over a CRDT library and a transport
  such as WebRTC, iroh, Syncthing, or Radicle.
- The git remote's ref namespace as shared storage, the way git-bug keeps issues
  under `refs/bugs/*` and syncs them through an ordinary `git push`.
- Give up the number as identity: a slug or a date as log4brains does, or a
  placeholder numbered at acceptance as pyadr does.

## Decision Outcome

Chosen option: "The git remote's ref namespace", because it is the one option
with no new infrastructure and no new identity scheme. Every clone is a peer, the
remote is storage the team already trusts, and git's ref update is the atomic
primitive.

Two ref families under `refs/domainbook/`, both pushed by the CLI and both
invisible to `git branch`:

- **Claims** — `refs/domainbook/claims/<key>`, one per artifact identity: a log
  number (`decisions/0015`, `domains/billing/debt/0002`) or a slug
  (`domains/billing/features/refund-order`). A domain's own claim ends in
  `/index` (`domains/billing/index`), because a git ref cannot also be a
  directory of refs and the domain's records live under its path. A claim is a
  root commit with an empty tree whose message names the key, the branch and
  the title;
  git's author line names who and when. A claim is created once and never
  forced, so two pushes for one key leave one winner and one retry. It is
  released by whoever syncs first after the artifact is on the default branch.
  A claim that could not be pushed is *pending* under `.git/domainbook/`, and
  the commit hook refuses the artifact until it is not.
- **Drafts** — `refs/domainbook/drafts/<author>/<branch>/book`, a snapshot of
  one clone's book root as its working tree holds it, published when `new` writes
  and refreshed by every sync. The `/book` leaf is there for the same reason
  claims end in `/index`: a git ref cannot also be a directory of refs, so a
  stale `feat` draft would otherwise block a later `feat/refunds` from
  publishing. A draft has one owner, is a root commit, and is replaced rather
  than merged. Its owner prunes it when the branch is gone.

Allocation counts every number the remote knows — the default branch, every
pushed branch, every draft, every claim — before it takes the next one and
claims it. Peers' work is read from git objects into a cache under
`.git/domainbook/`, never into the working tree.

A sync runs inside `new`, `check`, the MCP server, and the Stop hook, throttled
to once a minute unless asked for, and on its own as `domainbook sync`. When the
remote is unreachable over its configured URL and that URL has an SSH or HTTPS
twin, the sync retries over the twin once, remembers which worked, and never
edits the remote's configuration. A repo with no remote, or with
`collaboration.enabled: false`, behaves as v1 did.

The other options, and why not:

- A server centralizes what git already distributes, needs hosting and an
  account, and puts the source of truth outside the repo — the opposite of what
  the book is for.
- True peer-to-peer needs both peers online at once and, in every mature stack
  checked, an always-on third party anyway: a signaling server for WebRTC, a
  relay and DNS for iroh, a discovery server for Syncthing, seed nodes for
  Radicle. It replaces one server with a less familiar one.
- Dropping the number breaks every existing reference and the convention
  readers know; numbering at acceptance means rewriting references at merge,
  which is the renumbering this record exists to remove.

### Consequences

- Good, because a team gets collaboration from the remote it has, with nothing
  to deploy, and a solo repo notices no change.
- Good, because a number is reserved before it is committed, so the collision
  `format/ADR-0015` accepted as certain becomes a retry the agent never sees.
- Good, because a peer's decision is readable the moment it is written, from
  the CLI and over MCP, marked as unmerged rather than mistaken for settled.
- Good, because nothing a peer wrote can be staged: it lives in git objects and
  under `.git/domainbook/`, not in the tree.
- Bad, because the CLI now pushes on its own. A write to the remote on every
  `new` is behaviour a team has to know about, and a claim is one more ref per
  artifact for the remote to hold — a few hundred over a book's life, well
  under what hosts serve today.
- Bad, because a contributor without push access cannot claim. Their number is
  taken locally and the duplicate check in CI is the backstop, as it is for
  anyone who commits with `--no-verify`.
- Bad, because an abandoned claim is a gap in the log forever, which
  `format/ADR-0021` has to allow.
- Bad, because the transport fallback guesses a URL's twin from its shape. It
  covers `git@host:owner/repo`, `ssh://git@host/owner/repo`, and
  `https://host/owner/repo`; anything else has no fallback and says so.
- Bad, because work is visible only once published, so a draft is as fresh as
  the last command that ran. The Stop hook publishes at the end of a session to
  narrow that.

### Confirmation

The phase's walkthrough: two clones of one scratch repo sharing a bare remote,
each writing a decision without fetching the other, ending with different
numbers and each seeing the other's under `domainbook status` and
`get_decisions` before either branch is pushed; an offline `new` whose commit
the hook refuses until `sync` claims it; and, against a GitHub scratch repo, a
push that fails over SSH and lands over HTTPS with the remote's URL unchanged.

## More Information

- git-bug's data model, the pattern the claims and drafts follow:
  <https://github.com/git-bug/git-bug/blob/trunk/doc/design/data-model.md>
- The collision as the ADR tools see it, open since 2020:
  <https://github.com/adr/madr/issues/28> and
  <https://github.com/npryce/adr-tools/issues/102>
- spec-hub, the central-server option as built: <https://github.com/cezarpretto/spec-hub>
