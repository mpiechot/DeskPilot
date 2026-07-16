import http from "node:http";
import type { AddressInfo } from "node:net";
import type {
  BridgeStatus,
  CaptureMode,
  CaptureResult,
  CrossCategoryDuplicatePolicy,
  DataProfileId,
  DataProfileInfo,
  SessionTabInput
} from "../shared/deskPilotApi.js";
import { getActiveCategoryId, getDataProfileInfo, listCategories, saveCapturedTab, saveCapturedTabs } from "./storage.js";

type CapturedTab = {
  url?: unknown;
  title?: unknown;
};

type CurrentTabSavePayload = {
  categoryId?: unknown;
  tab?: unknown;
  allowCrossCategoryDuplicate?: unknown;
};

type WindowSavePayload = {
  categoryId?: unknown;
  allowCrossCategoryDuplicates?: unknown;
  tabs?: unknown;
  mode?: unknown;
};

type BridgeOptions = {
  port?: number;
  dataProfile?: DataProfileInfo;
  showApp?: () => void;
  onSessionsChanged?: () => void;
};

export const bridgeHost = "127.0.0.1";
export const productiveBridgePort = 17383;
export const developmentBridgePort = 17384;
export const bridgePort = productiveBridgePort;
export const allowedOriginPrefixes = ["chrome-extension://", "edge-extension://"];
export const extensionClientHeaderName = "x-deskpilot-client";
export const extensionClientHeaderValue = "deskpilot-browser-extension";

export function startBrowserBridge(options: BridgeOptions = {}): http.Server {
  const port = resolveBridgePort(options);
  const server = http.createServer((request, response) => {
    void handleRequest(request, response, options);
  });

  server.on("error", (error: NodeJS.ErrnoException) => {
    if (error.code === "EADDRINUSE") {
      console.warn(`DeskPilot extension bridge could not bind ${bridgeHost}:${port}; port is already in use.`);
      return;
    }

    console.warn(`DeskPilot extension bridge failed: ${error.message}`);
  });

  server.listen(port, bridgeHost);
  server.on("listening", () => {
    const address = server.address() as AddressInfo;
    console.log(`DeskPilot extension bridge listening on ${address.address}:${address.port} (not the app UI)`);
  });

  return server;
}

export function getBrowserBridgeStatus(server: http.Server | null, dataProfile?: DataProfileInfo): BridgeStatus {
  const address = server?.address();
  const actualPort = typeof address === "object" && address ? address.port : getBridgePortForDataProfile(dataProfile?.id ?? "productive");

  return {
    running: Boolean(server?.listening),
    host: bridgeHost,
    port: actualPort,
    allowedOrigins: allowedOriginPrefixes,
    dataProfile
  };
}

export function getBridgePortForDataProfile(profileId: DataProfileId): number {
  return profileId === "development" ? developmentBridgePort : productiveBridgePort;
}

function resolveBridgePort(options: BridgeOptions): number {
  return options.port ?? getBridgePortForDataProfile(options.dataProfile?.id ?? "productive");
}

async function handleRequest(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  options: BridgeOptions
): Promise<void> {
  if (request.method === "GET" && isBridgeInfoPath(request.url)) {
    writeText(
      response,
      200,
      [
        "DeskPilot local extension bridge is running.",
        "",
        "This URL is not the DeskPilot app UI.",
        "Start DeskPilot with the desktop launcher and use the Chrome/Edge extension to save browser windows."
      ].join("\n")
    );
    return;
  }

  if (!isAllowedBridgeClient(request)) {
    writeJson(response, 403, { error: "Origin not allowed" });
    return;
  }

  applyCorsHeaders(request, response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "GET" && request.url === "/categories") {
    writeJson(response, 200, {
      categories: listCategories(),
      activeCategoryId: getActiveCategoryId(),
      dataProfile: getDataProfileInfo()
    });
    return;
  }

  if (request.method === "POST" && request.url === "/tabs/current/save") {
    await handleCurrentTabSave(request, response, options);
    return;
  }

  if (request.method === "POST" && request.url === "/windows/current/save") {
    await handleCurrentWindowSave(request, response, options);
    return;
  }

  if (request.method === "POST" && request.url === "/app/show") {
    options.showApp?.();
    writeJson(response, 200, { shown: true });
    return;
  }

  writeJson(response, 404, { error: "Not found" });
}

async function handleCurrentTabSave(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  options: BridgeOptions
): Promise<void> {
  try {
    const payload = (await readJsonBody(request)) as CurrentTabSavePayload;
    const categoryId = typeof payload.categoryId === "string" ? payload.categoryId : "";
    const tab = normalizeCurrentTabPayload(payload.tab, categoryId);
    const result = saveCapturedTab(categoryId, tab, {
      crossCategoryDuplicatePolicy: payload.allowCrossCategoryDuplicate === true ? "allow" : "ask"
    });

    notifySessionsChangedIfNeeded(options, result);
    writeCaptureResult(response, result);
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : "Current tab save failed" });
  }
}

