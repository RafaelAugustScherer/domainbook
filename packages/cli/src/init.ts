import { existsSync, statSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { configFile, termSlug } from "@domainbook/core";
import { entries, quoted, relate, rooted, write } from "./files.js";
import { mcpFile, planServer } from "./mcp.js";
import { changelogPage, glossaryPage } from "./new.js";
import { refuse, type Result } from "./result.js";

const config = `enforcement:
  mode: block
  trailer: Skip-Docs
  require_reason: agents
`;

export function init(root: string): Result {
  const at = relate(root);
  if (existsSync(root)) {
    if (!statSync(root).isDirectory())
      return refuse(
        `"${at}" is a file — a book root is a folder; pass one that is empty, or one that does not exist yet`
      );
    const held = entries(root);
    if (held.length > 0)
      return refuse(
        `"${at}" is not empty — it holds "${held[0]}"; "domainbook init" writes a new book into an empty folder, so pass another root, or edit the book that is already here`
      );
  }
  const roadmap = join(root, "roadmap.md");
  const glossary = join(root, "glossary.md");
  const changelog = join(root, "changelog.md");
  const failed =
    write(roadmap, page(termSlug(basename(dirname(root))) || "book")) ??
    write(glossary, glossaryPage("Glossary", "this book")) ??
    write(changelog, changelogPage("this project")) ??
    write(join(root, configFile), config) ??
    server(at);
  if (failed !== undefined) return refuse(failed);
  return {
    code: 0,
    lines: [
      `wrote ${relate(roadmap)}, ${relate(glossary)}, ${relate(
        changelog
      )}, ${relate(join(root, configFile))} and ${mcpFile}`,
      `next: name the milestone in roadmap.md, then "${rooted(
        "domainbook new domain <id>",
        root
      )}" for your first bounded context`,
    ],
  };
}

function server(at: string): string | undefined {
  const planned = planServer(at);
  if ("refusal" in planned) return planned.refusal;
  return write(resolve(mcpFile), planned.text);
}

function page(id: string): string {
  return `---
id: ${quoted(id)}
milestones:
  - { id: first-milestone, name: First milestone, status: planned }
---

# ${id} roadmap

## Milestones

### First milestone
`;
}
