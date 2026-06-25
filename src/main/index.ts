import { app, BrowserWindow, ipcMain, nativeImage, nativeTheme, shell, Tray, Menu } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  addTab,
  createCategory,
  deleteCategory,
  deleteTab,
  initializeStorage,
  listDeletedCategories,
  listDeletedTabs,
  listCategories,
  listTabs,
  restoreCategory,
  restoreTab,
  updateCategory
} from "./storage.js";
import { getBrowserBridgeStatus, startBrowserBridge } from "./browserBridge.js";
import { loadWindowBounds, saveWindowBounds } from "./windowSettings.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
let bridgeServer: ReturnType<typeof startBrowserBridge> | null = null;

function createMainWindow(): void {
  const bounds = loadWindowBounds(app.getPath("userData"));

  mainWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    minWidth: 860,
    minHeight: 320,
    title: "DeskPilot",
    backgroundColor: nativeTheme.shouldUseDarkColors ? "#181a1f" : "#f7f5ef",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
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
      { label: "Show DeskPilot", click: () => mainWindow?.show() },
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

app.whenReady().then(async () => {
  await initializeStorage(app.getPath("userData"));
  bridgeServer = startBrowserBridge();
  ipcMain.handle("bridge:status", () => getBrowserBridgeStatus(bridgeServer));
  ipcMain.handle("categories:list", () => listCategories());
  ipcMain.handle("categories:create", (_event, input) => createCategory(input));
  ipcMain.handle("categories:update", (_event, id, input) => updateCategory(id, input));
  ipcMain.handle("categories:delete", (_event, id) => deleteCategory(id));
  ipcMain.handle("categories:deleted", () => listDeletedCategories());
  ipcMain.handle("categories:restore", (_event, id) => restoreCategory(id));
  ipcMain.handle("tabs:list", (_event, categoryId) => listTabs(categoryId));
  ipcMain.handle("tabs:add", (_event, input) => addTab(input));
  ipcMain.handle("tabs:delete", (_event, id) => deleteTab(id));
  ipcMain.handle("tabs:deleted", (_event, categoryId) => listDeletedTabs(categoryId));
  ipcMain.handle("tabs:restore", (_event, id) => restoreTab(id));
  ipcMain.handle("categories:open", async (_event, categoryId) => {
    const tabs = listTabs(categoryId);

    for (const tab of tabs) {
      await shell.openExternal(tab.url);
    }

    return tabs;
  });

  createMainWindow();

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
  bridgeServer?.close();
});
