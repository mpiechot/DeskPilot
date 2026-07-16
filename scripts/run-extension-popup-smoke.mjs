import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const projectRoot = process.cwd();
const electronExecutable = path.join(projectRoot, "node_modules", "electron", "dist", "electron.exe");
const smokeApp = path.join(projectRoot, "scripts", "extension-popup-smoke-app");
const resultPath = path.join(os.tmpdir(), `deskpilot-extension-popup-smoke-${process.pid}.json`);

try {
  const result = spawnSync(electronExecutable, [smokeApp], {
    cwd: projectRoot,
    encoding: "utf-8",
    env: {
      ...process.env,
      DESKPILOT_EXTENSION_SMOKE_RESULT_PATH: resultPath
    }
  });

  if (result.status !== 0) {
    throw new Error(
      `Extension popup smoke failed with exit code ${result.status}.\n${result.error?.message || result.stderr || result.stdout}`
    );
  }

  if (!fs.existsSync(resultPath)) {
    throw new Error("Extension popup smoke exited without producing a verified result.");
  }

  const verifiedResult = JSON.parse(fs.readFileSync(resultPath, "utf-8"));
  console.log(JSON.stringify(verifiedResult, null, 2));
} finally {
  fs.rmSync(resultPath, { force: true });
}
