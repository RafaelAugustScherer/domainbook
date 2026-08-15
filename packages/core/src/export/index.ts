import type { Book } from "../model.js";
import { toCml } from "./cml.js";
import { toContextive } from "./contextive.js";
import { toGherkin } from "./gherkin.js";
import { toModelJson } from "./json.js";
import { toMermaid } from "./mermaid.js";
import { toStructurizr } from "./structurizr.js";
import {
  type Export,
  type ExportTarget,
  exportTargets,
  isTarget,
} from "./types.js";

export { exportTargets, isTarget };
export type { Export, ExportFile, ExportTarget } from "./types.js";

export function exportBook(book: Book, target: ExportTarget): Export {
  switch (target) {
    case "contextive":
      return toContextive(book);
    case "cml":
      return toCml(book);
    case "gherkin":
      return toGherkin(book);
    case "json":
      return toModelJson(book);
    case "mermaid":
      return toMermaid(book);
    case "structurizr":
      return toStructurizr(book);
  }
}
