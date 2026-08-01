import type { Book, FeatureRecord } from "@domainbook/core";
import { sectionNamed } from "@domainbook/core";
import { type Answer, listed, refuse, said } from "../answer.js";
import { noDomain } from "../scope.js";
import { text } from "../files.js";

export function getFeature(book: Book, id: string, domain?: string): Answer {
  const within =
    domain === undefined
      ? book.domains
      : book.domains.filter((one) => one.id === domain);
  if (domain !== undefined && within.length === 0)
    return refuse(noDomain(book, domain));
  const found = within.flatMap((one) =>
    one.features.filter((feature) => feature.frontmatter.id === id)
  );
  if (found.length > 1)
    return refuse(
      `two contexts hold a feature "${id}" — pass ${listed(
        found.map((one) => `domain "${one.domain}"`)
      )}`
    );
  const [feature] = found;
  if (feature === undefined) return refuse(absent(within, id, domain));
  return said(written(feature));
}

function written(feature: FeatureRecord): string {
  const { frontmatter } = feature;
  return [
    `# ${frontmatter.name} (${frontmatter.id})`,
    "",
    `${feature.domain} · ${frontmatter.status}`,
    frontmatter.terms === undefined
      ? undefined
      : `Terms: ${frontmatter.terms.join(", ")} — read them with explain_terms`,
    frontmatter.decisions === undefined
      ? undefined
      : `Decisions: ${frontmatter.decisions.join(", ")}`,
    `File: ${feature.file}`,
    "",
    body(feature),
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}

function body(feature: FeatureRecord): string {
  const source = text(feature.file);
  const start = source.indexOf("## Story");
  if (start === -1) return openQuestions(feature);
  return source.slice(start).trimEnd();
}

function openQuestions(feature: FeatureRecord): string {
  const asked = sectionNamed(feature.file, "Open Questions");
  return asked === "" ? "" : `## Open Questions\n\n${asked}`;
}

function absent(
  within: Book["domains"],
  id: string,
  domain: string | undefined
): string {
  const ids = within.flatMap((one) =>
    one.features.map((feature) => feature.frontmatter.id)
  );
  const where = domain === undefined ? "this book" : domain;
  if (ids.length === 0) return `no feature "${id}" in ${where} — it holds none`;
  return `no feature "${id}" in ${where} — it holds ${listed(ids)}`;
}
