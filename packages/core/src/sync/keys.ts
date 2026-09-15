export type Key = {
  key: string;
  kind: "decision" | "debt" | "feature" | "domain";
  domain: string | undefined;
  logDir: string | undefined;
  number: number | undefined;
};

const rootLog = /^(decisions|debt)\/(\d{4})-[^/]+\.md$/u;
const domainLog = /^domains\/([^/]+)\/(decisions|debt)\/(\d{4})-[^/]+\.md$/u;
const feature = /^domains\/([^/]+)\/features\/([^/]+)\.md$/u;
const page = /^domains\/([^/]+)\/index\.md$/u;

export function keyOf(path: string): Key | undefined {
  const root = rootLog.exec(path);
  if (root !== null)
    return numbered(undefined, root[1] ?? "", Number(root[2]));
  const scoped = domainLog.exec(path);
  if (scoped !== null)
    return numbered(scoped[1], scoped[2] ?? "", Number(scoped[3]));
  const one = feature.exec(path);
  if (one !== null)
    return {
      key: `domains/${one[1]}/features/${one[2]}`,
      kind: "feature",
      domain: one[1],
      logDir: undefined,
      number: undefined,
    };
  const index = page.exec(path);
  if (index !== null)
    return {
      key: `domains/${index[1]}`,
      kind: "domain",
      domain: index[1],
      logDir: undefined,
      number: undefined,
    };
  return undefined;
}

export function logDirOf(
  domain: string | undefined,
  dir: "decisions" | "debt"
): string {
  return domain === undefined ? dir : `domains/${domain}/${dir}`;
}

export function numberKey(logDir: string, number: number): string {
  return `${logDir}/${pad(number)}`;
}

export function pad(number: number): string {
  return String(number).padStart(4, "0");
}

export function refName(record: Key): string {
  const digits = record.number === undefined ? "" : pad(record.number);
  return `${record.kind === "debt" ? "TDR" : "ADR"}-${digits}`;
}

function numbered(
  domain: string | undefined,
  dir: string,
  number: number
): Key {
  const logDir = logDirOf(domain, dir === "debt" ? "debt" : "decisions");
  return {
    key: numberKey(logDir, number),
    kind: dir === "debt" ? "debt" : "decision",
    domain,
    logDir,
    number,
  };
}
