import { checkDebt } from "./check/debt.js";
import { checkDomainIds } from "./check/domain.js";
import { checkFeatures } from "./check/feature.js";
import { checkGlobs } from "./check/glob.js";
import { checkLogs } from "./check/log.js";
import { checkMilestones } from "./check/milestone.js";
import { checkRelationships } from "./check/relationship.js";
import { checkTerms } from "./check/term.js";
import type { Issue } from "./issue.js";
import type { Book } from "./model.js";

export function checkBook(book: Book): Issue[] {
  return [
    ...checkRelationships(book),
    ...checkFeatures(book),
    ...checkTerms(book),
    ...checkLogs(book),
    ...checkDebt(book),
    ...checkGlobs(book),
    ...checkDomainIds(book),
    ...checkMilestones(book),
  ];
}
