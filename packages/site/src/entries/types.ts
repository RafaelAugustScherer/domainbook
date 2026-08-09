import type { Issue } from "@domainbook/core";

export type Render = (markdown: string) => Promise<string>;

export type Entry = { id: string; data: Record<string, unknown> };

export type Loaded = { issues: Issue[] };
