import { existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { formatIssue, type Issue } from "./issue.js";
import { loadChangelog } from "./load/changelog.js";
import { configFile, loadConfig } from "./load/config.js";
import { entries, relate, strange } from "./load/disk.js";
import { loadDomain } from "./load/domain.js";
import { loadGlossary } from "./load/glossary.js";
import { loadLog } from "./load/log.js";
import { loadRoadmap } from "./load/roadmap.js";
import { debtLog, decisionLog } from "./log.js";
import type { Book } from "./model.js";
import { configSchema } from "./schemas/config.js";

export { configFile } from "./load/config.js";

const rootHolds = `a book root holds roadmap.md, glossary.md, changelog.md, ${configFile}, decisions/*.md, debt/*.md, and domains/`;
const domainsHold = "domains/ holds one folder per domain and nothing else";

export function missingBook(root: string): string | undefined {
  const dir = resolve(root);
  if (existsSync(dir) && statSync(dir).isDirectory()) return undefined;
  const [issue] = loadBook(dir).issues;
  return issue === undefined ? undefined : formatIssue(issue);
}

export function loadBook(root: string): { book: Book; issues: Issue[] } {
  const dir = resolve(root);
  const issues: Issue[] = [];
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
    issues.push({
      file: book.root,
      message: `no book here — run "domainbook init ${book.root}" to write one`,
    });
    return { book, issues };
  }
  if (!statSync(dir).isDirectory()) {
    issues.push({
      file: book.root,
      message: "a book root is a folder, and this path is a file",
    });
    return { book, issues };
  }

  const known = ["roadmap.md", "glossary.md", "changelog.md", configFile];
  const rootFolders = ["decisions", "debt", "domains"];
  for (const entry of entries(dir))
    if (
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

  const changelog = loadChangelog(dir);
  book.changelog = changelog.record;
  issues.push(...changelog.issues);

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
    book.domains.push(domain.record);
  }

  return { book, issues };
}
