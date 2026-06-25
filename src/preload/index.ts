import { contextBridge, ipcRenderer } from "electron";
import type { DeskPilotApi } from "../shared/deskPilotApi.js";

const deskPilot: DeskPilotApi = {
  version: "0.1.0",
  listCategories: () => ipcRenderer.invoke("categories:list"),
  createCategory: (input) => ipcRenderer.invoke("categories:create", input),
  updateCategory: (id, input) => ipcRenderer.invoke("categories:update", id, input),
  deleteCategory: (id) => ipcRenderer.invoke("categories:delete", id)
};

contextBridge.exposeInMainWorld("deskPilot", deskPilot);
