import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

export const bookDir = fileURLToPath(
  new URL("./fixtures/book/", import.meta.url)
);
export const brokenDir = fileURLToPath(
  new URL("./fixtures/broken/", import.meta.url)
);

export function read(dir: string, name: string): string {
  return readFileSync(join(dir, name), "utf8");
}
