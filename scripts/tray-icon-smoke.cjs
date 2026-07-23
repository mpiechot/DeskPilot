const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { app } = require("electron");

app.whenReady().then(async () => {
  const projectRoot = path.resolve(__dirname, "..");
  const { createTrayIcon } = await import(pathToFileURL(path.join(projectRoot, "dist-electron", "main", "trayIcon.js")).href);
  const icon = createTrayIcon(projectRoot);
  const size = icon.getSize();

  if (icon.isEmpty() || size.width === 0 || size.height === 0) {
    throw new Error(`Expected a non-empty DeskPilot tray icon, received ${size.width}x${size.height}.`);
  }

  console.log(JSON.stringify({ trayIcon: "ok", width: size.width, height: size.height }));
  app.quit();
}).catch((error) => {
  console.error(error);
  app.exit(1);
});
