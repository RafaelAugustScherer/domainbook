import type { Issue } from "../issue.js";
import type { Book } from "../model.js";
import { notNfc, notNfkc, orSetId, tooLong } from "./common.js";

export function checkDomainIds(book: Book): Issue[] {
  return book.domains.flatMap((domain) => {
    const folder = domain.file.slice(0, domain.file.lastIndexOf("/"));
    const onDisk = { file: folder };
    const unnamed = notNfc(onDisk, domain.id) ?? notNfkc(onDisk, domain.id);
    const id = domain.frontmatter?.id;
    if (id === undefined) return unnamed === undefined ? [] : [unnamed];
    const at = { file: domain.file, line: domain.lines["id"], field: "id" };
    const wrong = notNfc(at, id) ?? notNfkc(at, id) ?? tooLong(at, id);
    const issues = [unnamed, wrong].filter((issue) => issue !== undefined);
    if (issues.length > 0 || id === domain.id) return issues;
    return [
      {
        ...at,
        message: `"${id}" does not match the folder "${
          domain.id
        }" — rename the folder to "${id}"${orSetId(domain.id)}`,
      },
    ];
  });
}
