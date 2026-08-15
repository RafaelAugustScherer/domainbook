import { contextMap } from "../map.js";
import { mermaidSource } from "../mermaid.js";
import type { Book } from "../model.js";
import { tally } from "./context-map.js";
import type { Export } from "./types.js";

export function toMermaid(book: Book): Export {
  const map = contextMap(book);
  return {
    files: [{ path: "context-map.mmd", content: `${mermaidSource(map)}\n` }],
    notices: [tally(map)],
  };
}
