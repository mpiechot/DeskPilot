import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import initSqlJs from "sql.js";
import {
  StorageStartupError,
  createCategory,
  createManualBackup,
  addTab,
  deleteCategory,
  deleteTab,
  exportStorageBackup,
  getActiveCategoryId,
  getDataProfileInfo,
  getStorageInfo,
  importStorageBackup,
  initializeStorage,
  listDeletedCategories,
  listDeletedTabs,
  listCategories,
  listTabs,
  moveTab,
  restoreCategory,
  restoreManualBackup,
  restoreRollingBackup,
  restoreTab,
  saveCapturedTab,
  saveCapturedTabs,
  setActiveCategoryId,
  updateCategory
} from "../dist-electron/main/storage.js";
import { loadWindowBounds, saveWindowBounds } from "../dist-electron/main/windowSettings.js";
import {
  developmentBridgePort,
  extensionClientHeaderName,
  extensionClientHeaderValue,
  getBrowserBridgeStatus,
  productiveBridgePort,
  startBrowserBridge
} from "../dist-electron/main/browserBridge.js";
import {
  createBrowserWindowLaunchPlan,
  getSupportedBrowserExecutableCandidates
} from "../dist-electron/main/browserLauncher.js";
import { getExtensionInstallInfo } from "../dist-electron/main/extensionInstall.js";
import { createStorageStartupFailurePrompt } from "../dist-electron/main/storageStartupFailure.js";

process.env.DESKPILOT_DATA_PROFILE = "development";
process.env.DESKPILOT_DISALLOW_PRODUCTIVE_PROFILE = "1";

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "deskpilot-storage-"));

await initializeStorage(dir, { profile: "development", disallowProductive: true });

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

const databasePath = path.join(dir, "profiles", "development", "storage", "deskpilot.sqlite");
const backupPath = path.join(dir, "profiles", "development", "storage", "deskpilot.sqlite.bak");
const orderCategory = createCategory({ name: "Order Test", description: "Saved tab order checks." }).find(
  (category) => category.name === "Order Test"
);
assert(orderCategory, "Expected Order Test category after create");
addTab({
  categoryId: orderCategory.id,
  url: "https://example.com/order-alpha",
  title: "Order Alpha"
});
addTab({
  categoryId: orderCategory.id,
  url: "https://example.com/order-beta",
  title: "Order Beta"
});
addTab({
  categoryId: orderCategory.id,
  url: "https://example.com/order-gamma",
  title: "Order Gamma"
});
assertTabOrder(
  listTabs(orderCategory.id),
  ["Order Alpha", "Order Beta", "Order Gamma"],
  "Expected newly saved tabs to receive stable positions"
);
const orderedRestoreUrls = listTabs(orderCategory.id).map((item) => item.url);
const orderedRestoreLaunchPlan = createBrowserWindowLaunchPlan(
  orderedRestoreUrls,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
);
assert(
  JSON.stringify(orderedRestoreLaunchPlan.args.slice(1)) === JSON.stringify(orderedRestoreUrls),
  "Expected saved category restore launch plan to preserve Tab Order"
);

await initializeStorage(dir, { profile: "development", disallowProductive: true });
assertTabOrder(
  listTabs(orderCategory.id),
  ["Order Alpha", "Order Beta", "Order Gamma"],
  "Expected saved tab order to survive storage restart"
);

await rewriteSqliteDatabase(databasePath, (db) => {
  db.run("UPDATE session_tabs SET position = 0 WHERE category_id = $categoryId", {
    $categoryId: orderCategory.id
  });
  db.run("UPDATE session_tabs SET saved_at = '2026-01-01T00:00:01.000Z' WHERE title = 'Order Alpha'");
  db.run("UPDATE session_tabs SET saved_at = '2026-01-01T00:00:02.000Z' WHERE title = 'Order Beta'");
  db.run("UPDATE session_tabs SET saved_at = '2026-01-01T00:00:03.000Z' WHERE title = 'Order Gamma'");
});
await initializeStorage(dir, { profile: "development", disallowProductive: true });
assertTabOrder(
  listTabs(orderCategory.id),
  ["Order Alpha", "Order Beta", "Order Gamma"],
  "Expected migration to normalize legacy duplicate tab positions deterministically"
);
assert(fs.existsSync(databasePath), "Expected SQLite database file");
assert(fs.existsSync(backupPath), "Expected SQLite backup file after writes");

