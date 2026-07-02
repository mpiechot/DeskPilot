const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { app, BrowserWindow, ipcMain } = require("electron");

runElectronSmoke().catch((error) => {
  console.error(error);
  process.exit(1);
});

async function runElectronSmoke() {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const prototypeRoot = path.join(projectRoot, "dist-prototype", "DeskPilot");
  const { defaultCategories } = await import(
    pathToFileURL(path.join(prototypeRoot, "dist-electron", "shared", "sessions.js")).href
  );

  await app.whenReady();
  console.log("Prototype renderer smoke: Electron ready");

  const smokeTabs = [];
  const categories = defaultCategories.map((category) => ({ ...category }));

  ipcMain.handle("bridge:status", () => ({ running: true, host: "127.0.0.1", port: 17383 }));
  ipcMain.handle("extension:install-info", () => ({
    extensionPath: path.join(prototypeRoot, "browser-extension"),
    manifestPath: path.join(prototypeRoot, "browser-extension", "manifest.json"),
    manifestPresent: true,
    supportedBrowsers: ["Chrome", "Edge"]
  }));
  ipcMain.handle("storage:info", () => ({
    databasePath: path.join(prototypeRoot, "smoke-deskpilot.sqlite"),
    manualBackupDirectory: path.join(prototypeRoot, "manual-backups"),
    manualBackups: []
  }));
  ipcMain.handle("categories:list", () => categories);
  ipcMain.handle("categories:deleted", () => []);
  ipcMain.handle("tabs:list", () => smokeTabs);
  ipcMain.handle("tabs:deleted", () => []);
  ipcMain.handle("tabs:add", (_event, input) => {
    const tab = {
      id: "smoke-tab",
      categoryId: input.categoryId,
      title: input.title || input.url,
      url: input.url
    };
    smokeTabs.splice(0, smokeTabs.length, tab);
    categories[0] = {
      ...categories[0],
      status: "ready",
      tabCount: 1,
      lastSavedLabel: "Just now"
    };

    return {
      categories,
      tabs: smokeTabs
    };
  });

  const window = new BrowserWindow({
    width: 1180,
    height: 720,
    show: false,
    webPreferences: {
      preload: path.join(prototypeRoot, "dist-electron", "preload", "index.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  window.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedUrl) => {
    console.error(`Prototype renderer smoke: failed to load ${validatedUrl}: ${errorCode} ${errorDescription}`);
  });

  await window.loadFile(path.join(prototypeRoot, "dist", "index.html"));
  console.log("Prototype renderer smoke: renderer loaded");

  const result = await window.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const getRenderedText = () => document.body.textContent;
      const waitForText = (needle, callback, attempts = 80) => {
        if (getRenderedText().includes(needle)) {
          callback();
          return;
        }

        if (attempts === 0) {
          resolve({
            hasDeskPilotApi: Boolean(window.deskPilot),
            bodyText: getRenderedText()
          });
          return;
        }

        setTimeout(() => waitForText(needle, callback, attempts - 1), 25);
      };

      waitForText("Local SQLite storage is active.", () => {
        const urlInput = document.querySelector('input[aria-label="URL to save"]');
        const saveButton = Array.from(document.querySelectorAll("button")).find((button) =>
          button.textContent.includes("Save URL")
        );
        const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
        const previousValue = urlInput.value;

        valueSetter.call(urlInput, "https://example.com");
        if (urlInput._valueTracker) {
          urlInput._valueTracker.setValue(previousValue);
        }
        urlInput.dispatchEvent(new Event("input", { bubbles: true }));
        urlInput.dispatchEvent(new Event("change", { bubbles: true }));
        saveButton.click();

        setTimeout(() => {
          resolve({
            hasDeskPilotApi: Boolean(window.deskPilot),
            bodyText: getRenderedText()
          });
        }, 200);
      });
    })
  `);

  assert(result.hasDeskPilotApi, "Expected packaged renderer to receive the Electron preload API");
  assert(
    !result.bodyText.includes("Saving URLs requires the Electron app."),
    "Expected Save URL not to report a missing Electron app"
  );
  if (!result.bodyText.includes("Saved URL to Work.")) {
    console.error(result.bodyText);
  }
  assert(result.bodyText.includes("Saved URL to Work."), "Expected Save URL to use the Electron preload API");

  window.destroy();
  app.quit();

  console.log(
    JSON.stringify(
      {
        renderer: "dist/index.html",
        preloadApi: result.hasDeskPilotApi,
        saveUrl: "ok"
      },
      null,
      2
    )
  );

  process.exit(0);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
