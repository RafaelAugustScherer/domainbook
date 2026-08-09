import {
  adrRef,
  canvas,
  contextMap,
  opening,
  sectionNamed,
  tdrRef,
  type Book,
  type DomainRecord,
} from "@domainbook/core";
import { bodyOf, partNamed, partsOf } from "../body.js";
import { under } from "../issues.js";
import { folderOf } from "../paths.js";
import type { Entry, Loaded, Render } from "./types.js";

export async function domainEntries(
  book: Book,
  loaded: Loaded,
  render: Render
): Promise<Entry[]> {
  return Promise.all(
    book.domains.map((one) => entryOf(book, loaded, one, render))
  );
}

async function entryOf(
  book: Book,
  loaded: Loaded,
  domain: DomainRecord,
  render: Render
): Promise<Entry> {
  const parts = partsOf(bodyOf(domain.file));
  const sections = await Promise.all(
    canvas.map(async (heading) => ({
      heading,
      html: await render(partNamed(parts, heading)),
    }))
  );
  return {
    id: domain.id,
    data: {
      frontmatter: domain.frontmatter,
      issues: under(loaded.issues, folderOf(domain.file)),
      file: domain.file,
      sections,
      map: contextMap(book, domain.id),
      hasGlossary: domain.glossary !== undefined,
      hasChangelog: domain.changelog !== undefined,
      terms: (domain.glossary?.terms ?? []).map((one) => ({
        slug: one.slug,
        name: one.name,
      })),
      features: domain.features.map((one) => ({
        id: one.frontmatter.id,
        name: one.frontmatter.name,
        status: one.frontmatter.status,
      })),
      decisions: await Promise.all(
        domain.decisions.map(async (one) => ({
          ref: adrRef(one),
          number: one.number,
          title: one.title,
          status: one.frontmatter.status,
          date: one.frontmatter.date,
          outcome: await render(
            opening(sectionNamed(one.file, "Decision Outcome"))
          ),
        }))
      ),
      debt: domain.debt.map((one) => ({
        ref: tdrRef(one),
        log: `${folderOf(one.file)}/`,
        number: one.number,
        title: one.title,
        status: one.frontmatter.status,
        severity: one.frontmatter.severity,
        quadrant: one.frontmatter.quadrant,
        date: one.frontmatter.date,
      })),
    },
  };
}
