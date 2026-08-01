import { serveStdio } from "@modelcontextprotocol/server/stdio";
import { createServer } from "./server.js";

export { createServer } from "./server.js";

export function serve(root: string, version: string): void {
  serveStdio(() => createServer(root, version));
}
