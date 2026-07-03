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
  getActiveCategoryId,
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
  saveCapturedTab,
  saveCapturedTabs,
  setActiveCategoryId,
  updateCategory
} from "../dist-electron/main/storage.js";
import { loadWindowBounds, saveWindowBounds } from "../dist-electron/main/windowSettings.js";
import {
  extensionClientHeaderName,
  extensionClientHeaderValue,
  getBrowserBridgeStatus,
  startBrowserBridge
} from "../dist-electron/main/browserBridge.js";
import { getExtensionInstallInfo } from "../dist-electron/main/extensionInstall.js";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "deskpilot-storage-"));

await initializeStorage(dir);

const initialNames = listCategories().map((category) => category.name);
assert(initialNames.length === 5, `Expected 5 default categories, got ${initialNames.length}`);
assert(initialNames.includes("Entertainment"), "Expected Entertainment default category");
assert(getActiveCategoryId() === "work", "Expected Work to be the initial active category");
setActiveCategoryId("projects");
assert(getActiveCategoryId() === "projects", "Expected active category selection to persist");

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

setActiveCategoryId(writing.id);
categories = deleteCategory(writing.id);
assert(
  !categories.some((category) => category.id === writing.id),
  "Expected deleted category to be hidden from active category list"
);
assert(getActiveCategoryId() !== writing.id, "Expected active category to fall back after deleting the active category");
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
const duplicateManualSave = addTab({
  categoryId: recreatedWriting.id,
  url: "https://example.com/notes",
  title: "Example Notes Duplicate"
});
assert(duplicateManualSave.saveStatus === "already-saved", "Expected manual same-category duplicate to be skipped");
assert(duplicateManualSave.tabs.length === 1, "Expected manual same-category duplicate not to add a second tab");
result = deleteTab(tab.id);
assert(result.tabs.length === 0, "Expected soft-deleted tab to be hidden");
assert(listTabs(recreatedWriting.id).length === 0, "Expected no active tabs after soft delete");
assert(listDeletedTabs(recreatedWriting.id).length === 1, "Expected soft-deleted tab to be recoverable");
const manualRestore = addTab({
  categoryId: recreatedWriting.id,
  url: "https://example.com/notes",
  title: "Example Notes Restored By Save"
});
assert(manualRestore.saveStatus === "restored", "Expected manual save to restore a soft-deleted same-category URL");
assert(manualRestore.tabs[0].title === "Example Notes Restored By Save", "Expected restored URL title to update");
result = deleteTab(manualRestore.tabs[0].id);
assert(result.tabs.length === 0, "Expected restored tab to be removable again");
result = restoreTab(manualRestore.tabs[0].id);
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

const bridgeServer = startBrowserBridge({ port: 0 });
await new Promise((resolve) => bridgeServer.once("listening", resolve));
const extensionClientHeaders = { [extensionClientHeaderName]: extensionClientHeaderValue };

