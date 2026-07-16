import {
  AppUpdateService,
  isNewerStableVersion,
  resolveLatestReleaseUpdate
} from "../dist-electron/main/appUpdate.js";

assert(isNewerStableVersion("0.1.0", "v0.1.1"), "Expected a newer patch release to be detected");
assert(isNewerStableVersion("0.1.9", "0.2.0"), "Expected a newer minor release to be detected");
assert(!isNewerStableVersion("0.2.0", "0.1.9"), "Expected an older release to be ignored");
assert(!isNewerStableVersion("0.1.0", "0.1.1-beta.1"), "Expected prerelease versions to be ignored");
assert(!isNewerStableVersion("0.1", "0.1.1"), "Expected invalid current versions to fail closed");

const available = resolveLatestReleaseUpdate("0.1.0", {
  tag_name: "v0.1.1",
  html_url: "https://github.com/mpiechot/DeskPilot/releases/tag/v0.1.1",
  draft: false,
  prerelease: false
});
assert(available.status === "available", "Expected a newer stable GitHub release to be available");
assert(available.availableVersion === "0.1.1", "Expected the normalized available version");

const invalidUrl = resolveLatestReleaseUpdate("0.1.0", {
  tag_name: "v0.1.1",
  html_url: "https://example.com/deskpilot/releases/v0.1.1",
  draft: false,
  prerelease: false
});
assert(invalidUrl.status === "unavailable", "Expected a non-GitHub release URL to fail closed");

const prerelease = resolveLatestReleaseUpdate("0.1.0", {
  tag_name: "v0.2.0",
  html_url: "https://github.com/mpiechot/DeskPilot/releases/tag/v0.2.0-beta.1",
  draft: false,
  prerelease: true
});
assert(prerelease.status === "up-to-date", "Expected prereleases not to produce an update action");

let requestCount = 0;
let openedUrl = "";
const service = new AppUpdateService({
  currentVersion: "0.1.0",
  enabled: true,
  fetchLatestRelease: async () => {
    requestCount += 1;
    return {
      tag_name: "v0.1.1",
      html_url: "https://github.com/mpiechot/DeskPilot/releases/tag/v0.1.1",
      draft: false,
      prerelease: false
    };
  },
  openExternal: async (url) => {
    openedUrl = url;
  }
});

await Promise.all([service.checkAtStartup(), service.checkAtStartup()]);
await service.checkAtStartup();
assert(requestCount === 1, `Expected one update request per process start, got ${requestCount}`);
assert(service.getStatus().status === "available", "Expected the service to retain the available update state");
await service.openAvailableUpdate();
assert(openedUrl.includes("github.com/mpiechot/DeskPilot/releases/"), "Expected the validated release page to open");

let disabledRequestCount = 0;
const disabledService = new AppUpdateService({
  currentVersion: "0.1.0",
  enabled: false,
  fetchLatestRelease: async () => {
    disabledRequestCount += 1;
    return {};
  },
  openExternal: async () => undefined
});
await disabledService.checkAtStartup();
assert(disabledRequestCount === 0, "Expected unpackaged Development runs not to contact GitHub");
assert(disabledService.getStatus().status === "disabled", "Expected an explicit disabled Development state");

console.log(
  JSON.stringify(
    {
      startupRequests: requestCount,
      update: service.getStatus(),
      developmentRequests: disabledRequestCount
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
