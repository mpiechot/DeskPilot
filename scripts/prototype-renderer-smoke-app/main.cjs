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
  const archivedTabsByCategory = new Map();
  const categories = [
    ...defaultCategories.map((category) => ({ ...category })),
    ...Array.from({ length: 6 }, (_value, index) => ({
      id: `overflow-${index + 1}`,
      name: `Overflow ${index + 1}`,
      description: "Horizontal category navigation fixture.",
      icon: "folder",
      tabCount: 0
    }))
  ];
  const deletedCategories = [];
  let activeCategoryId = categories[0]?.id ?? "";
  let displayPreferences = { layoutMode: "standard", displayId: null, kiosk: false };
  let openedUpdateUrl = "";
  let openedCategoryId = "";

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
        tabCount: storedTabs.length
      };
    }
  }

  function getDeletedTabs(categoryId) {
    return deletedTabsByCategory.get(categoryId) ?? [];
  }

  function getArchivedTabs(categoryId) {
    return archivedTabsByCategory.get(categoryId) ?? [];
  }

  setActiveTabs(
    "overflow-1",
    Array.from({ length: 12 }, (_value, index) => ({
      id: `overflow-tab-${index + 1}`,
      categoryId: "overflow-1",
      title: `Overflow tab ${index + 1}`,
      url: `https://example.com/overflow/${index + 1}`
    }))
  );

  ipcMain.handle("bridge:status", () => ({ running: true, host: "127.0.0.1", port: 17383 }));
  ipcMain.handle("updates:status", () => ({
    status: "available",
    currentVersion: "0.1.0",
    availableVersion: "0.1.1",
    releaseUrl: "https://github.com/mpiechot/DeskPilot/releases/tag/v0.1.1",
    message: "DeskPilot 0.1.1 is available."
  }));
  ipcMain.handle("updates:open", () => {
    openedUpdateUrl = "https://github.com/mpiechot/DeskPilot/releases/tag/v0.1.1";
    return {
      status: "available",
      currentVersion: "0.1.0",
      availableVersion: "0.1.1",
      releaseUrl: openedUpdateUrl,
      message: "DeskPilot 0.1.1 is available."
    };
  });
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
  ipcMain.handle("display:settings", () => ({
    preferences: displayPreferences,
    displays: [
      { id: "primary", label: "Display 1 (Primary)", primary: true, width: 1920, height: 1080 },
      { id: "secondary", label: "Display 2", primary: false, width: 1280, height: 720 }
    ]
  }));
  ipcMain.handle("display:update-preferences", (_event, preferences) => {
    displayPreferences = preferences;
    return {
      preferences: displayPreferences,
      displays: [
        { id: "primary", label: "Display 1 (Primary)", primary: true, width: 1920, height: 1080 },
        { id: "secondary", label: "Display 2", primary: false, width: 1280, height: 720 }
      ]
    };
  });
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
    archivedTabs: getArchivedTabs(activeCategoryId),
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
  ipcMain.handle("categories:open", (_event, id) => {
    openedCategoryId = id;
    return getActiveTabs(id);
  });
  ipcMain.handle("categories:create", (_event, input) => {
    categories.push({
      id: `smoke-category-${Date.now()}`,
      name: input.name,
      description: input.description,
      icon: input.icon || "folder",
      tabCount: 0
    });
    return categories;
  });
  ipcMain.handle("categories:update", (_event, id, input) => {
    const index = categories.findIndex((category) => category.id === id);

    if (index >= 0) {
      categories[index] = {
        ...categories[index],
        name: input.name,
        description: input.description,
        icon: input.icon || categories[index].icon || "folder"
      };
    }

    return categories;
  });
  ipcMain.handle("categories:delete", (_event, id) => {
    const index = categories.findIndex((category) => category.id === id);

    if (index >= 0) {
      deletedCategories.push(categories[index]);
      categories.splice(index, 1);
    }

    if (!categories.some((category) => category.id === activeCategoryId)) {
      activeCategoryId = categories[0]?.id ?? "";
    }

    return categories;
  });
  ipcMain.handle("categories:deleted", () => deletedCategories);
  ipcMain.handle("categories:restore", (_event, id) => {
    const index = deletedCategories.findIndex((category) => category.id === id);

    if (index >= 0) {
      categories.push(deletedCategories[index]);
      deletedCategories.splice(index, 1);
    }

    return { categories, deletedCategories };
  });
  ipcMain.handle("tabs:list", (_event, categoryId) => getActiveTabs(categoryId));
  ipcMain.handle("tabs:deleted", (_event, categoryId) => getDeletedTabs(categoryId));
  ipcMain.handle("tabs:archived", (_event, categoryId) => getArchivedTabs(categoryId));
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
  ipcMain.handle("tabs:archive", (_event, id) => {
    let affectedCategoryId = "";

    for (const [categoryId, tabs] of tabsByCategory.entries()) {
      const archivedTab = tabs.find((tab) => tab.id === id);

      if (archivedTab) {
        affectedCategoryId = categoryId;
        setActiveTabs(
          categoryId,
          tabs.filter((tab) => tab.id !== id)
        );
        archivedTabsByCategory.set(categoryId, [...getArchivedTabs(categoryId), archivedTab]);
        break;
      }
    }

    return {
      categories,
      tabs: affectedCategoryId ? getActiveTabs(affectedCategoryId) : []
    };
  });
  ipcMain.handle("tabs:unarchive", (_event, id) => {
    let affectedCategoryId = "";

    for (const [categoryId, tabs] of archivedTabsByCategory.entries()) {
      const restoredTab = tabs.find((tab) => tab.id === id);

      if (restoredTab) {
        affectedCategoryId = categoryId;
        archivedTabsByCategory.set(
          categoryId,
          tabs.filter((tab) => tab.id !== id)
        );
        setActiveTabs(categoryId, [...getActiveTabs(categoryId), restoredTab]);
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

  const shellNavigationResult = await window.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const shell = document.querySelector(".deskPilotShell");
      const navigation = shell?.querySelector('[aria-label="Pilot Navigation"]');
      const browserPilotButton = navigation?.querySelector('[data-pilot-id="browser"]');
      const desktopPilotButton = navigation?.querySelector('[data-pilot-id="desktop"]');
      const environmentPilotButton = navigation?.querySelector('[data-pilot-id="environment"]');
      const settingsButton = navigation?.querySelector('button[data-shell-destination="settings"]');
      const browserPilotContent = document.querySelector('[data-pilot="browser"]');
      const shellContent = shell?.querySelector('[aria-label="DeskPilot content"]');
      const shellMetadata = navigation?.querySelector('[data-shell-meta]');
      const browserPilotIcon = browserPilotButton?.querySelector('[data-icon="browser-pilot"]');
      const shellBrand = shell?.querySelector(':scope > .pilotNavigationBrand');
      const navigationStyle = navigation ? getComputedStyle(navigation) : null;
      const contentStyle = shellContent ? getComputedStyle(shellContent) : null;

      const destinationIsVisible = (destination) =>
        document.querySelector('.deskPilotShellContent [data-shell-destination="' + destination + '"]')?.hidden === false;

      desktopPilotButton?.click();
      setTimeout(() => {
        const desktopPilotReachable =
          destinationIsVisible("desktop") &&
          document.querySelector('[data-pilot-empty-state="desktop"]')?.textContent.includes("DesktopPilot");
        environmentPilotButton?.click();
        setTimeout(() => {
          const environmentPilotReachable =
            destinationIsVisible("environment") &&
            document.querySelector('[data-pilot-empty-state="environment"]')?.textContent.includes("EnvironmentPilot");
          settingsButton?.click();
          setTimeout(() => {
            const settingsWrapper = document.querySelector('.deskPilotShellContent [data-shell-destination="settings"]');
            const settingsReachable =
              destinationIsVisible("settings") &&
              settingsWrapper?.textContent.includes("Settings");
            browserPilotButton?.click();

            setTimeout(() => resolve({
        shellPresent: Boolean(shell),
        navigationPresent: Boolean(navigation),
        browserPilotNavigationPresent: Boolean(browserPilotButton),
        desktopPilotNavigationPresent: Boolean(desktopPilotButton),
        environmentPilotNavigationPresent: Boolean(environmentPilotButton),
        settingsNavigationPresent: Boolean(settingsButton),
        browserPilotNavigationIconOnly: Boolean(browserPilotButton?.querySelector("svg")) && !browserPilotButton?.textContent?.trim(),
        browserPilotUsesCustomStyleableIcon:
          browserPilotIcon?.getAttribute("stroke") === "currentColor" && browserPilotIcon?.getAttribute("data-icon") === "browser-pilot",
        browserPilotSelected: browserPilotButton?.getAttribute("aria-current") === "page",
        browserPilotReachable: browserPilotContent?.getAttribute("aria-label") === "BrowserPilot" && destinationIsVisible("browser"),
        desktopPilotReachable,
        environmentPilotReachable,
        settingsReachable,
        browserPilotHasSingleHeading:
          document.querySelectorAll('[data-shell-destination="browser"]:not([hidden]) h1').length === 1 &&
          document.querySelector('[data-shell-destination="browser"]:not([hidden]) h1')?.textContent === "BrowserPilot",
        shellMetadataVisible:
          shellMetadata?.textContent?.includes("DeskPilot") &&
          shellMetadata?.textContent?.includes("v0.1.1") &&
          shellMetadata?.textContent?.includes("Development"),
        brandOutsideNavigation:
          shellBrand?.textContent?.trim() === "DP" &&
          !navigation?.contains(shellBrand),
        navigationVisuallySeparated:
          Boolean(navigationStyle && contentStyle) &&
          navigationStyle?.backgroundImage !== "none" &&
          contentStyle?.borderLeftStyle === "solid",
        navigationBackgroundImage: navigationStyle?.backgroundImage,
        contentBorderLeftStyle: contentStyle?.borderLeftStyle
            }), 50);
          }, 50);
        }, 50);
      }, 50);
    })
  `);

  const browserPilotLayoutResult = await window.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const controlRailToggle = document.querySelector('[aria-controls="browser-pilot-control-rail"]');
      const controlRailContent = document.querySelector("#browser-pilot-control-rail");
      const overflowCard = Array.from(document.querySelectorAll(".categoryCard")).find((card) =>
        card.textContent.includes("Overflow 1")
      );
      const overflowList = overflowCard?.querySelector(".sessionBoardList");
      const workCard = Array.from(document.querySelectorAll(".categoryCard")).find((card) =>
        card.textContent.includes("Work")
      );
      const workOpenAction = workCard?.querySelector('button[aria-label="Open Work category"]');
      const categoryList = document.querySelector(".categoryList");
      const browserPilotShell = document.querySelector('[data-pilot="browser"]');
      const deskPilotShell = document.querySelector(".deskPilotShell");
      const collapsedRailRect = document.querySelector(".controlRail")?.getBoundingClientRect();
      const collapsedCategoryRect = categoryList?.getBoundingClientRect();
      const controlRailCollapsedByDefault =
        browserPilotShell?.classList.contains("shell-controlRailCollapsed") &&
        controlRailToggle?.getAttribute("aria-expanded") === "false" &&
        controlRailContent?.hidden === true;

      workOpenAction?.click();
      controlRailToggle?.click();

      setTimeout(() => {
        browserPilotShell?.getAnimations().forEach((animation) => animation.finish());
        const expandedRailRect = document.querySelector(".controlRail")?.getBoundingClientRect();
        const expandedCategoryRect = categoryList?.getBoundingClientRect();
        const expandedGridTemplateColumns = getComputedStyle(browserPilotShell).gridTemplateColumns;
        const controlRailCanExpand =
          !browserPilotShell?.classList.contains("shell-controlRailCollapsed") &&
          controlRailToggle?.getAttribute("aria-expanded") === "true" &&
          controlRailContent?.hidden === false;
        const horizontalTransitionConfigured =
          getComputedStyle(browserPilotShell).transitionProperty.includes("grid-template-columns") &&
          getComputedStyle(browserPilotShell).transitionDuration !== "0s";

        controlRailToggle?.click();

        setTimeout(() => {
          browserPilotShell?.getAnimations().forEach((animation) => animation.finish());
          const collapsedAgainRailRect = document.querySelector(".controlRail")?.getBoundingClientRect();
          const collapsedAgainCategoryRect = categoryList?.getBoundingClientRect();
          const controlRailCanCollapseAgain =
            browserPilotShell?.classList.contains("shell-controlRailCollapsed") &&
            controlRailToggle?.getAttribute("aria-expanded") === "false" &&
            controlRailContent?.hidden === true;

          controlRailToggle?.click();

          setTimeout(() => {
            browserPilotShell?.getAnimations().forEach((animation) => animation.finish());
            const categoryListRect = categoryList?.getBoundingClientRect();
            const shellRect = deskPilotShell?.getBoundingClientRect();

            resolve({
              controlRailCollapsedByDefault,
              controlRailCanExpand,
              controlRailCanCollapseAgain,
              horizontalTransitionConfigured,
              railWidths: {
                collapsed: collapsedRailRect?.width ?? null,
                expanded: expandedRailRect?.width ?? null,
                collapsedAgain: collapsedAgainRailRect?.width ?? null
              },
              categoryLefts: {
                collapsed: collapsedCategoryRect?.left ?? null,
                expanded: expandedCategoryRect?.left ?? null,
                collapsedAgain: collapsedAgainCategoryRect?.left ?? null
              },
              expandedGridTemplateColumns,
              collapsedRailIsNarrow:
                Boolean(collapsedRailRect && expandedRailRect && collapsedAgainRailRect) &&
                collapsedRailRect.width < 64 &&
                collapsedAgainRailRect.width < 64 &&
                expandedRailRect.width > collapsedRailRect.width + 180,
              categoryBoardUsesCollapsedSpace:
                Boolean(collapsedCategoryRect && expandedCategoryRect && collapsedAgainCategoryRect) &&
                collapsedCategoryRect.left < expandedCategoryRect.left - 180 &&
                collapsedAgainCategoryRect.left < expandedCategoryRect.left - 180,
              duplicateSavedUrlManagerAbsent: !document.querySelector(".savedUrlManager"),
              everyCategoryHasOpenAction:
                document.querySelectorAll(".categoryCard").length > 0 &&
                document.querySelectorAll(".categoryOpenAction").length === document.querySelectorAll(".categoryCard").length,
              longCategoryListScrolls:
                Boolean(overflowList) &&
                overflowList.scrollHeight > overflowList.clientHeight &&
                getComputedStyle(overflowList).overflowY === "auto",
              browserPilotFitsViewport:
                Boolean(categoryListRect && shellRect) &&
                shellRect.bottom <= window.innerHeight + 1 &&
                categoryListRect.bottom <= window.innerHeight + 1
            });
          }, 300);
        }, 300);
      }, 300);
    })
  `);

  window.setSize(600, 800);
  await new Promise((resolve) => setTimeout(resolve, 100));
  const responsiveNavigationResult = await window.webContents.executeJavaScript(`
    (() => {
      const shell = document.querySelector(".deskPilotShell");
      const navigation = document.querySelector('[aria-label="Pilot Navigation"]');
      const shellStyle = shell ? getComputedStyle(shell) : null;
      const navigationStyle = navigation ? getComputedStyle(navigation) : null;

      return {
        smallViewport: window.matchMedia("(max-width: 760px)").matches,
        shellUsesSingleColumn: shellStyle?.gridTemplateColumns !== "64px",
        navigationUsesHorizontalLayout: navigationStyle?.gridTemplateRows === "48px"
      };
    })()
  `);
  window.setSize(1180, 390);
  await new Promise((resolve) => setTimeout(resolve, 100));

  const toastResult = await window.webContents.executeJavaScript(`
    new Promise((resolve) => {
      document.querySelector(".secondaryAction")?.click();
      setTimeout(() => {
        const toast = document.querySelector(".shellToast");
        resolve({
          errorMessageVisible: toast?.textContent?.includes("Paste a URL before saving it.") ?? false,
          copyActionVisible: Boolean(toast?.querySelector(".shellToastCopy"))
        });
      }, 100);
    })
  `);

  const updateNoticeResult = await window.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const inspect = (attempts = 120) => {
        const action = document.querySelector(".headerUpdateAction");

        if (action) {
          const visibleText = action.textContent;
          action.click();
          setTimeout(
            () => resolve({ visibleText, actionText: action.textContent, ariaLabel: action.getAttribute("aria-label") }),
            100
          );
          return;
        }

        if (attempts === 0) {
          resolve(null);
          return;
        }

        setTimeout(() => inspect(attempts - 1), 25);
      };

      inspect();
    })
  `);

  const categoryClickPoint = await window.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const inspect = (attempts = 120) => {
        const card = document.querySelector('[data-category-id="research"]');

        if (card) {
          const rect = card.getBoundingClientRect();
          resolve({
            x: Math.round(rect.left + rect.width / 2),
            y: Math.round(rect.top + 24)
          });
          return;
        }

        if (attempts === 0) {
          resolve(null);
          return;
        }

        setTimeout(() => inspect(attempts - 1), 25);
      };

      inspect();
    })
  `);

  const emptyCategorySummaryResult = await window.webContents.executeJavaScript(`
    (() => {
      const workCard = document.querySelector('.categoryCard[data-category-id="work"]');
      const emptyStateMessage = workCard?.querySelector('.sessionBoardEmpty');

      return {
        emptyStateMessage: emptyStateMessage?.textContent,
        duplicateEmptySummaryHidden: !workCard?.querySelector('.status, .categoryMeta'),
        duplicateEmptyTextHidden:
          !workCard?.textContent?.includes("0 tabs") && !workCard?.textContent?.includes("Not saved yet")
      };
    })()
  `);

  if (categoryClickPoint) {
    window.webContents.sendInputEvent({
      type: "mouseMove",
      x: categoryClickPoint.x,
      y: categoryClickPoint.y,
      movementX: 0,
      movementY: 0
    });
    window.webContents.sendInputEvent({
      type: "mouseDown",
      x: categoryClickPoint.x,
      y: categoryClickPoint.y,
      button: "left",
      clickCount: 1
    });
    window.webContents.sendInputEvent({
      type: "mouseUp",
      x: categoryClickPoint.x,
      y: categoryClickPoint.y,
      button: "left",
      clickCount: 1
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 100));
  const categoryClickWorked = Boolean(categoryClickPoint) && (await window.webContents.executeJavaScript(`
    document.querySelector('.categoryCard-selected')?.dataset.categoryId === "research"
  `));

  await window.webContents.executeJavaScript(`
    document.querySelector('[data-category-id="work"]').click()
  `);

  const categoryDragStart = await window.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const inspect = (attempts = 120) => {
        const list = document.querySelector(".categoryList");

        if (list && list.scrollWidth > list.clientWidth) {
          const rect = list.getBoundingClientRect();
          list.scrollLeft = 0;
          resolve({
            x: Math.round(rect.right - 36),
            y: Math.round(rect.top + 24),
            targetX: Math.round(rect.left + 36),
            initialScrollLeft: list.scrollLeft
          });
          return;
        }

        if (attempts === 0) {
          resolve(null);
          return;
        }

        setTimeout(() => inspect(attempts - 1), 25);
      };

      inspect();
    })
  `);

  if (categoryDragStart) {
    window.webContents.sendInputEvent({
      type: "mouseMove",
      x: categoryDragStart.x,
      y: categoryDragStart.y,
      movementX: 0,
      movementY: 0
    });
    window.webContents.sendInputEvent({
      type: "mouseDown",
      x: categoryDragStart.x,
      y: categoryDragStart.y,
      button: "left",
      clickCount: 1
    });
    window.webContents.sendInputEvent({
      type: "mouseMove",
      x: categoryDragStart.targetX,
      y: categoryDragStart.y,
      movementX: categoryDragStart.targetX - categoryDragStart.x,
      movementY: 0
    });
    window.webContents.sendInputEvent({
      type: "mouseUp",
      x: categoryDragStart.targetX,
      y: categoryDragStart.y,
      button: "left",
      clickCount: 1
    });
  }

  await new Promise((resolve) => setTimeout(resolve, 100));
  const categoryDragWorked = Boolean(categoryDragStart) && (await window.webContents.executeJavaScript(`
    document.querySelector(".categoryList").scrollLeft > 100
  `));
  const categoryDragPreservedSelection = await window.webContents.executeJavaScript(`
    document.querySelector('.categoryCard-selected')?.dataset.categoryId === "work"
  `);

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
          const visibleDestination = document.querySelector('.deskPilotShellContent [data-shell-destination]:not([hidden])');
          resolve({
            hasDeskPilotApi: Boolean(window.deskPilot),
            bodyText: getRenderedText()
          });
          return;
        }

        setTimeout(() => waitForText(needle, callback, attempts - 1), 25);
      };
      const waitForVisibleText = (needle, callback, attempts = 80) => {
        const visibleDestination = document.querySelector('.deskPilotShellContent [data-shell-destination]:not([hidden])');

        if (visibleDestination?.textContent.includes(needle)) {
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

        setTimeout(() => waitForVisibleText(needle, callback, attempts - 1), 25);
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
      let archiveRoundTripWorked = false;
      let removeConfirmationWorked = false;
      let displaySettingsWorked = false;
      let sessionBoardOpenWorked = false;
      let permanentDeleteConfirmationWorked = false;

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

      waitForText("Database recovered from the automatic rolling backup.", () => {
        waitForCondition(
          () =>
            getCategoryCardText("Entertainment").includes("1 saved tab") &&
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
          getBoardTab("Work", longWorkTitle).querySelector('button[title="Archive saved tab"]').click();

          waitForText("Saved URL archived.", () => {
            findButtonByText("Archive").click();

            waitForText(longWorkTitle, () => {
              const archivedItem = Array.from(document.querySelectorAll(".archivedTabItem")).find((item) =>
                item.textContent.includes(longWorkTitle)
              );
              window.confirm = (message) => {
                permanentDeleteConfirmationWorked = message.includes(longWorkTitle) && message.includes("cannot be recovered");
                return false;
              };
              archivedItem.querySelector(".permanentDeleteAction").click();

              waitForText("Permanent deletion canceled.", () => {
              archivedItem.querySelector(".restoreAction").click();

              waitForText("Archived URL returned to the active Session.", () => {
                archiveRoundTripWorked = true;
                findButtonByText("Session").click();

                waitForText("Target: Work", () => {
                  window.confirm = (message) => {
                    removeConfirmationWorked = message.includes(longWorkTitle) && message.includes("Recovery");
                    return false;
                  };
                  getBoardTab("Work", longWorkTitle).querySelector('button[title="Remove saved tab"]').click();

                  waitForText("Removal canceled.", () => {
                    window.confirm = () => true;
                    getBoardTab("Work", longWorkTitle).querySelector('button[title="Remove saved tab"]').click();

                    waitForText("Saved URL removed safely.", () => {
            clickCategory("Projects");

            waitForText("Target: Projects", () => {
              const nextUrlInput = document.querySelector('input[aria-label="URL to save"]');
              const nextTitleInput = document.querySelector('input[aria-label="URL title"]');
              const nextSaveButton = findButtonByText("Save URL");
              nextTitleInput.scrollIntoView({ block: "center" });
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
                  sessionBoardOpenWorked = true;
                  document.querySelector('button[aria-label="Settings"]').click();

                  waitForVisibleText("Apply Display Settings", () => {
                  const layoutSelect = document.querySelector('select[aria-label="DeskPilot layout"]');
                  const displaySelect = document.querySelector('select[aria-label="DeskPilot launch display"]');
                  const kioskCheckbox = document.querySelector('.displayCheckbox input[type="checkbox"]');
                  layoutSelect.value = "touch";
                  layoutSelect.dispatchEvent(new Event("change", { bubbles: true }));
                  displaySelect.value = "secondary";
                  displaySelect.dispatchEvent(new Event("change", { bubbles: true }));
                  kioskCheckbox.click();
                  findButtonByText("Apply Display Settings").click();

                  waitForText("Display settings applied.", () => {
                  displaySettingsWorked =
                    document.querySelector(".shell").classList.contains("shell-touch") &&
                    layoutSelect.value === "touch" &&
                    displaySelect.value === "secondary" &&
                    kioskCheckbox.checked;
                  document.querySelector('button[data-pilot-id="browser"]').click();
                  findButtonByText("Recovery").click();

                  waitForVisibleText("Restore " + longWorkTitle, () => {
                  const recoveryOverflow = getControlRailOverflow();
                  const workBoardTitles = getBoardTitles("Work");

                  document.querySelector('button[aria-label="Settings"]').click();
                  findButtonByText("Safety").click();
                  waitForVisibleText("Automatic rolling backup", () => {
                  window.confirm = () => true;
                  document.querySelector('button[title="Restore automatic rolling backup"]').click();

                  waitForText("Restored automatic backup. Safety backup: deskpilot-pre-restore-smoke.sqlite.", () => {
                  document.querySelector('button[data-pilot-id="browser"]').click();

                resolve({
                  hasDeskPilotApi: Boolean(window.deskPilot),
                  extensionRefreshUpdatedCategoryCount: getCategoryCardText("Entertainment").includes("1 saved tab"),
                  sessionBoardShowsSavedTabs: getCategoryCardText("Entertainment").includes("External Extension Save"),
                  populatedCategorySummaryConsistent:
                    !getCategoryCard("Entertainment").querySelector(".status") &&
                    getCategoryCard("Entertainment").querySelector(".categoryMeta")?.textContent.trim() === "1 saved tab" &&
                    !getCategoryCardText("Entertainment").includes("Saved"),
                  sessionBoardMoveWorked: getCategoryCardText("Work").includes("Project title"),
                  sessionBoardReorderWorked:
                    workBoardTitles.includes("Work second") &&
                    workBoardTitles.includes("Project title") &&
                    workBoardTitles.indexOf("Work second") < workBoardTitles.indexOf("Project title"),
                  sessionBoardOpenWorked,
                  archiveRoundTripWorked,
                  removeConfirmationWorked,
                  displaySettingsWorked,
                  permanentDeleteConfirmationWorked,
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
          });
        });
      });
      });
      });
    })
  `);

  const categoryManagementResult = await window.webContents.executeJavaScript(`
    new Promise((resolve) => {
      const findButton = (text) =>
        Array.from(document.querySelectorAll("button")).find((button) => button.textContent.trim().includes(text));
      const findCard = (text) =>
        Array.from(document.querySelectorAll(".categoryCard")).find((card) => card.textContent.includes(text));
      let stage = "open category management";
      const setInputValue = (input, value) => {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
        const previous = input.value;
        setter.call(input, value);
        input._valueTracker?.setValue(previous);
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      };
      const waitFor = (predicate, callback, attempts = 120) => {
        if (predicate()) {
          callback();
          return;
        }

        if (attempts === 0) {
          resolve({
            categoryRenameWorked: false,
            categoryIconWorked: false,
            categoryRemovalWorked: false,
            categoryRecoveryWorked: false,
            stage,
            selectedName: document.querySelector('input[aria-label="Selected category name"]')?.value,
            selectedIcon: document.querySelector('.managedCategoryForm button[aria-pressed="true"]')?.getAttribute("aria-label"),
            renamedCardIcon: findCard("Navigation Tools")?.querySelector(".categoryIcon")?.dataset.categoryIcon,
            bodyText: document.body.textContent
          });
          return;
        }

        setTimeout(() => waitFor(predicate, callback, attempts - 1), 25);
      };

      findCard("Overflow 6").click();
      findButton("Categories").click();
      waitFor(
        () => document.querySelector('input[aria-label="Selected category name"]')?.value === "Overflow 6",
        () => {
          const nameInput = document.querySelector('input[aria-label="Selected category name"]');
          const descriptionInput = document.querySelector('input[aria-label="Selected category description"]');
          setInputValue(nameInput, "Navigation Tools");
          setInputValue(descriptionInput, "Managed without resizing the window.");
          document.querySelector('.managedCategoryForm button[aria-label="Code icon"]').click();
          stage = "select category icon";
          waitFor(
            () => document.querySelector('.managedCategoryForm button[aria-label="Code icon"]')?.getAttribute("aria-pressed") === "true",
            () => {
              findButton("Save changes").click();
              stage = "save renamed category and icon";
              waitFor(
                () => Boolean(findCard("Navigation Tools")?.querySelector('[data-category-icon="code"]')),
                () => {
                  const renamedCard = findCard("Navigation Tools");
                  const categoryRenameWorked = renamedCard?.textContent.includes("Managed without resizing the window.");
                  const categoryIconWorked = Boolean(renamedCard?.querySelector('[data-category-icon="code"]'));
                  let confirmationMessage = "";
                  window.confirm = (message) => {
                    confirmationMessage = message;
                    return true;
                  };
                  findButton("Remove").click();
                  stage = "remove category";
                  waitFor(
                    () => !findCard("Navigation Tools"),
                    () => {
                      const categoryRemovalWorked =
                        confirmationMessage.includes("Navigation Tools") && confirmationMessage.includes("Recovery");
                      findButton("Recovery").click();
                      stage = "show category in Recovery";
                      waitFor(
                        () => Boolean(findButton("Restore Navigation Tools")),
                        () => {
                          findButton("Restore Navigation Tools").click();
                          stage = "restore category";
                          waitFor(
                            () => Boolean(findCard("Navigation Tools")?.querySelector('[data-category-icon="code"]')),
                            () => resolve({
                              categoryRenameWorked,
                              categoryIconWorked,
                              categoryRemovalWorked,
                              categoryRecoveryWorked: true
                            })
                          );
                        }
                      );
                    }
                  );
                }
              );
            }
          );
        }
      );
    })
  `);

  assert(result.hasDeskPilotApi, "Expected packaged renderer to receive the Electron preload API");
  assert(shellNavigationResult.shellPresent, "Expected DeskPilot to render through the DeskPilot Shell");
  assert(shellNavigationResult.navigationPresent, "Expected the Shell to own Pilot Navigation");
  assert(shellNavigationResult.browserPilotNavigationPresent, "Expected BrowserPilot to be reachable from Pilot Navigation");
  assert(shellNavigationResult.desktopPilotNavigationPresent, "Expected DesktopPilot to be reachable from Pilot Navigation");
  assert(shellNavigationResult.environmentPilotNavigationPresent, "Expected EnvironmentPilot to be reachable from Pilot Navigation");
  assert(shellNavigationResult.settingsNavigationPresent, "Expected Settings to be reachable from shell navigation");
  assert(shellNavigationResult.browserPilotNavigationIconOnly, "Expected Pilot Navigation to use icon-only controls");
  assert(shellNavigationResult.browserPilotUsesCustomStyleableIcon, "Expected BrowserPilot to use a custom currentColor SVG icon");
  assert(shellNavigationResult.browserPilotSelected, "Expected BrowserPilot to be the selected default Pilot");
  assert(shellNavigationResult.browserPilotReachable, "Expected the BrowserPilot content surface to be reachable");
  assert(shellNavigationResult.desktopPilotReachable, "Expected DesktopPilot to render its development empty state");
  assert(shellNavigationResult.environmentPilotReachable, "Expected EnvironmentPilot to render its development empty state");
  assert(shellNavigationResult.settingsReachable, "Expected Settings to render inside the shared Shell content region");
  assert(shellNavigationResult.browserPilotHasSingleHeading, "Expected BrowserPilot to use one clear page heading");
  assert(shellNavigationResult.shellMetadataVisible, "Expected the Shell navigation to show DeskPilot version and data profile metadata");
  assert(shellNavigationResult.brandOutsideNavigation, "Expected the DP brand to sit outside the dark Pilot Navigation");
  assert(shellNavigationResult.navigationVisuallySeparated, "Expected Pilot Navigation to be visually separated from Pilot content");
  if (!Object.values(browserPilotLayoutResult).every(Boolean)) {
    console.error(JSON.stringify(browserPilotLayoutResult, null, 2));
  }
  assert(browserPilotLayoutResult.controlRailCollapsedByDefault, "Expected the entire BrowserPilot control rail to start collapsed");
  assert(browserPilotLayoutResult.controlRailCanExpand, "Expected the BrowserPilot control rail to expand on request");
  assert(browserPilotLayoutResult.controlRailCanCollapseAgain, "Expected the BrowserPilot control rail to collapse again");
  assert(browserPilotLayoutResult.horizontalTransitionConfigured, "Expected a horizontal control-rail transition");
  assert(browserPilotLayoutResult.collapsedRailIsNarrow, "Expected the collapsed BrowserPilot control rail to become narrow");
  assert(browserPilotLayoutResult.categoryBoardUsesCollapsedSpace, "Expected categories to move left into the collapsed rail space");
  assert(browserPilotLayoutResult.duplicateSavedUrlManagerAbsent, "Expected the redundant Saved URLs manager to be removed");
  assert(browserPilotLayoutResult.everyCategoryHasOpenAction, "Expected every category card to have its own Open action");
  assert(browserPilotLayoutResult.longCategoryListScrolls, "Expected long category tab lists to scroll inside a fixed card height");
  assert(browserPilotLayoutResult.browserPilotFitsViewport, "Expected BrowserPilot to fit inside the visible application viewport");
  assert(openedCategoryId === "work", "Expected the Work category Open action to open that category");
  assert(responsiveNavigationResult.smallViewport, "Expected the smoke viewport to exercise the compact navigation layout");
  assert(responsiveNavigationResult.shellUsesSingleColumn, "Expected compact navigation to use a single shell column");
  assert(responsiveNavigationResult.navigationUsesHorizontalLayout, "Expected compact navigation to use a horizontal rail");
  assert(toastResult.errorMessageVisible, "Expected shell-owned Toast Messages to show BrowserPilot errors");
  assert(toastResult.copyActionVisible, "Expected error Toast Messages to provide copyable details");
  assert(emptyCategorySummaryResult.emptyStateMessage === "No saved tabs yet", "Expected one clear empty-category message");
  assert(emptyCategorySummaryResult.duplicateEmptySummaryHidden, "Expected the empty category to hide duplicate status and metadata");
  assert(emptyCategorySummaryResult.duplicateEmptyTextHidden, "Expected the empty category to hide duplicate tab-count text");
  assert(categoryClickWorked, "Expected a stationary mouse click to select a category");
  assert(
    updateNoticeResult?.visibleText.includes("v0.1.0") && updateNoticeResult?.visibleText.includes("v0.1.1"),
    "Expected the startup update notice to show installed and available versions"
  );
  assert(updateNoticeResult?.ariaLabel.includes("Update now"), "Expected an explicit update action");
  assert(
    openedUpdateUrl === "https://github.com/mpiechot/DeskPilot/releases/tag/v0.1.1",
    "Expected the update action to open the validated GitHub release page"
  );
  assert(categoryDragWorked, "Expected horizontal category drag to reveal off-screen categories without resizing");
  assert(categoryDragPreservedSelection, "Expected horizontal category drag not to select another category");
  if (!Object.values(categoryManagementResult).every(Boolean)) {
    console.error(JSON.stringify(categoryManagementResult, null, 2));
  }
  assert(categoryManagementResult.categoryRenameWorked, "Expected Categories mode to rename the selected category");
  assert(categoryManagementResult.categoryIconWorked, "Expected Categories mode to apply a monochrome category icon");
  assert(
    categoryManagementResult.categoryRemovalWorked,
    "Expected category removal to require a Recovery-aware confirmation"
  );
  assert(categoryManagementResult.categoryRecoveryWorked, "Expected a removed category and its icon to be recoverable");
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
  assert(result.archiveRoundTripWorked, "Expected a saved URL to archive and return to the active Session");
  assert(result.removeConfirmationWorked, "Expected removing a saved URL to require a Recovery-aware confirmation");
  assert(result.displaySettingsWorked, "Expected touch layout, display selection and kiosk preference to apply together");
  assert(result.permanentDeleteConfirmationWorked, "Expected permanent archive deletion to require an irreversible warning");
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
