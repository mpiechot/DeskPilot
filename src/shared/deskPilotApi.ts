import type { SessionCategory } from "./sessions.js";
import type { CategoryIconName } from "./categoryIcons.js";

export type DeskPilotApi = {
  version: string;
  bridgeStatus: () => Promise<BridgeStatus>;
  extensionInstallInfo: () => Promise<ExtensionInstallInfo>;
  storageInfo: () => Promise<StorageBackupInfo>;
  displaySettings: () => Promise<DisplaySettingsInfo>;
  updateDisplayPreferences: (preferences: WindowPreferences) => Promise<DisplaySettingsInfo>;
  createStorageBackup: () => Promise<StorageBackupInfo>;
  restoreStorageBackup: (fileName: string) => Promise<StorageRestoreResult>;
  restoreRollingStorageBackup: () => Promise<StorageRestoreResult>;
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
  archiveTab: (id: string) => Promise<SessionMutationResult>;
  deleteTab: (id: string) => Promise<SessionMutationResult>;
  deleteArchivedTabPermanently: (id: string) => Promise<SessionMutationResult>;
  moveTab: (id: string, input: MoveTabInput) => Promise<SessionMutationResult>;
  openTab: (id: string) => Promise<SessionTab | null>;
  listDeletedTabs: (categoryId: string) => Promise<SessionTab[]>;
  listArchivedTabs: (categoryId: string) => Promise<SessionTab[]>;
  restoreTab: (id: string) => Promise<SessionMutationResult>;
  unarchiveTab: (id: string) => Promise<SessionMutationResult>;
  openCategory: (categoryId: string) => Promise<SessionTab[]>;
  onSessionsChanged: (callback: () => void) => () => void;
};

export type CategoryInput = {
  name: string;
  description: string;
  icon?: CategoryIconName;
};

export type BridgeStatus = {
  running: boolean;
  host: string;
  port: number;
  allowedOrigins: string[];
  dataProfile?: DataProfileInfo;
};

export type ExtensionInstallInfo = {
  extensionPath: string;
  manifestPath: string;
  manifestPresent: boolean;
  supportedBrowsers: string[];
};

export type StorageBackupInfo = {
  dataProfile: DataProfileInfo;
  startupRecovery: StorageStartupRecoveryInfo;
  databasePath: string;
  rollingBackupPath: string;
  rollingBackup: StorageBackupSnapshot | null;
  manualBackupDirectory: string;
  manualBackups: StorageBackupSnapshot[];
};

export type WindowLayoutMode = "standard" | "touch";

export type WindowPreferences = {
  layoutMode: WindowLayoutMode;
  displayId: string | null;
  kiosk: boolean;
};

export type DisplayDescriptor = {
  id: string;
  label: string;
  primary: boolean;
  width: number;
  height: number;
};

export type DisplaySettingsInfo = {
  preferences: WindowPreferences;
  displays: DisplayDescriptor[];
};

export type StorageStartupRecoveryStatus = "not-needed" | "recovered-from-rolling";

export type StorageStartupRecoveryInfo = {
  status: StorageStartupRecoveryStatus;
  message: string;
  recoveredAt?: string;
  rollingBackupPath?: string;
  corruptDatabaseBackupPath?: string;
};

export type DataProfileId = "development" | "productive";

export type DataProfileCutoverStatus =
  | "not-applicable"
  | "copied-from-legacy"
  | "no-legacy-source"
  | "already-created";

export type DataProfileCutoverInfo = {
  status: DataProfileCutoverStatus;
  automaticMigrationComplete: boolean;
  message: string;
  completedAt?: string;
  sourceDatabasePath?: string;
};

export type DataProfileInfo = {
  id: DataProfileId;
  label: string;
  description: string;
  storageDirectory: string;
  databasePath: string;
  legacyDatabasePath: string;
  developmentDatabasePath: string;
  productiveDatabasePath: string;
  profileStatePath: string;
  cutover: DataProfileCutoverInfo;
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
  archivedTabs: SessionTab[];
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
  icon: string | null;
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
  position: number;
  savedAt: string;
};

export type SessionTabInput = {
  categoryId: string;
  url: string;
  title: string;
};

export type MoveTabInput = {
  targetCategoryId: string;
  targetPosition: number;
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
  position: number;
  saved_at: string;
};
