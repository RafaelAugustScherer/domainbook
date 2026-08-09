import { build as astroBuild, dev as astroDev } from "astro";
import { inlineConfig, type Options } from "./astro.js";

export type { Options } from "./astro.js";

export type Running = { port: number; stop: () => Promise<void> };

export async function dev(options: Options): Promise<Running> {
  const server = await astroDev(inlineConfig(options));
  return { port: server.address.port, stop: () => server.stop() };
}

export async function build(options: Options): Promise<void> {
  process.env["NODE_ENV"] = "production";
  await astroBuild(inlineConfig({ ...options, mode: "production" }));
}
