export type Numbered = {
  kind: "decision" | "debt";
  key: string;
  domain: string | undefined;
  logDir: string;
  number: number;
};

export type Named = { kind: "feature" | "domain"; key: string; domain: string };

export type Key = Numbered | Named;

export function isNumbered(key: Key): key is Numbered {
  return key.kind === "decision" || key.kind === "debt";
}

const rootLog = /^(decisions|debt)\/(\d{4})-[^/]+\.md$/u;
const domainLog = /^domains\/([^/]+)\/(decisions|debt)\/(\d{4})-[^/]+\.md$/u;
const feature = /^domains\/([^/]+)\/features\/([^/]+)\.md$/u;
const page = /^domains\/([^/]+)\/index\.md$/u;

const numberedRef = /^((?:domains\/([^/]+)\/)?(decisions|debt))\/(\d{4})$/u;
const featureRef = /^domains\/([^/]+)\/features\/([^/]+)$/u;
const domainRef = /^domains\/([^/]+)$/u;

export function keyOf(path: string): Key | undefined {
  const root = rootLog.exec(path);
  if (root !== null) return numbered(undefined, root[1] ?? "", Number(root[2]));
  const scoped = domainLog.exec(path);
  if (scoped !== null)
    return numbered(scoped[1], scoped[2] ?? "", Number(scoped[3]));
  const one = feature.exec(path);
  if (one !== null)
    return {
      kind: "feature",
      key: `domains/${one[1]}/features/${one[2]}`,
      domain: one[1] ?? "",
    };
  const index = page.exec(path);
  if (index !== null)
    return { kind: "domain", key: `domains/${index[1]}`, domain: index[1] ?? "" };
  return undefined;
}

export function parseKey(key: string): Key | undefined {
  const num = numberedRef.exec(key);
  if (num !== null)
    return {
      kind: num[3] === "debt" ? "debt" : "decision",
      key,
      domain: num[2],
      logDir: num[1] ?? "",
      number: Number(num[4]),
    };
  const feat = featureRef.exec(key);
  if (feat !== null) return { kind: "feature", key, domain: feat[1] ?? "" };
  const dom = domainRef.exec(key);
  if (dom !== null) return { kind: "domain", key, domain: dom[1] ?? "" };
  return undefined;
}

export function pathOf(key: Named): string {
  return key.kind === "feature" ? `${key.key}.md` : `${key.key}/index.md`;
}

export function isDomainKey(key: string): boolean {
  return (
    key.startsWith("domains/") && !key.slice("domains/".length).includes("/")
  );
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

function numbered(
  domain: string | undefined,
  dir: string,
  number: number
): Numbered {
  const logDir = logDirOf(domain, dir === "debt" ? "debt" : "decisions");
  return {
    kind: dir === "debt" ? "debt" : "decision",
    key: numberKey(logDir, number),
    domain,
    logDir,
    number,
  };
}
