import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroInlineConfig } from "astro";
import { serveBook } from "./watch.js";

const siteRoot = fileURLToPath(new URL("../", import.meta.url));

const working = ".astro";

export type Options = {
  root: string;
  base: string;
  outDir?: string;
  port?: number;
  quiet?: boolean;
  mode?: string;
};

export function inlineConfig(options: Options): AstroInlineConfig {
  process.env["DOMAINBOOK_ROOT"] = resolve(options.root);
  delete process.env["BASE_URL"];
  const project = staged();
  return {
    root: project,
    srcDir: join(project, "app"),
    publicDir: join(project, "public"),
    cacheDir: join(project, "cache"),
    configFile: false,
    ...(options.mode === undefined ? {} : { mode: options.mode }),
    base: options.base,
    trailingSlash: "always",
    logLevel: options.quiet === true ? "silent" : "warn",
    ...(options.outDir === undefined
      ? {}
      : { outDir: resolve(options.outDir) }),
    server: { port: options.port ?? 4321 },
    integrations: [serveBook(options.root, options.base)],
    markdown: {
      shikiConfig: {
        themes: { light: "github-light", dark: "github-dark" },
        wrap: true,
      },
    },
  };
}

function staged(): string {
  const project = join(process.cwd(), working);
  const app = join(project, "app");
  mkdirSync(project, { recursive: true });
  writeFileSync(join(project, ".gitignore"), "*\n");
  writeFileSync(join(project, "package.json"), '{ "type": "module" }\n');
  rmSync(app, { recursive: true, force: true });
  cpSync(join(siteRoot, "app"), app, { recursive: true });
  mkdirSync(join(project, "public"), { recursive: true });
  return project;
}
