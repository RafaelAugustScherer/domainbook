import * as z from "zod";

const entries = z.array(z.string().min(1)).min(1);

const buckets = {
  added: entries.optional(),
  changed: entries.optional(),
  deprecated: entries.optional(),
  removed: entries.optional(),
  fixed: entries.optional(),
  security: entries.optional(),
};

export const changelogReleaseSchema = z.strictObject({
  version: z.string().regex(/^[0-9A-Za-z][0-9A-Za-z.+-]*$/, {
    error: "must be a version with no spaces or brackets",
  }),
  date: z.iso.date({ error: "must be a date as YYYY-MM-DD" }),
  yanked: z.boolean().default(false),
  ...buckets,
});

export const changelogSchema = z
  .strictObject({
    unreleased: z.strictObject(buckets).optional(),
    releases: z.array(changelogReleaseSchema),
  })
  .meta({ title: "domainbook changelog" });

export type ChangelogRelease = z.infer<typeof changelogReleaseSchema>;
export type Changelog = z.infer<typeof changelogSchema>;
