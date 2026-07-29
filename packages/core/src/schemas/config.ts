import * as z from "zod";

export const configSchema = z
  .strictObject({
    enforcement: z
      .strictObject({
        mode: z.enum(["block", "warn"]).default("block"),
        trailer: z.string().min(1).default("Skip-Docs"),
        require_reason: z.enum(["agents", "always"]).default("agents"),
      })
      .prefault({}),
  })
  .meta({ title: "domainbook config" });

export type Config = z.infer<typeof configSchema>;
