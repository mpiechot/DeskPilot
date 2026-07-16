import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  nativeImage,
  nativeTheme,
  net,
  screen,
  shell,
  Tray,
  Menu,
  type OpenDialogOptions,
  type SaveDialogOptions
} from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  addTab,
  archiveTab,
  createManualBackup,
  createCategory,
  deleteCategory,
  deleteArchivedTabPermanently,
  deleteTab,
  exportStorageBackup,
  getActiveCategoryId,
  getActiveTab,
  getDataProfileInfo,
  getStorageInfo,
  importStorageBackup,
  initializeStorage,
  listDeletedCategories,
  listDeletedTabs,
  listArchivedTabs,
  listCategories,
  listTabs,
  moveTab,
  restoreCategory,
  restoreManualBackup,
  restoreRollingBackup,
  restoreTab,
  setActiveCategoryId,
  unarchiveTab,
  updateCategory
} from "./storage.js";
import { getBrowserBridgeStatus, startBrowserBridge } from "./browserBridge.js";
import { openUrlsInNewBrowserWindow } from "./browserLauncher.js";
import { getExtensionInstallInfo } from "./extensionInstall.js";
import {
  loadWindowBounds,
  loadWindowPreferences,
  resolveWindowBounds,
  saveWindowBounds,
  saveWindowPreferences
} from "./windowSettings.js";
import type { DisplaySettingsInfo, WindowPreferences } from "../shared/deskPilotApi.js";
import {
  createStorageStartupFailurePrompt,
  exportStorageRecoveryFile,
  type StorageStartupFailurePrompt
} from "./storageStartupFailure.js";
import { AppUpdateService } from "./appUpdate.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "../..");

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let isStorageInitialized = false;
let bridgeServer: ReturnType<typeof startBrowserBridge> | null = null;
const hasSingleInstanceLock = app.requestSingleInstanceLock();

function notifySessionsChanged(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send("sessions:changed");
    }
  }
}

function showMainWindow(): void {
  if (!isStorageInitialized) {
    return;
  }

  if (!mainWindow) {
    createMainWindow();
    return;
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  mainWindow.show();
  mainWindow.focus();
}

function createMainWindow(): void {
  const userDataPath = app.getPath("userData");
  const preferences = loadWindowPreferences(userDataPath);
  const bounds = resolveWindowBounds(
    loadWindowBounds(userDataPath),
    preferences,
    screen.getAllDisplays().map((display) => ({ id: String(display.id), workArea: display.workArea }))
  );

  mainWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    minWidth: 860,
    minHeight: 320,
    kiosk: preferences.kiosk,
    title: "DeskPilot",
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#181a1f" : "#f7f5ef",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.cjs"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.on("close", (event) => {
    if (mainWindow) {
      saveWindowBounds(app.getPath("userData"), mainWindow.getBounds());
    }

    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

function createTray(): void {
  tray = new Tray(createTrayIcon());
  tray.setToolTip("DeskPilot");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Show DeskPilot", click: showMainWindow },
      { type: "separator" },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ])
  );
}

