import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createCategory,
  addTab,
  deleteCategory,
  deleteTab,
  initializeStorage,
  listDeletedCategories,
  listCategories,
  listTabs,
  restoreCategory,
  updateCategory
} from "../dist-electron/main/storage.js";
import { loadWindowBounds, saveWindowBounds } from "../dist-electron/main/windowSettings.js";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "deskpilot-storage-"));

await initializeStorage(dir);

const initialNames = listCategories().map((category) => category.name);
assert(initialNames.length === 5, `Expected 5 default categories, got ${initialNames.length}`);
assert(initialNames.includes("Entertainment"), "Expected Entertainment default category");

let categories = createCategory({
  name: "Writing",
  description: "Drafting, notes and publishing."
});
const writing = categories.find((category) => category.name === "Writing");
assert(writing, "Expected Writing category after create");

categories = updateCategory(writing.id, {
  name: "Writing Desk",
  description: "Drafting, notes and publishing context."
});
assert(
  categories.some((category) => category.name === "Writing Desk"),
  "Expected renamed Writing Desk category after update"
);

categories = deleteCategory(writing.id);
assert(
  !categories.some((category) => category.id === writing.id),
  "Expected deleted category to be hidden from active category list"
);
assert(
  listDeletedCategories().some((category) => category.id === writing.id),
  "Expected soft-deleted category to be recoverable"
);

const recovery = restoreCategory(writing.id);
assert(
  recovery.categories.some((category) => category.id === writing.id),
  "Expected restored category to return to active category list"
);

const recreatedWriting = recovery.categories.find((category) => category.id === writing.id);
let result = addTab({
  categoryId: recreatedWriting.id,
  url: "https://example.com/notes",
  title: "Example Notes"
});
assert(result.tabs.length === 1, `Expected 1 tab, got ${result.tabs.length}`);
assert(result.categories.some((category) => category.id === recreatedWriting.id && category.tabCount === 1), "Expected tab count update");

const tab = result.tabs[0];
result = deleteTab(tab.id);
assert(result.tabs.length === 0, "Expected soft-deleted tab to be hidden");
assert(listTabs(recreatedWriting.id).length === 0, "Expected no active tabs after soft delete");

const databasePath = path.join(dir, "storage", "deskpilot.sqlite");
const backupPath = path.join(dir, "storage", "deskpilot.sqlite.bak");
assert(fs.existsSync(databasePath), "Expected SQLite database file");
assert(fs.existsSync(backupPath), "Expected SQLite backup file after writes");

const customBounds = { x: 123, y: 456, width: 1180, height: 390 };
saveWindowBounds(dir, customBounds);
const loadedBounds = loadWindowBounds(dir);
assert(
  loadedBounds.x === customBounds.x &&
    loadedBounds.y === customBounds.y &&
    loadedBounds.width === customBounds.width &&
    loadedBounds.height === customBounds.height,
  "Expected window bounds to round-trip through settings storage"
);

console.log(
  JSON.stringify(
    {
      categories: categories.map((category) => category.name),
      databasePath,
      backupExists: fs.existsSync(backupPath),
      windowBounds: loadedBounds
    },
    null,
    2
  )
);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