const initialStorageInfo = getStorageInfo();
assert(getDataProfileInfo().id === "development", "Expected active data profile helper to report Development");
assert(initialStorageInfo.dataProfile.id === "development", "Expected smoke tests to use the Development profile");
assert(
  initialStorageInfo.dataProfile.databasePath === databasePath,
  "Expected profile info to expose the active Development database path"
);
assert(initialStorageInfo.databasePath === databasePath, "Expected storage info to expose the database path");
assert(initialStorageInfo.rollingBackupPath === backupPath, "Expected storage info to expose the rolling backup path");
assert(initialStorageInfo.manualBackups.length === 0, "Expected no manual backups before creating one");
const backupInfo = createManualBackup();
assert(backupInfo.manualBackups.length === 1, "Expected one manual backup after creating one");
assert(fs.existsSync(backupInfo.manualBackups[0].path), "Expected manual backup file to exist");
assert(backupInfo.manualBackups[0].sizeBytes > 0, "Expected manual backup file to contain data");

createCategory({ name: "After Backup", description: "Should disappear after restore." });
addTab({
  categoryId: orderCategory.id,
  url: "https://example.com/order-delta",
  title: "Order Delta"
});
assert(
  listCategories().some((category) => category.name === "After Backup"),
  "Expected mutation after manual backup"
);
assertTabOrder(
  listTabs(orderCategory.id),
  ["Order Alpha", "Order Beta", "Order Gamma", "Order Delta"],
  "Expected mutation after manual backup to append at the end of Tab Order"
);
const restoreResult = restoreManualBackup(backupInfo.manualBackups[0].fileName);
assert(!listCategories().some((category) => category.name === "After Backup"), "Expected restore to replace active data");
assertTabOrder(
  listTabs(orderCategory.id),
  ["Order Alpha", "Order Beta", "Order Gamma"],
  "Expected restore to recover the backed-up Tab Order"
);
assert(restoreResult.safetyBackupFileName.includes("pre-restore"), "Expected restore to create a pre-restore safety backup");
assert(
  fs.existsSync(path.join(dir, "profiles", "development", "storage", "manual-backups", restoreResult.safetyBackupFileName)),
  "Expected pre-restore safety backup file"
);

const boardSourceCategory = createCategory({
  name: "Board Source",
  description: "Session Board move source."
}).find((category) => category.name === "Board Source");
const boardTargetCategory = createCategory({
  name: "Board Target",
  description: "Session Board move target."
}).find((category) => category.name === "Board Target");
assert(boardSourceCategory && boardTargetCategory, "Expected Session Board categories after create");
addTab({
  categoryId: boardSourceCategory.id,
  url: "https://example.com/board-alpha",
  title: "Board Alpha"
});
addTab({
  categoryId: boardSourceCategory.id,
  url: "https://example.com/board-beta",
  title: "Board Beta"
});
addTab({
  categoryId: boardTargetCategory.id,
  url: "https://example.com/board-gamma",
  title: "Board Gamma"
});

let boardBeta = listTabs(boardSourceCategory.id).find((item) => item.title === "Board Beta");
assert(boardBeta, "Expected Board Beta before cross-category move");
const boardMoveResult = moveTab(boardBeta.id, {
  targetCategoryId: boardTargetCategory.id,
  targetPosition: 1
});
assert(
  boardMoveResult.categories.some((category) => category.id === boardSourceCategory.id && category.tabCount === 1),
  "Expected source category count to update after Session Board move"
);
assert(
  boardMoveResult.categories.some((category) => category.id === boardTargetCategory.id && category.tabCount === 2),
  "Expected target category count to update after Session Board move"
);
assertTabOrder(
  listTabs(boardSourceCategory.id),
  ["Board Alpha"],
  "Expected cross-category move to remove the tab from the source category"
);
assertTabOrder(
  listTabs(boardTargetCategory.id),
  ["Board Gamma", "Board Beta"],
  "Expected cross-category move to insert the tab at the requested target position"
);

