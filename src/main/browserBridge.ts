import http from "node:http";
import type { AddressInfo } from "node:net";
import type { BridgeStatus, CaptureMode, SessionTabInput } from "../shared/deskPilotApi.js";
import { listCategories, saveCapturedTabs } from "./storage.js";

type CapturedTab = {
  url?: unknown;
  title?: unknown;
};

type CapturePayload = {
  categoryId?: unknown;
  mode?: unknown;
  tabs?: unknown;
};

export const bridgeHost = "127.0.0.1";
export const bridgePort = 17383;
export const allowedOriginPrefixes = ["chrome-extension://", "edge-extension://"];

export function startBrowserBridge(): http.Server {
  const server = http.createServer((request, response) => {
    void handleRequest(request, response);
  });

  server.listen(bridgePort, bridgeHost);
  server.on("listening", () => {
    const address = server.address() as AddressInfo;
    console.log(`DeskPilot browser bridge listening on ${address.address}:${address.port}`);
  });

  return server;
}

export function getBrowserBridgeStatus(server: http.Server | null): BridgeStatus {
  return {
    running: Boolean(server?.listening),
    host: bridgeHost,
    port: bridgePort,
    allowedOrigins: allowedOriginPrefixes
  };
}

async function handleRequest(request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {
  if (!isAllowedOrigin(request.headers.origin)) {
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
    writeJson(response, 200, { categories: listCategories() });
    return;
  }

  if (request.method === "POST" && request.url === "/capture") {
    await handleCapture(request, response);
    return;
  }

  writeJson(response, 404, { error: "Not found" });
}

async function handleCapture(request: http.IncomingMessage, response: http.ServerResponse): Promise<void> {
  try {
    const payload = (await readJsonBody(request)) as CapturePayload;
    const categoryId = typeof payload.categoryId === "string" ? payload.categoryId : "";
    const mode = normalizeCaptureMode(payload.mode);
    const tabs = Array.isArray(payload.tabs) ? payload.tabs : [];
    const saveableTabs: SessionTabInput[] = [];

    for (const tab of tabs) {
      const capturedTab = tab as CapturedTab;

      if (typeof capturedTab.url !== "string") {
        continue;
      }

      saveableTabs.push({
        categoryId,
        url: capturedTab.url,
        title: typeof capturedTab.title === "string" ? capturedTab.title : ""
      });
    }

    const result = saveCapturedTabs(categoryId, saveableTabs, mode);

    writeJson(response, 200, { savedCount: result.savedCount, mode: result.mode, categories: listCategories() });
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : "Capture failed" });
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

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return false;
  }

  return allowedOriginPrefixes.some((prefix) => origin.startsWith(prefix));
}

function applyCorsHeaders(request: http.IncomingMessage, response: http.ServerResponse): void {
  const origin = request.headers.origin;

  if (origin && isAllowedOrigin(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin);
  }

  response.setHeader("Access-Control-Allow-Headers", "content-type");
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
