import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import ts from "typescript";

// Execute the real main-process entry point with isolated OS/storage boundaries.
// No running DeskPilot instance, user files or real Windows session are touched.
const entryUrl = new URL("../src/main/index.ts", import.meta.url);
const source = fs.readFileSync(entryUrl, "utf8").replaceAll("import.meta.url", JSON.stringify(entryUrl.href));
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
});

async function boot({ saveError = null } = {}) {
  const windows = [];
  const errors = [];
  let saves = 0;
  let bridgeCloses = 0;
  const bridge = { listening: true, close() { bridgeCloses++; this.listening = false; } };
  class Window extends EventEmitter {
    destroyed = false;
    hidden = false;
    constructor() { super(); windows.push(this); }
    static getAllWindows() { return windows.filter((window) => !window.destroyed); }
    isDestroyed() { return this.destroyed; }
    getBounds() {
      assert.equal(this.destroyed, false, "accessed a destroyed native window");
      return { x: 80, y: 80, width: 1180, height: 390 };
    }
    hide() { this.hidden = true; }
    show() { assert.equal(this.destroyed, false, "showed a destroyed native window"); }
    focus() {}
    isMinimized() { return false; }
    loadFile() { return Promise.resolve(); }
  }
  const app = Object.assign(new EventEmitter(), {
    requestSingleInstanceLock: () => true,
    whenReady: () => Promise.resolve(),
    getPath: () => "isolated-user-data",
    getVersion: () => "1.1.0",
    isPackaged: false,
    quit() { this.emit("before-quit"); }
  });
  const dependencies = {
    electron: {
      app, BrowserWindow: Window, ipcMain: { handle() {} },
      nativeTheme: { shouldUseDarkColors: false }, screen: { getAllDisplays: () => [] },
      Tray: class { setToolTip() {} setContextMenu() {} }, Menu: { buildFromTemplate: () => [] }
    },
    "node:path": path,
    "node:url": { fileURLToPath },
    "./storage.js": { initializeStorage: async () => {}, getDataProfileInfo: () => ({}) },
    "./browserBridge.js": { startBrowserBridge: () => bridge },
    "./browserLauncher.js": {}, "./extensionInstall.js": {}, "./storageStartupFailure.js": {},
    "./trayIcon.js": { createTrayIcon: () => null },
    "./appUpdate.js": { AppUpdateService: class { checkAtStartup() {} } },
    "./windowSettings.js": {
      loadWindowPreferences: () => ({}), loadWindowBounds: () => ({}), resolveWindowBounds: () => ({}),
      saveWindowBounds() { saves++; if (saveError) throw saveError; }
    }
  };
  vm.runInNewContext(outputText, {
    exports: {}, process: { env: {}, platform: "win32" },
    console: { error: (...args) => errors.push(args) },
    require(name) { assert.ok(name in dependencies, `unexpected dependency: ${name}`); return dependencies[name]; }
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(windows.length, 1);
  return { app, windows, errors, get saves() { return saves; }, get bridgeCloses() { return bridgeCloses; } };
}

function close(window) {
  const event = { prevented: false, preventDefault() { this.prevented = true; } };
  window.emit("close", event);
  return event;
}

test("ordinary close saves geometry and hides to tray", async () => {
  const state = await boot();
  assert.equal(close(state.windows[0]).prevented, true);
  assert.equal(state.windows[0].hidden, true);
  assert.equal(state.saves, 1);
});

test("settings I/O failure cannot escape the close handler", async () => {
  const state = await boot({ saveError: new Error("EPERM: rename window.json.tmp") });
  assert.doesNotThrow(() => close(state.windows[0]));
  assert.equal(state.windows[0].hidden, true);
  assert.equal(state.errors.length, 1);
});

test("confirmed Windows session end cleans up without before-quit", async () => {
  const state = await boot();
  state.windows[0].emit("session-end", {});
  assert.equal(state.bridgeCloses, 1);
  assert.equal(close(state.windows[0]).prevented, false);
  assert.equal(state.windows[0].hidden, false);
  state.app.emit("before-quit");
  assert.equal(state.bridgeCloses, 1);
});

test("shutdown query saves geometry but allows a cancelled shutdown to keep using tray", async () => {
  const state = await boot();
  state.windows[0].emit("query-session-end", { preventDefault() { assert.fail("blocked Windows shutdown"); } });
  assert.equal(state.saves, 1);
  assert.equal(state.bridgeCloses, 0);
  assert.equal(close(state.windows[0]).prevented, true);
});

test("shutdown query tolerates a settings write failure", async () => {
  const state = await boot({ saveError: new Error("EACCES") });
  assert.doesNotThrow(() => state.windows[0].emit("query-session-end", {}));
  assert.equal(state.errors.length, 1);
});

test("ordinary quit permits close even when saving geometry fails", async () => {
  const state = await boot({ saveError: new Error("EPERM") });
  state.app.emit("before-quit");
  assert.equal(close(state.windows[0]).prevented, false);
});

test("second-instance cannot access a window after closed", async () => {
  const state = await boot();
  state.windows[0].destroyed = true;
  state.windows[0].emit("closed");
  assert.doesNotThrow(() => state.app.emit("second-instance"));
  assert.equal(state.windows.length, 2);
});

test("confirmed shutdown cannot reopen the window via activation or second-instance", async () => {
  const state = await boot();
  state.windows[0].emit("session-end", {});
  state.windows[0].destroyed = true;
  state.windows[0].emit("closed");
  state.app.emit("activate");
  state.app.emit("second-instance");
  assert.equal(state.windows.length, 1);
});
