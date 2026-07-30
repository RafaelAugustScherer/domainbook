import * as z from "zod";
import { code, people, slug } from "./common.js";

export const classificationSchema = z.strictObject({
  domain: z.enum(["core-domain", "supporting-domain", "generic"]),
  "business-model": z.enum([
    "revenue-generator",
    "engagement-creator",
    "compliance-enforcer",
  ]),
  evolution: z.enum(["genesis", "custom-built", "product", "commodity"]),
});

const symmetricRelationshipSchema = z.strictObject({
  with: slug,
  type: z.enum(["partnership", "shared-kernel", "separate-ways"]),
});

const directionMessage =
  'must be "upstream" or "downstream" — "customer-supplier" and "upstream-downstream" need a direction, and "partnership", "shared-kernel", and "separate-ways" take none';

const asymmetricRelationshipSchema = z.discriminatedUnion(
  "direction",
  [
    z.strictObject({
      with: slug,
      type: z.enum(["customer-supplier", "upstream-downstream"]),
      direction: z.literal("upstream"),
      patterns: z
        .array(z.enum(["OHS", "PL"]))
        .min(1)
        .optional(),
    }),
    z.strictObject({
      with: slug,
      type: z.enum(["customer-supplier", "upstream-downstream"]),
      direction: z.literal("downstream"),
      patterns: z
        .array(z.enum(["ACL", "CF"]))
        .min(1)
        .optional(),
    }),
  ],
  { error: directionMessage }
);

export const relationshipSchema = z.discriminatedUnion("type", [
  symmetricRelationshipSchema,
  asymmetricRelationshipSchema,
]);

export const domainSchema = z
  .strictObject({
    id: slug,
    name: z.string().min(1),
    classification: classificationSchema,
    owners: people.optional(),
    code: code.optional(),
    relationships: z.array(relationshipSchema).min(1).optional(),
  })
  .meta({ title: "domainbook domain frontmatter" });

export type Classification = z.infer<typeof classificationSchema>;
export type Relationship = z.infer<typeof relationshipSchema>;
export type Domain = z.infer<typeof domainSchema>;
