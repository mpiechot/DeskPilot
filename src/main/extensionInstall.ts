import fs from "node:fs";
import path from "node:path";
import type { ExtensionInstallInfo } from "../shared/deskPilotApi.js";

export function getExtensionInstallInfo(projectRoot: string): ExtensionInstallInfo {
  const extensionPath = path.join(projectRoot, "browser-extension");
  const manifestPath = path.join(extensionPath, "manifest.json");

  return {
    extensionPath,
    manifestPath,
    manifestPresent: fs.existsSync(manifestPath),
    supportedBrowsers: ["Chrome", "Edge"]
  };
}
