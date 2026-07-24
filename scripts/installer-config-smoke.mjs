import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8"));
const signedScriptPath = path.join(projectRoot, "scripts", "package-windows-signed.ps1");
const installerPath = path.join(projectRoot, "dist-installer", `DeskPilot-Setup-${packageJson.version}.exe`);
const unpackedExecutablePath = path.join(projectRoot, "dist-installer", "win-unpacked", "DeskPilot.exe");
const packagedMainPath = path.join(projectRoot, "dist-electron", "main", "index.js");

assert(packageJson.engines?.node === ">=22.12.0", "Expected installer tooling to declare its supported Node runtime");
assert(packageJson.scripts?.["package:windows"]?.includes("electron-builder --win nsis"), "Expected an NSIS installer command");
assert(packageJson.scripts?.["package:windows:signed"]?.includes("package-windows-signed.ps1"), "Expected a guarded signing command");
assert(packageJson.build?.win?.target === "nsis", "Expected Windows installer target to be NSIS");
assert(packageJson.build?.win?.icon === "assets/deskpilot.ico", "Expected the Windows installer to use the DeskPilot icon");
assert(packageJson.build?.directories?.output === "dist-installer", "Expected installer output to stay isolated");
assert(packageJson.build?.npmRebuild === false, "Expected installer not to rebuild absent native dependencies");
const windowsIconPath = path.join(projectRoot, "assets", "deskpilot.ico");
assert(fs.existsSync(windowsIconPath), "Expected the DeskPilot Windows icon asset to exist");
const windowsIconHeader = fs.readFileSync(windowsIconPath).subarray(0, 4);
assert(windowsIconHeader.equals(Buffer.from([0, 0, 1, 0])), "Expected the DeskPilot Windows icon asset to be a valid ICO file");
assert(fs.existsSync(signedScriptPath), "Expected signing guard script to exist");

const signedScript = fs.readFileSync(signedScriptPath, "utf-8");
assert(signedScript.includes("CSC_LINK"), "Expected signed packaging to require a certificate source");
assert(signedScript.includes("CSC_KEY_PASSWORD"), "Expected signed packaging to require the certificate password");
assert(signedScript.includes("exit 1"), "Expected signed packaging to fail closed without credentials");

if (fs.existsSync(installerPath)) {
  assert(fs.statSync(installerPath).size > 1_000_000, "Expected generated installer to contain the application payload");
  assert(fs.existsSync(unpackedExecutablePath), "Expected installer build to produce an unpacked executable for smoke inspection");
}

if (fs.existsSync(packagedMainPath)) {
  const packagedMain = fs.readFileSync(packagedMainPath, "utf-8");
  assert(packagedMain.includes("app.isPackaged") && packagedMain.includes('profile: "productive"'), "Expected installed app to default to Productive data");
}

console.log(JSON.stringify({ target: "nsis", output: packageJson.build.directories.output, signing: "guarded" }, null, 2));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
