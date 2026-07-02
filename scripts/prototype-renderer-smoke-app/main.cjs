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

  const tabsByCategory = new Map();
  const categories = defaultCategories.map((category) => ({ ...category }));

  function getActiveTabs(categoryId) {
    return tabsByCategory.get(categoryId) ?? [];
  }

  function setActiveTabs(categoryId, tabs) {
    tabsByCategory.set(categoryId, tabs);
    const categoryIndex = categories.findIndex((category) => category.id === categoryId);

    if (categoryIndex >= 0) {
      categories[categoryIndex] = {
        ...categories[categoryIndex],
        status: tabs.length > 0 ? "ready" : "empty",
        tabCount: tabs.length,
        lastSavedLabel: tabs.length > 0 ? "Just now" : "Not saved yet"
      };
    }
  }

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
  ipcMain.handle("tabs:list", (_event, categoryId) => getActiveTabs(categoryId));
  ipcMain.handle("tabs:deleted", () => []);
  ipcMain.handle("tabs:add", (_event, input) => {
    const tab = {
      id: `smoke-tab-${input.categoryId}-${Date.now()}`,
      categoryId: input.categoryId,
      title: input.title || input.url,
      url: input.url
    };
    const nextTabs = [...getActiveTabs(input.categoryId), tab];
    setActiveTabs(input.categoryId, nextTabs);

    return {
      categories,
      tabs: nextTabs
    };
  });
  ipcMain.handle("tabs:delete", (_event, id) => {
    let affectedCategoryId = "";

    for (const [categoryId, tabs] of tabsByCategory.entries()) {
      if (tabs.some((tab) => tab.id === id)) {
        affectedCategoryId = categoryId;
        setActiveTabs(
          categoryId,
          tabs.filter((tab) => tab.id !== id)
        );
        break;
      }
    }

    return {
      categories,
      tabs: affectedCategoryId ? getActiveTabs(affectedCategoryId) : []
    };
  });

  const window = new BrowserWindow({
    width: 1180,
    height: 390,
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

      const setInputValue = (input, value) => {
        const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
        const previousValue = input.value;

        valueSetter.call(input, value);
        if (input._valueTracker) {
          input._valueTracker.setValue(previousValue);
        }
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      };

      const findButtonByText = (text) =>
        Array.from(document.querySelectorAll("button")).find((button) => button.textContent.includes(text));

      const clickCategory = (name) => {
        const category = Array.from(document.querySelectorAll(".categoryCard")).find((card) =>
          card.textContent.includes(name)
        );
        category.click();
      };

      waitForText("Local SQLite storage is active.", () => {
        waitForText("Target: Work", () => {
        const urlInput = document.querySelector('input[aria-label="URL to save"]');
        const titleInput = document.querySelector('input[aria-label="URL title"]');
        const saveButton = findButtonByText("Save URL");

        setInputValue(urlInput, "https://example.com/work");
        setInputValue(titleInput, "Work title");
        saveButton.click();

        waitForText("Saved URL to Work.", () => {
          document.querySelector('.savedUrlManagerItem button[title="Remove URL"]').click();

          waitForText("Saved URL removed safely.", () => {
            clickCategory("Projects");

            waitForText("Target: Projects", () => {
              const nextUrlInput = document.querySelector('input[aria-label="URL to save"]');
              const nextTitleInput = document.querySelector('input[aria-label="URL title"]');
              const nextSaveButton = findButtonByText("Save URL");
              const titleRect = nextTitleInput.getBoundingClientRect();
              const titleCenterElement = document.elementFromPoint(
                titleRect.left + titleRect.width / 2,
                titleRect.top + titleRect.height / 2
              );

              nextTitleInput.focus();
              setInputValue(nextUrlInput, "https://example.com/projects");
              setInputValue(nextTitleInput, "Project title");
              const titleInputAcceptsText = nextTitleInput.value === "Project title";
              nextSaveButton.click();

              setTimeout(() => {
                resolve({
                  hasDeskPilotApi: Boolean(window.deskPilot),
                  titleInputAcceptsText,
                  titleInputReceivesClicks: titleCenterElement === nextTitleInput,
                  titleInputCover: titleCenterElement
                    ? {
                        tagName: titleCenterElement.tagName,
                        className: titleCenterElement.className,
                        textContent: titleCenterElement.textContent,
                        ariaLabel: titleCenterElement.getAttribute("aria-label")
                      }
                    : null,
                  titleInputRect: {
                    top: titleRect.top,
                    left: titleRect.left,
                    width: titleRect.width,
                    height: titleRect.height
                  },
                  bodyText: getRenderedText()
                });
              }, 250);
            });
          });
        });
      });
      });
    })
  `);

  assert(result.hasDeskPilotApi, "Expected packaged renderer to receive the Electron preload API");
  assert(
    !result.bodyText.includes("Saving URLs requires the Electron app."),
    "Expected Save URL not to report a missing Electron app"
  );
  if (!result.titleInputReceivesClicks) {
    console.error(JSON.stringify({ titleInputCover: result.titleInputCover, titleInputRect: result.titleInputRect }, null, 2));
  }
  assert(result.titleInputReceivesClicks, "Expected the Projects title input not to be covered by another element");
  assert(result.titleInputAcceptsText, "Expected the Projects title input to accept text after deleting a Work URL");
  if (!result.bodyText.includes("Saved URL to Projects.")) {
    console.error(result.bodyText);
  }
  assert(result.bodyText.includes("Saved URL to Projects."), "Expected Save URL to work after switching to Projects");
  assert(result.bodyText.includes("Project title"), "Expected the Projects saved URL to keep the entered title");

  window.destroy();
  app.quit();

  console.log(
    JSON.stringify(
      {
        renderer: "dist/index.html",
        preloadApi: result.hasDeskPilotApi,
        moveAfterDelete: "ok"
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
