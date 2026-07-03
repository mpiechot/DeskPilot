import { contextBridge, ipcRenderer } from "electron";
import type { DeskPilotApi } from "../shared/deskPilotApi.js" with { "resolution-mode": "import" };

const deskPilot: DeskPilotApi = {
  version: "0.1.0",
  bridgeStatus: () => ipcRenderer.invoke("bridge:status"),
  extensionInstallInfo: () => ipcRenderer.invoke("extension:install-info"),
  storageInfo: () => ipcRenderer.invoke("storage:info"),
  createStorageBackup: () => ipcRenderer.invoke("storage:create-backup"),
  restoreStorageBackup: (fileName) => ipcRenderer.invoke("storage:restore-backup", fileName),
  exportStorageBackup: (fileName) => ipcRenderer.invoke("storage:export-backup", fileName),
  importStorageBackup: () => ipcRenderer.invoke("storage:import-backup"),
  listCategories: () => ipcRenderer.invoke("categories:list"),
  getActiveCategory: () => ipcRenderer.invoke("categories:active"),
  setActiveCategory: (id) => ipcRenderer.invoke("categories:set-active", id),
  createCategory: (input) => ipcRenderer.invoke("categories:create", input),
  updateCategory: (id, input) => ipcRenderer.invoke("categories:update", id, input),
  deleteCategory: (id) => ipcRenderer.invoke("categories:delete", id),
  listDeletedCategories: () => ipcRenderer.invoke("categories:deleted"),
  restoreCategory: (id) => ipcRenderer.invoke("categories:restore", id),
  listTabs: (categoryId) => ipcRenderer.invoke("tabs:list", categoryId),
  addTab: (input) => ipcRenderer.invoke("tabs:add", input),
  deleteTab: (id) => ipcRenderer.invoke("tabs:delete", id),
  listDeletedTabs: (categoryId) => ipcRenderer.invoke("tabs:deleted", categoryId),
  restoreTab: (id) => ipcRenderer.invoke("tabs:restore", id),
  openCategory: (categoryId) => ipcRenderer.invoke("categories:open", categoryId),
  onSessionsChanged: (callback) => {
    const listener = () => callback();

    ipcRenderer.on("sessions:changed", listener);
    return () => ipcRenderer.removeListener("sessions:changed", listener);
  }
};

contextBridge.exposeInMainWorld("deskPilot", deskPilot);
