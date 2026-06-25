import { contextBridge, ipcRenderer } from "electron";
import type { DeskPilotApi } from "../shared/deskPilotApi.js";

const deskPilot: DeskPilotApi = {
  version: "0.1.0",
  listCategories: () => ipcRenderer.invoke("categories:list")
};

contextBridge.exposeInMainWorld("deskPilot", deskPilot);
