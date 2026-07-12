import fs from "node:fs";
import path from "node:path";

const productiveRoot = path.join(process.cwd(), "dist-productive", "DeskPilot Productive");
const launcherPath = path.join(productiveRoot, "start-deskpilot-productive.cmd");
const debugLauncherPath = path.join(productiveRoot, "start-deskpilot-productive-debug.cmd");
const silentLauncherPath = path.join(productiveRoot, "start-deskpilot-productive.vbs");
const packagePath = path.join(productiveRoot, "package.json");

assert(fs.existsSync(launcherPath), "Expected Productive compatibility launcher to exist");
assert(fs.existsSync(debugLauncherPath), "Expected Productive debug launcher to exist");
assert(fs.existsSync(silentLauncherPath), "Expected Productive no-console launcher to exist");
assert(fs.existsSync(packagePath), "Expected Productive package.json to exist");

const launcher = fs.readFileSync(launcherPath, "utf-8");
const debugLauncher = fs.readFileSync(debugLauncherPath, "utf-8");
const silentLauncher = fs.readFileSync(silentLauncherPath, "utf-8");
const productivePackage = JSON.parse(fs.readFileSync(packagePath, "utf-8"));

assert(productivePackage.name === "deskpilot-productive", "Expected package to be clearly identified as Productive");
assert(launcher.includes("start \"DeskPilot Productive\""), "Expected launcher to use a Productive window label");
assert(launcher.includes("DESKPILOT_DATA_PROFILE=productive"), "Expected launcher to force the Productive data profile");
assert(
  launcher.includes("DESKPILOT_DISALLOW_PRODUCTIVE_PROFILE=0"),
  "Expected launcher to clear the development-only profile guard"
);
assert(debugLauncher.includes("DESKPILOT_DATA_PROFILE=productive"), "Expected debug launcher to force Productive");
assert(silentLauncher.includes("DESKPILOT_DATA_PROFILE") && silentLauncher.includes("productive"), "Expected VBS launcher to force Productive");
assert(
  silentLauncher.includes("DESKPILOT_DISALLOW_PRODUCTIVE_PROFILE") && silentLauncher.includes("0"),
  "Expected VBS launcher to clear the development-only profile guard"
);
assert(silentLauncher.includes("shell.Run"), "Expected Productive VBS launcher to start without a console");
assert(!launcher.includes("npm run dev"), "Expected Productive launcher not to start development tooling");
assert(!launcher.includes("5173"), "Expected Productive launcher not to reference the Vite development server");

console.log(
  JSON.stringify(
    {
      launcher: path.relative(process.cwd(), launcherPath),
      debugLauncher: path.relative(process.cwd(), debugLauncherPath),
      silentLauncher: path.relative(process.cwd(), silentLauncherPath),
      profile: "productive"
    },
    null,
    2
  )
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
