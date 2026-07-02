import fs from "node:fs";
import path from "node:path";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { defaultCategories, type SessionCategory } from "../shared/sessions.js";
import type {
  CategoryInput,
  CategoryRow,
  CategoryRecoveryResult,
  SessionMutationResult,
  SessionTab,
  SessionTabInput,
  SessionTabRow,
  StorageBackupInfo,
  StorageBackupSnapshot
} from "../shared/deskPilotApi.js";

type StoragePaths = {
  databasePath: string;
  backupPath: string;
  manualBackupDirectory: string;
  temporaryPath: string;
};

let sqlite: SqlJsStatic | null = null;
let database: Database | null = null;
let paths: StoragePaths | null = null;

export async function initializeStorage(userDataPath: string): Promise<void> {
  paths = getStoragePaths(userDataPath);
  fs.mkdirSync(path.dirname(paths.databasePath), { recursive: true });

  sqlite = await initSqlJs({
    locateFile: (file) => path.join(process.cwd(), "node_modules", "sql.js", "dist", file)
  });

  if (fs.existsSync(paths.databasePath)) {
    database = new sqlite.Database(fs.readFileSync(paths.databasePath));
  } else {
    database = new sqlite.Database();
  }

  migrate(database);
  seedDefaultCategories(database);
  saveDatabase();
}

export function getStorageInfo(): StorageBackupInfo {
  const storagePaths = getPaths();

  return {
    databasePath: storagePaths.databasePath,
    rollingBackupPath: storagePaths.backupPath,
    manualBackupDirectory: storagePaths.manualBackupDirectory,
    manualBackups: listManualBackups(storagePaths.manualBackupDirectory)
  };
}

export function createManualBackup(): StorageBackupInfo {
  const storagePaths = getPaths();

  fs.mkdirSync(storagePaths.manualBackupDirectory, { recursive: true });
  saveDatabase();
  fs.copyFileSync(storagePaths.databasePath, createManualBackupPath(storagePaths.manualBackupDirectory, new Date()));

  return getStorageInfo();
}

export function listCategories(): SessionCategory[] {
  return listCategoryRows("c.deleted_at IS NULL");
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

  saveDatabase();
  return {
    categories: listCategories(),
    deletedCategories: listDeletedCategories()
  };
}

export function listTabs(categoryId: string): SessionTab[] {
  return listTabsByDeletedState(categoryId, false);
}

export function listDeletedTabs(categoryId: string): SessionTab[] {
  return listTabsByDeletedState(categoryId, true);
}

function listTabsByDeletedState(categoryId: string, deleted: boolean): SessionTab[] {
  const db = getDatabase();
  const safeCategoryId = normalizeCategoryId(categoryId);
  const result = db.exec(
    `
      SELECT id, category_id, url, title, saved_at
      FROM session_tabs
      WHERE category_id = $categoryId AND deleted_at IS ${deleted ? "NOT NULL" : "NULL"}
      ORDER BY position ASC, saved_at ASC
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
  const position = getNextTabPosition(db, normalized.categoryId);
  const id = createTabId(normalized.url);

  db.run(
    `
      INSERT INTO session_tabs (id, category_id, url, title, position)
      VALUES ($id, $categoryId, $url, $title, $position)
    `,
    {
      $id: id,
      $categoryId: normalized.categoryId,
      $url: normalized.url,
      $title: normalized.title,
      $position: position
    }
  );

  saveDatabase();
  return {
    categories: listCategories(),
    tabs: listTabs(normalized.categoryId)
  };
}

export function deleteTab(id: string): SessionMutationResult {
  const db = getDatabase();
  const safeId = normalizeRequiredString(id, "Tab id is required.");
  const categoryId = getTabCategoryId(db, safeId);

  db.run(
    `
      UPDATE session_tabs
      SET deleted_at = CURRENT_TIMESTAMP
      WHERE id = $id AND deleted_at IS NULL
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

export function restoreTab(id: string): SessionMutationResult {
  const db = getDatabase();
  const safeId = normalizeRequiredString(id, "Tab id is required.");
  const categoryId = getTabCategoryId(db, safeId);

  db.run(
    `
      UPDATE session_tabs
      SET deleted_at = NULL
      WHERE id = $id AND deleted_at IS NOT NULL
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

function getStoragePaths(userDataPath: string): StoragePaths {
  const storageDirectory = path.join(userDataPath, "storage");

  return {
    databasePath: path.join(storageDirectory, "deskpilot.sqlite"),
    backupPath: path.join(storageDirectory, "deskpilot.sqlite.bak"),
    manualBackupDirectory: path.join(storageDirectory, "manual-backups"),
    temporaryPath: path.join(storageDirectory, "deskpilot.sqlite.tmp")
  };
}

function listManualBackups(manualBackupDirectory: string): StorageBackupSnapshot[] {
  if (!fs.existsSync(manualBackupDirectory)) {
    return [];
  }

  return fs
    .readdirSync(manualBackupDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sqlite"))
    .map((entry) => {
      const backupPath = path.join(manualBackupDirectory, entry.name);
      const stats = fs.statSync(backupPath);

      return {
        fileName: entry.name,
        path: backupPath,
        createdAt: stats.mtime.toISOString(),
        sizeBytes: stats.size
      };
    })
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function createManualBackupPath(manualBackupDirectory: string, date: Date): string {
  const timestamp = date.toISOString().replace(/[:.]/g, "-");
  const baseName = `deskpilot-${timestamp}`;
  let suffix = 1;
  let candidate = path.join(manualBackupDirectory, `${baseName}.sqlite`);

  while (fs.existsSync(candidate)) {
    suffix += 1;
    candidate = path.join(manualBackupDirectory, `${baseName}-${suffix}.sqlite`);
  }

  return candidate;
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
    LEFT JOIN session_tabs t ON t.category_id = c.id AND t.deleted_at IS NULL
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
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );
  `);
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

function getNextTabPosition(db: Database, categoryId: string): number {
  const result = db.exec(
    "SELECT COALESCE(MAX(position), -1) + 1 AS next_position FROM session_tabs WHERE category_id = $categoryId",
    {
      $categoryId: categoryId
    }
  );

  if (result.length === 0) {
    return 0;
  }

  return Number(result[0].values[0][0]);
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
    savedAt: row.saved_at
  };
}

function saveDatabase(): void {
  const db = getDatabase();
  const storagePaths = getPaths();
  const exported = Buffer.from(db.export());

  if (fs.existsSync(storagePaths.databasePath)) {
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

function getPaths(): StoragePaths {
  if (!paths) {
    throw new Error("DeskPilot storage paths have not been initialized.");
  }

  return paths;
}
