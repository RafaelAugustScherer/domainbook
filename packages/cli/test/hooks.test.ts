import { existsSync, readFileSync, statSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { enter, failed, git, leave, ran, wrote } from "./repo.js";

const hook = ".git/hooks/commit-msg";

const block = [
  "# domainbook:start",
  'domainbook check --staged --message-file "$1" || exit 1',
  "# domainbook:end",
].join("\n");

const installed = [
  '.git/hooks/commit-msg is installed — every commit now runs "domainbook check --staged"',
  'next: run "domainbook instructions" to write the rule where agents will read it',
];

beforeEach(() => {
  enter();
  ran("init");
});

afterEach(leave);

function held(): string {
  return readFileSync(hook, "utf8");
}

describe("what install writes", () => {
  it("writes an executable hook holding the check between markers", () => {
    expect(ran("hooks", "install")).toEqual(installed);
    expect(held()).toBe(`#!/bin/sh\n\n${block}\n`);
    expect(statSync(hook).mode & 0o111).not.toBe(0);
  });

  it("remembers a book that lives somewhere else", () => {
    ran("init", "docs/book");
    ran("hooks", "install", "docs/book");
    expect(held()).toContain(
      'domainbook check --staged --message-file "$1" docs/book'
    );
  });

  it("adds the check below a hook someone else wrote", () => {
    wrote(hook, '#!/bin/sh\necho "someone else ran"\n');
    expect(ran("hooks", "install")).toEqual([
      ".git/hooks/commit-msg already existed, so the check was added to the end of it — the hook that was there runs first and still decides first",
      installed[1],
    ]);
    expect(held()).toBe(`#!/bin/sh\necho "someone else ran"\n\n${block}\n`);
  });

  it("replaces its own block rather than adding a second", () => {
    ran("hooks", "install");
    expect(ran("hooks", "install")).toEqual([
      '.git/hooks/commit-msg is up to date — every commit runs "domainbook check --staged"',
    ]);
    expect(held().split("# domainbook:start")).toHaveLength(2);
  });

  it("treats a hook with no shebang as shell, the way git runs it", () => {
    wrote(hook, "echo hi\n");
    ran("hooks", "install");
    expect(held()).toBe(`echo hi\n\n${block}\n`);
  });
});

describe("what install refuses", () => {
  it("hands back a hook written in another language", () => {
    wrote(hook, '#!/usr/bin/perl\nprint "hi\\n";\n');
    const before = held();
    expect(failed("hooks", "install")).toEqual([
      '.git/hooks/commit-msg is a perl script, and the check is a shell line — add the equivalent of "domainbook check --staged --message-file \\"$1\\"" to it yourself, or move it aside and run this again',
    ]);
    expect(held()).toBe(before);
  });

  it("hands back a hook that ends by exiting", () => {
    wrote(hook, "#!/bin/sh\necho hi\nexit 0\n");
    const before = held();
    expect(failed("hooks", "install")).toEqual([
      '.git/hooks/commit-msg ends with "exit 0", so a check appended below it would never run — put "domainbook check --staged --message-file \\"$1\\"" above that line yourself, or move the hook aside and run this again',
    ]);
    expect(held()).toBe(before);
  });

  it("names init when there is no book to check against", () => {
    expect(failed("hooks", "install", "docs/book")).toEqual([
      'docs/book: no book here — run "domainbook init docs/book" to write one',
    ]);
  });
});

describe("what install does in a repo that manages its own hooks", () => {
  it("hands lefthook the snippet and writes nothing", () => {
    wrote(
      "lefthook.yml",
      "pre-commit:\n  commands:\n    lint:\n      run: x\n"
    );
    expect(ran("hooks", "install")).toEqual([
      "lefthook.yml is here, and lefthook rewrites .git/hooks — add this to lefthook.yml instead:",
      "",
      "commit-msg:",
      "  commands:",
      "    domainbook:",
      "      run: domainbook check --staged --message-file {1}",
    ]);
    expect(existsSync(hook)).toBe(false);
  });

  it("writes under core.hooksPath and leaves the setting alone", () => {
    git("config", "core.hooksPath", ".githooks");
    expect(ran("hooks", "install")[0]).toBe(
      '.githooks/commit-msg is installed — every commit now runs "domainbook check --staged"'
    );
    expect(git("config", "core.hooksPath").trim()).toBe(".githooks");
    expect(readFileSync(".githooks/commit-msg", "utf8")).toContain(block);
  });
});

describe("what uninstall removes", () => {
  it("takes the block and leaves every other line where it was", () => {
    wrote(hook, '#!/bin/sh\necho "someone else ran"\n');
    const before = held();
    ran("hooks", "install");
    expect(ran("hooks", "uninstall")).toEqual([
      "the domainbook block is removed from .git/hooks/commit-msg — what was already in that hook is untouched",
    ]);
    expect(held()).toBe(before);
    expect(statSync(hook).mode & 0o111).not.toBe(0);
  });

  it("removes a hook that was only ever ours", () => {
    ran("hooks", "install");
    expect(ran("hooks", "uninstall")).toEqual([
      ".git/hooks/commit-msg held nothing but the domainbook block, so the hook is removed",
    ]);
    expect(existsSync(hook)).toBe(false);
  });

  it("leaves a hook with no block of ours alone", () => {
    wrote(hook, "#!/bin/sh\necho hi\n");
    expect(ran("hooks", "uninstall")).toEqual([
      ".git/hooks/commit-msg carries no domainbook block, so nothing was removed",
    ]);
    expect(held()).toBe("#!/bin/sh\necho hi\n");
  });

  it("treats no hook at all as nothing to do", () => {
    expect(ran("hooks", "uninstall")).toEqual([
      "there is no .git/hooks/commit-msg here, so nothing was removed",
    ]);
  });

  it("puts back what it started with when install follows uninstall", () => {
    wrote(hook, '#!/bin/sh\necho "someone else ran"\n');
    ran("hooks", "install");
    const before = held();
    ran("hooks", "uninstall");
    ran("hooks", "install");
    expect(held()).toBe(before);
  });
});

describe("what hooks asks to be told", () => {
  it("needs to know which", () => {
    expect(failed("hooks")[0]).toContain(
      '"domainbook hooks" needs to know which'
    );
  });

  it("names what it does when asked for something else", () => {
    expect(failed("hooks", "reinstall")[0]).toContain(
      '"reinstall" is not something "domainbook hooks" does'
    );
  });
});
