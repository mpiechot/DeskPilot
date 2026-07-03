import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export type BrowserWindowLaunchPlan = {
  executablePath: string;
  args: string[];
};

type Environment = NodeJS.ProcessEnv;

type SpawnBrowser = (executablePath: string, args: string[]) => void;

type OpenExternal = (url: string) => Promise<unknown>;

const browserRelativePaths = [
  ["Google", "Chrome", "Application", "chrome.exe"],
  ["Microsoft", "Edge", "Application", "msedge.exe"]
];

export function createBrowserWindowLaunchPlan(urls: string[], executablePath: string): BrowserWindowLaunchPlan {
  return {
    executablePath,
    args: ["--new-window", ...urls]
  };
}

export function getSupportedBrowserExecutableCandidates(environment: Environment = process.env): string[] {
  const basePaths = [
    environment.ProgramFiles,
    environment["ProgramFiles(x86)"],
    environment.LOCALAPPDATA
  ].filter((value): value is string => Boolean(value));

  return basePaths.flatMap((basePath) => browserRelativePaths.map((relativePath) => path.join(basePath, ...relativePath)));
}

export function findSupportedBrowserExecutable(
  environment: Environment = process.env,
  exists: (candidate: string) => boolean = fs.existsSync
): string | null {
  return getSupportedBrowserExecutableCandidates(environment).find((candidate) => exists(candidate)) ?? null;
}

export async function openUrlsInNewBrowserWindow(
  urls: string[],
  openExternal: OpenExternal,
  spawnBrowser: SpawnBrowser = spawnDetachedBrowser
): Promise<void> {
  const httpUrls = urls.filter((url) => /^https?:\/\//i.test(url));

  if (httpUrls.length === 0) {
    return;
  }

  const executablePath = findSupportedBrowserExecutable();

  if (!executablePath) {
    for (const url of httpUrls) {
      await openExternal(url);
    }
    return;
  }

  const plan = createBrowserWindowLaunchPlan(httpUrls, executablePath);
  spawnBrowser(plan.executablePath, plan.args);
}

function spawnDetachedBrowser(executablePath: string, args: string[]): void {
  const child = spawn(executablePath, args, {
    detached: true,
    stdio: "ignore"
  });

  child.unref();
}
