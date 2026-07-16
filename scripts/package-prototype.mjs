import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const dataProfile = process.argv[2] ?? "development";
const isProductive = dataProfile === "productive";

if (!isProductive && dataProfile !== "development") {
  throw new Error(`Unknown DeskPilot package profile: ${dataProfile}`);
}

const packageLabel = isProductive ? "Productive" : "prototype";
const prototypeRoot = isProductive
  ? path.join(projectRoot, "dist-productive", "DeskPilot Productive")
  : path.join(projectRoot, "dist-prototype", "DeskPilot");
const launcherBaseName = isProductive ? "start-deskpilot-productive" : "start-deskpilot";
const launcherTitle = isProductive ? "DeskPilot Productive" : "DeskPilot";
const productiveGuard = isProductive ? "0" : "1";
const electronRuntimeDirectory = path.join(projectRoot, "node_modules", "electron", "dist");
const electronExecutable = path.join(projectRoot, "node_modules", "electron", "dist", "electron.exe");
const commandElectronExecutable = isProductive ? "%APP_DIR%runtime\\electron.exe" : electronExecutable;
const runtimeRecoveryMessage = isProductive
  ? "Rebuild or reinstall the DeskPilot Productive package."
  : "Run npm install in the DeskPilot repository, then package the prototype again.";
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8"));

assertInsideProject(prototypeRoot);

