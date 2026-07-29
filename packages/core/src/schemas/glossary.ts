import * as z from "zod";

export const glossaryTermSchema = z.strictObject({
  name: z.string().min(1),
  definition: z.string().min(1),
  aliases: z.array(z.string().min(1)).min(1).optional(),
  examples: z.array(z.string().min(1)).min(1).optional(),
  status: z.enum(["draft", "validated", "deprecated"]).default("draft"),
});

export const glossarySchema = z
  .strictObject({
    terms: z.array(glossaryTermSchema).min(1),
  })
  .meta({ title: "domainbook glossary" });

export type GlossaryTerm = z.infer<typeof glossaryTermSchema>;
export type Glossary = z.infer<typeof glossarySchema>;
