import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { defaultCategories, type SessionCategory } from "../shared/sessions.js";
import type {
  CaptureMode,
  CaptureResult,
  CategoryInput,
  CategoryRow,
  CategoryRecoveryResult,
  CrossCategoryDuplicatePolicy,
  DataProfileId,
  DataProfileInfo,
  MoveTabInput,
  SaveStatus,
  SessionMutationResult,
  SessionTab,
  SessionTabInput,
  SessionTabRow,
  StorageExportResult,
  StorageBackupInfo,
  StorageBackupSnapshot,
  StorageRestoreResult,
  StorageStartupRecoveryInfo
} from "../shared/deskPilotApi.js";
import { prepareDataProfile } from "./dataProfile.js";

const storageModuleDirectory = path.dirname(fileURLToPath(import.meta.url));

type StoragePaths = {
  databasePath: string;
  backupPath: string;
  manualBackupDirectory: string;
  temporaryPath: string;
};

export class StorageStartupError extends Error {
  readonly activeDatabasePath: string;
  readonly rollingBackupPath: string;
  readonly storageDirectory: string;
  readonly activeDatabaseError: string;
  readonly rollingBackupError: string;

  constructor(storagePaths: StoragePaths, activeDatabaseError: unknown, rollingBackupError: unknown) {
    super("DeskPilot could not open the active database or the automatic rolling backup.");
    this.name = "StorageStartupError";
    this.activeDatabasePath = storagePaths.databasePath;
    this.rollingBackupPath = storagePaths.backupPath;
    this.storageDirectory = path.dirname(storagePaths.databasePath);
    this.activeDatabaseError = describeError(activeDatabaseError);
    this.rollingBackupError = describeError(rollingBackupError);
  }
}

type SaveTabOptions = {
  crossCategoryDuplicatePolicy: CrossCategoryDuplicatePolicy;
};

type CaptureSaveOptions = {
  crossCategoryDuplicatePolicy?: CrossCategoryDuplicatePolicy;
  skippedUnsupportedCount?: number;
};

type SaveTabOutcome = {
  status: SaveStatus;
  savedCount: number;
  restoredCount: number;
  skippedSameCategoryDuplicateCount: number;
  skippedCrossCategoryDuplicateCount: number;
  confirmationRequired: boolean;
  duplicateCategoryNames: string[];
  savedUrls: string[];
};

type TabOrderRow = {
  id: string;
  category_id: string;
  deleted_at: string | null;
  archived_at: string | null;
  position: number;
  saved_at: string;
};

type ActiveTabPlacementRow = {
  category_id: string;
  position: number;
  url: string;
};

let sqlite: SqlJsStatic | null = null;
let database: Database | null = null;
let paths: StoragePaths | null = null;
let dataProfile: DataProfileInfo | null = null;
let startupRecovery: StorageStartupRecoveryInfo = createNoStartupRecoveryInfo();

type InitializeStorageOptions = {
  profile?: DataProfileId;
  disallowProductive?: boolean;
};

export async function initializeStorage(userDataPath: string, options: InitializeStorageOptions = {}): Promise<void> {
  const nextDataProfile = prepareDataProfile(userDataPath, options);
  const nextPaths = getStoragePaths(nextDataProfile.storageDirectory);
  fs.mkdirSync(path.dirname(nextPaths.databasePath), { recursive: true });

  const SQL =
    sqlite ??
    (await initSqlJs({
      locateFile: (file) => path.resolve(storageModuleDirectory, "../../node_modules/sql.js/dist", file)
    }));
  sqlite = SQL;

  const activeDatabaseExists = fs.existsSync(nextPaths.databasePath);
  let nextDatabase: Database | null = null;
  let nextStartupRecovery = createNoStartupRecoveryInfo();

  try {
    nextDatabase = activeDatabaseExists
      ? new SQL.Database(fs.readFileSync(nextPaths.databasePath))
      : new SQL.Database();
    migrate(nextDatabase);
    seedDefaultCategories(nextDatabase);
  } catch (error) {
    nextDatabase?.close();

    if (!activeDatabaseExists) {
      throw error;
    }

    const recovered = recoverStartupDatabase(SQL, nextPaths, error);
    nextDatabase = recovered.database;
    nextStartupRecovery = recovered.info;
  }

  database?.close();
  database = nextDatabase;
  paths = nextPaths;
  dataProfile = nextDataProfile;
  startupRecovery = nextStartupRecovery;
  saveDatabase({ preserveRollingBackup: nextStartupRecovery.status === "recovered-from-rolling" });
}

export function getDataProfileInfo(): DataProfileInfo {
  if (!dataProfile) {
    throw new Error("DeskPilot data profile has not been initialized.");
  }

  return dataProfile;
}

function getStoragePaths(storageDirectory: string): StoragePaths {
  return {
    databasePath: path.join(storageDirectory, "deskpilot.sqlite"),
    backupPath: path.join(storageDirectory, "deskpilot.sqlite.bak"),
    manualBackupDirectory: path.join(storageDirectory, "manual-backups"),
    temporaryPath: path.join(storageDirectory, "deskpilot.sqlite.tmp")
  };
}

export function getStorageInfo(): StorageBackupInfo {
  const storagePaths = getPaths();

  return {
    dataProfile: getDataProfileInfo(),
    startupRecovery,
    databasePath: storagePaths.databasePath,
    rollingBackupPath: storagePaths.backupPath,
    rollingBackup: getBackupSnapshot(storagePaths.backupPath),
    manualBackupDirectory: storagePaths.manualBackupDirectory,
    manualBackups: listManualBackups(storagePaths.manualBackupDirectory)
  };
}

export function createManualBackup(): StorageBackupInfo {
  const storagePaths = getPaths();

  fs.mkdirSync(storagePaths.manualBackupDirectory, { recursive: true });
  saveDatabase();
  fs.copyFileSync(storagePaths.databasePath, createManualBackupPath(storagePaths.manualBackupDirectory, new Date(), "deskpilot"));

  return getStorageInfo();
}