for (const requiredPath of [
  "dist",
  "dist-electron",
  "browser-extension",
  path.join("node_modules", "sql.js"),
  path.join("node_modules", "electron", "dist", "electron.exe")
]) {
  const absolutePath = path.join(projectRoot, requiredPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Cannot package DeskPilot ${packageLabel}. Missing ${requiredPath}. Run npm install and npm run build first.`);
  }
}

fs.rmSync(prototypeRoot, { recursive: true, force: true });
fs.mkdirSync(prototypeRoot, { recursive: true });
fs.mkdirSync(path.join(prototypeRoot, "node_modules"), { recursive: true });

copyDirectory("dist", "dist");
copyDirectory("dist-electron", "dist-electron");
copyDirectory("browser-extension", "browser-extension");
copyDirectory(path.join("node_modules", "sql.js"), path.join("node_modules", "sql.js"));

if (isProductive) {
  fs.cpSync(electronRuntimeDirectory, path.join(prototypeRoot, "runtime"), {
    recursive: true,
    force: true
  });
}

fs.writeFileSync(
  path.join(prototypeRoot, "package.json"),
  JSON.stringify(
    {
      name: isProductive ? "deskpilot-productive" : "deskpilot-prototype",
      version: packageJson.version,
      private: true,
      type: "module",
      main: "dist-electron/main/index.js"
    },
    null,
    2
  )
);

fs.writeFileSync(
  path.join(prototypeRoot, `${launcherBaseName}.cmd`),
  [
    "@echo off",
    "setlocal",
    "set \"APP_DIR=%~dp0\"",
    `set "ELECTRON_EXE=${commandElectronExecutable}"`,
    "if not exist \"%ELECTRON_EXE%\" (",
    "  echo DeskPilot could not find the Electron runtime.",
    "  echo Expected: %ELECTRON_EXE%",
    `  echo ${runtimeRecoveryMessage}`,
    "  pause",
    "  exit /b 1",
    ")",
    "pushd \"%APP_DIR%\" || exit /b 1",
    `set "DESKPILOT_DATA_PROFILE=${dataProfile}"`,
    `set "DESKPILOT_DISALLOW_PRODUCTIVE_PROFILE=${productiveGuard}"`,
    `start "${launcherTitle}" "%ELECTRON_EXE%" .`,
    "set EXIT_CODE=%ERRORLEVEL%",
    "popd",
    "exit /b %EXIT_CODE%",
    ""
  ].join("\r\n")
);

fs.writeFileSync(
  path.join(prototypeRoot, `${launcherBaseName}-debug.cmd`),
  [
    "@echo off",
    "setlocal",
    "set \"APP_DIR=%~dp0\"",
    `set "ELECTRON_EXE=${commandElectronExecutable}"`,
    "if not exist \"%ELECTRON_EXE%\" (",
    "  echo DeskPilot could not find the Electron runtime.",
    "  echo Expected: %ELECTRON_EXE%",
    `  echo ${runtimeRecoveryMessage}`,
    "  pause",
    "  exit /b 1",
    ")",
    "pushd \"%APP_DIR%\" || exit /b 1",
    `set "DESKPILOT_DATA_PROFILE=${dataProfile}"`,
    `set "DESKPILOT_DISALLOW_PRODUCTIVE_PROFILE=${productiveGuard}"`,
    "\"%ELECTRON_EXE%\" .",
    "set EXIT_CODE=%ERRORLEVEL%",
    "popd",
    "exit /b %EXIT_CODE%",
    ""
  ].join("\r\n")
);

fs.writeFileSync(
  path.join(prototypeRoot, `${launcherBaseName}.vbs`),
  [
    "Set shell = CreateObject(\"WScript.Shell\")",
    "Set fso = CreateObject(\"Scripting.FileSystemObject\")",
    "appDir = fso.GetParentFolderName(WScript.ScriptFullName)",
    isProductive
      ? "electronExe = fso.BuildPath(appDir, \"runtime\\electron.exe\")"
      : `electronExe = "${electronExecutable}"`,
    "If Not fso.FileExists(electronExe) Then",
    `  MsgBox "DeskPilot could not find the Electron runtime. ${runtimeRecoveryMessage}", 16, "DeskPilot"`,
    "  WScript.Quit 1",
    "End If",
    `shell.Environment("PROCESS")("DESKPILOT_DATA_PROFILE") = "${dataProfile}"`,
    `shell.Environment("PROCESS")("DESKPILOT_DISALLOW_PRODUCTIVE_PROFILE") = "${productiveGuard}"`,
    "shell.CurrentDirectory = appDir",
    "shell.Run Chr(34) & electronExe & Chr(34) & \" .\", 1, False",
    ""
  ].join("\r\n")
);

fs.writeFileSync(
  path.join(prototypeRoot, "README.txt"),
  [
    isProductive ? "DeskPilot Productive launcher" : "DeskPilot local prototype",
    "",
    "Start:",
    `- Double-click ${launcherBaseName}.vbs for the desktop app without a console window.`,
    `- If that fails, run ${launcherBaseName}-debug.cmd to keep a diagnostic console open.`,
    `- ${launcherBaseName}.cmd is a compatibility launcher that starts Electron and exits immediately.`,
    "",
    "Browser extension prototype:",
    "- Load the browser-extension folder from this prototype directory as an unpacked Chrome or Edge extension.",
    "- The local bridge URL is for the extension only; it is not the DeskPilot app UI.",
    "",
    "Limitations:",
    isProductive
      ? "- This is the explicit local Productive launcher, not a signed installer."
      : "- This is a local development prototype, not a signed installer.",
    isProductive
      ? "- It contains its own Electron runtime and can be moved outside the repository."
      : "- It uses the repository's installed Electron runtime.",
    isProductive
      ? "- It always starts in the Productive data profile. Treat the stored sessions as real user data."
      : "- It starts in the Development data profile and cannot touch Productive data."
  ].join("\r\n")
);

console.log(`Created DeskPilot ${packageLabel} at ${prototypeRoot}`);

function copyDirectory(from, to) {
  fs.cpSync(path.join(projectRoot, from), path.join(prototypeRoot, to), {
    recursive: true,
    force: true
  });
}

function assertInsideProject(targetPath) {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedProjectRoot = path.resolve(projectRoot);

  if (!resolvedTarget.startsWith(`${resolvedProjectRoot}${path.sep}`)) {
    throw new Error("Refusing to write prototype outside the project directory.");
  }
}
