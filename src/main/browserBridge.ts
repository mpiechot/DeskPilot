import http from "node:http";
import type { AddressInfo } from "node:net";
import { addTab, listCategories } from "./storage.js";

type CapturedTab = {
  url?: unknown;
  title?: unknown;
};

type CapturePayload = {
  categoryId?: unknown;
  tabs?: unknown;
};

const bridgePort = 17383;
const allowedOriginPrefixes = ["chrome-extension://", "edge-extension://"];

export function startBrowserBridge(): http.Server {
  const server = http.createServer((request, response) => {
    void handleRequest(request, response);
  });

  server.listen(bridgePort, "127.0.0.1");
  server.on("listening", () => {
    const address = server.address() as AddressInfo;
    console.log(`DeskPilot browser bridge listening on ${address.address}:${address.port}`);
  });

  return server;
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
    const tabs = Array.isArray(payload.tabs) ? payload.tabs : [];
    let savedCount = 0;

    for (const tab of tabs) {
      const capturedTab = tab as CapturedTab;

      if (typeof capturedTab.url !== "string") {
        continue;
      }

      addTab({
        categoryId,
        url: capturedTab.url,
        title: typeof capturedTab.title === "string" ? capturedTab.title : ""
      });
      savedCount += 1;
    }

    writeJson(response, 200, { savedCount, categories: listCategories() });
  } catch (error) {
    writeJson(response, 400, { error: error instanceof Error ? error.message : "Capture failed" });
  }
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return true;
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
