import { payload } from "./state.mjs";

const bypass = /(?:^|[\n;&|])[ \t]*(?:(?:export|env)[ \t]+)?SKIP_DOCS=/;
const unmark = /-u\s+CLAUDECODE\b|unset\s+CLAUDECODE\b/;

const denials = [
  {
    matches: bypass,
    reason:
      'SKIP_DOCS=1 waives without a reason and is for a person at a terminal — write the reason in a "Skip-Docs: <reason>" trailer on this commit instead',
  },
  {
    matches: unmark,
    reason:
      'unsetting CLAUDECODE makes this shell look like a person\'s, and the waiver rules differ — write the reason in a "Skip-Docs: <reason>" trailer on this commit instead',
  },
];

const event = await payload();
const command = event?.tool_input?.command;
const denied =
  typeof command === "string"
    ? denials.find((one) => one.matches.test(command))
    : undefined;

if (denied !== undefined)
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: denied.reason,
      },
    })
  );
