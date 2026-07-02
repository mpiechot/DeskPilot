import fs from "node:fs";
import path from "node:path";

const prototypeRoot = path.join(process.cwd(), "dist-prototype", "DeskPilot");
const launcherPath = path.join(prototypeRoot, "start-deskpilot.cmd");
const debugLauncherPath = path.join(prototypeRoot, "start-deskpilot-debug.cmd");
const silentLauncherPath = path.join(prototypeRoot, "start-deskpilot.vbs");
const packagePath = path.join(prototypeRoot, "package.json");
const rendererIndexPath = path.join(prototypeRoot, "dist", "index.html");

assert(fs.existsSync(launcherPath), "Expected compatibility launcher to exist");
assert(fs.existsSync(debugLauncherPath), "Expected debug launcher to exist");
assert(fs.existsSync(silentLauncherPath), "Expected no-console launcher to exist");
assert(fs.existsSync(packagePath), "Expected prototype package.json to exist");
assert(fs.existsSync(rendererIndexPath), "Expected packaged renderer index to exist");

const launcher = fs.readFileSync(launcherPath, "utf-8");
const debugLauncher = fs.readFileSync(debugLauncherPath, "utf-8");
const silentLauncher = fs.readFileSync(silentLauncherPath, "utf-8");
const prototypePackage = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
const rendererIndex = fs.readFileSync(rendererIndexPath, "utf-8");

assert(prototypePackage.main === "dist-electron/main/index.js", "Expected prototype to point at the Electron main process");
assert(launcher.includes("electron.exe"), "Expected launcher to use the Electron executable directly");
assert(launcher.includes("start \"DeskPilot\""), "Expected launcher to detach the desktop app from the console");
assert(!launcher.includes("electron.cmd"), "Expected launcher not to use the npm Electron cmd shim");
assert(!launcher.includes("npm run dev"), "Expected launcher not to start the Vite browser dev server");
assert(!launcher.includes("5173"), "Expected launcher not to reference the Vite browser port");
assert(debugLauncher.includes("\"%ELECTRON_EXE%\" ."), "Expected debug launcher to run Electron in the foreground");
assert(silentLauncher.includes("shell.Run"), "Expected VBS launcher to run Electron without a visible console");
assert(silentLauncher.includes(", 1, False"), "Expected VBS launcher to show the Electron desktop window");
assert(!rendererIndex.includes('src="/assets/'), "Expected renderer script path to be relative for Electron loadFile");
assert(!rendererIndex.includes('href="/assets/'), "Expected renderer stylesheet path to be relative for Electron loadFile");

console.log(
  JSON.stringify(
    {
      launcher: path.relative(process.cwd(), launcherPath),
      debugLauncher: path.relative(process.cwd(), debugLauncherPath),
      silentLauncher: path.relative(process.cwd(), silentLauncherPath),
      main: prototypePackage.main
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