try {
  const bridgeStatus = getBrowserBridgeStatus(bridgeServer);
  const bridgeUrl = `http://${bridgeStatus.host}:${bridgeStatus.port}`;
  assert(bridgeStatus.running, "Expected browser bridge status to report running");
  assert(bridgeStatus.host === "127.0.0.1", "Expected bridge to bind to localhost");
  assert(bridgeStatus.port > 0, "Expected bridge status to report the browser bridge port");

  const bridgeInfoResponse = await fetch(`${bridgeUrl}/`);
  const bridgeInfoText = await bridgeInfoResponse.text();
  assert(bridgeInfoResponse.status === 200, "Expected bridge root to be reachable for human diagnostics");
  assert(bridgeInfoText.includes("not the DeskPilot app UI"), "Expected bridge root to explain it is not the app UI");

  const forbiddenResponse = await fetch(`${bridgeUrl}/categories`);
  assert(forbiddenResponse.status === 403, "Expected origin-less bridge request to be forbidden");

  const extensionClientCategoriesResponse = await fetch(`${bridgeUrl}/categories`, {
    headers: extensionClientHeaders
  });
  assert(
    extensionClientCategoriesResponse.status === 200,
    "Expected extension client header to allow browser-extension requests without an Origin header"
  );
  const extensionClientCategoriesPayload = await extensionClientCategoriesResponse.json();
  assert(
    extensionClientCategoriesPayload.activeCategoryId === getActiveCategoryId(),
    "Expected extension client header request to expose the active category"
  );

  const categoriesResponse = await fetch(`${bridgeUrl}/categories`, {
    headers: { origin: "chrome-extension://deskpilot-test" }
  });
  const categoriesPayload = await categoriesResponse.json();
  const categoryId = categoriesPayload.categories[0].id;
  const otherCategoryId = categoriesPayload.categories.find((category) => category.id !== categoryId).id;
  assert(categoriesPayload.activeCategoryId === getActiveCategoryId(), "Expected bridge categories to expose active category");

  const currentTabResponse = await fetch(`${bridgeUrl}/tabs/current/save`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "chrome-extension://deskpilot-test"
    },
    body: JSON.stringify({
      categoryId,
      tab: { url: "https://example.com/current-tab", title: "Current Tab" }
    })
  });
  const currentTabPayload = await currentTabResponse.json();

  assert(currentTabPayload.savedCount === 1, "Expected current-tab route to save one tab");
  assert(listTabs(categoryId).some((item) => item.title === "Current Tab"), "Expected current tab in storage");

  const extensionClientCurrentTabResponse = await fetch(`${bridgeUrl}/tabs/current/save`, {
    method: "POST",
    headers: {
      ...extensionClientHeaders,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      categoryId,
      tab: { url: "https://example.com/current-tab-extension-client", title: "Current Tab Extension Client" }
    })
  });
  const extensionClientCurrentTabPayload = await extensionClientCurrentTabResponse.json();

  assert(
    extensionClientCurrentTabPayload.savedCount === 1,
    "Expected extension client header to allow current-tab saves without an Origin header"
  );
  assert(
    listTabs(categoryId).some((item) => item.title === "Current Tab Extension Client"),
    "Expected extension client current tab in storage"
  );

  const currentTabDuplicateResponse = await fetch(`${bridgeUrl}/tabs/current/save`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "chrome-extension://deskpilot-test"
    },
    body: JSON.stringify({
      categoryId,
      tab: { url: "https://example.com/current-tab", title: "Current Tab Duplicate" }
    })
  });
  const currentTabDuplicatePayload = await currentTabDuplicateResponse.json();

  assert(currentTabDuplicatePayload.savedCount === 0, "Expected current-tab duplicate not to save a new tab");
  assert(
    currentTabDuplicatePayload.skippedSameCategoryDuplicateCount === 1,
    "Expected current-tab duplicate to be reported"
  );

  const currentTab = listTabs(categoryId).find((item) => item.url === "https://example.com/current-tab");
  deleteTab(currentTab.id);
  const currentTabRestoreResponse = await fetch(`${bridgeUrl}/tabs/current/save`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "chrome-extension://deskpilot-test"
    },
    body: JSON.stringify({
      categoryId,
      tab: { url: "https://example.com/current-tab", title: "Current Tab Restored" }
    })
  });
  const currentTabRestorePayload = await currentTabRestoreResponse.json();

  assert(currentTabRestorePayload.restoredCount === 1, "Expected current-tab route to restore a soft-deleted URL");
  assert(
    listTabs(categoryId).some((item) => item.title === "Current Tab Restored"),
    "Expected restored current tab title to update"
  );

  addTab({
    categoryId: otherCategoryId,
    url: "https://example.com/cross-category",
    title: "Cross Category Original"
  });
  const crossCategoryResponse = await fetch(`${bridgeUrl}/tabs/current/save`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "chrome-extension://deskpilot-test"
    },
    body: JSON.stringify({
      categoryId,
      tab: { url: "https://example.com/cross-category", title: "Cross Category Copy" }
    })
  });
  const crossCategoryPayload = await crossCategoryResponse.json();

  assert(crossCategoryResponse.status === 409, "Expected current-tab cross-category duplicate to require confirmation");
  assert(crossCategoryPayload.confirmationRequired, "Expected confirmation-required response");

  const confirmedCrossCategoryResponse = await fetch(`${bridgeUrl}/tabs/current/save`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "chrome-extension://deskpilot-test"
    },
    body: JSON.stringify({
      categoryId,
      allowCrossCategoryDuplicate: true,
      tab: { url: "https://example.com/cross-category", title: "Cross Category Copy" }
    })
  });
  const confirmedCrossCategoryPayload = await confirmedCrossCategoryResponse.json();

  assert(confirmedCrossCategoryPayload.savedCount === 1, "Expected confirmed cross-category duplicate to save");

  const unsupportedCurrentTabResponse = await fetch(`${bridgeUrl}/tabs/current/save`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "chrome-extension://deskpilot-test"
    },
    body: JSON.stringify({
      categoryId,
      tab: { url: "chrome://extensions", title: "Extensions" }
    })
  });
  const unsupportedCurrentTabPayload = await unsupportedCurrentTabResponse.json();

  assert(unsupportedCurrentTabResponse.status === 400, "Expected unsupported current tab to be rejected");
  assert(
    unsupportedCurrentTabPayload.error === "This browser page cannot be saved.",
    "Expected unsupported current tab to get a clear error"
  );

  addTab({
    categoryId,
    url: "https://example.com/old-capture",
    title: "Old Capture"
  });
  const windowAppendResponse = await fetch(`${bridgeUrl}/windows/current/save`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "chrome-extension://deskpilot-test"
    },
    body: JSON.stringify({
      categoryId,
      mode: "append",
      allowCrossCategoryDuplicates: false,
      tabs: [
        { url: "https://example.com/bridge", title: "Bridge Test" },
        { url: "https://example.com/old-capture", title: "Old Capture Duplicate" },
        { url: "chrome://history", title: "History" }
      ]
    })
  });
  const windowAppendPayload = await windowAppendResponse.json();

  assert(windowAppendPayload.savedCount === 1, "Expected window append to save one new tab");
  assert(windowAppendPayload.skippedSameCategoryDuplicateCount === 1, "Expected window append to skip same-category duplicate");
  assert(windowAppendPayload.skippedUnsupportedCount === 1, "Expected window append to report unsupported pages");
  assert(listTabs(categoryId).some((item) => item.title === "Bridge Test"), "Expected window bridge tab in storage");

  const windowCrossCategoryAskResponse = await fetch(`${bridgeUrl}/windows/current/save`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "chrome-extension://deskpilot-test"
    },
    body: JSON.stringify({
      categoryId,
      mode: "append",
      tabs: [{ url: "https://example.com/cross-window", title: "Cross Window Copy" }]
    })
  });
  const windowCrossCategoryAskPayload = await windowCrossCategoryAskResponse.json();

  assert(windowCrossCategoryAskResponse.status === 200, "Expected no conflict before source duplicate exists");
  assert(windowCrossCategoryAskPayload.savedCount === 1, "Expected first cross-window save to create target URL");
  addTab({
    categoryId: otherCategoryId,
    url: "https://example.com/window-other",
    title: "Window Other"
  });
  const windowCrossCategorySkipResponse = await fetch(`${bridgeUrl}/windows/current/save`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "chrome-extension://deskpilot-test"
    },
    body: JSON.stringify({
      categoryId,
      mode: "append",
      allowCrossCategoryDuplicates: false,
      tabs: [
        { url: "https://example.com/window-other", title: "Window Other Copy" },
        { url: "https://example.com/window-new", title: "Window New" }
      ]
    })
  });
  const windowCrossCategorySkipPayload = await windowCrossCategorySkipResponse.json();

  assert(windowCrossCategorySkipPayload.savedCount === 1, "Expected declined window duplicate prompt to save non-conflicting tabs");
  assert(
    windowCrossCategorySkipPayload.skippedCrossCategoryDuplicateCount === 1,
    "Expected declined window duplicate prompt to skip cross-category duplicate"
  );

  const replaceResponse = await fetch(`${bridgeUrl}/windows/current/save`, {
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

  assert(replacePayload.mode === "replace", "Expected window route to report replace mode");
  assert(replacePayload.savedCount === 1, "Expected replace save to save one tab");
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

  const directTabConflict = saveCapturedTab(
    categoryId,
    { categoryId, url: "https://example.com/window-other", title: "Direct Conflict" },
    { crossCategoryDuplicatePolicy: "ask" }
  );
  assert(directTabConflict.confirmationRequired, "Expected direct tab save to report cross-category confirmation requirement");

  const legacyCaptureResponse = await fetch(`${bridgeUrl}/capture`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "chrome-extension://deskpilot-test"
    },
    body: JSON.stringify({ categoryId, tabs: [] })
  });
  assert(legacyCaptureResponse.status === 404, "Expected legacy /capture route to be removed");

  const showAppResponse = await fetch(`${bridgeUrl}/app/show`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "chrome-extension://deskpilot-test"
    },
    body: "{}"
  });
  assert(showAppResponse.status === 200, "Expected app show bridge route to be reachable");
} finally {
  await new Promise((resolve) => bridgeServer.close(resolve));
}

