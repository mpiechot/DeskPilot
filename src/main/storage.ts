import fs from "node:fs";
import path from "node:path";
import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { defaultCategories, type SessionCategory } from "../shared/sessions.js";
import type { CategoryRow } from "../shared/deskPilotApi.js";

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
