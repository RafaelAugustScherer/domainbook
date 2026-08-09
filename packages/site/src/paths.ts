export function pad(number: number): string {
  return String(number).padStart(4, "0");
}

export function folderOf(file: string): string {
  return file.slice(0, file.lastIndexOf("/"));
}

export function domainPath(id: string): string {
  return `/domains/${encodeURIComponent(id)}/`;
}

export function featurePath(domain: string, id: string): string {
  return `${domainPath(domain)}features/${encodeURIComponent(id)}/`;
}

export function decisionPath(
  domain: string | undefined,
  number: number
): string {
  const at = domain === undefined ? "/" : domainPath(domain);
  return `${at}decisions/${pad(number)}/`;
}

export function debtPath(domain: string | undefined, number: number): string {
  const at = domain === undefined ? "/" : domainPath(domain);
  return `${at}debt/${pad(number)}/`;
}

export function termPath(domain: string | undefined, slug: string): string {
  const at = domain === undefined ? "/" : domainPath(domain);
  return `${at}glossary/${encodeURIComponent(slug)}/`;
}

export function changelogPath(domain: string | undefined): string {
  return `${domain === undefined ? "/" : domainPath(domain)}changelog/`;
}

export function glossaryPath(domain: string | undefined): string {
  return `${domain === undefined ? "/" : domainPath(domain)}glossary/`;
}
