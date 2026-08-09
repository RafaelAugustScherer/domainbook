import type { Book, GlossaryRecord } from "@domainbook/core";

export type Found = { slug: string; name: string; domain: string | undefined };

export function glossaryFor(
  book: Book,
  domain: string | undefined
): GlossaryRecord | undefined {
  if (domain === undefined) return book.glossary;
  return book.domains.find((one) => one.id === domain)?.glossary;
}

export function resolveTerm(
  book: Book,
  domain: string,
  slug: string
): Found | undefined {
  const own = glossaryFor(book, domain)?.terms.find((one) => one.slug === slug);
  if (own !== undefined) return { slug, name: own.name, domain };
  const shared = book.glossary?.terms.find((one) => one.slug === slug);
  if (shared === undefined) return undefined;
  return { slug, name: shared.name, domain: undefined };
}

export function usedBy(
  book: Book,
  domain: string | undefined,
  slug: string
): { domain: string; id: string; name: string }[] {
  return book.domains.flatMap((one) =>
    one.features
      .filter(
        (feature) =>
          (feature.frontmatter.terms ?? []).includes(slug) &&
          resolveTerm(book, one.id, slug)?.domain === domain
      )
      .map((feature) => ({
        domain: one.id,
        id: feature.frontmatter.id,
        name: feature.frontmatter.name,
      }))
  );
}
