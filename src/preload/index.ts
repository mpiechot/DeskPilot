import { contextBridge, ipcRenderer } from "electron";
import type { DeskPilotApi } from "../shared/deskPilotApi.js";

const deskPilot: DeskPilotApi = {
  version: "0.1.0",
  bridgeStatus: () => ipcRenderer.invoke("bridge:status"),
  extensionInstallInfo: () => ipcRenderer.invoke("extension:install-info"),
  listCategories: () => ipcRenderer.invoke("categories:list"),
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
  openCategory: (categoryId) => ipcRenderer.invoke("categories:open", categoryId)
};

contextBridge.exposeInMainWorld("deskPilot", deskPilot);
