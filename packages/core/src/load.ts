import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { formatIssue, type Issue } from "./issue.js";
import { isChangelog } from "./load/changelog.js";
import { configFile, loadConfig } from "./load/config.js";
import { entries, isFile, relate, strange } from "./load/disk.js";
import { loadDomain } from "./load/domain.js";
import { loadGlossary } from "./load/glossary.js";
import { loadLog } from "./load/log.js";
import { loadRoadmap } from "./load/roadmap.js";
import { debtLog, decisionLog } from "./log.js";
import type { Book } from "./model.js";
import { configSchema } from "./schemas/config.js";

export { configFile } from "./load/config.js";

export const buildDir = "build";

const rootHolds = `a book root holds roadmap.md, glossary.md, ${configFile}, decisions/*.md, debt/*.md, and domains/ — ${buildDir}/ is written by "domainbook build" and read by nothing`;
const domainsHold = "domains/ holds one folder per domain and nothing else";
const notAFolder = "a book root is a folder, and this path is a file";

function noBook(root: string): Issue {
  return {
    file: root,
    message: `no book here — run "domainbook init ${root}" to write one`,
  };
}

function noChangelog(file: string, root: string): Issue {
  return {
    file,
    message: `a book holds no changelog — run "${rooted(
      "domainbook validate --fix",
      root
    )}" to delete it, or move it out of ${root}/ if the project keeps one`,
  };
}

export function rooted(command: string, root: string): string {
  if (resolve(root) === resolve("domainbook")) return command;
  const at = relate(resolve(root));
  const argument = /\s/.test(at) ? `'${at}'` : at;
  return `${command} ${argument}`;
}

export function missingBook(root: string): string | undefined {
  const dir = resolve(root);
  if (existsSync(dir) && !statSync(dir).isDirectory())
    return formatIssue({ file: relate(dir), message: notAFolder });
  if (isFile(join(dir, "roadmap.md"))) return undefined;
  return formatIssue(noBook(relate(dir)));
}

export type Loaded = { book: Book; issues: Issue[]; changelogs: string[] };

export function loadBook(root: string): Loaded {
  const dir = resolve(root);
  const issues: Issue[] = [];
  const changelogs: string[] = [];
  const book: Book = {
    root: relate(dir),
    config: configSchema.parse({}),
    decisions: [],
    decisionFiles: [],
    debt: [],
    debtFiles: [],
    domains: [],
  };

  if (!existsSync(dir)) {
    issues.push(noBook(book.root));
    return { book, issues, changelogs };
  }
  if (!statSync(dir).isDirectory()) {
    issues.push({ file: book.root, message: notAFolder });
    return { book, issues, changelogs };
  }

  const known = ["roadmap.md", "glossary.md", configFile];
  const rootFolders = ["decisions", "debt", "domains", buildDir];
  for (const entry of entries(dir))
    if (isChangelog(entry)) changelogs.push(relate(join(dir, entry.name)));
    else if (
      entry.isDirectory()
        ? !rootFolders.includes(entry.name)
        : !known.includes(entry.name)
    )
      issues.push(strange(dir, entry, rootHolds));

  const config = loadConfig(dir);
  book.config = config.config;
  issues.push(...config.issues);

  const roadmap = loadRoadmap(dir);
  book.roadmap = roadmap.record;
  issues.push(...roadmap.issues);

  const glossary = loadGlossary(dir);
  book.glossary = glossary.record;
  issues.push(...glossary.issues);

  const log = loadLog(dir, undefined, decisionLog);
  book.decisions = log.records;
  book.decisionFiles = log.files;
  issues.push(...log.issues);

  const debt = loadLog(dir, undefined, debtLog);
  book.debt = debt.records;
  book.debtFiles = debt.files;
  issues.push(...debt.issues);

  const domains = join(dir, "domains");
  for (const entry of entries(domains)) {
    if (!entry.isDirectory()) {
      issues.push(strange(domains, entry, domainsHold));
      continue;
    }
    const domain = loadDomain(join(domains, entry.name), entry.name);
    issues.push(...domain.issues);
    changelogs.push(...domain.changelogs);
    book.domains.push(domain.record);
  }

  for (const file of changelogs) issues.push(noChangelog(file, book.root));
  return { book, issues, changelogs };
}
