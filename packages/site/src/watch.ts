import { watch } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { loaderName } from "./loader.js";
import { buildIndex, bundle } from "./search.js";

const types: Record<string, string> = {
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".wasm": "application/wasm",
};

export function serveBook(root: string, base: string): AstroIntegration {
  const at = resolve(root);
  const under = `/${bundle}/`;
  const based = `${base.replace(/\/$/, "")}${under}`;
  let files = new Map<string, Uint8Array>();
  return {
    name: "domainbook",
    hooks: {
      "astro:server:setup": async ({ server, refreshContent }) => {
        files = await buildIndex(at, undefined);
        server.middlewares.use((request, response, next) => {
          const path = (request.url ?? "").split("?")[0] ?? "";
          const asked = wanted(path, based) ?? wanted(path, under);
          const held = asked === undefined ? undefined : files.get(asked);
          if (held === undefined) return next();
          response.writeHead(200, { "content-type": typeOf(path) });
          response.end(held);
          return undefined;
        });
        let pending: NodeJS.Timeout | undefined;
        const reread = async (): Promise<void> => {
          files = await buildIndex(at, undefined);
          await refreshContent?.({ loaders: [loaderName] });
          server.hot.send({ type: "full-reload", path: "*" });
        };
        const queued = oneAtATime(reread);
        watch(at, { recursive: true }, (_, name) => {
          if (hidden(name)) return;
          clearTimeout(pending);
          pending = setTimeout(queued, 80);
        });
      },
      "astro:build:done": async ({ dir }) => {
        await buildIndex(at, join(fileURLToPath(dir), bundle));
      },
    },
  };
}

export function oneAtATime(work: () => Promise<void>): () => void {
  let running: Promise<void> | undefined;
  let asked = false;
  const start = (): void => {
    running = work()
      .catch(() => undefined)
      .finally(() => {
        running = undefined;
        if (!asked) return;
        asked = false;
        start();
      });
  };
  return () => {
    if (running !== undefined) {
      asked = true;
      return;
    }
    start();
  };
}

function wanted(path: string, prefix: string): string | undefined {
  return path.startsWith(prefix) ? path.slice(prefix.length) : undefined;
}

function hidden(name: string | Buffer | null): boolean {
  if (typeof name !== "string") return false;
  return name.split(/[\\/]/).some((part) => part.startsWith("."));
}

function typeOf(path: string): string {
  const dot = path.lastIndexOf(".");
  return types[path.slice(dot)] ?? "application/octet-stream";
}
