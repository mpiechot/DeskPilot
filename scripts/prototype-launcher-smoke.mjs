import fs from "node:fs";
import path from "node:path";

const prototypeRoot = path.join(process.cwd(), "dist-prototype", "DeskPilot");
const launcherPath = path.join(prototypeRoot, "start-deskpilot.cmd");
const debugLauncherPath = path.join(prototypeRoot, "start-deskpilot-debug.cmd");
const silentLauncherPath = path.join(prototypeRoot, "start-deskpilot.vbs");
const packagePath = path.join(prototypeRoot, "package.json");
const rendererIndexPath = path.join(prototypeRoot, "dist", "index.html");
const mainProcessPath = path.join(prototypeRoot, "dist-electron", "main", "index.js");
const storageStartupFailurePath = path.join(prototypeRoot, "dist-electron", "main", "storageStartupFailure.js");

assert(fs.existsSync(launcherPath), "Expected compatibility launcher to exist");
assert(fs.existsSync(debugLauncherPath), "Expected debug launcher to exist");
assert(fs.existsSync(silentLauncherPath), "Expected no-console launcher to exist");
assert(fs.existsSync(packagePath), "Expected prototype package.json to exist");
assert(fs.existsSync(rendererIndexPath), "Expected packaged renderer index to exist");
assert(fs.existsSync(mainProcessPath), "Expected packaged Electron main process to exist");
assert(fs.existsSync(storageStartupFailurePath), "Expected packaged storage startup recovery module to exist");

const launcher = fs.readFileSync(launcherPath, "utf-8");
const debugLauncher = fs.readFileSync(debugLauncherPath, "utf-8");
const silentLauncher = fs.readFileSync(silentLauncherPath, "utf-8");
const prototypePackage = JSON.parse(fs.readFileSync(packagePath, "utf-8"));
const rendererIndex = fs.readFileSync(rendererIndexPath, "utf-8");
const mainProcess = fs.readFileSync(mainProcessPath, "utf-8");
const storageStartupFailure = fs.readFileSync(storageStartupFailurePath, "utf-8");
const categoryOpenHandlerStart = mainProcess.indexOf('ipcMain.handle("categories:open"');
const categoryOpenHandlerEnd = mainProcess.indexOf("createMainWindow()", categoryOpenHandlerStart);
const categoryOpenHandler =
  categoryOpenHandlerStart >= 0 && categoryOpenHandlerEnd > categoryOpenHandlerStart
    ? mainProcess.slice(categoryOpenHandlerStart, categoryOpenHandlerEnd)
    : "";

assert(prototypePackage.main === "dist-electron/main/index.js", "Expected prototype to point at the Electron main process");
assert(launcher.includes("electron.exe"), "Expected launcher to use the Electron executable directly");
assert(launcher.includes("start \"DeskPilot\""), "Expected launcher to detach the desktop app from the console");
assert(!launcher.includes("electron.cmd"), "Expected launcher not to use the npm Electron cmd shim");
assert(!launcher.includes("npm run dev"), "Expected launcher not to start the Vite browser dev server");
assert(!launcher.includes("5173"), "Expected launcher not to reference the Vite browser port");
assert(launcher.includes("DESKPILOT_DATA_PROFILE=development"), "Expected launcher to force the Development data profile");
assert(
  launcher.includes("DESKPILOT_DISALLOW_PRODUCTIVE_PROFILE=1"),
  "Expected launcher to forbid the Productive data profile"
);
assert(debugLauncher.includes("\"%ELECTRON_EXE%\" ."), "Expected debug launcher to run Electron in the foreground");
assert(
  debugLauncher.includes("DESKPILOT_DATA_PROFILE=development"),
  "Expected debug launcher to force the Development data profile"
);
assert(silentLauncher.includes("shell.Run"), "Expected VBS launcher to run Electron without a visible console");
assert(silentLauncher.includes(", 1, False"), "Expected VBS launcher to show the Electron desktop window");
assert(
  silentLauncher.includes("DESKPILOT_DATA_PROFILE") && silentLauncher.includes("development"),
  "Expected VBS launcher to force the Development data profile"
);
assert(
  silentLauncher.includes("DESKPILOT_DISALLOW_PRODUCTIVE_PROFILE") && silentLauncher.includes("1"),
  "Expected VBS launcher to forbid the Productive data profile"
);
assert(!rendererIndex.includes('src="/assets/'), "Expected renderer script path to be relative for Electron loadFile");
assert(!rendererIndex.includes('href="/assets/'), "Expected renderer stylesheet path to be relative for Electron loadFile");
assert(mainProcess.includes("requestSingleInstanceLock"), "Expected DeskPilot to prevent parallel app instances");
assert(mainProcess.includes("second-instance"), "Expected DeskPilot to focus the existing window when started twice");
assert(mainProcess.includes("isStorageInitialized"), "Expected DeskPilot not to create its normal window before storage initializes");
assert(
  mainProcess.includes("createStorageStartupFailurePrompt") && mainProcess.includes("dialog.showMessageBox"),
  "Expected packaged DeskPilot to show a native storage startup failure dialog"
);
assert(mainProcess.includes("shell.openPath"), "Expected storage startup failure dialog to open the affected storage folder");
assert(
  storageStartupFailure.includes("Export Active Database") && storageStartupFailure.includes("Export Rolling Backup"),
  "Expected packaged startup recovery menu to expose both read-only exports"
);
assert(
  storageStartupFailure.includes("exportStorageRecoveryFile") && mainProcess.includes("showSaveDialog"),
  "Expected packaged startup recovery exports to use explicit save destinations"
);
assert(
  categoryOpenHandler.includes("openUrlsInNewBrowserWindow"),
  "Expected Open Selected to restore saved URLs in a new browser window"
);
assert(
  categoryOpenHandler.includes("category.name"),
  "Expected Open Selected to pass the Category name to the browser window launcher"
);
assert(
  !categoryOpenHandler.includes("openExternal(tab.url)"),
  "Expected Open Selected not to open saved URLs one-by-one"
);

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
