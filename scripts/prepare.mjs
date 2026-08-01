import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const bin = fileURLToPath(
  new URL("../packages/cli/dist/bin.js", import.meta.url)
);

const skipped = why();
if (skipped === undefined) install();
else say(skipped);

function why() {
  if (process.env.CI !== undefined)
    return "this is CI, and the action on the pull request runs the check here — no commit hook installed";
  if (!existsSync(new URL("../.git", import.meta.url)))
    return "there is no git repo here, so there is no commit hook to install";
  return undefined;
}

function install() {
  try {
    if (!existsSync(bin)) run("npm", ["run", "build"]);
    run(process.execPath, [bin, "hooks", "install"]);
  } catch {
    say(
      'the commit hook was not installed — run "npm run build && node packages/cli/dist/bin.js hooks install" to see why'
    );
  }
}

function run(command, args) {
  execFileSync(command, args, { cwd: root, stdio: "inherit" });
}

function say(line) {
  process.stdout.write(`domainbook: ${line}\n`);
}