function createTrayIcon() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <rect width="32" height="32" rx="7" fill="#26352f"/>
      <path d="M8 10.5h16v11H8z" fill="none" stroke="#fffaf0" stroke-width="2"/>
      <path d="M11 14h10M11 18h6" stroke="#fffaf0" stroke-width="2" stroke-linecap="round"/>
    </svg>
  `;
  const dataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

  return nativeImage.createFromDataURL(dataUrl);
}

function showSaveDialog(options: SaveDialogOptions) {
  return mainWindow ? dialog.showSaveDialog(mainWindow, options) : dialog.showSaveDialog(options);
}

function showOpenDialog(options: OpenDialogOptions) {
  return mainWindow ? dialog.showOpenDialog(mainWindow, options) : dialog.showOpenDialog(options);
}

function notifyUpdateStatusChanged(status: ReturnType<AppUpdateService["getStatus"]>): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send("updates:changed", status);
    }
  }
}

async function fetchLatestDeskPilotRelease(): Promise<unknown> {
  const response = await net.fetch("https://api.github.com/repos/mpiechot/DeskPilot/releases/latest", {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": `DeskPilot/${app.getVersion()}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub update check failed with ${response.status}.`);
  }

  return response.json();
}

function getDisplaySettingsInfo(): DisplaySettingsInfo {
  const primaryDisplayId = String(screen.getPrimaryDisplay().id);

  return {
    preferences: loadWindowPreferences(app.getPath("userData")),
    displays: screen.getAllDisplays().map((display, index) => ({
      id: String(display.id),
      label: `Display ${index + 1}${String(display.id) === primaryDisplayId ? " (Primary)" : ""}`,
      primary: String(display.id) === primaryDisplayId,
      width: display.workArea.width,
      height: display.workArea.height
    }))
  };
}

function updateDisplayPreferences(preferences: WindowPreferences): DisplaySettingsInfo {
  const userDataPath = app.getPath("userData");
  saveWindowPreferences(userDataPath, preferences);

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setKiosk(preferences.kiosk);
    const nextBounds = resolveWindowBounds(
      mainWindow.getBounds(),
      preferences,
      screen.getAllDisplays().map((display) => ({ id: String(display.id), workArea: display.workArea }))
    );
    mainWindow.setBounds(nextBounds);
  }

  return getDisplaySettingsInfo();
}

async function showStorageStartupFailure(error: unknown): Promise<void> {
  const prompt = createStorageStartupFailurePrompt(error, app.getPath("userData"));

  while (true) {
    const result = await dialog.showMessageBox(prompt.options);

    if (result.response === 0) {
      await exportStartupRecoveryFile(prompt, "Active database", prompt.activeDatabasePath, "deskpilot-active-recovery.sqlite");
      continue;
    }

    if (result.response === 1) {
      await exportStartupRecoveryFile(prompt, "Rolling backup", prompt.rollingBackupPath, "deskpilot-rolling-recovery.sqlite");
      continue;
    }

    if (result.response === 2) {
      await shell.openPath(prompt.storageDirectory);
      continue;
    }

    break;
  }

  isQuitting = true;
  app.quit();
}

async function exportStartupRecoveryFile(
  prompt: StorageStartupFailurePrompt,
  label: string,
  sourcePath: string,
  defaultFileName: string
): Promise<void> {
  const result = await showSaveDialog({
    title: `Export DeskPilot ${label.toLowerCase()}`,
    defaultPath: path.join(app.getPath("downloads"), defaultFileName),
    filters: [{ name: "SQLite database", extensions: ["sqlite"] }]
  });

  if (result.canceled || !result.filePath) {
    return;
  }

  try {
    const exported = exportStorageRecoveryFile(sourcePath, result.filePath, [
      prompt.activeDatabasePath,
      prompt.rollingBackupPath
    ]);
    await dialog.showMessageBox({
      type: "info",
      title: prompt.options.title ?? "DeskPilot storage recovery",
      message: `${label} exported safely.`,
      detail: `${exported.sizeBytes} bytes copied to:\n${exported.targetPath}`,
      buttons: ["Continue Recovery"],
      defaultId: 0,
      noLink: true
    });
  } catch (exportError) {
    await dialog.showMessageBox({
      type: "error",
      title: prompt.options.title ?? "DeskPilot storage recovery",
      message: `${label} could not be exported.`,
      detail: `${exportError instanceof Error ? exportError.message : String(exportError)}\n\n${prompt.options.detail ?? ""}`,
      buttons: ["Continue Recovery"],
      defaultId: 0,
      noLink: true
    });
  }
}

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    showMainWindow();
  });

  app.whenReady().then(async () => {
    try {
      await initializeStorage(app.getPath("userData"), app.isPackaged ? { profile: "productive" } : {});
    } catch (error) {
      await showStorageStartupFailure(error);
      return;
    }

    const activeDataProfile = getDataProfileInfo();
    const appUpdateService = new AppUpdateService({
      currentVersion: app.getVersion(),
      enabled: app.isPackaged,
      fetchLatestRelease: fetchLatestDeskPilotRelease,
      openExternal: (url) => shell.openExternal(url),
      onStatusChanged: notifyUpdateStatusChanged
    });
    bridgeServer = startBrowserBridge({
      dataProfile: activeDataProfile,
      showApp: showMainWindow,
      onSessionsChanged: notifySessionsChanged
    });
    ipcMain.handle("bridge:status", () => getBrowserBridgeStatus(bridgeServer, activeDataProfile));
    ipcMain.handle("updates:status", () => appUpdateService.getStatus());
    ipcMain.handle("updates:open", () => appUpdateService.openAvailableUpdate());
    ipcMain.handle("extension:install-info", () => getExtensionInstallInfo(projectRoot));
    ipcMain.handle("storage:info", () => getStorageInfo());
    ipcMain.handle("display:settings", () => getDisplaySettingsInfo());
    ipcMain.handle("display:update-preferences", (_event, preferences) => updateDisplayPreferences(preferences));
    ipcMain.handle("storage:create-backup", () => createManualBackup());
    ipcMain.handle("storage:restore-backup", (_event, fileName) => restoreManualBackup(fileName));
    ipcMain.handle("storage:restore-rolling-backup", () => restoreRollingBackup());
    ipcMain.handle("storage:export-backup", async (_event, fileName?: string) => {
      const defaultFileName = fileName || `deskpilot-current-${new Date().toISOString().slice(0, 10)}.sqlite`;
      const result = await showSaveDialog({
        title: "Export DeskPilot backup",
        defaultPath: path.join(app.getPath("downloads"), defaultFileName),
        filters: [{ name: "SQLite database", extensions: ["sqlite"] }]
      });

      if (result.canceled || !result.filePath) {
        return null;
      }

      const sourceFileName = typeof fileName === "string" && fileName.trim() ? fileName : null;
      return exportStorageBackup(sourceFileName, result.filePath);
    });
    ipcMain.handle("storage:import-backup", async () => {
      const result = await showOpenDialog({
        title: "Import DeskPilot backup",
        properties: ["openFile"],
        filters: [{ name: "SQLite database", extensions: ["sqlite"] }]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return importStorageBackup(result.filePaths[0]);
    });
    ipcMain.handle("categories:list", () => listCategories());
    ipcMain.handle("categories:active", () => getActiveCategoryId());
    ipcMain.handle("categories:set-active", (_event, id) => setActiveCategoryId(id));
    ipcMain.handle("categories:create", (_event, input) => createCategory(input));
    ipcMain.handle("categories:update", (_event, id, input) => updateCategory(id, input));
    ipcMain.handle("categories:delete", (_event, id) => deleteCategory(id));
    ipcMain.handle("categories:deleted", () => listDeletedCategories());
    ipcMain.handle("categories:restore", (_event, id) => restoreCategory(id));
    ipcMain.handle("tabs:list", (_event, categoryId) => listTabs(categoryId));
    ipcMain.handle("tabs:add", (_event, input) => addTab(input));
    ipcMain.handle("tabs:archive", (_event, id) => archiveTab(id));
    ipcMain.handle("tabs:delete", (_event, id) => deleteTab(id));
    ipcMain.handle("tabs:delete-archived-permanently", (_event, id) => deleteArchivedTabPermanently(id));
    ipcMain.handle("tabs:move", (_event, id, input) => moveTab(id, input));
    ipcMain.handle("tabs:open", async (_event, id) => {
      const tab = getActiveTab(id);

      if (tab) {
        await shell.openExternal(tab.url);
      }

      return tab;
    });
    ipcMain.handle("tabs:deleted", (_event, categoryId) => listDeletedTabs(categoryId));
    ipcMain.handle("tabs:archived", (_event, categoryId) => listArchivedTabs(categoryId));
    ipcMain.handle("tabs:restore", (_event, id) => restoreTab(id));
    ipcMain.handle("tabs:unarchive", (_event, id) => unarchiveTab(id));
    ipcMain.handle("categories:open", async (_event, categoryId) => {
      const category = listCategories().find((item) => item.id === categoryId);

      if (!category) {
        return [];
      }

      const tabs = listTabs(category.id);
      await openUrlsInNewBrowserWindow(
        tabs.map((tab) => tab.url),
        category.name,
        (url) => shell.openExternal(url)
      );

      return tabs;
    });

    isStorageInitialized = true;
    createMainWindow();
    void appUpdateService.checkAtStartup();

    try {
      createTray();
    } catch {
      tray = null;
    }

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow();
      } else {
        mainWindow?.show();
      }
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("before-quit", () => {
    isQuitting = true;
    if (bridgeServer?.listening) {
      bridgeServer.close();
    }
  });
}