const extensionInfo = getExtensionInstallInfo(process.cwd());
assert(extensionInfo.manifestPresent, "Expected browser extension manifest to be present");
assert(extensionInfo.extensionPath.endsWith("browser-extension"), "Expected extension path to point at browser-extension");
const extensionManifest = JSON.parse(fs.readFileSync(path.join(extensionInfo.extensionPath, "manifest.json"), "utf-8"));
const extensionPopupScript = fs.readFileSync(path.join(extensionInfo.extensionPath, "popup.js"), "utf-8");

for (const size of ["16", "32", "48", "128"]) {
  const iconPath = extensionManifest.icons?.[size];
  const actionIconPath = extensionManifest.action?.default_icon?.[size];

  assert(iconPath, `Expected extension manifest icon for ${size}px`);
  assert(actionIconPath === iconPath, `Expected action icon to reuse manifest ${size}px icon`);
  assert(fs.existsSync(path.join(extensionInfo.extensionPath, iconPath)), `Expected ${size}px extension icon file to exist`);
}

assert(!extensionPopupScript.includes("/capture"), "Expected extension popup not to call legacy /capture route");
assert(extensionPopupScript.includes("/tabs/current/save"), "Expected extension popup to call current-tab route");
assert(extensionPopupScript.includes("/windows/current/save"), "Expected extension popup to call current-window route");
assert(extensionPopupScript.includes("/app/show"), "Expected extension popup to call app-show route");
assert(
  extensionPopupScript.includes(extensionClientHeaderName) && extensionPopupScript.includes(extensionClientHeaderValue),
  "Expected extension popup to send the DeskPilot bridge client header"
);

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
