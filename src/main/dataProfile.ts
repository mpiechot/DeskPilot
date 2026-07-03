import fs from "node:fs";
import path from "node:path";
import type {
  DataProfileCutoverInfo,
  DataProfileId,
  DataProfileInfo
} from "../shared/deskPilotApi.js";

export const dataProfileEnvName = "DESKPILOT_DATA_PROFILE";
export const disallowProductiveProfileEnvName = "DESKPILOT_DISALLOW_PRODUCTIVE_PROFILE";

export type DataProfileOptions = {
  profile?: DataProfileId;
  disallowProductive?: boolean;
  now?: Date;
};

type StoredProfileState = {
  version: 1;
  profileId: DataProfileId;
  cutover: DataProfileCutoverInfo;
};

type ProfilePaths = {
  profileRoot: string;
  storageDirectory: string;
  databasePath: string;
  profileStatePath: string;
  legacyDatabasePath: string;
  developmentDatabasePath: string;
  productiveDatabasePath: string;
};

export function prepareDataProfile(userDataPath: string, options: DataProfileOptions = {}): DataProfileInfo {
  const profile = normalizeDataProfileId(options.profile ?? process.env[dataProfileEnvName] ?? "development");
  const disallowProductive =
    options.disallowProductive ?? process.env[disallowProductiveProfileEnvName] === "1";

  if (profile === "productive" && disallowProductive) {
    throw new Error("Productive data profile is disabled for this development or test run.");
  }

  const paths = getProfilePaths(userDataPath, profile);
  fs.mkdirSync(paths.storageDirectory, { recursive: true });

  const cutover =
    profile === "productive"
      ? prepareProductiveCutover(paths, options.now ?? new Date())
      : createDevelopmentCutoverInfo();

  return {
    id: profile,
    label: profile === "productive" ? "Productive" : "Development",
    description:
      profile === "productive"
        ? "Real local browser-session data. Development and smoke checks must not use this profile."
        : "Development, prototype and smoke-check data isolated from productive use.",
    storageDirectory: paths.storageDirectory,
    databasePath: paths.databasePath,
    legacyDatabasePath: paths.legacyDatabasePath,
    developmentDatabasePath: paths.developmentDatabasePath,
    productiveDatabasePath: paths.productiveDatabasePath,
    profileStatePath: paths.profileStatePath,
    cutover
  };
}

function getProfilePaths(userDataPath: string, profile: DataProfileId): ProfilePaths {
  const profilesRoot = path.join(userDataPath, "profiles");
  const profileRoot = path.join(profilesRoot, profile);
  const storageDirectory = path.join(profileRoot, "storage");

  return {
    profileRoot,
    storageDirectory,
    databasePath: path.join(storageDirectory, "deskpilot.sqlite"),
    profileStatePath: path.join(profileRoot, "profile-state.json"),
    legacyDatabasePath: path.join(userDataPath, "storage", "deskpilot.sqlite"),
    developmentDatabasePath: path.join(profilesRoot, "development", "storage", "deskpilot.sqlite"),
    productiveDatabasePath: path.join(profilesRoot, "productive", "storage", "deskpilot.sqlite")
  };
}

function prepareProductiveCutover(paths: ProfilePaths, now: Date): DataProfileCutoverInfo {
  const existingState = readProfileState(paths.profileStatePath);

  if (existingState?.profileId === "productive") {
    return existingState.cutover;
  }

  if (fs.existsSync(paths.databasePath)) {
    const cutover: DataProfileCutoverInfo = {
      status: "already-created",
      automaticMigrationComplete: true,
      completedAt: now.toISOString(),
      message: "Productive storage already existed; prototype data was not copied again."
    };

    writeProfileState(paths.profileStatePath, "productive", cutover);
    return cutover;
  }

  if (fs.existsSync(paths.legacyDatabasePath)) {
    fs.copyFileSync(paths.legacyDatabasePath, paths.databasePath);

    const cutover: DataProfileCutoverInfo = {
      status: "copied-from-legacy",
      automaticMigrationComplete: true,
      completedAt: now.toISOString(),
      sourceDatabasePath: paths.legacyDatabasePath,
      message: "Existing prototype data was copied once. Later prototype changes are not imported automatically."
    };

    writeProfileState(paths.profileStatePath, "productive", cutover);
    return cutover;
  }

  const cutover: DataProfileCutoverInfo = {
    status: "no-legacy-source",
    automaticMigrationComplete: true,
    completedAt: now.toISOString(),
    message: "No prototype database existed; Productive storage started empty."
  };

  writeProfileState(paths.profileStatePath, "productive", cutover);
  return cutover;
}

function createDevelopmentCutoverInfo(): DataProfileCutoverInfo {
  return {
    status: "not-applicable",
    automaticMigrationComplete: false,
    message: "Development storage is isolated. Productive cutover runs only for the Productive profile."
  };
}

function normalizeDataProfileId(value: string): DataProfileId {
  const normalized = value.trim().toLowerCase();

  if (normalized === "development" || normalized === "productive") {
    return normalized;
  }

  throw new Error(`Unsupported DeskPilot data profile: ${value}`);
}

function readProfileState(profileStatePath: string): StoredProfileState | null {
  if (!fs.existsSync(profileStatePath)) {
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(profileStatePath, "utf-8")) as StoredProfileState;
  } catch {
    return null;
  }
}

function writeProfileState(
  profileStatePath: string,
  profileId: DataProfileId,
  cutover: DataProfileCutoverInfo
): void {
  fs.mkdirSync(path.dirname(profileStatePath), { recursive: true });
  fs.writeFileSync(
    profileStatePath,
    JSON.stringify(
      {
        version: 1,
        profileId,
        cutover
      },
      null,
      2
    )
  );
}
