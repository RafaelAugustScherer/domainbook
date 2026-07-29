import { execFileSync, spawn, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const repo = fileURLToPath(new URL("../../../", import.meta.url));
const bin = fileURLToPath(new URL("../dist/bin.js", import.meta.url));
let home = "";

beforeAll(() => {
  execFileSync(
    process.execPath,
    [join(repo, "node_modules/typescript/bin/tsc"), "--build", "packages/cli"],
    { cwd: repo }
  );
  home = mkdtempSync(join(tmpdir(), "domainbook-bin-"));
}, 120_000);

afterAll(() => {
  rmSync(home, { recursive: true, force: true });
});

function ran(...argv: string[]) {
  return spawnSync(process.execPath, [bin, ...argv], {
    cwd: home,
    encoding: "utf8",
  });
}

describe("the published entry point", () => {
  it("scaffolds a book and validates it, talking on stdout with status 0", () => {
    expect(ran("init").status).toBe(0);
    expect(ran("new", "domain", "ticketing").status).toBe(0);
    const validated = ran("validate");
    expect(validated.status).toBe(0);
    expect(validated.stdout).toBe(
      "domainbook is a valid book — 1 domain, 0 features, 0 decisions, 0 terms\n"
    );
    expect(validated.stderr).toBe("");
  });

  it("talks on stderr with status 1 when it has nothing to validate", () => {
    const validated = ran("validate", "nowhere");
    expect(validated.status).toBe(1);
    expect(validated.stdout).toBe("");
    expect(validated.stderr).toBe(
      'nowhere: no book here — run "domainbook init nowhere" to write one\n'
    );
  });

  it("names the files it found from wherever it was run", () => {
    const outer = mkdtempSync(join(tmpdir(), "domainbook-inside-"));
    execFileSync(process.execPath, [bin, "init"], { cwd: outer });
    execFileSync(
      process.execPath,
      [bin, "new", "decision", "Expire holds after ten minutes"],
      { cwd: outer }
    );
    const log = join(outer, "domainbook", "decisions");
    const first = join(log, "0001-expire-holds-after-ten-minutes.md");
    writeFileSync(
      join(log, "0001-refund-a-late-capture-in-full.md"),
      readFileSync(first, "utf8").replace(
        "# Expire holds after ten minutes",
        "# Refund a late capture in full"
      )
    );
    const validated = spawnSync(process.execPath, [bin, "validate", "."], {
      cwd: join(outer, "domainbook"),
      encoding: "utf8",
    });
    rmSync(outer, { recursive: true, force: true });
    expect(validated.status).toBe(1);
    expect(validated.stderr.trimEnd().split("\n")).toEqual([
      "decisions/0001-refund-a-late-capture-in-full.md: ADR-0001 is already decisions/0001-expire-holds-after-ten-minutes.md — decision numbers are never reused; renumber this one to 0002",
    ]);
  });

  it("hands every issue to a slow reader instead of cutting the report short", async () => {
    const noisy = mkdtempSync(join(tmpdir(), "domainbook-noisy-"));
    execFileSync(process.execPath, [bin, "init"], { cwd: noisy });
    for (let count = 0; count < 900; count += 1)
      writeFileSync(join(noisy, "domainbook", `stray-${count}.txt`), "");
    const child = spawn(process.execPath, [bin, "validate"], { cwd: noisy });
    const report = await new Promise<string>((done) => {
      let text = "";
      child.stderr.setEncoding("utf8");
      child.stderr.on("data", (chunk: string) => {
        text += chunk;
      });
      child.stderr.pause();
      child.on("close", () => done(text));
      setTimeout(() => child.stderr.resume(), 500);
    });
    rmSync(noisy, { recursive: true, force: true });
    expect(report.trimEnd().split("\n")).toHaveLength(900);
  }, 20_000);
});
