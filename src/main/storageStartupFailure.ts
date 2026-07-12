import path from "node:path";
import fs from "node:fs";
import type { MessageBoxOptions } from "electron";
import { StorageStartupError } from "./storage.js";

export type StorageStartupFailurePrompt = {
  storageDirectory: string;
  activeDatabasePath: string;
  rollingBackupPath: string;
  options: MessageBoxOptions;
};

export type StorageRecoveryExportResult = {
  sourcePath: string;
  targetPath: string;
  sizeBytes: number;
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
    activeDatabasePath,
    rollingBackupPath,
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
        "Export either file for safekeeping or open the storage folder. To continue, import a known valid DeskPilot backup or move both unusable files aside before restarting."
      ].join("\n"),
      buttons: ["Export Active Database", "Export Rolling Backup", "Open Storage Folder", "Quit"],
      defaultId: 0,
      cancelId: 3,
      noLink: true
    }
  };
}

export function exportStorageRecoveryFile(
  sourcePath: string,
  targetPath: string,
  protectedSourcePaths: string[] = [sourcePath]
): StorageRecoveryExportResult {
  const resolvedTargetPath = path.resolve(targetPath);

  if (protectedSourcePaths.some((protectedPath) => path.resolve(protectedPath) === resolvedTargetPath)) {
    throw new Error("Recovery export target must not overwrite a DeskPilot source file.");
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  fs.copyFileSync(sourcePath, targetPath);

  return {
    sourcePath,
    targetPath,
    sizeBytes: fs.statSync(targetPath).size
  };
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
