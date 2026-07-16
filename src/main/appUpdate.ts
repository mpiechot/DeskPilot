import type { AppUpdateStatus } from "../shared/deskPilotApi.js";

const releasePagePrefix = "https://github.com/mpiechot/DeskPilot/releases/";

type LatestReleasePayload = {
  tag_name?: unknown;
  html_url?: unknown;
  draft?: unknown;
  prerelease?: unknown;
};

type AppUpdateServiceOptions = {
  currentVersion: string;
  enabled: boolean;
  fetchLatestRelease: () => Promise<unknown>;
  openExternal: (url: string) => Promise<unknown>;
  onStatusChanged?: (status: AppUpdateStatus) => void;
};

export class AppUpdateService {
  private readonly options: AppUpdateServiceOptions;
  private status: AppUpdateStatus;
  private startupCheck: Promise<AppUpdateStatus> | null = null;

  constructor(options: AppUpdateServiceOptions) {
    this.options = options;
    this.status = options.enabled
      ? createUpdateStatus("not-checked", options.currentVersion, "Update check has not started yet.")
      : createUpdateStatus("disabled", options.currentVersion, "Update checks run only in installed DeskPilot builds.");
  }

  getStatus(): AppUpdateStatus {
    return this.status;
  }

  checkAtStartup(): Promise<AppUpdateStatus> {
    if (!this.options.enabled) {
      return Promise.resolve(this.status);
    }

    if (!this.startupCheck) {
      this.startupCheck = this.runStartupCheck();
    }

    return this.startupCheck;
  }

  async openAvailableUpdate(): Promise<AppUpdateStatus> {
    if (this.status.status !== "available" || !this.status.releaseUrl) {
      throw new Error("No validated DeskPilot update is available.");
    }

    const safeReleaseUrl = normalizeReleasePageUrl(this.status.releaseUrl);

    if (!safeReleaseUrl) {
      throw new Error("DeskPilot update URL is not allowed.");
    }

    await this.options.openExternal(safeReleaseUrl);
    return this.status;
  }

  private async runStartupCheck(): Promise<AppUpdateStatus> {
    this.setStatus(createUpdateStatus("checking", this.options.currentVersion, "Checking for a DeskPilot update."));

    try {
      const payload = await this.options.fetchLatestRelease();
      this.setStatus(resolveLatestReleaseUpdate(this.options.currentVersion, payload));
    } catch {
      this.setStatus(
        createUpdateStatus(
          "unavailable",
          this.options.currentVersion,
          "Update check was unavailable. DeskPilot can continue normally."
        )
      );
    }

    return this.status;
  }

  private setStatus(status: AppUpdateStatus): void {
    this.status = status;
    this.options.onStatusChanged?.(status);
  }
}

export function resolveLatestReleaseUpdate(currentVersion: string, payload: unknown): AppUpdateStatus {
  if (!isLatestReleasePayload(payload)) {
    return createUpdateStatus("unavailable", currentVersion, "GitHub returned an invalid update response.");
  }

  const candidateVersion = normalizeStableVersion(payload.tag_name);
  const releaseUrl = normalizeReleasePageUrl(payload.html_url);

  if (payload.draft === true || payload.prerelease === true) {
    return createUpdateStatus("up-to-date", currentVersion, "No newer stable DeskPilot release is available.");
  }

  if (!candidateVersion || !releaseUrl) {
    return createUpdateStatus("unavailable", currentVersion, "GitHub returned an invalid stable release.");
  }

  if (!isNewerStableVersion(currentVersion, candidateVersion)) {
    return createUpdateStatus("up-to-date", currentVersion, "DeskPilot is up to date.");
  }

  return {
    status: "available",
    currentVersion,
    availableVersion: candidateVersion,
    releaseUrl,
    message: `DeskPilot ${candidateVersion} is available.`
  };
}

export function isNewerStableVersion(currentVersion: string, candidateVersion: string): boolean {
  const current = parseStableVersion(currentVersion);
  const candidate = parseStableVersion(candidateVersion);

  if (!current || !candidate) {
    return false;
  }

  for (let index = 0; index < current.length; index += 1) {
    if (candidate[index] !== current[index]) {
      return candidate[index] > current[index];
    }
  }

  return false;
}

function createUpdateStatus(
  status: AppUpdateStatus["status"],
  currentVersion: string,
  message: string
): AppUpdateStatus {
  return { status, currentVersion, message };
}

function parseStableVersion(value: string): [number, number, number] | null {
  const normalized = normalizeStableVersion(value);

  if (!normalized) {
    return null;
  }

  const parts = normalized.split(".").map(Number);
  return [parts[0], parts[1], parts[2]];
}

function normalizeStableVersion(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(value.trim());
  return match ? `${match[1]}.${match[2]}.${match[3]}` : null;
}

function normalizeReleasePageUrl(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  try {
    const url = new URL(value);
    const normalized = url.toString();
    return url.protocol === "https:" && url.username === "" && url.password === "" && normalized.startsWith(releasePagePrefix)
      ? normalized
      : null;
  } catch {
    return null;
  }
}

function isLatestReleasePayload(value: unknown): value is LatestReleasePayload {
  return typeof value === "object" && value !== null;
}
