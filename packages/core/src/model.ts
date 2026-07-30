import type { ParsedRule } from "./body/feature.js";
import type { Changelog } from "./schemas/changelog.js";
import { slugSource } from "./schemas/common.js";
import type { Config } from "./schemas/config.js";
import type { Decision } from "./schemas/decision.js";
import type { Domain } from "./schemas/domain.js";
import type { Feature } from "./schemas/feature.js";
import type { GlossaryTerm } from "./schemas/glossary.js";
import type { Roadmap } from "./schemas/roadmap.js";

export type FieldLines = Record<string, number>;

export type TermRecord = GlossaryTerm & { slug: string; line: number };

export type GlossaryRecord = { file: string; terms: TermRecord[] };

export type ChangelogRecord = { file: string; changelog: Changelog };

export type RoadmapRecord = {
  file: string;
  frontmatter: Roadmap;
  lines: FieldLines;
};

export type DecisionFile = { file: string; number: number };

export type DecisionRecord = {
  file: string;
  number: number;
  title: string;
  domain?: string;
  frontmatter: Decision;
  lines: FieldLines;
};

export type FeatureRecord = {
  file: string;
  domain: string;
  frontmatter: Feature;
  story: string;
  rules: ParsedRule[];
  lines: FieldLines;
};

export type DomainRecord = {
  id: string;
  file: string;
  frontmatter?: Domain;
  lines: FieldLines;
  glossary?: GlossaryRecord;
  changelog?: ChangelogRecord;
  features: FeatureRecord[];
  decisions: DecisionRecord[];
  decisionFiles: DecisionFile[];
};

export type Book = {
  root: string;
  config: Config;
  roadmap?: RoadmapRecord;
  glossary?: GlossaryRecord;
  changelog?: ChangelogRecord;
  decisions: DecisionRecord[];
  decisionFiles: DecisionFile[];
  domains: DomainRecord[];
};

const slugs = new RegExp(slugSource, "gu");

export function termSlug(name: string): string {
  return (name.normalize("NFC").toLowerCase().match(slugs) ?? []).join("-");
}