await initializeStorage(dir, { profile: "development", disallowProductive: true });
assertTabOrder(
  listTabs(boardTargetCategory.id),
  ["Board Gamma", "Board Beta"],
  "Expected Session Board cross-category move to survive storage restart"
);

boardBeta = listTabs(boardTargetCategory.id).find((item) => item.title === "Board Beta");
assert(boardBeta, "Expected Board Beta before same-category reorder");
moveTab(boardBeta.id, {
  targetCategoryId: boardTargetCategory.id,
  targetPosition: 0
});
assertTabOrder(
  listTabs(boardTargetCategory.id),
  ["Board Beta", "Board Gamma"],
  "Expected same-category Session Board reorder to update Tab Order"
);
const reorderedRestoreLaunchPlan = createBrowserWindowLaunchPlan(
  listTabs(boardTargetCategory.id).map((item) => item.url),
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
);
assert(
  reorderedRestoreLaunchPlan.args[1] === "https://example.com/board-beta",
  "Expected reordered Session Board category restore to use the updated order"
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

const restoreLaunchPlan = createBrowserWindowLaunchPlan(
  ["https://example.com/one", "https://example.com/two"],
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
);
assert(
  restoreLaunchPlan.args[0] === "--new-window",
  "Expected saved category restore to request a new browser window"
);
assert(
  restoreLaunchPlan.args.includes("https://example.com/one") && restoreLaunchPlan.args.includes("https://example.com/two"),
  "Expected saved category restore to launch all saved URLs together"
);
const restoreBrowserCandidates = getSupportedBrowserExecutableCandidates({
  ProgramFiles: "C:\\Program Files",
  "ProgramFiles(x86)": "C:\\Program Files (x86)",
  LOCALAPPDATA: "C:\\Users\\DeskPilot\\AppData\\Local"
});
assert(
  restoreBrowserCandidates.some((candidate) => candidate.endsWith("Chrome\\Application\\chrome.exe")),
  "Expected saved category restore to support Chrome"
);
assert(
  restoreBrowserCandidates.some((candidate) => candidate.endsWith("Edge\\Application\\msedge.exe")),
  "Expected saved category restore to support Edge"
);
assert(productiveBridgePort === 17383, "Expected Productive extension bridge to keep the browser-extension port");
assert(developmentBridgePort !== productiveBridgePort, "Expected Development bridge not to share Productive's extension port");

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
  assert(categoriesPayload.dataProfile?.id === "development", "Expected bridge categories to expose the connected data profile");

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

const occupiedPortServer = http.createServer();
await new Promise((resolve) => occupiedPortServer.listen(0, "127.0.0.1", resolve));
const occupiedAddress = occupiedPortServer.address();
const occupiedPort = typeof occupiedAddress === "object" && occupiedAddress ? occupiedAddress.port : 0;
const conflictingBridgeServer = startBrowserBridge({ port: occupiedPort });
await new Promise((resolve) => setTimeout(resolve, 50));
assert(
  !getBrowserBridgeStatus(conflictingBridgeServer).running,
  "Expected bridge startup on an occupied port to fail without crashing DeskPilot"
);
if (conflictingBridgeServer.listening) {
  await new Promise((resolve) => conflictingBridgeServer.close(resolve));
}
await new Promise((resolve) => occupiedPortServer.close(resolve));

const profileIsolationDir = fs.mkdtempSync(path.join(os.tmpdir(), "deskpilot-profiles-"));
await initializeStorage(profileIsolationDir, { profile: "development", disallowProductive: true });
createCategory({ name: "Development Only", description: "Must stay out of Productive." });
const developmentProfileInfo = getStorageInfo();
assert(developmentProfileInfo.dataProfile.id === "development", "Expected Development profile to initialize");
assert(fs.existsSync(developmentProfileInfo.databasePath), "Expected Development profile database to exist");

await assertRejects(
  () => initializeStorage(profileIsolationDir, { profile: "productive", disallowProductive: true }),
  "Expected tooling guard to block Productive profile initialization"
);
assert(getStorageInfo().dataProfile.id === "development", "Expected failed Productive guard not to switch active profile");

await initializeStorage(profileIsolationDir, { profile: "productive", disallowProductive: false });
assert(getStorageInfo().dataProfile.id === "productive", "Expected explicit Productive profile initialization");
assert(
  !listCategories().some((category) => category.name === "Development Only"),
  "Expected Productive profile not to read Development categories"
);
createCategory({ name: "Productive Only", description: "Must stay out of Development." });

await initializeStorage(profileIsolationDir, { profile: "development", disallowProductive: true });
assert(
  listCategories().some((category) => category.name === "Development Only"),
  "Expected Development profile writes to persist"
);
assert(
  !listCategories().some((category) => category.name === "Productive Only"),
  "Expected Development profile not to read Productive categories"
);

const cutoverDir = fs.mkdtempSync(path.join(os.tmpdir(), "deskpilot-cutover-"));
await initializeStorage(cutoverDir, { profile: "development", disallowProductive: true });
createCategory({ name: "Legacy Copied", description: "Should copy into Productive once." });
addTab({
  categoryId: "work",
  url: "https://example.com/legacy-cutover",
  title: "Legacy Cutover Tab"
});
const legacySourceDatabase = getStorageInfo().databasePath;
const legacyDatabasePath = path.join(cutoverDir, "storage", "deskpilot.sqlite");
fs.mkdirSync(path.dirname(legacyDatabasePath), { recursive: true });
fs.copyFileSync(legacySourceDatabase, legacyDatabasePath);

await initializeStorage(cutoverDir, { profile: "productive", disallowProductive: false });
const firstCutoverInfo = getStorageInfo();
assert(firstCutoverInfo.dataProfile.cutover.status === "copied-from-legacy", "Expected Productive cutover to copy legacy data");
assert(fs.existsSync(legacyDatabasePath), "Expected legacy prototype database to remain untouched after cutover");
assert(
  listCategories().some((category) => category.name === "Legacy Copied"),
  "Expected legacy category to exist in Productive after cutover"
);
assert(
  listTabs("work").some((tab) => tab.title === "Legacy Cutover Tab"),
  "Expected legacy saved tab to exist in Productive after cutover"
);
createCategory({ name: "Productive After Cutover", description: "Must survive later legacy changes." });

await initializeStorage(cutoverDir, { profile: "development", disallowProductive: true });
createCategory({ name: "Legacy Later", description: "Must not copy after Productive exists." });
fs.copyFileSync(getStorageInfo().databasePath, legacyDatabasePath);

await initializeStorage(cutoverDir, { profile: "productive", disallowProductive: false });
assert(
  listCategories().some((category) => category.name === "Productive After Cutover"),
  "Expected existing Productive data not to be overwritten by later legacy changes"
);
assert(
  !listCategories().some((category) => category.name === "Legacy Later"),
  "Expected legacy changes after cutover not to be imported automatically"
);
assert(
  getStorageInfo().dataProfile.cutover.status === "copied-from-legacy",
  "Expected Productive cutover state to remain one-time"
);

const rollingRestoreDir = fs.mkdtempSync(path.join(os.tmpdir(), "deskpilot-rolling-restore-"));
await initializeStorage(rollingRestoreDir, { profile: "development", disallowProductive: true });
createCategory({ name: "Rolling Baseline", description: "Must be restored from the rolling backup." });
createCategory({ name: "Rolling Mutation", description: "Must disappear after rolling restore." });
const rollingBackupInfo = getStorageInfo().rollingBackup;
assert(rollingBackupInfo, "Expected storage info to expose the available rolling backup");
assert(fs.existsSync(rollingBackupInfo.path), "Expected rolling backup file to exist");

const rollingRestoreResult = restoreRollingBackup();
assert(
  listCategories().some((category) => category.name === "Rolling Baseline"),
  "Expected rolling backup restore to recover the previous database state"
);
assert(
  !listCategories().some((category) => category.name === "Rolling Mutation"),
  "Expected rolling backup restore to replace the newer database state"
);
assert(
  rollingRestoreResult.safetyBackupFileName.includes("pre-restore"),
  "Expected rolling backup restore to create a pre-restore safety backup"
);
assert(
  fs.existsSync(path.join(rollingRestoreDir, "profiles", "development", "storage", "manual-backups", rollingRestoreResult.safetyBackupFileName)),
  "Expected rolling backup restore safety snapshot to remain available"
);

const startupRecoveryDir = fs.mkdtempSync(path.join(os.tmpdir(), "deskpilot-startup-recovery-"));
await initializeStorage(startupRecoveryDir, { profile: "development", disallowProductive: true });
createCategory({ name: "Startup Recovery Baseline", description: "Must survive active database corruption." });
createCategory({ name: "Startup Recovery Newer", description: "Exists only after the rolling backup state." });
const corruptedDatabasePath = getStorageInfo().databasePath;
fs.writeFileSync(corruptedDatabasePath, "corrupted DeskPilot database");

await initializeStorage(startupRecoveryDir, { profile: "development", disallowProductive: true });
const startupRecoveryInfo = getStorageInfo().startupRecovery;
assert(startupRecoveryInfo.status === "recovered-from-rolling", "Expected startup to recover a corrupted database");
assert(
  listCategories().some((category) => category.name === "Startup Recovery Baseline"),
  "Expected startup recovery to load the valid rolling backup state"
);
assert(
  !listCategories().some((category) => category.name === "Startup Recovery Newer"),
  "Expected startup recovery not to keep data newer than the rolling backup"
);
assert(startupRecoveryInfo.corruptDatabaseBackupPath, "Expected startup recovery to preserve the corrupted database file");
assert(
  startupRecoveryInfo.corruptDatabaseBackupPath.endsWith(".sqlite.corrupt"),
  "Expected the corrupted file not to appear as a restorable manual backup"
);
assert(
  fs.readFileSync(startupRecoveryInfo.corruptDatabaseBackupPath, "utf-8") === "corrupted DeskPilot database",
  "Expected preserved startup recovery file to contain the original corrupted data"
);
assert(
  !getStorageInfo().manualBackups.some((backup) => backup.path === startupRecoveryInfo.corruptDatabaseBackupPath),
  "Expected the corrupted file to stay out of the manual restore list"
);
assert(
  fs.existsSync(getStorageInfo().rollingBackupPath),
  "Expected startup recovery to preserve the valid rolling backup instead of overwriting it with corruption"
);

const startupFailureDir = fs.mkdtempSync(path.join(os.tmpdir(), "deskpilot-startup-failure-"));
await initializeStorage(startupFailureDir, { profile: "development", disallowProductive: true });
createCategory({ name: "Failure Baseline", description: "Creates the rolling backup for the failure test." });
const failedStorageInfo = getStorageInfo();
fs.writeFileSync(failedStorageInfo.databasePath, "corrupted active database");
fs.writeFileSync(failedStorageInfo.rollingBackupPath, "corrupted rolling backup");
let startupFailure = null;

try {
  await initializeStorage(startupFailureDir, { profile: "development", disallowProductive: true });
} catch (error) {
  startupFailure = error;
}

assert(startupFailure instanceof StorageStartupError, "Expected unusable active and rolling databases to produce a startup error");
assert(startupFailure.activeDatabasePath === failedStorageInfo.databasePath, "Expected startup error to expose active database path");
assert(startupFailure.rollingBackupPath === failedStorageInfo.rollingBackupPath, "Expected startup error to expose rolling backup path");
assert(startupFailure.storageDirectory === path.dirname(failedStorageInfo.databasePath), "Expected startup error to expose storage directory");
const startupFailurePrompt = createStorageStartupFailurePrompt(startupFailure);
assert(startupFailurePrompt.storageDirectory === startupFailure.storageDirectory, "Expected startup dialog to open the affected storage directory");
assert(
  startupFailurePrompt.options.detail.includes(startupFailure.activeDatabasePath) &&
    startupFailurePrompt.options.detail.includes(startupFailure.rollingBackupPath),
  "Expected startup dialog to show both unusable database paths"
);
assert(
  JSON.stringify(startupFailurePrompt.options.buttons) === JSON.stringify(["Open Storage Folder", "Quit"]),
  "Expected startup dialog to offer storage folder access and controlled quit"
);
assert(
  fs.readFileSync(failedStorageInfo.databasePath, "utf-8") === "corrupted active database" &&
    fs.readFileSync(failedStorageInfo.rollingBackupPath, "utf-8") === "corrupted rolling backup",
  "Expected startup failure to leave both unusable files untouched"
);

const extensionInfo = getExtensionInstallInfo(process.cwd());
assert(extensionInfo.manifestPresent, "Expected browser extension manifest to be present");
assert(extensionInfo.extensionPath.endsWith("browser-extension"), "Expected extension path to point at browser-extension");
const extensionManifest = JSON.parse(fs.readFileSync(path.join(extensionInfo.extensionPath, "manifest.json"), "utf-8"));
const extensionPopupHtml = fs.readFileSync(path.join(extensionInfo.extensionPath, "popup.html"), "utf-8");
const extensionPopupScript = fs.readFileSync(path.join(extensionInfo.extensionPath, "popup.js"), "utf-8");

for (const size of ["16", "32", "48", "128"]) {
  const iconPath = extensionManifest.icons?.[size];
  const actionIconPath = extensionManifest.action?.default_icon?.[size];

  assert(iconPath, `Expected extension manifest icon for ${size}px`);
  assert(actionIconPath === iconPath, `Expected action icon to reuse manifest ${size}px icon`);
  assert(fs.existsSync(path.join(extensionInfo.extensionPath, iconPath)), `Expected ${size}px extension icon file to exist`);
}

assert(!extensionPopupScript.includes("/capture"), "Expected extension popup not to call legacy /capture route");
assert(extensionPopupScript.includes(String(productiveBridgePort)), "Expected extension popup to try the Productive bridge port");
assert(extensionPopupScript.includes(String(developmentBridgePort)), "Expected extension popup to fall back to the Development bridge port");
assert(extensionPopupHtml.includes('id="profileBadge"'), "Expected extension popup to keep the connected data profile visible");
assert(
  extensionPopupScript.includes("profileBadge.dataset.profile"),
  "Expected extension popup to style the persistent profile badge from the connected profile"
);
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

async function assertRejects(operation, message) {
  try {
    await operation();
  } catch {
    return;
  }

  throw new Error(message);
}

function assertTabOrder(tabs, expectedTitles, message) {
  const titles = tabs.map((tab) => tab.title);
  const positions = tabs.map((tab) => tab.position);
  const expectedPositions = expectedTitles.map((_, index) => index);

  assert(
    JSON.stringify(titles) === JSON.stringify(expectedTitles),
    `${message}: expected titles ${JSON.stringify(expectedTitles)}, got ${JSON.stringify(titles)}`
  );
  assert(
    JSON.stringify(positions) === JSON.stringify(expectedPositions),
    `${message}: expected positions ${JSON.stringify(expectedPositions)}, got ${JSON.stringify(positions)}`
  );
}

async function rewriteSqliteDatabase(filePath, operation) {
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(process.cwd(), "node_modules", "sql.js", "dist", file)
  });
  const database = new SQL.Database(fs.readFileSync(filePath));

  try {
    operation(database);
    fs.writeFileSync(filePath, Buffer.from(database.export()));
  } finally {
    database.close();
  }
}