export function restoreManualBackup(fileName: string): StorageRestoreResult {
  const backupPath = resolveManualBackupPath(fileName);

  validateDeskPilotDatabaseFile(backupPath);
  const safetyBackupPath = createSafetyBackup("pre-restore");
  replaceActiveDatabase(backupPath);

  return createStorageRestoreResult(backupPath, safetyBackupPath);
}

export function restoreRollingBackup(): StorageRestoreResult {
  const rollingBackupPath = getPaths().backupPath;

  if (!fs.existsSync(rollingBackupPath)) {
    throw new Error("Rolling backup does not exist yet.");
  }

  const rollingBackupContents = fs.readFileSync(rollingBackupPath);
  validateDeskPilotDatabaseContents(rollingBackupContents);
  const safetyBackupPath = createSafetyBackup("pre-restore");
  replaceActiveDatabaseContents(rollingBackupContents);

  return createStorageRestoreResult(rollingBackupPath, safetyBackupPath);
}

export function exportStorageBackup(fileName: string | null, targetPath: string): StorageExportResult {
  const sourcePath = fileName ? resolveManualBackupPath(fileName) : getPaths().databasePath;
  const safeTargetPath = normalizeRequiredString(targetPath, "Export target path is required.");

  validateDeskPilotDatabaseFile(sourcePath);
  fs.mkdirSync(path.dirname(safeTargetPath), { recursive: true });
  fs.copyFileSync(sourcePath, safeTargetPath);

  return {
    filePath: safeTargetPath,
    storageInfo: getStorageInfo()
  };
}

export function importStorageBackup(sourcePath: string): StorageRestoreResult {
  const safeSourcePath = normalizeRequiredString(sourcePath, "Import source path is required.");

  validateDeskPilotDatabaseFile(safeSourcePath);
  const safetyBackupPath = createSafetyBackup("pre-import");
  replaceActiveDatabase(safeSourcePath);

  return createStorageRestoreResult(safeSourcePath, safetyBackupPath);
}

export function listCategories(): SessionCategory[] {
  return listCategoryRows("c.deleted_at IS NULL");
}

export function getActiveCategoryId(): string {
  return resolveActiveCategoryId(getDatabase());
}

export function setActiveCategoryId(id: string): string {
  const db = getDatabase();
  const safeId = normalizeCategoryId(id);

  assertActiveCategoryExists(db, safeId);
  setAppStateValue(db, "activeCategoryId", safeId);
  saveDatabase();

  return safeId;
}

export function createCategory(input: CategoryInput): SessionCategory[] {
  const db = getDatabase();
  const normalized = normalizeCategoryInput(input);
  const id = createCategoryId(normalized.name);
  const position = getNextCategoryPosition(db);

  db.run(
    `
      INSERT INTO categories (id, name, description, position)
      VALUES ($id, $name, $description, $position)
    `,
    {
      $id: id,
      $name: normalized.name,
      $description: normalized.description,
      $position: position
    }
  );

  resolveActiveCategoryId(db);
  saveDatabase();
  return listCategories();
}

export function updateCategory(id: string, input: CategoryInput): SessionCategory[] {
  const db = getDatabase();
  const normalized = normalizeCategoryInput(input);
  const safeId = normalizeCategoryId(id);

  db.run(
    `
      UPDATE categories
      SET name = $name,
          description = $description,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $id AND deleted_at IS NULL
    `,
    {
      $id: safeId,
      $name: normalized.name,
      $description: normalized.description
    }
  );

  resolveActiveCategoryId(db);
  saveDatabase();
  return listCategories();
}

export function deleteCategory(id: string): SessionCategory[] {
  const db = getDatabase();
  const safeId = normalizeCategoryId(id);

  db.run(
    `
      UPDATE categories
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $id AND deleted_at IS NULL
    `,
    {
      $id: safeId
    }
  );

  resolveActiveCategoryId(db);
  saveDatabase();
  return listCategories();
}

export function listDeletedCategories(): SessionCategory[] {
  return listCategoryRows("c.deleted_at IS NOT NULL");
}

export function restoreCategory(id: string): CategoryRecoveryResult {
  const db = getDatabase();
  const safeId = normalizeCategoryId(id);

  db.run(
    `
      UPDATE categories
      SET deleted_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $id AND deleted_at IS NOT NULL
    `,
    {
      $id: safeId
    }
  );

  resolveActiveCategoryId(db);
  saveDatabase();
  return {
    categories: listCategories(),
    deletedCategories: listDeletedCategories()
  };
}

export function listTabs(categoryId: string): SessionTab[] {
  return listTabsByState(categoryId, "active");
}

export function listDeletedTabs(categoryId: string): SessionTab[] {
  return listTabsByState(categoryId, "deleted");
}

export function listArchivedTabs(categoryId: string): SessionTab[] {
  return listTabsByState(categoryId, "archived");
}

