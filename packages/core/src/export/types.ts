export const exportTargets = [
  "contextive",
  "cml",
  "gherkin",
  "json",
  "mermaid",
  "structurizr",
] as const;

export type ExportTarget = (typeof exportTargets)[number];

export type ExportFile = { path: string; content: string };

export type Export = { files: ExportFile[]; notices: string[] };

export function isTarget(name: string): name is ExportTarget {
  return (exportTargets as readonly string[]).includes(name);
}

export function counted(total: number, thing: string): string {
  return `${total} ${thing}${total === 1 ? "" : "s"}`;
}
