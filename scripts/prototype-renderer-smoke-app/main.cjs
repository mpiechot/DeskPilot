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
  const smokeDataProfile = {
    id: "development",
    label: "Development",
    description: "Renderer smoke data isolated from productive use.",
    storageDirectory: path.join(prototypeRoot, "profiles", "development", "storage"),
    databasePath: path.join(prototypeRoot, "profiles", "development", "storage", "smoke-deskpilot.sqlite"),
    legacyDatabasePath: path.join(prototypeRoot, "storage", "deskpilot.sqlite"),
    developmentDatabasePath: path.join(prototypeRoot, "profiles", "development", "storage", "smoke-deskpilot.sqlite"),
    productiveDatabasePath: path.join(prototypeRoot, "profiles", "productive", "storage", "deskpilot.sqlite"),
    profileStatePath: path.join(prototypeRoot, "profiles", "development", "profile-state.json"),
    cutover: {
      status: "not-applicable",
      automaticMigrationComplete: false,
      message: "Development storage is isolated."
    }
  };

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
    tabsByCategory.set(
      categoryId,
      tabs.map((tab, index) => ({
        ...tab,
        categoryId,
        position: index,
        savedAt: tab.savedAt || new Date().toISOString()
      }))
    );
    const categoryIndex = categories.findIndex((category) => category.id === categoryId);
    const storedTabs = tabsByCategory.get(categoryId) ?? [];

    if (categoryIndex >= 0) {
      categories[categoryIndex] = {
        ...categories[categoryIndex],
        status: storedTabs.length > 0 ? "ready" : "empty",
        tabCount: storedTabs.length,
        lastSavedLabel: storedTabs.length > 0 ? "Just now" : "Not saved yet"
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
    dataProfile: smokeDataProfile,
    startupRecovery: {
      status: "recovered-from-rolling",
      message: "DeskPilot recovered the active database from the automatic rolling backup and preserved the corrupted file.",
      recoveredAt: "2026-07-12T12:00:00.000Z",
      rollingBackupPath: path.join(prototypeRoot, "profiles", "development", "storage", "smoke-deskpilot.sqlite.bak"),
      corruptDatabaseBackupPath: path.join(
        prototypeRoot,
        "profiles",
        "development",
        "storage",
        "manual-backups",
        "deskpilot-corrupt-startup-smoke.sqlite.corrupt"
      )
    },
    databasePath: smokeDataProfile.databasePath,
    rollingBackupPath: path.join(prototypeRoot, "profiles", "development", "storage", "smoke-deskpilot.sqlite.bak"),
    rollingBackup: {
      fileName: "smoke-deskpilot.sqlite.bak",
      path: path.join(prototypeRoot, "profiles", "development", "storage", "smoke-deskpilot.sqlite.bak"),
      createdAt: "2026-07-12T12:00:00.000Z",
      sizeBytes: 4096
    },
    manualBackupDirectory: path.join(prototypeRoot, "profiles", "development", "storage", "manual-backups"),
    manualBackups: []
  }));
  ipcMain.handle("storage:restore-rolling-backup", () => ({
    storageInfo: {
      dataProfile: smokeDataProfile,
      startupRecovery: {
        status: "recovered-from-rolling",
        message: "DeskPilot recovered the active database from the automatic rolling backup and preserved the corrupted file.",
        recoveredAt: "2026-07-12T12:00:00.000Z",
        rollingBackupPath: path.join(prototypeRoot, "profiles", "development", "storage", "smoke-deskpilot.sqlite.bak"),
        corruptDatabaseBackupPath: path.join(
          prototypeRoot,
          "profiles",
          "development",
          "storage",
          "manual-backups",
          "deskpilot-corrupt-startup-smoke.sqlite.corrupt"
        )
      },
      databasePath: smokeDataProfile.databasePath,
      rollingBackupPath: path.join(prototypeRoot, "profiles", "development", "storage", "smoke-deskpilot.sqlite.bak"),
      rollingBackup: {
        fileName: "smoke-deskpilot.sqlite.bak",
        path: path.join(prototypeRoot, "profiles", "development", "storage", "smoke-deskpilot.sqlite.bak"),
        createdAt: "2026-07-12T12:00:00.000Z",
        sizeBytes: 4096
      },
      manualBackupDirectory: path.join(prototypeRoot, "profiles", "development", "storage", "manual-backups"),
      manualBackups: []
    },
    categories,
    deletedCategories: [],
    selectedCategoryId: activeCategoryId,
    tabs: getActiveTabs(activeCategoryId),
    deletedTabs: getDeletedTabs(activeCategoryId),
    restoredFrom: "smoke-deskpilot.sqlite.bak",
    safetyBackupFileName: "deskpilot-pre-restore-smoke.sqlite"
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
      url: input.url,
      position: getActiveTabs(input.categoryId).length,
      savedAt: new Date().toISOString()
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
  ipcMain.handle("tabs:move", (_event, id, input) => {
    let movedTab = null;
    let sourceCategoryId = "";

    for (const [categoryId, tabs] of tabsByCategory.entries()) {
      const tab = tabs.find((item) => item.id === id);

      if (tab) {
        movedTab = tab;
        sourceCategoryId = categoryId;
        setActiveTabs(
          categoryId,
          tabs.filter((item) => item.id !== id)
        );
        break;
      }
    }

    if (!movedTab) {
      return {
        categories,
        tabs: getActiveTabs(input.targetCategoryId)
      };
    }

    const targetTabs = getActiveTabs(input.targetCategoryId).filter((item) => item.id !== id);
    const targetPosition = Math.max(0, Math.min(Number(input.targetPosition) || 0, targetTabs.length));
    targetTabs.splice(targetPosition, 0, {
      ...movedTab,
      categoryId: input.targetCategoryId
    });
    setActiveTabs(input.targetCategoryId, targetTabs);

    if (sourceCategoryId && sourceCategoryId !== input.targetCategoryId) {
      setActiveTabs(sourceCategoryId, getActiveTabs(sourceCategoryId));
    }

    return {
      categories,
      tabs: getActiveTabs(input.targetCategoryId)
    };
  });
  ipcMain.handle("tabs:open", (_event, id) => {
    for (const tabs of tabsByCategory.values()) {
      const tab = tabs.find((item) => item.id === id);

      if (tab) {
        return tab;
      }
    }

    return null;
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
      const getCategoryCard = (name) =>
        Array.from(document.querySelectorAll(".categoryCard")).find((card) => card.textContent.includes(name));
      const getCategoryCardText = (name) => {
        const category = getCategoryCard(name);

        return category ? category.textContent : "";
      };
      const getBoardList = (categoryName) => getCategoryCard(categoryName).querySelector(".sessionBoardList");
      const getBoardTab = (categoryName, title) =>
        Array.from(getCategoryCard(categoryName).querySelectorAll(".sessionBoardTab")).find((tab) =>
          tab.textContent.includes(title)
        );
      const getBoardTitles = (categoryName) =>
        Array.from(getCategoryCard(categoryName).querySelectorAll(".sessionBoardTab span")).map((item) => item.textContent);
      const dragElementTo = (source, target, clientY) => {
        const dataTransfer = new DataTransfer();

        source.dispatchEvent(new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer }));
        target.dispatchEvent(new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer, clientY }));
        target.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer, clientY }));
        source.dispatchEvent(new DragEvent("dragend", { bubbles: true, cancelable: true, dataTransfer }));
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

      waitForText("Database recovered from the automatic rolling backup. Review Safety for details.", () => {
        waitForCondition(
          () =>
            getCategoryCardText("Entertainment").includes("1 tabs") &&
            getCategoryCardText("Entertainment").includes("External Extension Save"),
          () => {
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

              waitForCondition(() => Boolean(getBoardTab("Projects", "Project title")), () => {
                const projectTitleSavedBeforeRecovery = getRenderedText().includes("Project title");
                const projectBoardTab = getBoardTab("Projects", "Project title");
                const workBoardList = getBoardList("Work");
                const workBoardRect = workBoardList.getBoundingClientRect();

                dragElementTo(projectBoardTab, workBoardList, workBoardRect.bottom - 2);

                waitForCondition(
                  () =>
                    getCategoryCardText("Work").includes("Project title") &&
                    !getCategoryCardText("Projects").includes("Project title"),
                  () => {
                clickCategory("Work");

                waitForText("Target: Work", () => {
                  const workUrlInput = document.querySelector('input[aria-label="URL to save"]');
                  const workTitleInput = document.querySelector('input[aria-label="URL title"]');
                  const workSaveButton = findButtonByText("Save URL");

                  setInputValue(workUrlInput, "https://example.com/work-second");
                  setInputValue(workTitleInput, "Work second");
                  workSaveButton.click();

                  waitForText("Saved URL to Work.", () => {
                    const workSecondTab = getBoardTab("Work", "Work second");
                    const movedProjectTab = getBoardTab("Work", "Project title");
                    const movedProjectRect = movedProjectTab.getBoundingClientRect();

                    dragElementTo(workSecondTab, movedProjectTab, movedProjectRect.top + 1);

                    waitForCondition(() => {
                      const workTitles = getBoardTitles("Work");

                      return (
                        workTitles.includes("Work second") &&
                        workTitles.includes("Project title") &&
                        workTitles.indexOf("Work second") < workTitles.indexOf("Project title")
                      );
                    }, () => {
                  getBoardTab("Work", "Work second").querySelector('button[title="Open saved tab"]').click();

                  waitForText("Opened Work second.", () => {
                  findButtonByText("Recovery").click();

                  waitForText("Restore " + longWorkTitle, () => {
                  const recoveryOverflow = getControlRailOverflow();
                  const workBoardTitles = getBoardTitles("Work");
                  const sessionBoardOpenWorked = getRenderedText().includes("Opened Work second.");

                  findButtonByText("Safety").click();
                  waitForText("Automatic rolling backup", () => {
                  window.confirm = () => true;
                  document.querySelector('button[title="Restore automatic rolling backup"]').click();

                  waitForText("Restored automatic backup. Safety backup: deskpilot-pre-restore-smoke.sqlite.", () => {

                resolve({
                  hasDeskPilotApi: Boolean(window.deskPilot),
                  extensionRefreshUpdatedCategoryCount: getCategoryCardText("Entertainment").includes("1 tabs"),
                  sessionBoardShowsSavedTabs: getCategoryCardText("Entertainment").includes("External Extension Save"),
                  sessionBoardMoveWorked: getCategoryCardText("Work").includes("Project title"),
                  sessionBoardReorderWorked:
                    workBoardTitles.includes("Work second") &&
                    workBoardTitles.includes("Project title") &&
                    workBoardTitles.indexOf("Work second") < workBoardTitles.indexOf("Project title"),
                  sessionBoardOpenWorked,
                  workBoardTitles,
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
                  rollingBackupRestoreWorked: getRenderedText().includes("Restored automatic backup."),
                  startupRecoveryVisible: getRenderedText().includes("Recovered at startup"),
                  bodyText: getRenderedText()
                });
                  });
                  });
                  });
                  });
                    });
                  });
                });
                  }
                );
              });
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
  assert(result.sessionBoardShowsSavedTabs, "Expected Session Board cards to show saved tabs");
  assert(result.sessionBoardMoveWorked, "Expected Session Board drag/drop to move a saved tab between categories");
  if (!result.sessionBoardReorderWorked) {
    console.error(JSON.stringify({ workBoardTitles: result.workBoardTitles, bodyText: result.bodyText }, null, 2));
  }
  assert(result.sessionBoardReorderWorked, "Expected Session Board drag/drop to reorder saved tabs within a category");
  assert(result.sessionBoardOpenWorked, "Expected Session Board per-tab open control to open a saved tab");
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
  assert(result.rollingBackupRestoreWorked, "Expected Safety mode to restore the automatic rolling backup");
  assert(result.startupRecoveryVisible, "Expected Safety mode to report automatic startup recovery");
  if (!result.bodyText.includes("Saved URL to Projects.") && !result.projectTitleSavedBeforeRecovery) {
    console.error(result.bodyText);
  }
  assert(
    result.bodyText.includes("Saved URL to Projects.") || result.projectTitleSavedBeforeRecovery,
    "Expected Save URL to work after switching to Projects"
  );
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
