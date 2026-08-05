import {
  debtSchema,
  decisionSchema,
  domainSchema,
  featureSchema,
} from "@domainbook/core";
import { defineCollection } from "astro:content";
import * as z from "zod";
import { fromBook } from "@domainbook/site/app";

const root = process.env["DOMAINBOOK_ROOT"] ?? "domainbook";
const base = import.meta.env.BASE_URL;

export const collections = {
  book: defineCollection({ loader: fromBook(root, base, "book") }),
  domains: defineCollection({
    loader: fromBook(root, base, "domains"),
    schema: z.looseObject({ frontmatter: domainSchema.optional() }),
  }),
  features: defineCollection({
    loader: fromBook(root, base, "features"),
    schema: z.looseObject({ frontmatter: featureSchema }),
  }),
  decisions: defineCollection({
    loader: fromBook(root, base, "decisions"),
    schema: z.looseObject({ frontmatter: decisionSchema }),
  }),
  debt: defineCollection({
    loader: fromBook(root, base, "debt"),
    schema: z.looseObject({ frontmatter: debtSchema }),
  }),
  terms: defineCollection({ loader: fromBook(root, base, "terms") }),
  changelogs: defineCollection({ loader: fromBook(root, base, "changelogs") }),
};
