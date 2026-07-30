import type { Issue } from "../issue.js";
import type { Book } from "../model.js";
import { notNfc, notNfkc, tooLong } from "./common.js";

export function checkMilestones(book: Book): Issue[] {
  const roadmap = book.roadmap;
  if (roadmap === undefined) return [];
  const issues: Issue[] = [];
  const head = { file: roadmap.file, line: roadmap.lines["id"], field: "id" };
  const id = roadmap.frontmatter.id;
  const named = notNfc(head, id) ?? notNfkc(head, id) ?? tooLong(head, id);
  if (named !== undefined) issues.push(named);
  const seen = new Map<string, number>();
  for (const [index, milestone] of roadmap.frontmatter.milestones.entries()) {
    const field = `milestones[${index}].id`;
    const at = { file: roadmap.file, line: roadmap.lines[field], field };
    const wrong =
      notNfc(at, milestone.id) ??
      notNfkc(at, milestone.id) ??
      tooLong(at, milestone.id);
    if (wrong !== undefined) {
      issues.push(wrong);
      continue;
    }
    const first = seen.get(milestone.id);
    if (first === undefined) {
      seen.set(milestone.id, index);
      continue;
    }
    issues.push({
      ...at,
      message: `"${milestone.id}" is already milestones[${first}].id — milestone ids are unique`,
    });
  }
  return issues;
}
