import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createCategory,
  deleteCategory,
  initializeStorage,
  listCategories,
  updateCategory
} from "../dist-electron/main/storage.js";

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

categories = createCategory({
  name: "Writing",
  description: "A recreated category must not collide with a soft-deleted id."
});
assert(
  categories.some((category) => category.name === "Writing"),
  "Expected Writing category to be creatable after soft delete"
);

const databasePath = path.join(dir, "storage", "deskpilot.sqlite");
const backupPath = path.join(dir, "storage", "deskpilot.sqlite.bak");
assert(fs.existsSync(databasePath), "Expected SQLite database file");
assert(fs.existsSync(backupPath), "Expected SQLite backup file after writes");

console.log(
  JSON.stringify(
    {
      categories: categories.map((category) => category.name),
      databasePath,
      backupExists: fs.existsSync(backupPath)
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
