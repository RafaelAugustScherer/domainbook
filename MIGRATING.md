# Migrating to domainbook 2.0

2.0 adds team collaboration through the git remote your team already has, with no
server to run (`ADR-0015`). It is built to drop in: existing books keep working,
the numbers already in your history are read from the branches you already have,
and nothing on disk is rewritten. There is no codemod because there is nothing to
transform — the migration is a package bump and one regenerated file.

## Before you start

- **Node 24.18.1 or newer.**
- **One behaviour changes.** On a repo that has a git remote, `domainbook new`,
  `domainbook check`, and the commit-msg and Stop hooks now reach the network,
  throttled to once a minute, to reserve numbers and publish your branch's book as
  a draft under `refs/domainbook/`. A repo with no remote is unchanged. To keep a
  repo with a remote on the old behaviour, see [Staying on single-developer
  behaviour](#staying-on-single-developer-behaviour).

## Upgrade

1. **Bump the package.**

   ```bash
   npm install domainbook@^2
   ```

2. **Regenerate the agent instructions**, then commit the result.

   ```bash
   domainbook instructions
   ```

   This rewrites `AGENTS.md`, `CLAUDE.md`, and `.claude/rules/*` so agents write
   each artifact with `domainbook new` — which reserves its number on the remote —
   and run `domainbook status` before deciding anything in a context. This is the
   one step that changes files; do not skip it.

3. **Optional: publish each active branch now** instead of on its next command.

   ```bash
   domainbook sync
   ```

That is the whole migration.

## What you do not need to do

- **No number backfill.** Allocation reads the default branch and every remote
  branch directly, so the decisions and debt already in your history are already
  counted. Claims are short-lived reservations for in-flight work, released once an
  artifact reaches the default branch — seeding them for existing artifacts would
  only create refs the next sync deletes.
- **No config file.** Collaboration is on by default, sharing through `origin`; a
  repo with no `domainbook.config.yaml` works.
- **No data migration.** No existing file's format or numbering changes.

## What is new

- `domainbook new` reserves the number or id on the remote and publishes your
  branch's draft the moment it writes.
- `domainbook status` shows what teammates are writing, before their branches are
  pushed.
- `domainbook sync` runs the exchange on demand; it otherwise runs underneath
  `new`, `check`, the MCP server, and the Stop hook, throttled to once a minute. A
  remote unreachable over its URL is retried over its SSH or HTTPS twin, and the
  remote's configuration is never edited.
- A decision or debt log may now have gaps and still never reuses a number
  (`format/ADR-0021`).

Full detail is in the "Work as a team, with no server" section of the
[README](README.md) and in `ADR-0015`.

## Staying on single-developer behaviour

- A repo with **no git remote** behaves exactly as 1.x.
- To keep a repo that has a remote on the old behaviour, set this in
  `domainbook.config.yaml`:

  ```yaml
  collaboration:
    enabled: false
  ```

- To share through a remote other than `origin`, set `collaboration.remote: <name>`.
