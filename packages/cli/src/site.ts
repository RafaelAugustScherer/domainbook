export function broke(thrown: unknown): string {
  const message = thrown instanceof Error ? thrown.message : String(thrown);
  const notFound =
    (thrown as { code?: string }).code === "ERR_MODULE_NOT_FOUND";
  if (notFound && message.includes("@domainbook/site"))
    return `the website is not installed — the CLI ships without it; run "npm i -g domainbook @domainbook/site" (or add both to this project), then try again`;
  if (notFound)
    return `the site could not be built here — ${
      message.split("\n")[0]
    }; run this from the repo domainbook is installed in, so its dependencies can be found`;
  return `the site could not be built — ${message.split("\n")[0]}`;
}
