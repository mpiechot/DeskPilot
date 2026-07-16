import fs from "node:fs";
import path from "node:path";
import type { Rectangle } from "electron";
import type { WindowPreferences } from "../shared/deskPilotApi.js";

type WindowSettings = {
  bounds?: Rectangle;
  preferences?: WindowPreferences;
};

export type DisplayWorkArea = {
  id: string;
  workArea: Rectangle;
};

const defaultBounds: Rectangle = {
  x: 80,
  y: 80,
  width: 1180,
  height: 390
};

const defaultPreferences: WindowPreferences = {
  layoutMode: "standard",
  displayId: null,
  kiosk: false
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

  writeSettings(userDataPath, {
    ...readSettings(userDataPath),
    bounds
  });
}

export function loadWindowPreferences(userDataPath: string): WindowPreferences {
  const preferences = readSettings(userDataPath).preferences;

  if (!preferences || !isValidPreferences(preferences)) {
    return defaultPreferences;
  }

  return preferences;
}

export function saveWindowPreferences(userDataPath: string, preferences: WindowPreferences): void {
  if (!isValidPreferences(preferences)) {
    throw new Error("Window preferences are invalid.");
  }

  writeSettings(userDataPath, {
    ...readSettings(userDataPath),
    preferences
  });
}

export function resolveWindowBounds(
  bounds: Rectangle,
  preferences: WindowPreferences,
  displays: DisplayWorkArea[]
): Rectangle {
  const selectedDisplay = preferences.displayId
    ? displays.find((display) => display.id === preferences.displayId)
    : null;

  if (!selectedDisplay) {
    return bounds;
  }

  const workArea = selectedDisplay.workArea;
  const width = Math.min(bounds.width, workArea.width);
  const height = Math.min(bounds.height, workArea.height);
  const isAlreadyOnDisplay =
    bounds.x >= workArea.x &&
    bounds.y >= workArea.y &&
    bounds.x + width <= workArea.x + workArea.width &&
    bounds.y + height <= workArea.y + workArea.height;

  if (isAlreadyOnDisplay) {
    return { ...bounds, width, height };
  }

  return {
    x: Math.min(workArea.x + 32, workArea.x + workArea.width - width),
    y: Math.min(workArea.y + 32, workArea.y + workArea.height - height),
    width,
    height
  };
}

function writeSettings(userDataPath: string, nextSettings: WindowSettings): void {
  const paths = getSettingsPaths(userDataPath);
  fs.mkdirSync(path.dirname(paths.settingsPath), { recursive: true });

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

function isValidPreferences(preferences: WindowPreferences): boolean {
  return (
    (preferences.layoutMode === "standard" || preferences.layoutMode === "touch") &&
    (preferences.displayId === null || (typeof preferences.displayId === "string" && preferences.displayId.length > 0)) &&
    typeof preferences.kiosk === "boolean"
  );
}
