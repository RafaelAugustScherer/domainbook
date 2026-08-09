import {
  contextMap,
  opening,
  sectionNamed,
  type Book,
  type DomainRecord,
  type Milestone,
} from "@domainbook/core";
import { bodyOf, withoutTitle } from "../body.js";
import { under } from "../issues.js";
import { folderOf } from "../paths.js";
import type { Entry, Loaded, Render } from "./types.js";

export async function bookEntry(
  book: Book,
  loaded: Loaded,
  render: Render
): Promise<Entry> {
  const roadmap = book.roadmap;
  const milestones = roadmap?.frontmatter.milestones ?? [];
  return {
    id: "book",
    data: {
      root: book.root,
      milestones,
      now: nowAt(milestones),
      roadmapHtml:
        roadmap === undefined
          ? ""
          : await render(withoutTitle(bodyOf(roadmap.file))),
      map: contextMap(book),
      contexts: book.domains.map((one) => counted(loaded, one)),
      totals: totalsOf(book),
    },
  };
}

function nowAt(milestones: Milestone[]): Milestone | undefined {
  return (
    milestones.find((one) => one.status === "in-progress") ??
    milestones.find((one) => one.status === "planned")
  );
}

function totalsOf(book: Book): Record<string, number | boolean> {
  const held = book.domains.map((one) => holdings(one));
  return {
    glossary: book.glossary !== undefined,
    changelog: book.changelog !== undefined,
    roadmap: book.roadmap !== undefined,
    domains: book.domains.length,
    features: added(held, "features"),
    decisions: book.decisions.length + added(held, "decisions"),
    rootDecisions: book.decisions.length,
    debt: book.debt.length + added(held, "debt"),
    terms: (book.glossary?.terms.length ?? 0) + added(held, "terms"),
    changelogs:
      (book.changelog === undefined ? 0 : 1) +
      book.domains.filter((one) => one.changelog !== undefined).length,
  };
}

function holdings(domain: DomainRecord): Record<string, number> {
  return {
    features: domain.features.length,
    decisions: domain.decisions.length,
    debt: domain.debt.length,
    terms: domain.glossary?.terms.length ?? 0,
  };
}

function added(held: Record<string, number>[], key: string): number {
  return held.reduce((total, one) => total + (one[key] ?? 0), 0);
}

function counted(
  loaded: Loaded,
  domain: DomainRecord
): Record<string, unknown> {
  return {
    id: domain.id,
    name: domain.frontmatter?.name ?? domain.id,
    classification: domain.frontmatter?.classification,
    purpose: opening(sectionNamed(domain.file, "Purpose")),
    issues: under(loaded.issues, folderOf(domain.file)).length,
    holds: holdings(domain),
  };
}
