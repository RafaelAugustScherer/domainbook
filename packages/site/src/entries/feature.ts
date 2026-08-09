import {
  findDecision,
  termSlug,
  type Book,
  type FeatureRecord,
  type ParsedRule,
} from "@domainbook/core";
import { bodyOf, partNamed, partsOf } from "../body.js";
import { resolveTerm } from "../terms.js";
import type { Entry, Render } from "./types.js";

export async function featureEntries(
  book: Book,
  render: Render
): Promise<Entry[]> {
  const found = book.domains.flatMap((one) =>
    one.features.map((feature) => ({ domain: one.id, feature }))
  );
  return Promise.all(
    found.map((one) => entryOf(book, one.domain, one.feature, render))
  );
}

async function entryOf(
  book: Book,
  domain: string,
  feature: FeatureRecord,
  render: Render
): Promise<Entry> {
  const parts = partsOf(bodyOf(feature.file));
  return {
    id: `${domain}/${feature.frontmatter.id}`,
    data: {
      frontmatter: feature.frontmatter,
      domain,
      file: feature.file,
      storyHtml: await render(broken(partNamed(parts, "Story"))),
      openQuestionsHtml: await render(partNamed(parts, "Open Questions")),
      rules: await Promise.all(feature.rules.map((one) => ruleOf(one, render))),
      terms: (feature.frontmatter.terms ?? []).flatMap((slug) => {
        const found = resolveTerm(book, domain, slug);
        return found === undefined ? [] : [found];
      }),
      decisions: (feature.frontmatter.decisions ?? []).map((ref) => ({
        ref,
        title: findDecision(book, ref)?.title ?? "",
        domain: findDecision(book, ref)?.domain,
        number: findDecision(book, ref)?.number,
      })),
    },
  };
}

async function ruleOf(
  rule: ParsedRule,
  render: Render
): Promise<Record<string, unknown>> {
  const written = rule.examples.flatMap((example) => split(example.source));
  return {
    name: rule.name,
    slug: termSlug(rule.name),
    examples: await Promise.all(
      written.map(async (example) => ({
        title: example.title,
        slug: termSlug(`${rule.name} ${example.title}`),
        html: await render(`\`\`\`gherkin\n${example.source}\n\`\`\``),
      }))
    ),
  };
}

function split(source: string): { title: string; source: string }[] {
  const opener = /^\s*Example:(.*)$/;
  const found: { title: string; source: string }[] = [];
  for (const line of source.split(/\r?\n/)) {
    const title = opener.exec(line)?.[1];
    if (title !== undefined) {
      found.push({ title: title.trim(), source: line });
      continue;
    }
    const last = found.at(-1);
    if (last !== undefined) last.source += `\n${line}`;
  }
  return found.map((one) => ({ ...one, source: one.source.trimEnd() }));
}

function broken(markdown: string): string {
  return markdown
    .split(/\r?\n/)
    .map((line) => (line.trim() === "" ? line : `${line.trimEnd()}  `))
    .join("\n");
}