export function getActiveTab(id: string): SessionTab | null {
  const db = getDatabase();
  const safeId = normalizeRequiredString(id, "Tab id is required.");
  const result = db.exec(
    `
      SELECT id, category_id, url, title, position, saved_at
      FROM session_tabs
      WHERE id = $id AND deleted_at IS NULL AND archived_at IS NULL
      LIMIT 1
    `,
    {
      $id: safeId
    }
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  const row = Object.fromEntries(columns.map((column, index) => [column, result[0].values[0][index]])) as SessionTabRow;
  return mapSessionTabRow(row);
}

function listTabsByState(categoryId: string, state: "active" | "archived" | "deleted"): SessionTab[] {
  const db = getDatabase();
  const safeCategoryId = normalizeCategoryId(categoryId);
  const stateClause =
    state === "deleted"
      ? "deleted_at IS NOT NULL"
      : state === "archived"
        ? "deleted_at IS NULL AND archived_at IS NOT NULL"
        : "deleted_at IS NULL AND archived_at IS NULL";
  const result = db.exec(
    `
      SELECT id, category_id, url, title, position, saved_at
      FROM session_tabs
      WHERE category_id = $categoryId AND ${stateClause}
      ORDER BY position ASC, saved_at ASC, id ASC
    `,
    {
      $categoryId: safeCategoryId
    }
  );

  if (result.length === 0) {
    return [];
  }

  const columns = result[0].columns;
  return result[0].values.map((value) => {
    const row = Object.fromEntries(columns.map((column, index) => [column, value[index]])) as SessionTabRow;
    return mapSessionTabRow(row);
  });
}

export function addTab(input: SessionTabInput): SessionMutationResult {
  const db = getDatabase();
  const normalized = normalizeTabInput(input);
  const outcome = saveTab(db, normalized, { crossCategoryDuplicatePolicy: "ignore" });

  saveDatabase();
  return {
    categories: listCategories(),
    tabs: listTabs(normalized.categoryId),
    saveStatus: outcome.status
  };
}

export function saveCapturedTab(categoryId: string, tab: SessionTabInput, options: CaptureSaveOptions = {}): CaptureResult {
  return saveCapturedTabs(categoryId, [tab], "append", options);
}

export function saveCapturedTabs(
  categoryId: string,
  tabs: SessionTabInput[],
  mode: CaptureMode,
  options: CaptureSaveOptions = {}
): CaptureResult {
  const db = getDatabase();
  const safeCategoryId = normalizeCategoryId(categoryId);
  const safeMode = normalizeCaptureMode(mode);
  const crossCategoryDuplicatePolicy = options.crossCategoryDuplicatePolicy ?? "ask";

  assertActiveCategoryExists(db, safeCategoryId);
  const normalizedTabs = tabs.map((tab) => normalizeTabInput({ ...tab, categoryId: safeCategoryId }));

  if (normalizedTabs.length === 0) {
    return createCaptureResult(safeCategoryId, safeMode, createEmptySaveOutcome(), options.skippedUnsupportedCount ?? 0);
  }

  if (safeMode === "append" && crossCategoryDuplicatePolicy === "ask") {
    const duplicateCategoryNames = getCrossCategoryDuplicateNamesForTabs(db, safeCategoryId, normalizedTabs);

    if (duplicateCategoryNames.length > 0) {
      return createCaptureResult(safeCategoryId, safeMode, {
        status: "skipped-cross-category-duplicate",
        savedCount: 0,
        restoredCount: 0,
        skippedSameCategoryDuplicateCount: 0,
        skippedCrossCategoryDuplicateCount: 0,
        confirmationRequired: true,
        duplicateCategoryNames,
        savedUrls: []
      }, options.skippedUnsupportedCount ?? 0);
    }
  }

  if (safeMode === "replace") {
    db.run(
      `
        UPDATE session_tabs
        SET deleted_at = CURRENT_TIMESTAMP
        WHERE category_id = $categoryId AND deleted_at IS NULL AND archived_at IS NULL
      `,
      {
        $categoryId: safeCategoryId
      }
    );
  }

  const total = createEmptySaveOutcome();

  for (const tab of normalizedTabs) {
    const outcome = saveTab(db, tab, {
      crossCategoryDuplicatePolicy: safeMode === "replace" ? "ignore" : crossCategoryDuplicatePolicy
    });

    mergeSaveOutcome(total, outcome);
  }

  saveDatabase();
  return createCaptureResult(safeCategoryId, safeMode, total, options.skippedUnsupportedCount ?? 0);
}

export function deleteTab(id: string): SessionMutationResult {
  const db = getDatabase();
  const safeId = normalizeRequiredString(id, "Tab id is required.");
  const categoryId = getTabCategoryId(db, safeId);

  db.run(
    `
      UPDATE session_tabs
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $id AND deleted_at IS NULL AND archived_at IS NULL
    `,
    {
      $id: safeId
    }
  );

  saveDatabase();
  return {
    categories: listCategories(),
    tabs: categoryId ? listTabs(categoryId) : []
  };
}

export function moveTab(id: string, input: MoveTabInput): SessionMutationResult {
  const db = getDatabase();
  const safeId = normalizeRequiredString(id, "Tab id is required.");
  const targetCategoryId = normalizeCategoryId(input.targetCategoryId);
  const targetPosition = normalizeTabPosition(input.targetPosition);

  assertActiveCategoryExists(db, targetCategoryId);
  const currentPlacement = getActiveTabPlacement(db, safeId);

  if (!currentPlacement) {
    throw new Error("Saved tab is not active.");
  }

  if (
    currentPlacement.category_id !== targetCategoryId &&
    hasActiveTabUrlInCategoryExcept(db, targetCategoryId, currentPlacement.url, safeId)
  ) {
    throw new Error("Target category already contains this URL.");
  }

  db.run("BEGIN TRANSACTION");

  try {
    if (currentPlacement.category_id !== targetCategoryId) {
      db.run(
        `
          UPDATE session_tabs
          SET category_id = $targetCategoryId
          WHERE id = $id AND deleted_at IS NULL AND archived_at IS NULL
        `,
        {
          $id: safeId,
          $targetCategoryId: targetCategoryId
        }
      );
    }

    const affectedCategoryIds = new Set([currentPlacement.category_id, targetCategoryId]);

    for (const categoryId of affectedCategoryIds) {
      const orderedIds = getActiveTabIds(db, categoryId).filter((tabId) => tabId !== safeId);

      if (categoryId === targetCategoryId) {
        orderedIds.splice(Math.min(targetPosition, orderedIds.length), 0, safeId);
      }

      rewriteTabPositions(db, categoryId, orderedIds);
    }

    db.run("COMMIT");
  } catch (error) {
    db.run("ROLLBACK");
    throw error;
  }

  saveDatabase();
  return {
    categories: listCategories(),
    tabs: listTabs(targetCategoryId)
  };
}

export function restoreTab(id: string): SessionMutationResult {
  const db = getDatabase();
  const safeId = normalizeRequiredString(id, "Tab id is required.");
  const categoryId = getTabCategoryId(db, safeId);
  const position = categoryId ? getNextTabPosition(db, categoryId) : 0;

  db.run(
    `
      UPDATE session_tabs
      SET position = $position,
          saved_at = CURRENT_TIMESTAMP,
          deleted_at = NULL
      WHERE id = $id AND deleted_at IS NOT NULL
    `,
    {
      $id: safeId,
      $position: position
    }
  );

  saveDatabase();
  return {
    categories: listCategories(),
    tabs: categoryId ? listTabs(categoryId) : []
  };
}

function listManualBackups(manualBackupDirectory: string): StorageBackupSnapshot[] {
  if (!fs.existsSync(manualBackupDirectory)) {
    return [];
  }

  return fs
    .readdirSync(manualBackupDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sqlite"))
    .map((entry) => getBackupSnapshot(path.join(manualBackupDirectory, entry.name)))
    .filter((backup): backup is StorageBackupSnapshot => backup !== null)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export function archiveTab(id: string): SessionMutationResult {
  const db = getDatabase();
  const safeId = normalizeRequiredString(id, "Tab id is required.");
  const placement = getActiveTabPlacement(db, safeId);

  if (!placement) {
    throw new Error("Saved tab is not active.");
  }

  db.run(
    `
      UPDATE session_tabs
      SET archived_at = CURRENT_TIMESTAMP,
          position = $position
      WHERE id = $id AND deleted_at IS NULL AND archived_at IS NULL
    `,
    {
      $id: safeId,
      $position: getNextArchivedTabPosition(db, placement.category_id)
    }
  );

  rewriteTabPositions(db, placement.category_id, getActiveTabIds(db, placement.category_id));
  saveDatabase();
  return {
    categories: listCategories(),
    tabs: listTabs(placement.category_id)
  };
}

export function unarchiveTab(id: string): SessionMutationResult {
  const db = getDatabase();
  const safeId = normalizeRequiredString(id, "Tab id is required.");
  const categoryId = getArchivedTabCategoryId(db, safeId);

  if (!categoryId) {
    throw new Error("Archived tab does not exist.");
  }

  db.run(
    `
      UPDATE session_tabs
      SET archived_at = NULL,
          position = $position,
          saved_at = CURRENT_TIMESTAMP
      WHERE id = $id AND deleted_at IS NULL AND archived_at IS NOT NULL
    `,
    {
      $id: safeId,
      $position: getNextTabPosition(db, categoryId)
    }
  );

  saveDatabase();
  return {
    categories: listCategories(),
    tabs: listTabs(categoryId)
  };
}

export function deleteArchivedTabPermanently(id: string): SessionMutationResult {
  const db = getDatabase();
  const safeId = normalizeRequiredString(id, "Tab id is required.");
  const categoryId = getArchivedTabCategoryId(db, safeId);

  if (!categoryId) {
    throw new Error("Only an archived tab can be permanently deleted.");
  }

  db.run(
    "DELETE FROM session_tabs WHERE id = $id AND deleted_at IS NULL AND archived_at IS NOT NULL",
    { $id: safeId }
  );
  normalizeTabPositions(db);
  saveDatabase();
  return {
    categories: listCategories(),
    tabs: listTabs(categoryId)
  };
}

function getBackupSnapshot(backupPath: string): StorageBackupSnapshot | null {
  if (!fs.existsSync(backupPath)) {
    return null;
  }

  const stats = fs.statSync(backupPath);

  return {
    fileName: path.basename(backupPath),
    path: backupPath,
    createdAt: stats.mtime.toISOString(),
    sizeBytes: stats.size
  };
}

function createNoStartupRecoveryInfo(): StorageStartupRecoveryInfo {
  return {
    status: "not-needed",
    message: "Active database opened normally. No startup recovery was needed."
  };
}

function recoverStartupDatabase(
  SQL: SqlJsStatic,
  storagePaths: StoragePaths,
  activeDatabaseError: unknown
): { database: Database; info: StorageStartupRecoveryInfo } {
  if (!fs.existsSync(storagePaths.backupPath)) {
    throw new StorageStartupError(storagePaths, activeDatabaseError, "Automatic rolling backup does not exist.");
  }

  let recoveredDatabase: Database | null = null;

  try {
    recoveredDatabase = new SQL.Database(fs.readFileSync(storagePaths.backupPath));
    assertDeskPilotTables(recoveredDatabase);
    migrate(recoveredDatabase);
    seedDefaultCategories(recoveredDatabase);
  } catch (rollingBackupError) {
    recoveredDatabase?.close();
    throw new StorageStartupError(storagePaths, activeDatabaseError, rollingBackupError);
  }

  fs.mkdirSync(storagePaths.manualBackupDirectory, { recursive: true });
  const corruptDatabaseBackupPath = createCorruptDatabaseBackupPath(storagePaths.manualBackupDirectory, new Date());

  try {
    fs.copyFileSync(storagePaths.databasePath, corruptDatabaseBackupPath);
  } catch (error) {
    recoveredDatabase.close();
    throw error;
  }

  return {
    database: recoveredDatabase,
    info: {
      status: "recovered-from-rolling",
      message: "DeskPilot recovered the active database from the automatic rolling backup and preserved the corrupted file.",
      recoveredAt: new Date().toISOString(),
      rollingBackupPath: storagePaths.backupPath,
      corruptDatabaseBackupPath
    }
  };
}

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function createCorruptDatabaseBackupPath(manualBackupDirectory: string, date: Date): string {
  const timestamp = date.toISOString().replace(/[:.]/g, "-");
  const baseName = `deskpilot-corrupt-startup-${timestamp}`;
  let suffix = 1;
  let candidate = path.join(manualBackupDirectory, `${baseName}.sqlite.corrupt`);

  while (fs.existsSync(candidate)) {
    suffix += 1;
    candidate = path.join(manualBackupDirectory, `${baseName}-${suffix}.sqlite.corrupt`);
  }

  return candidate;
}

function createManualBackupPath(manualBackupDirectory: string, date: Date, prefix: string): string {
  const timestamp = date.toISOString().replace(/[:.]/g, "-");
  const baseName = `${prefix}-${timestamp}`;
  let suffix = 1;
  let candidate = path.join(manualBackupDirectory, `${baseName}.sqlite`);

  while (fs.existsSync(candidate)) {
    suffix += 1;
    candidate = path.join(manualBackupDirectory, `${baseName}-${suffix}.sqlite`);
  }

  return candidate;
}

function resolveManualBackupPath(fileName: string): string {
  const storagePaths = getPaths();
  const safeFileName = normalizeRequiredString(fileName, "Backup file name is required.");

  if (safeFileName !== path.basename(safeFileName) || !safeFileName.endsWith(".sqlite")) {
    throw new Error("Backup file name is not valid.");
  }

  const backupPath = path.resolve(storagePaths.manualBackupDirectory, safeFileName);
  const backupDirectory = path.resolve(storagePaths.manualBackupDirectory);

  if (!backupPath.startsWith(`${backupDirectory}${path.sep}`)) {
    throw new Error("Backup path is outside the manual backup directory.");
  }

  if (!fs.existsSync(backupPath)) {
    throw new Error("Backup file does not exist.");
  }

  return backupPath;
}

function validateDeskPilotDatabaseFile(filePath: string): void {
  validateDeskPilotDatabaseContents(fs.readFileSync(filePath));
}

function validateDeskPilotDatabaseContents(contents: Uint8Array): void {
  const SQL = getSqlite();
  const candidate = new SQL.Database(contents);

  try {
    assertDeskPilotTables(candidate);
  } finally {
    candidate.close();
  }
}

function assertDeskPilotTables(candidate: Database): void {
  const result = candidate.exec(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name IN ('categories', 'session_tabs')
  `);

  if (result.length === 0 || result[0].values.length !== 2) {
    throw new Error("Selected file is not a DeskPilot backup.");
  }
}

function createSafetyBackup(prefix: "pre-import" | "pre-restore"): string {
  const storagePaths = getPaths();

  fs.mkdirSync(storagePaths.manualBackupDirectory, { recursive: true });
  saveDatabase();

  const backupPath = createManualBackupPath(storagePaths.manualBackupDirectory, new Date(), `deskpilot-${prefix}`);
  fs.copyFileSync(storagePaths.databasePath, backupPath);

  return backupPath;
}

function replaceActiveDatabase(sourcePath: string): void {
  replaceActiveDatabaseContents(fs.readFileSync(sourcePath));
}

function replaceActiveDatabaseContents(contents: Uint8Array): void {
  const SQL = getSqlite();
  const nextDatabase = new SQL.Database(contents);

  try {
    assertDeskPilotTables(nextDatabase);
    migrate(nextDatabase);
    seedDefaultCategories(nextDatabase);
  } catch (error) {
    nextDatabase.close();
    throw error;
  }

  const previousDatabase = database;
  database = nextDatabase;

  try {
    saveDatabase();
  } catch (error) {
    database = previousDatabase;
    nextDatabase.close();
    throw error;
  }

  previousDatabase?.close();
}

function createStorageRestoreResult(sourcePath: string, safetyBackupPath: string): StorageRestoreResult {
  const categories = listCategories();
  const selectedCategoryId = getActiveCategoryId();

  return {
    storageInfo: getStorageInfo(),
    categories,
    deletedCategories: listDeletedCategories(),
    selectedCategoryId,
    tabs: selectedCategoryId ? listTabs(selectedCategoryId) : [],
    deletedTabs: selectedCategoryId ? listDeletedTabs(selectedCategoryId) : [],
    archivedTabs: selectedCategoryId ? listArchivedTabs(selectedCategoryId) : [],
    restoredFrom: sourcePath,
    safetyBackupFileName: path.basename(safetyBackupPath)
  };
}

function listCategoryRows(whereClause: string): SessionCategory[] {
  const db = getDatabase();
  const result = db.exec(`
    SELECT
      c.id,
      c.name,
      c.description,
      c.position,
      c.is_favorite,
      COUNT(t.id) AS tab_count,
      MAX(t.saved_at) AS last_saved_at
    FROM categories c
    LEFT JOIN session_tabs t ON t.category_id = c.id AND t.deleted_at IS NULL AND t.archived_at IS NULL
    WHERE ${whereClause}
    GROUP BY c.id
    ORDER BY c.position ASC, c.name ASC
  `);

  if (result.length === 0) {
    return [];
  }

  const columns = result[0].columns;
  return result[0].values.map((value) => {
    const row = Object.fromEntries(columns.map((column, index) => [column, value[index]])) as CategoryRow;
    return mapCategoryRow(row);
  });
}

function migrate(db: Database): void {
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL DEFAULT 0,
      color TEXT,
      icon TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS session_tabs (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      url TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      position INTEGER NOT NULL DEFAULT 0,
      saved_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      archived_at TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  ensureColumn(db, "categories", "position", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_tabs", "position", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_tabs", "archived_at", "TEXT");
  normalizeTabPositions(db);
}

function ensureColumn(db: Database, tableName: "categories" | "session_tabs", columnName: string, definition: string): void {
  const result = db.exec(`PRAGMA table_info(${tableName})`);
  const columns = result[0]?.values.map((value) => String(value[1])) ?? [];

  if (!columns.includes(columnName)) {
    db.run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  }
}

function normalizeTabPositions(db: Database): void {
  const result = db.exec(`
    SELECT id, category_id, deleted_at, archived_at, position, saved_at
    FROM session_tabs
    ORDER BY category_id ASC,
             deleted_at IS NOT NULL ASC,
             archived_at IS NOT NULL ASC,
             position ASC,
             saved_at ASC,
             id ASC
  `);

  if (result.length === 0) {
    return;
  }

  const columns = result[0].columns;
  const nextPositionByGroup = new Map<string, number>();
  const updates: Array<{ id: string; position: number }> = [];

  for (const value of result[0].values) {
    const row = Object.fromEntries(columns.map((column, index) => [column, value[index]])) as TabOrderRow;
    const state = row.deleted_at ? "deleted" : row.archived_at ? "archived" : "active";
    const groupKey = `${row.category_id}:${state}`;
    const nextPosition = nextPositionByGroup.get(groupKey) ?? 0;

    if (Number(row.position) !== nextPosition) {
      updates.push({ id: row.id, position: nextPosition });
    }

    nextPositionByGroup.set(groupKey, nextPosition + 1);
  }

  if (updates.length === 0) {
    return;
  }

  const statement = db.prepare("UPDATE session_tabs SET position = $position WHERE id = $id");

  try {
    for (const update of updates) {
      statement.run({
        $id: update.id,
        $position: update.position
      });
    }
  } finally {
    statement.free();
  }
}

function seedDefaultCategories(db: Database): void {
  const statement = db.prepare(`
    INSERT INTO categories (id, name, description, position)
    VALUES ($id, $name, $description, $position)
    ON CONFLICT(id) DO NOTHING
  `);

  try {
    defaultCategories.forEach((category, index) => {
      statement.run({
        $id: category.id,
        $name: category.name,
        $description: category.description,
        $position: index
      });
    });
  } finally {
    statement.free();
  }
}

function resolveActiveCategoryId(db: Database): string {
  const storedCategoryId = getAppStateValue(db, "activeCategoryId");

  if (storedCategoryId && isActiveCategoryId(db, storedCategoryId)) {
    return storedCategoryId;
  }

  const fallbackCategoryId = getFirstActiveCategoryId(db);
  setAppStateValue(db, "activeCategoryId", fallbackCategoryId);

  return fallbackCategoryId;
}

function getAppStateValue(db: Database, key: string): string {
  const result = db.exec("SELECT value FROM app_state WHERE key = $key", {
    $key: key
  });

  if (result.length === 0 || result[0].values.length === 0) {
    return "";
  }

  return String(result[0].values[0][0]);
}

function setAppStateValue(db: Database, key: string, value: string): void {
  db.run(
    `
      INSERT INTO app_state (key, value, updated_at)
      VALUES ($key, $value, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value = excluded.value,
        updated_at = CURRENT_TIMESTAMP
    `,
    {
      $key: key,
      $value: value
    }
  );
}

function getFirstActiveCategoryId(db: Database): string {
  const result = db.exec(`
    SELECT id
    FROM categories
    WHERE deleted_at IS NULL
    ORDER BY position ASC, name ASC
    LIMIT 1
  `);

  if (result.length === 0 || result[0].values.length === 0) {
    return "";
  }

  return String(result[0].values[0][0]);
}

function isActiveCategoryId(db: Database, id: string): boolean {
  const result = db.exec("SELECT 1 FROM categories WHERE id = $id AND deleted_at IS NULL LIMIT 1", {
    $id: id
  });

  return result.length > 0 && result[0].values.length > 0;
}

function assertActiveCategoryExists(db: Database, id: string): void {
  if (!isActiveCategoryId(db, id)) {
    throw new Error("DeskPilot category not found.");
  }
}

function normalizeCategoryInput(input: CategoryInput): CategoryInput {
  const name = input.name.trim();
  const description = input.description.trim();

  if (!name) {
    throw new Error("Category name is required.");
  }

  if (name.length > 40) {
    throw new Error("Category name must be 40 characters or less.");
  }

  if (description.length > 140) {
    throw new Error("Category description must be 140 characters or less.");
  }

  return { name, description };
}

function normalizeCategoryId(id: string): string {
  return normalizeRequiredString(id, "Category id is required.");
}

function createCategoryId(name: string): string {
  const baseSlug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "category";
  const existingIds = getAllCategoryIds();

  if (!existingIds.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  let nextId = `${baseSlug}-${suffix}`;

  while (existingIds.has(nextId)) {
    suffix += 1;
    nextId = `${baseSlug}-${suffix}`;
  }

  return nextId;
}

function getAllCategoryIds(): Set<string> {
  const db = getDatabase();
  const result = db.exec("SELECT id FROM categories");

  if (result.length === 0) {
    return new Set();
  }

  return new Set(result[0].values.map((value) => String(value[0])));
}

function getNextCategoryPosition(db: Database): number {
  const result = db.exec("SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM categories");

  if (result.length === 0) {
    return 0;
  }

  return Number(result[0].values[0][0]);
}

function normalizeTabInput(input: SessionTabInput): SessionTabInput {
  const categoryId = normalizeCategoryId(input.categoryId);
  const url = normalizeUrl(input.url);
  const title = input.title.trim().slice(0, 180) || url;

  return { categoryId, url, title };
}

function normalizeUrl(value: string): string {
  const rawUrl = normalizeRequiredString(value, "URL is required.");
  const parsed = new URL(rawUrl);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http and https URLs are supported right now.");
  }

  return parsed.toString();
}

function normalizeRequiredString(value: string, message: string): string {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(message);
  }

  return normalized;
}

function normalizeTabPosition(value: number): number {
  const position = Number(value);

  if (!Number.isFinite(position)) {
    return 0;
  }

  return Math.max(0, Math.trunc(position));
}

function createTabId(url: string): string {
  const baseSlug =
    url
      .replace(/^https?:\/\//, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
      .slice(0, 48) || "tab";
  const existingIds = getAllTabIds();

  if (!existingIds.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  let nextId = `${baseSlug}-${suffix}`;

  while (existingIds.has(nextId)) {
    suffix += 1;
    nextId = `${baseSlug}-${suffix}`;
  }

  return nextId;
}

function getAllTabIds(): Set<string> {
  const db = getDatabase();
  const result = db.exec("SELECT id FROM session_tabs");

  if (result.length === 0) {
    return new Set();
  }

  return new Set(result[0].values.map((value) => String(value[0])));
}

function getActiveTabPlacement(db: Database, id: string): ActiveTabPlacementRow | null {
  const result = db.exec(
    `
      SELECT category_id, position, url
      FROM session_tabs
      WHERE id = $id AND deleted_at IS NULL AND archived_at IS NULL
      LIMIT 1
    `,
    {
      $id: id
    }
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  return Object.fromEntries(columns.map((column, index) => [column, result[0].values[0][index]])) as ActiveTabPlacementRow;
}

function hasActiveTabUrlInCategoryExcept(db: Database, categoryId: string, url: string, excludedTabId: string): boolean {
  const result = db.exec(
    `
      SELECT id
      FROM session_tabs
      WHERE category_id = $categoryId
        AND url = $url
        AND id != $excludedTabId
        AND deleted_at IS NULL
        AND archived_at IS NULL
      LIMIT 1
    `,
    {
      $categoryId: categoryId,
      $url: url,
      $excludedTabId: excludedTabId
    }
  );

  return result.length > 0 && result[0].values.length > 0;
}

function getActiveTabIds(db: Database, categoryId: string): string[] {
  const result = db.exec(
    `
      SELECT id
      FROM session_tabs
      WHERE category_id = $categoryId AND deleted_at IS NULL AND archived_at IS NULL
      ORDER BY position ASC, saved_at ASC, id ASC
    `,
    {
      $categoryId: categoryId
    }
  );

  if (result.length === 0) {
    return [];
  }

  return result[0].values.map((value) => String(value[0]));
}

function rewriteTabPositions(db: Database, categoryId: string, tabIds: string[]): void {
  const statement = db.prepare(`
    UPDATE session_tabs
    SET category_id = $categoryId,
        position = $position
    WHERE id = $id AND deleted_at IS NULL AND archived_at IS NULL
  `);

  try {
    tabIds.forEach((tabId, position) => {
      statement.run({
        $id: tabId,
        $categoryId: categoryId,
        $position: position
      });
    });
  } finally {
    statement.free();
  }
}

function getNextTabPosition(db: Database, categoryId: string): number {
  const result = db.exec(
    `
      SELECT COALESCE(MAX(position), -1) + 1 AS next_position
      FROM session_tabs
      WHERE category_id = $categoryId AND deleted_at IS NULL AND archived_at IS NULL
    `,
    {
      $categoryId: categoryId
    }
  );

  if (result.length === 0) {
    return 0;
  }

  return Number(result[0].values[0][0]);
}

function getArchivedTabCategoryId(db: Database, id: string): string | null {
  const result = db.exec(
    `
      SELECT category_id
      FROM session_tabs
      WHERE id = $id AND deleted_at IS NULL AND archived_at IS NOT NULL
      LIMIT 1
    `,
    {
      $id: id
    }
  );

  return result.length > 0 && result[0].values.length > 0 ? String(result[0].values[0][0]) : null;
}

function getNextArchivedTabPosition(db: Database, categoryId: string): number {
  const result = db.exec(
    `
      SELECT COALESCE(MAX(position), -1) + 1 AS next_position
      FROM session_tabs
      WHERE category_id = $categoryId AND deleted_at IS NULL AND archived_at IS NOT NULL
    `,
    {
      $categoryId: categoryId
    }
  );

  return result.length === 0 ? 0 : Number(result[0].values[0][0]);
}

function saveTab(db: Database, input: SessionTabInput, options: SaveTabOptions): SaveTabOutcome {
  assertActiveCategoryExists(db, input.categoryId);

  const activeSameCategoryTab = findTabByUrl(db, input.categoryId, input.url, "active");

  if (activeSameCategoryTab) {
    return {
      status: "already-saved",
      savedCount: 0,
      restoredCount: 0,
      skippedSameCategoryDuplicateCount: 1,
      skippedCrossCategoryDuplicateCount: 0,
      confirmationRequired: false,
      duplicateCategoryNames: [],
      savedUrls: []
    };
  }

  const archivedSameCategoryTab = findTabByUrl(db, input.categoryId, input.url, "archived");

  if (archivedSameCategoryTab) {
    restoreTabRow(db, archivedSameCategoryTab.id, input);

    return {
      status: "restored",
      savedCount: 1,
      restoredCount: 1,
      skippedSameCategoryDuplicateCount: 0,
      skippedCrossCategoryDuplicateCount: 0,
      confirmationRequired: false,
      duplicateCategoryNames: [],
      savedUrls: [input.url]
    };
  }

  const deletedSameCategoryTab = findTabByUrl(db, input.categoryId, input.url, "deleted");

  if (deletedSameCategoryTab) {
    restoreTabRow(db, deletedSameCategoryTab.id, input);

    return {
      status: "restored",
      savedCount: 1,
      restoredCount: 1,
      skippedSameCategoryDuplicateCount: 0,
      skippedCrossCategoryDuplicateCount: 0,
      confirmationRequired: false,
      duplicateCategoryNames: [],
      savedUrls: [input.url]
    };
  }

  const duplicateCategoryNames = findCrossCategoryDuplicateNames(db, input.categoryId, input.url);

  if (duplicateCategoryNames.length > 0) {
    if (options.crossCategoryDuplicatePolicy === "ask") {
      return {
        status: "skipped-cross-category-duplicate",
        savedCount: 0,
        restoredCount: 0,
        skippedSameCategoryDuplicateCount: 0,
        skippedCrossCategoryDuplicateCount: 0,
        confirmationRequired: true,
        duplicateCategoryNames,
        savedUrls: []
      };
    }

    if (options.crossCategoryDuplicatePolicy === "skip") {
      return {
        status: "skipped-cross-category-duplicate",
        savedCount: 0,
        restoredCount: 0,
        skippedSameCategoryDuplicateCount: 0,
        skippedCrossCategoryDuplicateCount: 1,
        confirmationRequired: false,
        duplicateCategoryNames,
        savedUrls: []
      };
    }
  }

  insertTab(db, input);

  return {
    status: "saved",
    savedCount: 1,
    restoredCount: 0,
    skippedSameCategoryDuplicateCount: 0,
    skippedCrossCategoryDuplicateCount: 0,
    confirmationRequired: false,
    duplicateCategoryNames: [],
    savedUrls: [input.url]
  };
}

function findTabByUrl(
  db: Database,
  categoryId: string,
  url: string,
  state: "active" | "archived" | "deleted"
): SessionTab | null {
  const stateClause =
    state === "deleted"
      ? "deleted_at IS NOT NULL"
      : state === "archived"
        ? "deleted_at IS NULL AND archived_at IS NOT NULL"
        : "deleted_at IS NULL AND archived_at IS NULL";
  const result = db.exec(
    `
      SELECT id, category_id, url, title, position, saved_at
      FROM session_tabs
      WHERE category_id = $categoryId AND url = $url AND ${stateClause}
      ORDER BY position DESC, saved_at DESC, id DESC
      LIMIT 1
    `,
    {
      $categoryId: categoryId,
      $url: url
    }
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const columns = result[0].columns;
  const row = Object.fromEntries(columns.map((column, index) => [column, result[0].values[0][index]])) as SessionTabRow;
  return mapSessionTabRow(row);
}

function restoreTabRow(db: Database, tabId: string, input: SessionTabInput): void {
  db.run(
    `
      UPDATE session_tabs
      SET title = $title,
          position = $position,
          saved_at = CURRENT_TIMESTAMP,
          deleted_at = NULL,
          archived_at = NULL
      WHERE id = $id
    `,
    {
      $id: tabId,
      $title: input.title,
      $position: getNextTabPosition(db, input.categoryId)
    }
  );
}

function findCrossCategoryDuplicateNames(db: Database, categoryId: string, url: string): string[] {
  const result = db.exec(
    `
      SELECT DISTINCT c.name
      FROM session_tabs t
      INNER JOIN categories c ON c.id = t.category_id
      WHERE t.url = $url
        AND t.category_id != $categoryId
        AND t.deleted_at IS NULL
        AND t.archived_at IS NULL
        AND c.deleted_at IS NULL
      ORDER BY c.position ASC, c.name ASC
    `,
    {
      $categoryId: categoryId,
      $url: url
    }
  );

  if (result.length === 0) {
    return [];
  }

  return result[0].values.map((value) => String(value[0]));
}

function getCrossCategoryDuplicateNamesForTabs(db: Database, categoryId: string, tabs: SessionTabInput[]): string[] {
  const names = new Set<string>();

  for (const tab of tabs) {
    if (findTabByUrl(db, categoryId, tab.url, "active")) {
      continue;
    }

    for (const name of findCrossCategoryDuplicateNames(db, categoryId, tab.url)) {
      names.add(name);
    }
  }

  return [...names];
}

function createEmptySaveOutcome(): SaveTabOutcome {
  return {
    status: "saved",
    savedCount: 0,
    restoredCount: 0,
    skippedSameCategoryDuplicateCount: 0,
    skippedCrossCategoryDuplicateCount: 0,
    confirmationRequired: false,
    duplicateCategoryNames: [],
    savedUrls: []
  };
}

function mergeSaveOutcome(target: SaveTabOutcome, source: SaveTabOutcome): void {
  target.savedCount += source.savedCount;
  target.restoredCount += source.restoredCount;
  target.skippedSameCategoryDuplicateCount += source.skippedSameCategoryDuplicateCount;
  target.skippedCrossCategoryDuplicateCount += source.skippedCrossCategoryDuplicateCount;
  target.confirmationRequired = target.confirmationRequired || source.confirmationRequired;
  target.savedUrls.push(...source.savedUrls);

  for (const name of source.duplicateCategoryNames) {
    if (!target.duplicateCategoryNames.includes(name)) {
      target.duplicateCategoryNames.push(name);
    }
  }

  if (source.status !== "saved") {
    target.status = source.status;
  }
}

function createCaptureResult(
  categoryId: string,
  mode: CaptureMode,
  outcome: SaveTabOutcome,
  skippedUnsupportedCount: number
): CaptureResult {
  return {
    categories: listCategories(),
    tabs: listTabs(categoryId),
    saveStatus: outcome.status,
    savedCount: outcome.savedCount,
    restoredCount: outcome.restoredCount,
    skippedSameCategoryDuplicateCount: outcome.skippedSameCategoryDuplicateCount,
    skippedCrossCategoryDuplicateCount: outcome.skippedCrossCategoryDuplicateCount,
    skippedUnsupportedCount,
    confirmationRequired: outcome.confirmationRequired,
    duplicateCategoryNames: outcome.duplicateCategoryNames,
    savedUrls: outcome.savedUrls,
    mode
  };
}

function insertTab(db: Database, input: SessionTabInput): void {
  const position = getNextTabPosition(db, input.categoryId);
  const id = createTabId(input.url);

  db.run(
    `
      INSERT INTO session_tabs (id, category_id, url, title, position)
      VALUES ($id, $categoryId, $url, $title, $position)
    `,
    {
      $id: id,
      $categoryId: input.categoryId,
      $url: input.url,
      $title: input.title,
      $position: position
    }
  );
}

function normalizeCaptureMode(mode: CaptureMode): CaptureMode {
  if (mode === "append" || mode === "replace") {
    return mode;
  }

  throw new Error("Capture mode is not supported.");
}

function getTabCategoryId(db: Database, id: string): string | null {
  const result = db.exec("SELECT category_id FROM session_tabs WHERE id = $id", {
    $id: id
  });

  if (result.length === 0) {
    return null;
  }

  return String(result[0].values[0][0]);
}

function mapSessionTabRow(row: SessionTabRow): SessionTab {
  return {
    id: row.id,
    categoryId: row.category_id,
    url: row.url,
    title: row.title,
    position: Number(row.position),
    savedAt: row.saved_at
  };
}

function saveDatabase(options: { preserveRollingBackup?: boolean } = {}): void {
  const db = getDatabase();
  const storagePaths = getPaths();
  const exported = Buffer.from(db.export());

  if (!options.preserveRollingBackup && fs.existsSync(storagePaths.databasePath)) {
    fs.copyFileSync(storagePaths.databasePath, storagePaths.backupPath);
  }

  fs.writeFileSync(storagePaths.temporaryPath, exported);
  fs.renameSync(storagePaths.temporaryPath, storagePaths.databasePath);
}

function mapCategoryRow(row: CategoryRow): SessionCategory {
  const tabCount = Number(row.tab_count);

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    tabCount,
    lastSavedLabel: row.last_saved_at ? "Saved" : "Not saved yet",
    status: tabCount > 0 ? "ready" : "empty"
  };
}

function getDatabase(): Database {
  if (!database) {
    throw new Error("DeskPilot storage has not been initialized.");
  }

  return database;
}

function getSqlite(): SqlJsStatic {
  if (!sqlite) {
    throw new Error("DeskPilot SQLite runtime has not been initialized.");
  }

  return sqlite;
}

function getPaths(): StoragePaths {
  if (!paths) {
    throw new Error("DeskPilot storage paths have not been initialized.");
  }

  return paths;
}
