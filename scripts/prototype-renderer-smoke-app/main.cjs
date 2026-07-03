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
  const deletedTabsByCategory = new Map();
  const categories = defaultCategories.map((category) => ({ ...category }));
  let activeCategoryId = categories[0]?.id ?? "";

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

  function getDeletedTabs(categoryId) {
    return deletedTabsByCategory.get(categoryId) ?? [];
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
  ipcMain.handle("categories:active", () => activeCategoryId);
  ipcMain.handle("categories:set-active", (_event, id) => {
    if (categories.some((category) => category.id === id)) {
      activeCategoryId = id;
    }

    return activeCategoryId;
  });
  ipcMain.handle("categories:deleted", () => []);
  ipcMain.handle("tabs:list", (_event, categoryId) => getActiveTabs(categoryId));
  ipcMain.handle("tabs:deleted", (_event, categoryId) => getDeletedTabs(categoryId));
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
      const deletedTab = tabs.find((tab) => tab.id === id);

      if (deletedTab) {
        affectedCategoryId = categoryId;
        setActiveTabs(
          categoryId,
          tabs.filter((tab) => tab.id !== id)
        );
        deletedTabsByCategory.set(categoryId, [...getDeletedTabs(categoryId), deletedTab]);
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

  setTimeout(() => {
    setActiveTabs("entertainment", [
      {
        id: "external-extension-entertainment",
        categoryId: "entertainment",
        title: "External Extension Save",
        url: "https://example.com/external-extension-save"
      }
    ]);
    window.webContents.send("sessions:changed");
  }, 750);

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
      const getCategoryCardText = (name) => {
        const category = Array.from(document.querySelectorAll(".categoryCard")).find((card) =>
          card.textContent.includes(name)
        );

        return category ? category.textContent : "";
      };
      const waitForCondition = (predicate, callback, attempts = 120) => {
        if (predicate()) {
          callback();
          return;
        }

        if (attempts === 0) {
          resolve({
            hasDeskPilotApi: Boolean(window.deskPilot),
            extensionRefreshUpdatedCategoryCount: false,
            entertainmentCardText: getCategoryCardText("Entertainment"),
            bodyText: getRenderedText()
          });
          return;
        }

        setTimeout(() => waitForCondition(predicate, callback, attempts - 1), 25);
      };

      const clickCategory = (name) => {
        const category = Array.from(document.querySelectorAll(".categoryCard")).find((card) =>
          card.textContent.includes(name)
        );
        category.click();
      };
      const longWorkTitle =
        "WorkTitleWithEnoughDetailToOverflowTheRecoveryPanelWhenRenderedInsideTheNarrowControlRail";

      const getControlRailOverflow = () => {
        const controlRail = document.querySelector(".controlRail");
        const categoryList = document.querySelector(".categoryList");
        const categoryLeft = categoryList.getBoundingClientRect().left;
        const visibleElements = Array.from(controlRail.querySelectorAll("*")).filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0;
        });
        const contentOverflow = visibleElements
          .filter((element) => element.scrollWidth > element.clientWidth + 1)
          .map((element) => ({
            tagName: element.tagName,
            className: element.className,
            textContent: element.textContent,
            clientWidth: element.clientWidth,
            scrollWidth: element.scrollWidth
          }));
        const offenders = visibleElements
          .map((element) => {
            const rect = element.getBoundingClientRect();

            return {
              tagName: element.tagName,
              className: element.className,
              textContent: element.textContent,
              right: rect.right
            };
          })
          .filter((item) => item.right > categoryLeft);

        return {
          categoryLeft,
          controlRailClientWidth: controlRail.clientWidth,
          controlRailScrollWidth: controlRail.scrollWidth,
          contentOverflow,
          offenders
        };
      };

      waitForText("Local SQLite storage is active.", () => {
        waitForCondition(() => getCategoryCardText("Entertainment").includes("1 tabs"), () => {
        waitForText("Target: Work", () => {
        const urlInput = document.querySelector('input[aria-label="URL to save"]');
        const titleInput = document.querySelector('input[aria-label="URL title"]');
        const saveButton = findButtonByText("Save URL");

        setInputValue(urlInput, "https://example.com/work");
        setInputValue(titleInput, longWorkTitle);
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
                const projectTitleSavedBeforeRecovery = getRenderedText().includes("Project title");
                clickCategory("Work");

                setTimeout(() => {
                  findButtonByText("Recovery").click();

                  waitForText("Restore " + longWorkTitle, () => {
                  const recoveryOverflow = getControlRailOverflow();

                resolve({
                  hasDeskPilotApi: Boolean(window.deskPilot),
                  extensionRefreshUpdatedCategoryCount: getCategoryCardText("Entertainment").includes("1 tabs"),
                  entertainmentCardText: getCategoryCardText("Entertainment"),
                  titleInputAcceptsText,
                  titleInputReceivesClicks: titleCenterElement === nextTitleInput,
                  projectTitleSavedBeforeRecovery,
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
                  recoveryStaysInsideRail:
                    recoveryOverflow.offenders.length === 0 &&
                    recoveryOverflow.controlRailScrollWidth <= recoveryOverflow.controlRailClientWidth + 1,
                  recoveryOverflow,
                  bodyText: getRenderedText()
                });
                  });
                }, 50);
              }, 250);
            });
          });
        });
      });
      });
      });
    })
  `);

  assert(result.hasDeskPilotApi, "Expected packaged renderer to receive the Electron preload API");
  if (!result.extensionRefreshUpdatedCategoryCount) {
    console.error(JSON.stringify({ entertainmentCardText: result.entertainmentCardText, bodyText: result.bodyText }, null, 2));
  }
  assert(
    result.extensionRefreshUpdatedCategoryCount,
    "Expected external extension saves to refresh category counts in the renderer"
  );
  assert(
    !result.bodyText.includes("Saving URLs requires the Electron app."),
    "Expected Save URL not to report a missing Electron app"
  );
  if (!result.titleInputReceivesClicks) {
    console.error(JSON.stringify({ titleInputCover: result.titleInputCover, titleInputRect: result.titleInputRect }, null, 2));
  }
  assert(result.titleInputReceivesClicks, "Expected the Projects title input not to be covered by another element");
  assert(result.titleInputAcceptsText, "Expected the Projects title input to accept text after deleting a Work URL");
  if (!result.recoveryStaysInsideRail) {
    console.error(JSON.stringify(result.recoveryOverflow, null, 2));
  }
  assert(result.recoveryStaysInsideRail, "Expected Recovery mode controls not to overlap the category list");
  if (!result.bodyText.includes("Saved URL to Projects.") && !result.projectTitleSavedBeforeRecovery) {
    console.error(result.bodyText);
  }
  assert(result.bodyText.includes("Saved URL to Projects."), "Expected Save URL to work after switching to Projects");
  assert(result.projectTitleSavedBeforeRecovery, "Expected the Projects saved URL to keep the entered title");

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
