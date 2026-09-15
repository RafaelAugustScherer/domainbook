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
    collaboration: z
      .strictObject({
        enabled: z.boolean().default(true).meta({
          description:
            "Whether this book shares claims and drafts through the git remote. Off, the repo works alone as before.",
        }),
        remote: z.string().min(1).default("origin").meta({
          description: "The git remote peers share.",
        }),
      })
      .prefault({}),
    site: z
      .strictObject({
        base: z
          .string()
          .min(1)
          .regex(/^\//u, {
            error:
              'must start with "/" — write "/domainbook/" for a site published under that path',
          })
          .default("/")
          .meta({
            description:
              "The path the built site is published under, starting with a slash.",
          }),
      })
      .prefault({}),
  })
  .meta({ title: "domainbook config" });

export type Config = z.infer<typeof configSchema>;
