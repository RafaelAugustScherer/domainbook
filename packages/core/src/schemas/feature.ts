import * as z from "zod";
import { decisionRef, people, slug } from "./common.js";

export const featureSchema = z
  .strictObject({
    id: slug,
    name: z.string().min(1),
    status: z.enum(["draft", "ready", "implemented", "deprecated"]),
    owners: people.optional(),
    terms: z.array(slug).min(1).optional(),
    decisions: z.array(decisionRef).min(1).optional(),
  })
  .meta({ title: "domainbook feature frontmatter" });

export type Feature = z.infer<typeof featureSchema>;
