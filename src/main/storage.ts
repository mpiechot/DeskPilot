import fs from "node:fs";
import path from "node:path";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { defaultCategories, type SessionCategory } from "../shared/sessions.js";
import type { CategoryInput, CategoryRow } from "../shared/deskPilotApi.js";

type StoragePaths = {
  databasePath: string;
  backupPath: string;
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

export function listCategories(): SessionCategory[] {
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
    WHERE c.deleted_at IS NULL
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

function getStoragePaths(userDataPath: string): StoragePaths {
  const storageDirectory = path.join(userDataPath, "storage");

  return {
    databasePath: path.join(storageDirectory, "deskpilot.sqlite"),
    backupPath: path.join(storageDirectory, "deskpilot.sqlite.bak"),
    temporaryPath: path.join(storageDirectory, "deskpilot.sqlite.tmp")
  };
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
  const safeId = id.trim();

  if (!safeId) {
    throw new Error("Category id is required.");
  }

  return safeId;
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
