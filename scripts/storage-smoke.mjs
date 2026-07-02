import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
  createCategory,
  createManualBackup,
  addTab,
  deleteCategory,
  deleteTab,
  exportStorageBackup,
  getStorageInfo,
  importStorageBackup,
  initializeStorage,
  listDeletedCategories,
  listDeletedTabs,
  listCategories,
  listTabs,
  restoreCategory,
  restoreManualBackup,
  restoreTab,
  saveCapturedTabs,
  updateCategory
} from "../dist-electron/main/storage.js";
import { loadWindowBounds, saveWindowBounds } from "../dist-electron/main/windowSettings.js";
import { getBrowserBridgeStatus, startBrowserBridge } from "../dist-electron/main/browserBridge.js";
import { getExtensionInstallInfo } from "../dist-electron/main/extensionInstall.js";

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
assert(listDeletedTabs(recreatedWriting.id).length === 1, "Expected soft-deleted tab to be recoverable");
result = restoreTab(tab.id);
assert(result.tabs.length === 1, "Expected restored tab to return to active list");

const databasePath = path.join(dir, "storage", "deskpilot.sqlite");
const backupPath = path.join(dir, "storage", "deskpilot.sqlite.bak");
assert(fs.existsSync(databasePath), "Expected SQLite database file");
assert(fs.existsSync(backupPath), "Expected SQLite backup file after writes");

const initialStorageInfo = getStorageInfo();
assert(initialStorageInfo.databasePath === databasePath, "Expected storage info to expose the database path");
assert(initialStorageInfo.rollingBackupPath === backupPath, "Expected storage info to expose the rolling backup path");
assert(initialStorageInfo.manualBackups.length === 0, "Expected no manual backups before creating one");
const backupInfo = createManualBackup();
assert(backupInfo.manualBackups.length === 1, "Expected one manual backup after creating one");
assert(fs.existsSync(backupInfo.manualBackups[0].path), "Expected manual backup file to exist");
assert(backupInfo.manualBackups[0].sizeBytes > 0, "Expected manual backup file to contain data");

createCategory({ name: "After Backup", description: "Should disappear after restore." });
assert(
  listCategories().some((category) => category.name === "After Backup"),
  "Expected mutation after manual backup"
);
const restoreResult = restoreManualBackup(backupInfo.manualBackups[0].fileName);
assert(!listCategories().some((category) => category.name === "After Backup"), "Expected restore to replace active data");
assert(restoreResult.safetyBackupFileName.includes("pre-restore"), "Expected restore to create a pre-restore safety backup");
assert(
  fs.existsSync(path.join(dir, "storage", "manual-backups", restoreResult.safetyBackupFileName)),
  "Expected pre-restore safety backup file"
);

const exportPath = path.join(dir, "exported-deskpilot.sqlite");
const exportResult = exportStorageBackup(backupInfo.manualBackups[0].fileName, exportPath);
assert(exportResult.filePath === exportPath, "Expected export to report target path");
assert(fs.existsSync(exportPath), "Expected exported backup file to exist");

const invalidImportPath = path.join(dir, "invalid.sqlite");
fs.writeFileSync(invalidImportPath, "not a sqlite database");
assertThrows(() => importStorageBackup(invalidImportPath), "Expected invalid import file to be rejected");

createCategory({ name: "Before Import", description: "Should disappear after import." });
assert(
  listCategories().some((category) => category.name === "Before Import"),
  "Expected mutation before import"
);
const importResult = importStorageBackup(exportPath);
assert(!listCategories().some((category) => category.name === "Before Import"), "Expected import to replace active data");
assert(importResult.safetyBackupFileName.includes("pre-import"), "Expected import to create a pre-import safety backup");

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

const bridgeServer = startBrowserBridge();
await new Promise((resolve) => bridgeServer.once("listening", resolve));

try {
  const bridgeStatus = getBrowserBridgeStatus(bridgeServer);
  assert(bridgeStatus.running, "Expected browser bridge status to report running");
  assert(bridgeStatus.host === "127.0.0.1", "Expected bridge to bind to localhost");
  assert(bridgeStatus.port === 17383, "Expected bridge status to report the browser bridge port");

  const bridgeInfoResponse = await fetch("http://127.0.0.1:17383/");
  const bridgeInfoText = await bridgeInfoResponse.text();
  assert(bridgeInfoResponse.status === 200, "Expected bridge root to be reachable for human diagnostics");
  assert(bridgeInfoText.includes("not the DeskPilot app UI"), "Expected bridge root to explain it is not the app UI");

  const forbiddenResponse = await fetch("http://127.0.0.1:17383/categories");
  assert(forbiddenResponse.status === 403, "Expected origin-less bridge request to be forbidden");

  const categoriesResponse = await fetch("http://127.0.0.1:17383/categories", {
    headers: { origin: "chrome-extension://deskpilot-test" }
  });
  const categoriesPayload = await categoriesResponse.json();
  const categoryId = categoriesPayload.categories[0].id;
  addTab({
    categoryId,
    url: "https://example.com/old-capture",
    title: "Old Capture"
  });
  const captureResponse = await fetch("http://127.0.0.1:17383/capture", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "chrome-extension://deskpilot-test"
    },
    body: JSON.stringify({
      categoryId,
      mode: "append",
      tabs: [{ url: "https://example.com/bridge", title: "Bridge Test" }]
    })
  });
  const capturePayload = await captureResponse.json();

  assert(capturePayload.savedCount === 1, "Expected bridge capture to save one tab");
  assert(listTabs(categoryId).some((item) => item.title === "Bridge Test"), "Expected captured bridge tab in storage");

  const replaceResponse = await fetch("http://127.0.0.1:17383/capture", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "chrome-extension://deskpilot-test"
    },
    body: JSON.stringify({
      categoryId,
      mode: "replace",
      tabs: [{ url: "https://example.com/replacement", title: "Replacement Capture" }]
    })
  });
  const replacePayload = await replaceResponse.json();
  const replacedTabs = listTabs(categoryId);

  assert(replacePayload.mode === "replace", "Expected bridge capture to report replace mode");
  assert(replacePayload.savedCount === 1, "Expected replace capture to save one tab");
  assert(replacedTabs.length === 1, `Expected replace capture to leave one active tab, got ${replacedTabs.length}`);
  assert(replacedTabs[0].title === "Replacement Capture", "Expected replacement tab to be active");
  assert(
    listDeletedTabs(categoryId).some((item) => item.title === "Old Capture" || item.title === "Bridge Test"),
    "Expected replace capture to soft-delete previous active tabs"
  );

  const directCapture = saveCapturedTabs(
    categoryId,
    [{ categoryId, url: "https://example.com/direct-replace", title: "Direct Replace" }],
    "replace"
  );
  assert(directCapture.savedCount === 1, "Expected direct replace capture to save one tab");
  assert(directCapture.tabs.length === 1, "Expected direct replace capture to leave one active tab");
} finally {
  await new Promise((resolve) => bridgeServer.close(resolve));
}

const extensionInfo = getExtensionInstallInfo(process.cwd());
assert(extensionInfo.manifestPresent, "Expected browser extension manifest to be present");
assert(extensionInfo.extensionPath.endsWith("browser-extension"), "Expected extension path to point at browser-extension");

console.log(
  JSON.stringify(
    {
      categories: categories.map((category) => category.name),
      databasePath,
      backupExists: fs.existsSync(backupPath),
      manualBackups: getStorageInfo().manualBackups.length,
      extensionPath: extensionInfo.extensionPath,
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

function assertThrows(operation, message) {
  try {
    operation();
  } catch {
    return;
  }

  throw new Error(message);
}