async function handleCurrentWindowSave(
  request: http.IncomingMessage,
  response: http.ServerResponse,
  options: BridgeOptions
): Promise<void> {
  try {
    const payload = (await readJsonBody(request)) as WindowSavePayload;
    const categoryId = typeof payload.categoryId === "string" ? payload.categoryId : "";
    const mode = normalizeCaptureMode(payload.mode);
    const { saveableTabs, skippedUnsupportedCount } = normalizeWindowTabsPayload(payload.tabs, categoryId);

    if (saveableTabs.length === 0) {
      writeCaptureResult(response, saveCapturedTabs(categoryId, [], mode, { skippedUnsupportedCount }));
      return;
    }

    const result = saveCapturedTabs(categoryId, saveableTabs, mode, {
      crossCategoryDuplicatePolicy: normalizeCrossCategoryDuplicatePolicy(payload.allowCrossCategoryDuplicates),
      skippedUnsupportedCount
    });

    notifySessionsChangedIfNeeded(options, result);
    writeCaptureResult(response, result);
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : "Current window save failed" });
  }
}

function normalizeCaptureMode(value: unknown): CaptureMode {
  if (value === undefined || value === null || value === "append") {
    return "append";
  }

  if (value === "replace") {
    return "replace";
  }

  throw new Error("Capture mode is not supported.");
}

function normalizeCrossCategoryDuplicatePolicy(value: unknown): CrossCategoryDuplicatePolicy {
  if (value === true) {
    return "allow";
  }

  if (value === false) {
    return "skip";
  }

  return "ask";
}

function normalizeCurrentTabPayload(value: unknown, categoryId: string): SessionTabInput {
  const tab = value as CapturedTab;

  if (!tab || typeof tab.url !== "string" || !isHttpUrl(tab.url)) {
    throw new Error("This browser page cannot be saved.");
  }

  return {
    categoryId,
    url: tab.url,
    title: typeof tab.title === "string" ? tab.title : ""
  };
}

function normalizeWindowTabsPayload(value: unknown, categoryId: string): {
  saveableTabs: SessionTabInput[];
  skippedUnsupportedCount: number;
} {
  const tabs = Array.isArray(value) ? value : [];
  const saveableTabs: SessionTabInput[] = [];
  let skippedUnsupportedCount = 0;

  for (const item of tabs) {
    const tab = item as CapturedTab;

    if (typeof tab.url !== "string" || !isHttpUrl(tab.url)) {
      skippedUnsupportedCount += 1;
      continue;
    }

    saveableTabs.push({
      categoryId,
      url: tab.url,
      title: typeof tab.title === "string" ? tab.title : ""
    });
  }

  return { saveableTabs, skippedUnsupportedCount };
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function writeCaptureResult(response: http.ServerResponse, result: CaptureResult): void {
  if (result.confirmationRequired) {
    writeJson(response, 409, {
      ...result,
      error: "URL already saved in another category."
    });
    return;
  }

  writeJson(response, 200, result);
}

function notifySessionsChangedIfNeeded(options: BridgeOptions, result: CaptureResult): void {
  if (result.savedCount === 0 && result.restoredCount === 0) {
    return;
  }

  try {
    options.onSessionsChanged?.();
  } catch {
    // The bridge response is more important than a renderer refresh notification.
  }
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return false;
  }

  return allowedOriginPrefixes.some((prefix) => origin.startsWith(prefix));
}

function isAllowedBridgeClient(request: http.IncomingMessage): boolean {
  const origin = request.headers.origin;

  if (isAllowedOrigin(origin)) {
    return true;
  }

  if (origin) {
    return false;
  }

  return request.headers[extensionClientHeaderName] === extensionClientHeaderValue;
}

function isBridgeInfoPath(url: string | undefined): boolean {
  return url === "/" || url === "/health";
}

function applyCorsHeaders(request: http.IncomingMessage, response: http.ServerResponse): void {
  const origin = request.headers.origin;

  if (origin && isAllowedOrigin(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
  }

  response.setHeader("Access-Control-Allow-Headers", `content-type, ${extensionClientHeaderName}`);
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}

function readJsonBody(request: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk: Buffer) => {
      body += chunk.toString("utf-8");

      if (body.length > 1_000_000) {
        reject(new Error("Request body too large."));
        request.destroy();
      }
    });

    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON."));
      }
    });

    request.on("error", reject);
  });
}

function writeJson(response: http.ServerResponse, statusCode: number, value: unknown): void {
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(JSON.stringify(value));
}

function writeText(response: http.ServerResponse, statusCode: number, value: string): void {
  response.writeHead(statusCode, { "content-type": "text/plain; charset=utf-8" });
  response.end(value);
}
