import { app, BrowserWindow, ipcMain, nativeTheme, shell, Tray, Menu } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  addTab,
  createCategory,
  deleteCategory,
  deleteTab,
  initializeStorage,
  listCategories,
  listTabs,
  updateCategory
} from "./storage.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 390,
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

  if (process.env.VITE_DEV_SERVER_URL) {
    void mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    void mainWindow.loadFile(path.join(__dirname, "../../dist/index.html"));
  }
}

function createTray(): void {
  tray = new Tray(path.join(__dirname, "../../assets/tray-icon.png"));
  tray.setToolTip("DeskPilot");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Show DeskPilot", click: () => mainWindow?.show() },
      { type: "separator" },
      { label: "Quit", click: () => app.quit() }
    ])
  );
}

app.whenReady().then(async () => {
  await initializeStorage(app.getPath("userData"));
  ipcMain.handle("categories:list", () => listCategories());
  ipcMain.handle("categories:create", (_event, input) => createCategory(input));
  ipcMain.handle("categories:update", (_event, id, input) => updateCategory(id, input));
  ipcMain.handle("categories:delete", (_event, id) => deleteCategory(id));
  ipcMain.handle("tabs:list", (_event, categoryId) => listTabs(categoryId));
  ipcMain.handle("tabs:add", (_event, input) => addTab(input));
  ipcMain.handle("tabs:delete", (_event, id) => deleteTab(id));
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
