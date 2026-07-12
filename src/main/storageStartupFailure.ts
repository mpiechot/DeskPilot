import path from "node:path";
import type { MessageBoxOptions } from "electron";
import { StorageStartupError } from "./storage.js";

export type StorageStartupFailurePrompt = {
  storageDirectory: string;
  options: MessageBoxOptions;
};

export function createStorageStartupFailurePrompt(
  error: unknown,
  fallbackStorageDirectory = process.cwd()
): StorageStartupFailurePrompt {
  const startupError = error instanceof StorageStartupError ? error : null;
  const storageDirectory = startupError?.storageDirectory ?? fallbackStorageDirectory;
  const activeDatabasePath = startupError?.activeDatabasePath ?? path.join(storageDirectory, "deskpilot.sqlite");
  const rollingBackupPath = startupError?.rollingBackupPath ?? path.join(storageDirectory, "deskpilot.sqlite.bak");
  const activeError = startupError?.activeDatabaseError ?? describeError(error);
  const rollingError = startupError?.rollingBackupError ?? "Automatic recovery was not available.";

  return {
    storageDirectory,
    options: {
      type: "error",
      title: "DeskPilot storage recovery required",
      message: "DeskPilot could not open the active database or recover from the automatic rolling backup.",
      detail: [
        "DeskPilot did not modify either file.",
        "",
        `Active database: ${activeDatabasePath}`,
        `Active error: ${activeError}`,
        "",
        `Rolling backup: ${rollingBackupPath}`,
        `Backup error: ${rollingError}`,
        "",
        "Open the storage folder and preserve both files. To continue, import a known valid DeskPilot backup or move both unusable files aside before restarting."
      ].join("\n"),
      buttons: ["Open Storage Folder", "Quit"],
      defaultId: 0,
      cancelId: 1,
      noLink: true
    }
  };
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
