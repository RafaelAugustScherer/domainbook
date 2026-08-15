import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as z from "zod";
import {
  changelogSchema,
  configSchema,
  debtSchema,
  decisionSchema,
  domainSchema,
  featureSchema,
  glossarySchema,
  modelSchema,
  roadmapSchema,
} from "../dist/index.js";

const schemas = {
  changelog: changelogSchema,
  config: configSchema,
  debt: debtSchema,
  decision: decisionSchema,
  domain: domainSchema,
  feature: featureSchema,
  glossary: glossarySchema,
  model: modelSchema,
  roadmap: roadmapSchema,
};

const outDir = join(dirname(fileURLToPath(import.meta.url)), "..", "schema");
mkdirSync(outDir, { recursive: true });

for (const [name, schema] of Object.entries(schemas)) {
  const json = z.toJSONSchema(schema, { io: "input" });
  writeFileSync(
    join(outDir, `${name}.schema.json`),
    `${JSON.stringify(json, null, 2)}\n`
  );
}
