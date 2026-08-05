import { formatIssue, sortIssues, type Issue } from "@domainbook/core";

export function under(issues: Issue[], folder: string): string[] {
  return sortIssues(
    issues.filter(
      (one) => one.file === folder || one.file.startsWith(`${folder}/`)
    )
  ).map((one) => formatIssue(one));
}
