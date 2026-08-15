import { rmSync } from "node:fs";
import { join } from "node:path";
import {
  buildDir,
  exportBook,
  exportTargets,
  isTarget,
  missingBook,
  validateBook,
} from "@domainbook/core";
import { relate, write } from "./files.js";
import { refuse, type Result } from "./result.js";

export function exportTo(target: string, root: string): Result {
  if (target === "")
    return refuse(
      `export what? — the targets are ${listed()}, as in "domainbook export json"`
    );
  if (!isTarget(target))
    return refuse(`no export "${target}" — the targets are ${listed()}`);
  const missing = missingBook(root);
  if (missing !== undefined) return refuse(missing);
  const { book, issues } = validateBook(root);
  if (issues.length > 0)
    return refuse(
      `${relate(
        root
      )} does not validate — run "domainbook validate" to see what is wrong, fix it, then export again`
    );
  const under = join(root, buildDir);
  const dir = join(under, target);
  rmSync(dir, { recursive: true, force: true });
  const { files, notices } = exportBook(book, target);
  const ignore = write(join(under, ".gitignore"), "*\n");
  if (ignore !== undefined) return refuse(ignore);
  for (const file of files) {
    const problem = write(join(dir, file.path), file.content);
    if (problem !== undefined) return refuse(problem);
  }
  return { code: 0, lines: [`wrote ${relate(dir)}/`, ...notices] };
}

function listed(): string {
  const all = [...exportTargets];
  return `${all.slice(0, -1).join(", ")} and ${all[all.length - 1]}`;
}
