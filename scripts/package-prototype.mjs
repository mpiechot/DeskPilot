import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const prototypeRoot = path.join(projectRoot, "dist-prototype", "DeskPilot");
const electronCommand = path.join(projectRoot, "node_modules", ".bin", "electron.cmd");
const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf-8"));

assertInsideProject(prototypeRoot);

for (const requiredPath of ["dist", "dist-electron", "browser-extension", path.join("node_modules", "sql.js")]) {
  const absolutePath = path.join(projectRoot, requiredPath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Cannot package prototype. Missing ${requiredPath}. Run npm install and npm run build first.`);
  }
}

fs.rmSync(prototypeRoot, { recursive: true, force: true });
fs.mkdirSync(prototypeRoot, { recursive: true });
fs.mkdirSync(path.join(prototypeRoot, "node_modules"), { recursive: true });

copyDirectory("dist", "dist");
copyDirectory("dist-electron", "dist-electron");
copyDirectory("browser-extension", "browser-extension");
copyDirectory(path.join("node_modules", "sql.js"), path.join("node_modules", "sql.js"));

fs.writeFileSync(
  path.join(prototypeRoot, "package.json"),
  JSON.stringify(
    {
      name: "deskpilot-prototype",
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
  path.join(prototypeRoot, "start-deskpilot.cmd"),
  [
    "@echo off",
    "setlocal",
    "cd /d \"%~dp0\"",
    `"${electronCommand}" "%~dp0"`,
    ""
  ].join("\r\n")
);

fs.writeFileSync(
  path.join(prototypeRoot, "README.txt"),
  [
    "DeskPilot local prototype",
    "",
    "Start:",
    "- Double-click start-deskpilot.cmd",
    "",
    "Browser extension prototype:",
    "- Load the browser-extension folder from this prototype directory as an unpacked Chrome or Edge extension.",
    "",
    "Limitations:",
    "- This is a local development prototype, not a signed installer.",
    "- It uses the repository's installed Electron runtime.",
    "- User data remains in Electron's DeskPilot user-data folder."
  ].join("\r\n")
);

console.log(`Created DeskPilot prototype at ${prototypeRoot}`);

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
