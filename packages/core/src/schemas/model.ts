import * as z from "zod";
import { changelogSchema } from "./changelog.js";
import { decisionRef, slug } from "./common.js";
import { debtSchema } from "./debt.js";
import { decisionSchema } from "./decision.js";
import { domainSchema } from "./domain.js";
import { featureSchema } from "./feature.js";
import { glossaryTermSchema } from "./glossary.js";
import { roadmapSchema } from "./roadmap.js";

const modelTermSchema = z.strictObject({
  ...glossaryTermSchema.shape,
  slug,
});

const modelFeatureSchema = z.strictObject({
  ...featureSchema.shape,
  story: z.string(),
  rules: z.array(
    z.strictObject({ name: z.string(), examples: z.array(z.string()) })
  ),
});

const modelDecisionSchema = z.strictObject({
  ref: decisionRef,
  number: z.number().int().positive(),
  title: z.string(),
  ...decisionSchema.shape,
});

const modelDebtSchema = z.strictObject({
  ref: z.string(),
  number: z.number().int().positive(),
  title: z.string(),
  ...debtSchema.shape,
});

const modelDomainSchema = z.strictObject({
  ...domainSchema.shape,
  glossary: z.array(modelTermSchema),
  features: z.array(modelFeatureSchema),
  decisions: z.array(modelDecisionSchema),
  debt: z.array(modelDebtSchema),
  changelog: changelogSchema.nullable(),
});

export const modelSchema = z
  .strictObject({
    root: z.string(),
    roadmap: roadmapSchema.nullable(),
    glossary: z.array(modelTermSchema),
    changelog: changelogSchema.nullable(),
    decisions: z.array(modelDecisionSchema),
    debt: z.array(modelDebtSchema),
    domains: z.array(modelDomainSchema),
  })
  .meta({ title: "domainbook book model" });

export type Model = z.infer<typeof modelSchema>;
