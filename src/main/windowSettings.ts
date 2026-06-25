import fs from "node:fs";
import path from "node:path";
import type { Rectangle } from "electron";

type WindowSettings = {
  bounds?: Rectangle;
};

const defaultBounds: Rectangle = {
  x: 80,
  y: 80,
  width: 1180,
  height: 390
};

export function loadWindowBounds(userDataPath: string): Rectangle {
  const settings = readSettings(userDataPath);

  if (!settings.bounds || !isValidBounds(settings.bounds)) {
    return defaultBounds;
  }

  return settings.bounds;
}

export function saveWindowBounds(userDataPath: string, bounds: Rectangle): void {
  if (!isValidBounds(bounds)) {
    return;
  }

  const paths = getSettingsPaths(userDataPath);
  fs.mkdirSync(path.dirname(paths.settingsPath), { recursive: true });

  const nextSettings: WindowSettings = {
    ...readSettings(userDataPath),
    bounds
  };

  if (fs.existsSync(paths.settingsPath)) {
    fs.copyFileSync(paths.settingsPath, paths.backupPath);
  }

  fs.writeFileSync(paths.temporaryPath, JSON.stringify(nextSettings, null, 2));
  fs.renameSync(paths.temporaryPath, paths.settingsPath);
}

function readSettings(userDataPath: string): WindowSettings {
  const { settingsPath } = getSettingsPaths(userDataPath);

  if (!fs.existsSync(settingsPath)) {
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(settingsPath, "utf-8")) as WindowSettings;
  } catch {
    return {};
  }
}

function getSettingsPaths(userDataPath: string) {
  const settingsDirectory = path.join(userDataPath, "settings");

  return {
    settingsPath: path.join(settingsDirectory, "window.json"),
    backupPath: path.join(settingsDirectory, "window.json.bak"),
    temporaryPath: path.join(settingsDirectory, "window.json.tmp")
  };
}

function isValidBounds(bounds: Rectangle): boolean {
  return (
    Number.isFinite(bounds.x) &&
    Number.isFinite(bounds.y) &&
    Number.isFinite(bounds.width) &&
    Number.isFinite(bounds.height) &&
    bounds.width >= 860 &&
    bounds.height >= 320
  );
}
