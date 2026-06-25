import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("deskPilot", {
  version: "0.1.0"
});
