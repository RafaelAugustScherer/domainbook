import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const bookDir = fileURLToPath(
  new URL("../../core/test/fixtures/book/", import.meta.url)
);

const entry = fileURLToPath(new URL("../dist/index.js", import.meta.url));

const repo = fileURLToPath(new URL("../../../", import.meta.url));

export function builtInto(base: string): string {
  const out = mkdtempSync(join(tmpdir(), "domainbook-out-"));
  const source = [
    `import { build } from ${JSON.stringify(entry)};`,
    `await build({`,
    `  root: ${JSON.stringify(bookDir)},`,
    `  base: ${JSON.stringify(base)},`,
    `  outDir: ${JSON.stringify(out)},`,
    `  quiet: true,`,
    `});`,
  ].join("\n");
  execFileSync(process.execPath, ["--input-type=module", "-e", source], {
    cwd: repo,
    stdio: "pipe",
    timeout: 120_000,
    env: { ...process.env, NODE_ENV: "test" },
  });
  return out;
}
