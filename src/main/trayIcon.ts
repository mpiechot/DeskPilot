import { nativeImage, type NativeImage } from "electron";
import path from "node:path";

const trayIconRelativePath = path.join("browser-extension", "icons", "deskpilot-32.png");

export function getTrayIconPath(projectRoot: string): string {
  return path.join(projectRoot, trayIconRelativePath);
}

export function createTrayIcon(projectRoot: string): NativeImage {
  const iconPath = getTrayIconPath(projectRoot);
  const icon = nativeImage.createFromPath(iconPath);

  if (icon.isEmpty()) {
    throw new Error(`DeskPilot tray icon could not be loaded from ${iconPath}.`);
  }

  return icon;
}
