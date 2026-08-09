import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { payload, touched } from "./state.mjs";

const event = await payload();
const input = event?.tool_input ?? {};
const file = input.file_path ?? input.notebook_path;

if (typeof file === "string" && typeof event?.session_id === "string") {
  const at = touched(event.session_id);
  mkdirSync(dirname(at), { recursive: true });
  appendFileSync(at, `${file}\n`);
}
