import { missingBook } from "@domainbook/core";
import { refuse, type Result } from "./result.js";

export function serve(target: string | undefined, root: string): Result {
  if (target === "web")
    return refuse(
      '"web" is not something "domainbook serve" does yet — the site comes in a later phase; "domainbook serve mcp" is the one that works today'
    );
  const missing = missingBook(root);
  if (missing !== undefined) return refuse(missing);
  return { code: 0, lines: [], serve: root };
}
