import type { SessionCategory } from "./sessions.js";

export type DeskPilotApi = {
  version: string;
  bridgeStatus: () => Promise<BridgeStatus>;
  extensionInstallInfo: () => Promise<ExtensionInstallInfo>;
  storageInfo: () => Promise<StorageBackupInfo>;
  createStorageBackup: () => Promise<StorageBackupInfo>;
  restoreStorageBackup: (fileName: string) => Promise<StorageRestoreResult>;
  exportStorageBackup: (fileName?: string) => Promise<StorageExportResult | null>;
  importStorageBackup: () => Promise<StorageRestoreResult | null>;
  listCategories: () => Promise<SessionCategory[]>;
  getActiveCategory: () => Promise<string>;
  setActiveCategory: (id: string) => Promise<string>;
  createCategory: (input: CategoryInput) => Promise<SessionCategory[]>;
  updateCategory: (id: string, input: CategoryInput) => Promise<SessionCategory[]>;
  deleteCategory: (id: string) => Promise<SessionCategory[]>;
  listDeletedCategories: () => Promise<SessionCategory[]>;
  restoreCategory: (id: string) => Promise<CategoryRecoveryResult>;
  listTabs: (categoryId: string) => Promise<SessionTab[]>;
  addTab: (input: SessionTabInput) => Promise<SessionMutationResult>;
  deleteTab: (id: string) => Promise<SessionMutationResult>;
  listDeletedTabs: (categoryId: string) => Promise<SessionTab[]>;
  restoreTab: (id: string) => Promise<SessionMutationResult>;
  openCategory: (categoryId: string) => Promise<SessionTab[]>;
  onSessionsChanged: (callback: () => void) => () => void;
};

export type CategoryInput = {
  name: string;
  description: string;
};

export type BridgeStatus = {
  running: boolean;
  host: string;
  port: number;
  allowedOrigins: string[];
};

export type ExtensionInstallInfo = {
  extensionPath: string;
  manifestPath: string;
  manifestPresent: boolean;
  supportedBrowsers: string[];
};

export type StorageBackupInfo = {
  databasePath: string;
  rollingBackupPath: string;
  manualBackupDirectory: string;
  manualBackups: StorageBackupSnapshot[];
};

export type StorageBackupSnapshot = {
  fileName: string;
  path: string;
  createdAt: string;
  sizeBytes: number;
};

export type StorageRestoreResult = {
  storageInfo: StorageBackupInfo;
  categories: SessionCategory[];
  deletedCategories: SessionCategory[];
  selectedCategoryId: string;
  tabs: SessionTab[];
  deletedTabs: SessionTab[];
  restoredFrom: string;
  safetyBackupFileName: string;
};

export type StorageExportResult = {
  filePath: string;
  storageInfo: StorageBackupInfo;
};

export type CaptureMode = "append" | "replace";

export type CrossCategoryDuplicatePolicy = "ask" | "allow" | "skip" | "ignore";

export type SaveStatus = "saved" | "already-saved" | "restored" | "skipped-cross-category-duplicate";

export type CategoryRow = {
  id: string;
  name: string;
  description: string;
  position: number;
  is_favorite: number;
  tab_count: number;
  last_saved_at: string | null;
};

export type SessionTab = {
  id: string;
  categoryId: string;
  url: string;
  title: string;
  savedAt: string;
};

export type SessionTabInput = {
  categoryId: string;
  url: string;
  title: string;
};

export type SessionMutationResult = {
  categories: SessionCategory[];
  tabs: SessionTab[];
  saveStatus?: SaveStatus;
};

export type CaptureResult = SessionMutationResult & {
  savedCount: number;
  restoredCount: number;
  skippedSameCategoryDuplicateCount: number;
  skippedCrossCategoryDuplicateCount: number;
  skippedUnsupportedCount: number;
  confirmationRequired: boolean;
  duplicateCategoryNames: string[];
  savedUrls: string[];
  mode: CaptureMode;
};

export type CategoryRecoveryResult = {
  categories: SessionCategory[];
  deletedCategories: SessionCategory[];
};

export type SessionTabRow = {
  id: string;
  category_id: string;
  url: string;
  title: string;
  saved_at: string;
};
