import {
  AlertTriangle,
  Archive,
  BookOpen,
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Code2,
  DatabaseBackup,
  Download,
  ExternalLink,
  FlaskConical,
  FolderOpen,
  Gamepad2,
  Globe2,
  GripVertical,
  Inbox,
  Lightbulb,
  PanelTopOpen,
  Pencil,
  Plus,
  Puzzle,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  Wrench,
  type LucideIcon,
  X
} from "lucide-react";
import {
  type DragEvent,
  type FormEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState
} from "react";
import type {
  AppUpdateStatus,
  BridgeStatus,
  CategoryInput,
  CategoryRecoveryResult,
  DisplaySettingsInfo,
  ExtensionInstallInfo,
  SessionMutationResult,
  SessionTab,
  SessionTabInput,
  StorageExportResult,
  StorageBackupInfo,
  StorageRestoreResult,
  WindowPreferences
} from "../shared/deskPilotApi";
import {
  categoryIconOptions,
  defaultCategoryIcon,
  type CategoryIconName
} from "../shared/categoryIcons";
import { defaultCategories, type SessionCategory } from "../shared/sessions";
import { DeskPilotShell } from "./shell";
import "./styles.css";

const categoryIconComponents: Record<CategoryIconName, LucideIcon> = {
  folder: FolderOpen,
  briefcase: Briefcase,
  "book-open": BookOpen,
  flask: FlaskConical,
  clapperboard: Clapperboard,
  gamepad: Gamepad2,
  code: Code2,
  inbox: Inbox,
  globe: Globe2,
  wrench: Wrench,
  lightbulb: Lightbulb
};

function CategoryGlyph({ icon }: { icon: CategoryIconName }) {
  const Icon = categoryIconComponents[icon] ?? FolderOpen;
  return <Icon aria-hidden="true" />;
}

function CategoryIconPicker({
  value,
  onChange,
  label
}: {
  value: CategoryIconName;
  onChange: (icon: CategoryIconName) => void;
  label: string;
}) {
  return (
    <fieldset className="categoryIconPicker">
      <legend>{label}</legend>
      <div className="categoryIconOptions">
        {categoryIconOptions.map((option) => (
          <button
            type="button"
            className={value === option.name ? "categoryIconOption categoryIconOption-selected" : "categoryIconOption"}
            key={option.name}
            onClick={() => onChange(option.name)}
            aria-label={`${option.label} icon`}
            aria-pressed={value === option.name}
            title={option.label}
          >
            <CategoryGlyph icon={option.name} />
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function savedTabsLabel(tabCount: number): string {
  return `${tabCount} saved tab${tabCount === 1 ? "" : "s"}`;
}

function formatBackupSize(sizeBytes: number): string {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  return `${Math.round(sizeBytes / 1024)} KB`;
}

function formatBackupTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function getUrlHost(value: string): string {
  try {
    return new URL(value).host;
  } catch {
    return value;
  }
}

function SettingsPilot({
  onOperationMessage,
  onStorageRestore,
  onDisplayLayoutModeChange
}: {
  onOperationMessage: (message: string) => void;
  onStorageRestore: (result: StorageRestoreResult) => void;
  onDisplayLayoutModeChange: (layoutMode: WindowPreferences["layoutMode"]) => void;
}) {
  const [settingsMode, setSettingsMode] = useState<"display" | "safety" | "theme">("display");
  const [storageInfo, setStorageInfo] = useState<StorageBackupInfo | null>(null);
  const [displaySettings, setDisplaySettings] = useState<DisplaySettingsInfo | null>(null);
  const [displayDraft, setDisplayDraft] = useState<WindowPreferences>({
    layoutMode: "standard",
    displayId: null,
    kiosk: false
  });

  useEffect(() => {
    if (!window.deskPilot) {
      return;
    }

    window.deskPilot
      .storageInfo()
      .then((info: StorageBackupInfo) => setStorageInfo(info))
      .catch(() => onOperationMessage("Could not load storage settings."));

    window.deskPilot
      .displaySettings()
      .then((info: DisplaySettingsInfo) => {
        setDisplaySettings(info);
        setDisplayDraft(info.preferences);
        onDisplayLayoutModeChange(info.preferences.layoutMode);
      })
      .catch(() => onOperationMessage("Could not load display settings."));
  }, [onDisplayLayoutModeChange, onOperationMessage]);

  const latestManualBackup = storageInfo?.manualBackups[0] ?? null;
  const activeDataProfile = storageInfo?.dataProfile ?? null;
  const startupRecovery = storageInfo?.startupRecovery ?? null;
  const storageMessage = !window.deskPilot
    ? "Settings require the Electron app."
    : startupRecovery?.status === "recovered-from-rolling"
      ? "Database recovered from the automatic rolling backup."
      : activeDataProfile
        ? `${activeDataProfile.label} data profile is active.`
        : "Local SQLite storage is active.";

  function handleBackupError(): void {
    onOperationMessage("Could not create backup. Existing data was left untouched.");
  }

  function handleCreateStorageBackup(): void {
    if (!window.deskPilot) {
      onOperationMessage("Backups require the Electron app.");
      return;
    }

    window.deskPilot
      .createStorageBackup()
      .then((info: StorageBackupInfo) => {
        setStorageInfo(info);
        onOperationMessage("Created local database backup.");
      })
      .catch(handleBackupError);
  }

  function handleRestoreStorageBackup(fileName: string): void {
    if (!window.deskPilot) {
      onOperationMessage("Restoring backups requires the Electron app.");
      return;
    }

    if (!window.confirm(`Restore "${fileName}"? DeskPilot will create a safety backup before replacing active data.`)) {
      return;
    }

    window.deskPilot
      .restoreStorageBackup(fileName)
      .then((result: StorageRestoreResult) => {
        setStorageInfo(result.storageInfo);
        onStorageRestore(result);
        onOperationMessage(`Restored backup. Safety backup: ${result.safetyBackupFileName}.`);
      })
      .catch(() => onOperationMessage("Could not restore backup. Existing data was left untouched."));
  }

  function handleRestoreRollingBackup(): void {
    if (!window.deskPilot) {
      onOperationMessage("Restoring backups requires the Electron app.");
      return;
    }

    if (!storageInfo?.rollingBackup) {
      onOperationMessage("No automatic rolling backup is available yet.");
      return;
    }

    if (!window.confirm("Restore the latest automatic rolling backup? DeskPilot will preserve the current data in a safety backup first.")) {
      return;
    }

    window.deskPilot
      .restoreRollingStorageBackup()
      .then((result: StorageRestoreResult) => {
        setStorageInfo(result.storageInfo);
        onStorageRestore(result);
        onOperationMessage(`Restored automatic backup. Safety backup: ${result.safetyBackupFileName}.`);
      })
      .catch(() => onOperationMessage("Could not restore automatic backup. Existing data was left untouched."));
  }

  function handleExportStorageBackup(fileName?: string): void {
    if (!window.deskPilot) {
      onOperationMessage("Export requires the Electron app.");
      return;
    }

    window.deskPilot
      .exportStorageBackup(fileName)
      .then((result: StorageExportResult | null) => {
        if (!result) {
          onOperationMessage("Export canceled.");
          return;
        }

        setStorageInfo(result.storageInfo);
        onOperationMessage(`Exported backup to ${result.filePath}.`);
      })
      .catch(() => onOperationMessage("Could not export backup."));
  }

  function handleImportStorageBackup(): void {
    if (!window.deskPilot) {
      onOperationMessage("Import requires the Electron app.");
      return;
    }

    if (!window.confirm("Importing a backup replaces active data after creating a safety backup. Continue?")) {
      return;
    }

    window.deskPilot
      .importStorageBackup()
      .then((result: StorageRestoreResult | null) => {
        if (!result) {
          onOperationMessage("Import canceled.");
          return;
        }

        setStorageInfo(result.storageInfo);
        onStorageRestore(result);
        onOperationMessage(`Imported backup. Safety backup: ${result.safetyBackupFileName}.`);
      })
      .catch(() => onOperationMessage("Could not import backup. Existing data was left untouched."));
  }

  function handleSaveDisplayPreferences(): void {
    if (!window.deskPilot) {
      onOperationMessage("Display settings require the Electron app.");
      return;
    }

    window.deskPilot
      .updateDisplayPreferences(displayDraft)
      .then((info: DisplaySettingsInfo) => {
        setDisplaySettings(info);
        setDisplayDraft(info.preferences);
        onDisplayLayoutModeChange(info.preferences.layoutMode);
        onOperationMessage("Display settings applied.");
      })
      .catch(() => onOperationMessage("Could not apply display settings."));
  }

  return (
    <main className="settingsShell" aria-label="Settings">
      <section className="settingsContent">
        <header className="settingsHeader">
          <div>
            <span className="pilotEmptyStateEyebrow">DeskPilot-wide configuration</span>
            <h1>Settings</h1>
          </div>
          <span className="settingsProfileLabel">{activeDataProfile?.label ?? "Development"}</span>
        </header>

        <div className="modeSwitch settingsModeSwitch" role="tablist" aria-label="Settings sections">
          <button
            type="button"
            className={settingsMode === "display" ? "modeButton modeButton-active" : "modeButton"}
            onClick={() => setSettingsMode("display")}
            aria-selected={settingsMode === "display"}
          >
            Display
          </button>
          <button
            type="button"
            className={settingsMode === "safety" ? "modeButton modeButton-active" : "modeButton"}
            onClick={() => setSettingsMode("safety")}
            aria-selected={settingsMode === "safety"}
          >
            Safety
          </button>
          <button
            type="button"
            className={settingsMode === "theme" ? "modeButton modeButton-active" : "modeButton"}
            onClick={() => setSettingsMode("theme")}
            aria-selected={settingsMode === "theme"}
          >
            Theme
          </button>
        </div>

        {settingsMode === "display" ? (
          <section className="displayPanel settingsPanel" aria-label="Display settings">
            <div className="settingsSectionIntro">
              <strong>Display</strong>
              <span>Choose how DeskPilot appears and where it launches.</span>
            </div>
            <label>
              Layout
              <select
                aria-label="DeskPilot layout"
                value={displayDraft.layoutMode}
                onChange={(event) =>
                  setDisplayDraft({ ...displayDraft, layoutMode: event.target.value as WindowPreferences["layoutMode"] })
                }
              >
                <option value="standard">Standard</option>
                <option value="touch">Touch</option>
              </select>
            </label>
            <label>
              Launch display
              <select
                aria-label="DeskPilot launch display"
                value={displayDraft.displayId ?? ""}
                onChange={(event) => setDisplayDraft({ ...displayDraft, displayId: event.target.value || null })}
              >
                <option value="">Current / system default</option>
                {displaySettings?.displays.map((display) => (
                  <option value={display.id} key={display.id}>
                    {display.label} · {display.width}×{display.height}
                  </option>
                ))}
              </select>
            </label>
            <label className="displayCheckbox">
              <input
                type="checkbox"
                checked={displayDraft.kiosk}
                onChange={(event) => setDisplayDraft({ ...displayDraft, kiosk: event.target.checked })}
              />
              Kiosk-like fullscreen mode
            </label>
            <small>Kiosk mode can always be left by quitting DeskPilot from the tray menu.</small>
            <button type="button" className="addCategoryAction" onClick={handleSaveDisplayPreferences}>
              Apply Display Settings
            </button>
          </section>
        ) : settingsMode === "safety" ? (
          <section className="safetyPanel settingsPanel" aria-label="Storage safety">
            <div
              className={
                activeDataProfile?.id === "productive" ? "profileSummary profileSummary-productive" : "profileSummary"
              }
            >
              <strong>{activeDataProfile ? `${activeDataProfile.label} profile` : "Data profile"}</strong>
              <span>{activeDataProfile?.description ?? "Profile status unavailable."}</span>
              <small>{activeDataProfile?.cutover.message ?? "Cutover status unavailable."}</small>
            </div>
            {startupRecovery?.status === "recovered-from-rolling" ? (
              <div className="startupRecoveryNotice" role="status">
                <AlertTriangle aria-hidden="true" />
                <div>
                  <strong>Recovered at startup</strong>
                  <span>{startupRecovery.message}</span>
                  <small>
                    Preserved corrupted file: <code>{startupRecovery.corruptDatabaseBackupPath}</code>
                  </small>
                </div>
              </div>
            ) : null}
            <div className="backupActionGrid">
              <button type="button" className="backupAction" onClick={handleCreateStorageBackup}>
                <DatabaseBackup aria-hidden="true" />
                Create Backup
              </button>
              <button type="button" className="backupAction secondaryBackupAction" onClick={() => handleExportStorageBackup()}>
                <Download aria-hidden="true" />
                Export Current
              </button>
              <button type="button" className="backupAction secondaryBackupAction" onClick={handleImportStorageBackup}>
                <Upload aria-hidden="true" />
                Import Backup
              </button>
            </div>
            <div className="backupPathBox">
              <strong>Database</strong>
              <code>{storageInfo?.databasePath ?? "Electron storage path unavailable"}</code>
            </div>
            <div className="backupPathBox">
              <strong>Manual backups</strong>
              <code>{storageInfo?.manualBackupDirectory ?? "No backup directory yet"}</code>
            </div>
            <div className="rollingBackupSection">
              <div className="backupListHeader">
                <p>Automatic rolling backup</p>
                <span>{storageInfo?.rollingBackup ? "Ready" : "Pending"}</span>
              </div>
              <div className="backupListItem">
                <div className="backupListItemText">
                  <span title={storageInfo?.rollingBackup?.path}>{storageInfo?.rollingBackup?.fileName ?? "Not created yet"}</span>
                  <small>
                    {storageInfo?.rollingBackup
                      ? `${formatBackupSize(storageInfo.rollingBackup.sizeBytes)} - ${formatBackupTime(storageInfo.rollingBackup.createdAt)}`
                      : "DeskPilot creates this after the first database update."}
                  </small>
                </div>
                <div className="backupListActions">
                  <button
                    type="button"
                    onClick={handleRestoreRollingBackup}
                    title="Restore automatic rolling backup"
                    disabled={!storageInfo?.rollingBackup}
                  >
                    <RotateCcw aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
            <div className="backupList">
              <div className="backupListHeader">
                <p>Manual backups</p>
                <span>{storageInfo?.manualBackups.length ?? 0}</span>
              </div>
              {!latestManualBackup ? <span className="emptyRecoveryText">None</span> : null}
              {storageInfo?.manualBackups.map((backup) => (
                <div className="backupListItem" key={backup.fileName}>
                  <div className="backupListItemText">
                    <span title={backup.path}>{backup.fileName}</span>
                    <small>
                      {formatBackupSize(backup.sizeBytes)} - {formatBackupTime(backup.createdAt)}
                    </small>
                  </div>
                  <div className="backupListActions">
                    <button type="button" onClick={() => handleRestoreStorageBackup(backup.fileName)} title="Restore backup">
                      <RotateCcw aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => handleExportStorageBackup(backup.fileName)} title="Export backup">
                      <Download aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="settingsThemePanel settingsPanel" aria-label="Theme settings">
            <div className="pilotEmptyStateIcon" aria-hidden="true">
              <Lightbulb />
            </div>
            <strong>Theme selection</strong>
            <p>The theme surface is reserved here. Additional visual themes will be added without changing BrowserPilot data or workflows.</p>
            <label>
              Current theme
              <select aria-label="DeskPilot theme" disabled>
                <option>Default Theme</option>
              </select>
            </label>
          </section>
        )}

        <footer className="safetyNote">
          <ShieldCheck aria-hidden="true" />
          <span>{storageMessage}</span>
        </footer>
      </section>
    </main>
  );
}

function BrowserPilot({
  onOperationMessage,
  storageRestoreResult,
  layoutMode
}: {
  onOperationMessage: (message: string) => void;
  storageRestoreResult: StorageRestoreResult | null;
  layoutMode: WindowPreferences["layoutMode"];
}) {
  const [categories, setCategories] = useState<SessionCategory[]>(defaultCategories);
  const [storageStatus, setStorageStatus] = useState<"loading" | "ready" | "fallback" | "error">("loading");
  const [categoryDraft, setCategoryDraft] = useState<CategoryInput>({
    name: "",
    description: "",
    icon: defaultCategoryIcon
  });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CategoryInput>({ name: "", description: "", icon: defaultCategoryIcon });
  const [managedCategoryDraft, setManagedCategoryDraft] = useState<CategoryInput>({
    name: defaultCategories[0]?.name ?? "",
    description: defaultCategories[0]?.description ?? "",
    icon: defaultCategories[0]?.icon ?? defaultCategoryIcon
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState(defaultCategories[0]?.id ?? "");
  const [deletedCategories, setDeletedCategories] = useState<SessionCategory[]>([]);
  const [deletedTabs, setDeletedTabs] = useState<SessionTab[]>([]);
  const [archivedTabs, setArchivedTabs] = useState<SessionTab[]>([]);
  const [tabs, setTabs] = useState<SessionTab[]>([]);
  const [boardTabsByCategory, setBoardTabsByCategory] = useState<Record<string, SessionTab[]>>({});
  const [tabDraft, setTabDraft] = useState<SessionTabInput>({ categoryId: selectedCategoryId, url: "", title: "" });
  const [controlMode, setControlMode] = useState<"session" | "categories" | "archive" | "recovery" | "extension">("session");
  const [controlRailCollapsed, setControlRailCollapsed] = useState(true);
  const [operationMessage, setOperationMessage] = useState("");
  const [appUpdateStatus, setAppUpdateStatus] = useState<AppUpdateStatus | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);
  const [extensionInfo, setExtensionInfo] = useState<ExtensionInstallInfo | null>(null);
  const [draggedTab, setDraggedTab] = useState<{ id: string; categoryId: string } | null>(null);
  const [isCategoryListDragging, setIsCategoryListDragging] = useState(false);
  const categoryListDrag = useRef<{
    pointerId: number;
    startX: number;
    startScrollLeft: number;
    moved: boolean;
  } | null>(null);
  const suppressCategoryClick = useRef(false);
  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? null;

  useEffect(() => {
    if (!selectedCategory) {
      setManagedCategoryDraft({ name: "", description: "", icon: defaultCategoryIcon });
      return;
    }

    setManagedCategoryDraft({
      name: selectedCategory.name,
      description: selectedCategory.description,
      icon: selectedCategory.icon
    });
  }, [selectedCategory]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribeFromUpdates: () => void = () => undefined;

    if (!window.deskPilot) {
      setStorageStatus("fallback");
      return () => {
        isMounted = false;
      };
    }

    unsubscribeFromUpdates = window.deskPilot.onUpdateStatusChanged((status: AppUpdateStatus) => {
      if (isMounted) {
        setAppUpdateStatus(status);
      }
    });

    window.deskPilot
      .updateStatus()
      .then((status: AppUpdateStatus) => {
        if (isMounted) {
          setAppUpdateStatus(status);
        }
      })
      .catch(() => undefined);

    window.deskPilot
      .bridgeStatus()
      .then((status: BridgeStatus) => {
        if (isMounted) {
          setBridgeStatus(status);
        }
      })
      .catch(() => undefined);

    window.deskPilot
      .extensionInstallInfo()
      .then((info: ExtensionInstallInfo) => {
        if (isMounted) {
          setExtensionInfo(info);
        }
      })
      .catch(() => undefined);

    Promise.all([window.deskPilot.listCategories(), window.deskPilot.getActiveCategory()])
      .then(([storedCategories, activeCategoryId]: [SessionCategory[], string]) => {
        if (!isMounted) {
          return;
        }

        setCategories(storedCategories);
        setSelectedCategoryId(
          storedCategories.some((category) => category.id === activeCategoryId)
            ? activeCategoryId
            : storedCategories[0]?.id || ""
        );
        setStorageStatus("ready");
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setStorageStatus("error");
      });

    window.deskPilot
      .listDeletedCategories()
      .then((storedCategories: SessionCategory[]) => {
        if (isMounted) {
          setDeletedCategories(storedCategories);
        }
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
      unsubscribeFromUpdates();
    };
  }, []);

  useEffect(() => {
    setTabDraft((currentDraft) => ({ ...currentDraft, categoryId: selectedCategoryId }));

    if (!window.deskPilot || !selectedCategoryId) {
      setTabs([]);
      setDeletedTabs([]);
      setArchivedTabs([]);
      return;
    }

    window.deskPilot
      .listTabs(selectedCategoryId)
      .then((storedTabs: SessionTab[]) => setTabs(storedTabs))
      .catch(() => setOperationMessage("Could not load saved URLs."));

    window.deskPilot
      .listDeletedTabs(selectedCategoryId)
      .then((storedTabs: SessionTab[]) => setDeletedTabs(storedTabs))
      .catch(() => undefined);

    window.deskPilot
      .listArchivedTabs(selectedCategoryId)
      .then((storedTabs: SessionTab[]) => setArchivedTabs(storedTabs))
      .catch(() => undefined);
  }, [selectedCategoryId]);

  useEffect(() => {
    onOperationMessage(operationMessage);
  }, [onOperationMessage, operationMessage]);

  useEffect(() => {
    if (!window.deskPilot || storageStatus !== "ready" || !selectedCategoryId) {
      return;
    }

    window.deskPilot.setActiveCategory(selectedCategoryId).catch(() => undefined);
  }, [selectedCategoryId, storageStatus]);

  useEffect(() => {
    let isMounted = true;

    if (!window.deskPilot || storageStatus !== "ready") {
      setBoardTabsByCategory({});
      return () => {
        isMounted = false;
      };
    }

    Promise.all(categories.map((category) => window.deskPilot?.listTabs(category.id) ?? Promise.resolve([])))
      .then((tabLists: SessionTab[][]) => {
        if (!isMounted) {
          return;
        }

        const nextBoardTabs = Object.fromEntries(
          categories.map((category, index) => [category.id, tabLists[index] ?? []])
        );
        setBoardTabsByCategory(nextBoardTabs);
        setTabs(nextBoardTabs[selectedCategoryId] ?? []);
      })
      .catch(() => {
        if (isMounted) {
          setOperationMessage("Could not load Session Board tabs.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [categories, selectedCategoryId, storageStatus]);

  useEffect(() => {
    if (!window.deskPilot?.onSessionsChanged) {
      return;
    }

    let isMounted = true;
    const unsubscribe = window.deskPilot.onSessionsChanged(() => {
      const currentCategoryId = selectedCategoryId;
      const tabsPromise = currentCategoryId ? window.deskPilot?.listTabs(currentCategoryId) : Promise.resolve([]);
      const deletedTabsPromise = currentCategoryId ? window.deskPilot?.listDeletedTabs(currentCategoryId) : Promise.resolve([]);
      const archivedTabsPromise = currentCategoryId ? window.deskPilot?.listArchivedTabs(currentCategoryId) : Promise.resolve([]);

      Promise.all([window.deskPilot?.listCategories(), tabsPromise, deletedTabsPromise, archivedTabsPromise])
        .then(([nextCategories, nextTabs, nextDeletedTabs, nextArchivedTabs]) => {
          if (!isMounted || !nextCategories || !nextTabs || !nextDeletedTabs || !nextArchivedTabs) {
            return;
          }

          setCategories(nextCategories);
          setSelectedCategoryId((currentId) => {
            if (nextCategories.some((category) => category.id === currentId)) {
              return currentId;
            }

            return nextCategories[0]?.id ?? "";
          });
          setTabs(nextTabs);
          setDeletedTabs(nextDeletedTabs);
          setArchivedTabs(nextArchivedTabs);
          setStorageStatus("ready");
        })
        .catch(() => {
          if (isMounted) {
            setOperationMessage("Could not refresh saved URLs.");
          }
        });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!storageRestoreResult) {
      return;
    }

    setCategories(storageRestoreResult.categories);
    setDeletedCategories(storageRestoreResult.deletedCategories);
    setSelectedCategoryId(storageRestoreResult.selectedCategoryId);
    setTabs(storageRestoreResult.tabs);
    setDeletedTabs(storageRestoreResult.deletedTabs);
    setArchivedTabs(storageRestoreResult.archivedTabs);
    setStorageStatus("ready");
  }, [storageRestoreResult]);

  const isStorageWritable = storageStatus === "ready" && Boolean(window.deskPilot);
  const bridgeStatusText = !window.deskPilot
    ? "Bridge: Electron app required"
    : bridgeStatus?.running
      ? `Bridge: ${bridgeStatus.host}:${bridgeStatus.port}`
      : "Bridge: unavailable";
  const bridgeEndpointText = bridgeStatus?.running ? `http://${bridgeStatus.host}:${bridgeStatus.port}` : "Start the Electron app";
  const extensionPathText = extensionInfo?.extensionPath ?? "browser-extension";
  const supportedBrowsers = extensionInfo?.supportedBrowsers ?? ["Chrome", "Edge"];

  function updateCategories(nextCategories: SessionCategory[]): void {
    setCategories(nextCategories);
    setSelectedCategoryId((currentId) => {
      if (nextCategories.some((category) => category.id === currentId)) {
        return currentId;
      }

      return nextCategories[0]?.id ?? "";
    });
    setStorageStatus("ready");
  }

  function updateSessionResult(result: SessionMutationResult): void {
    updateCategories(result.categories);
    setTabs(result.tabs);
  }

  function refreshDeletedTabs(): void {
    if (!window.deskPilot || !selectedCategoryId) {
      setDeletedTabs([]);
      return;
    }

    window.deskPilot
      .listDeletedTabs(selectedCategoryId)
      .then((storedTabs: SessionTab[]) => setDeletedTabs(storedTabs))
      .catch(() => undefined);
  }

  function refreshArchivedTabs(): void {
    if (!window.deskPilot || !selectedCategoryId) {
      setArchivedTabs([]);
      return;
    }

    window.deskPilot
      .listArchivedTabs(selectedCategoryId)
      .then((storedTabs: SessionTab[]) => setArchivedTabs(storedTabs))
      .catch(() => undefined);
  }

  function updateRecoveryResult(result: CategoryRecoveryResult): void {
    updateCategories(result.categories);
    setDeletedCategories(result.deletedCategories);
  }

  function handleStorageError(): void {
    setStorageStatus("error");
    setOperationMessage("Storage write failed. Existing data was left untouched.");
  }

  function categoryName(categoryId: string): string {
    return categories.find((category) => category.id === categoryId)?.name ?? "category";
  }

  function selectedCategoryName(): string {
    return categoryName(selectedCategoryId);
  }

  function getBoardTabs(categoryId: string): SessionTab[] {
    return boardTabsByCategory[categoryId] ?? [];
  }

  function handleCategoryListPointerDown(event: ReactPointerEvent<HTMLElement>): void {
    const target = event.target instanceof Element ? event.target : null;
    const interactiveTarget = target?.closest("button, input, textarea, select, a, [draggable='true']");

    if (event.button !== 0 || interactiveTarget || event.currentTarget.scrollWidth <= event.currentTarget.clientWidth) {
      return;
    }

    categoryListDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
      moved: false
    };
  }

  function handleCategoryListPointerMove(event: ReactPointerEvent<HTMLElement>): void {
    const drag = categoryListDrag.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const distance = event.clientX - drag.startX;

    if (!drag.moved && Math.abs(distance) >= 5) {
      drag.moved = true;
      setIsCategoryListDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    if (drag.moved) {
      event.preventDefault();
      event.currentTarget.scrollLeft = drag.startScrollLeft - distance;
    }
  }

  function finishCategoryListDrag(event: ReactPointerEvent<HTMLElement>): void {
    const drag = categoryListDrag.current;

    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    suppressCategoryClick.current = drag.moved;
    categoryListDrag.current = null;
    setIsCategoryListDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (drag.moved) {
      window.setTimeout(() => {
        suppressCategoryClick.current = false;
      }, 0);
    }
  }

  function handleBoardDragStart(event: DragEvent<HTMLElement>, tab: SessionTab): void {
    event.stopPropagation();

    if (!isStorageWritable) {
      event.preventDefault();
      setOperationMessage("Moving URLs requires the Electron app.");
      return;
    }

    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-deskpilot-tab", tab.id);
    event.dataTransfer.setData("text/plain", tab.id);
    setDraggedTab({ id: tab.id, categoryId: tab.categoryId });
  }

  function handleBoardDragOver(event: DragEvent<HTMLElement>): void {
    if (!isStorageWritable || !draggedTab) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleBoardDrop(event: DragEvent<HTMLElement>, targetCategoryId: string, targetPosition: number): void {
    event.preventDefault();
    event.stopPropagation();

    const tabId = event.dataTransfer.getData("application/x-deskpilot-tab") || draggedTab?.id;
    const sourceCategoryId = draggedTab?.categoryId;

    if (!tabId || !isStorageWritable) {
      setDraggedTab(null);
      return;
    }

    window.deskPilot
      ?.moveTab(tabId, { targetCategoryId, targetPosition })
      .then((result: SessionMutationResult) => {
        const targetCategoryName = categories.find((category) => category.id === targetCategoryId)?.name ?? "category";

        updateCategories(result.categories);

        if (selectedCategoryId === targetCategoryId) {
          setTabs(result.tabs);
        } else if (selectedCategoryId) {
          window.deskPilot
            ?.listTabs(selectedCategoryId)
            .then((storedTabs: SessionTab[]) => setTabs(storedTabs))
            .catch(() => undefined);
        }

        refreshDeletedTabs();
        setOperationMessage(
          sourceCategoryId === targetCategoryId
            ? `Updated tab order in ${targetCategoryName}.`
            : `Moved URL to ${targetCategoryName}.`
        );
      })
      .catch(() => setOperationMessage("Could not move saved URL. Existing data was left untouched."))
      .finally(() => setDraggedTab(null));
  }

  function handleOpenTab(tab: SessionTab): void {
    if (!window.deskPilot) {
      setOperationMessage("Opening a saved URL requires the Electron app.");
      return;
    }

    window.deskPilot
      .openTab(tab.id)
      .then((openedTab: SessionTab | null) => {
        setOperationMessage(openedTab ? `Opened ${openedTab.title}.` : "Saved URL is no longer active.");
      })
      .catch(() => setOperationMessage("Could not open saved URL."));
  }

  function handleSaveUrl(): void {
    if (!tabDraft.url.trim()) {
      setOperationMessage("Paste a URL before saving it.");
      return;
    }

    if (!isStorageWritable) {
      setOperationMessage("Saving URLs requires the Electron app.");
      return;
    }

    window.deskPilot
      ?.addTab({ ...tabDraft, categoryId: selectedCategoryId })
      .then((result: SessionMutationResult) => {
        updateSessionResult(result);
        setTabDraft({ categoryId: selectedCategoryId, url: "", title: "" });
        setOperationMessage(
          result.saveStatus === "already-saved"
            ? `Already saved in ${selectedCategoryName()}.`
            : result.saveStatus === "restored"
              ? `Restored URL in ${selectedCategoryName()}.`
              : `Saved URL to ${selectedCategoryName()}.`
        );
      })
      .catch(() => {
        setOperationMessage("Could not save URL. Use a full http or https URL.");
      });
  }

  function handleOpenCategory(categoryId = selectedCategoryId): void {
    if (!categoryId) {
      setOperationMessage("Select a category first.");
      return;
    }

    if (!window.deskPilot) {
      setOperationMessage("Opening saved URLs requires the Electron app.");
      return;
    }

    window.deskPilot
      .openCategory(categoryId)
      .then((openedTabs: SessionTab[]) => {
        if (categoryId === selectedCategoryId) {
          setTabs(openedTabs);
        }
        setOperationMessage(
          openedTabs.length > 0 ? `Opened ${openedTabs.length} saved URLs.` : `${categoryName(categoryId)} has no saved URLs yet.`
        );
      })
      .catch(() => setOperationMessage("Could not open saved URLs."));
  }

  function handleOpenAvailableUpdate(): void {
    if (!window.deskPilot || appUpdateStatus?.status !== "available") {
      return;
    }

    window.deskPilot
      .openAvailableUpdate()
      .then((status: AppUpdateStatus) => {
        setAppUpdateStatus(status);
      })
      .catch(() => setOperationMessage("Could not open the DeskPilot update page."));
  }

  function removeTab(tab: SessionTab): void {
    if (!isStorageWritable) {
      setOperationMessage("Removing URLs requires the Electron app.");
      return;
    }

    if (!window.confirm(`Remove "${tab.title}" from the active Session? It will remain available in Recovery.`)) {
      setOperationMessage("Removal canceled.");
      return;
    }

    window.deskPilot
      ?.deleteTab(tab.id)
      .then((result: SessionMutationResult) => {
        updateSessionResult(result);
        refreshDeletedTabs();
        setOperationMessage("Saved URL removed safely.");
      })
      .catch(handleStorageError);
  }

  function archiveSavedTab(id: string, categoryId = selectedCategoryId): void {
    if (!isStorageWritable) {
      setOperationMessage("Archiving URLs requires the Electron app.");
      return;
    }

    window.deskPilot
      ?.archiveTab(id)
      .then((result: SessionMutationResult) => {
        updateCategories(result.categories);

        if (categoryId === selectedCategoryId) {
          setTabs(result.tabs);
          refreshArchivedTabs();
        }

        setOperationMessage("Saved URL archived.");
      })
      .catch(handleStorageError);
  }

  function restoreArchivedTab(id: string): void {
    if (!isStorageWritable) {
      setOperationMessage("Archive restore requires the Electron app.");
      return;
    }

    window.deskPilot
      ?.unarchiveTab(id)
      .then((result: SessionMutationResult) => {
        updateSessionResult(result);
        refreshArchivedTabs();
        setOperationMessage("Archived URL returned to the active Session.");
      })
      .catch(handleStorageError);
  }

  function permanentlyDeleteArchivedTab(tab: SessionTab): void {
    if (!isStorageWritable) {
      setOperationMessage("Permanent deletion requires the Electron app.");
      return;
    }

    if (!window.confirm(`Permanently delete "${tab.title}"? This cannot be recovered.`)) {
      setOperationMessage("Permanent deletion canceled.");
      return;
    }

    window.deskPilot
      ?.deleteArchivedTabPermanently(tab.id)
      .then((result: SessionMutationResult) => {
        updateSessionResult(result);
        refreshArchivedTabs();
        setOperationMessage("Archived URL permanently deleted.");
      })
      .catch(handleStorageError);
  }

  function restoreDeletedTab(id: string): void {
    if (!isStorageWritable) {
      setOperationMessage("URL recovery requires the Electron app.");
      return;
    }

    window.deskPilot
      ?.restoreTab(id)
      .then((result: SessionMutationResult) => {
        updateSessionResult(result);
        refreshDeletedTabs();
        setOperationMessage("Saved URL restored.");
      })
      .catch(handleStorageError);
  }

  function handleCreateCategory(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!categoryDraft.name.trim()) {
      setOperationMessage("Name a category before adding it.");
      return;
    }

    if (!isStorageWritable) {
      setOperationMessage("Category changes require the Electron app.");
      return;
    }

    window.deskPilot
      ?.createCategory(categoryDraft)
      .then((nextCategories: SessionCategory[]) => {
        updateCategories(nextCategories);
        setCategoryDraft({ name: "", description: "", icon: defaultCategoryIcon });
        setOperationMessage("Category added.");
      })
      .catch(handleStorageError);
  }

  function startEditingCategory(category: SessionCategory): void {
    setEditingCategoryId(category.id);
    setEditDraft({ name: category.name, description: category.description, icon: category.icon });
    setOperationMessage("");
  }

  function cancelEditingCategory(): void {
    setEditingCategoryId(null);
    setEditDraft({ name: "", description: "", icon: defaultCategoryIcon });
  }

  function saveCategoryEdit(id: string): void {
    if (!editDraft.name.trim()) {
      setOperationMessage("Category name cannot be empty.");
      return;
    }

    if (!isStorageWritable) {
      setOperationMessage("Category changes require the Electron app.");
      return;
    }

    window.deskPilot
      ?.updateCategory(id, editDraft)
      .then((nextCategories: SessionCategory[]) => {
        updateCategories(nextCategories);
        cancelEditingCategory();
        setOperationMessage("Category updated.");
      })
      .catch(handleStorageError);
  }

  function saveManagedCategory(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();

    if (!selectedCategory || !managedCategoryDraft.name.trim()) {
      setOperationMessage("Category name cannot be empty.");
      return;
    }

    if (!isStorageWritable) {
      setOperationMessage("Category changes require the Electron app.");
      return;
    }

    window.deskPilot
      ?.updateCategory(selectedCategory.id, managedCategoryDraft)
      .then((nextCategories: SessionCategory[]) => {
        updateCategories(nextCategories);
        setOperationMessage("Category updated.");
      })
      .catch(handleStorageError);
  }

  function removeCategory(id: string): void {
    const category = categories.find((item) => item.id === id);

    if (
      !category ||
      !window.confirm(
        `Remove "${category.name}" and hide its ${category.tabCount} active tab${category.tabCount === 1 ? "" : "s"}? ` +
          "The category and its saved tabs remain available in Recovery."
      )
    ) {
      return;
    }

    if (!isStorageWritable) {
      setOperationMessage("Category changes require the Electron app.");
      return;
    }

    window.deskPilot
      ?.deleteCategory(id)
      .then((nextCategories: SessionCategory[]) => {
        updateCategories(nextCategories);
        return window.deskPilot?.listDeletedCategories();
      })
      .then((nextDeletedCategories?: SessionCategory[]) => {
        if (nextDeletedCategories) {
          setDeletedCategories(nextDeletedCategories);
        }
        setOperationMessage("Category removed safely.");
      })
      .catch(handleStorageError);
  }

  function restoreDeletedCategory(id: string): void {
    if (!isStorageWritable) {
      setOperationMessage("Recovery requires the Electron app.");
      return;
    }

    window.deskPilot
      ?.restoreCategory(id)
      .then((result: CategoryRecoveryResult) => {
        updateRecoveryResult(result);
        setOperationMessage("Category restored.");
      })
      .catch(handleStorageError);
  }

  return (
    <main
      className={[
        "shell",
        layoutMode === "touch" ? "shell-touch" : "",
        controlRailCollapsed ? "shell-controlRailCollapsed" : ""
      ]
        .filter(Boolean)
        .join(" ")}
      data-pilot="browser"
      aria-label="BrowserPilot"
    >
      <aside className="controlRail" aria-label="BrowserPilot controls" aria-hidden={controlRailCollapsed}>
        <div
          className="controlRailContent"
          id="browser-pilot-control-rail"
          hidden={controlRailCollapsed}
        >
        <header className="appHeader">
          <div>
            <h1>BrowserPilot</h1>
          </div>
          <div className="headerMeta">
            {appUpdateStatus?.status === "available" ? (
              <button
                type="button"
                className="headerUpdateAction"
                onClick={handleOpenAvailableUpdate}
                aria-label={`Update available: version ${appUpdateStatus.availableVersion}. Update now.`}
              >
                <Download aria-hidden="true" />
                <span>
                  Update v{appUpdateStatus.currentVersion} → v{appUpdateStatus.availableVersion}
                </span>
              </button>
            ) : null}
            <div className={bridgeStatus?.running ? "bridgeStatus bridgeStatus-ready" : "bridgeStatus"}>{bridgeStatusText}</div>
          </div>
        </header>

        <section className="quickActions" aria-label="Session actions">
          <button type="button" className="primaryAction" onClick={() => handleOpenCategory()}>
            <PanelTopOpen aria-hidden="true" />
            Open Selected
          </button>
          <button type="button" className="secondaryAction" onClick={handleSaveUrl}>
            <Save aria-hidden="true" />
            Save URL
          </button>
        </section>

        <div className="modeSwitch" role="tablist" aria-label="Control mode">
          <button
            type="button"
            className={controlMode === "session" ? "modeButton modeButton-active" : "modeButton"}
            onClick={() => setControlMode("session")}
          >
            Session
          </button>
          <button
            type="button"
            className={controlMode === "categories" ? "modeButton modeButton-active" : "modeButton"}
            onClick={() => setControlMode("categories")}
          >
            Categories
          </button>
          <button
            type="button"
            className={controlMode === "recovery" ? "modeButton modeButton-active" : "modeButton"}
            onClick={() => setControlMode("recovery")}
          >
            Recovery
          </button>
          <button
            type="button"
            className={controlMode === "archive" ? "modeButton modeButton-active" : "modeButton"}
            onClick={() => setControlMode("archive")}
          >
            Archive
          </button>
          <button
            type="button"
            className={controlMode === "extension" ? "modeButton modeButton-active" : "modeButton"}
            onClick={() => setControlMode("extension")}
          >
            Extension
          </button>
        </div>

        {controlMode === "session" ? (
          <section className="tabForm" aria-label="Saved URL">
            <div className="selectedCategoryLabel">Target: {selectedCategoryName()}</div>
            <input
              aria-label="URL to save"
              onChange={(event) => setTabDraft({ ...tabDraft, url: event.target.value })}
              placeholder="https://example.com"
              type="url"
              value={tabDraft.url}
            />
            <input
              aria-label="URL title"
              maxLength={180}
              onChange={(event) => setTabDraft({ ...tabDraft, title: event.target.value })}
              placeholder="Optional title"
              type="text"
              value={tabDraft.title}
            />
            <div className="savedUrlCount">{tabs.length} saved URLs</div>
          </section>
        ) : controlMode === "categories" ? (
          <section className="categoryManagementPanel" aria-label="Category management">
            {selectedCategory ? (
              <form className="categoryForm managedCategoryForm" onSubmit={saveManagedCategory}>
                <div className="categoryManagementHeading">
                  <strong>Selected category</strong>
                  <span>{selectedCategory.tabCount} active tabs</span>
                </div>
                <input
                  aria-label="Selected category name"
                  maxLength={40}
                  onChange={(event) => setManagedCategoryDraft({ ...managedCategoryDraft, name: event.target.value })}
                  type="text"
                  value={managedCategoryDraft.name}
                />
                <input
                  aria-label="Selected category description"
                  maxLength={140}
                  onChange={(event) =>
                    setManagedCategoryDraft({ ...managedCategoryDraft, description: event.target.value })
                  }
                  type="text"
                  value={managedCategoryDraft.description}
                />
                <CategoryIconPicker
                  label="Category icon"
                  value={managedCategoryDraft.icon ?? defaultCategoryIcon}
                  onChange={(icon) => setManagedCategoryDraft({ ...managedCategoryDraft, icon })}
                />
                <div className="categoryManagementActions">
                  <button type="submit" className="addCategoryAction compactCategoryAction">
                    <Save aria-hidden="true" />
                    Save changes
                  </button>
                  <button
                    type="button"
                    className="removeCategoryAction"
                    onClick={() => removeCategory(selectedCategory.id)}
                  >
                    <Trash2 aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </form>
            ) : (
              <span className="emptyRecoveryText">Create a category to start.</span>
            )}
            <form className="categoryForm newCategoryForm" onSubmit={handleCreateCategory}>
              <div className="categoryManagementHeading">
                <strong>New category</strong>
              </div>
              <input
                aria-label="Category name"
                maxLength={40}
                onChange={(event) => setCategoryDraft({ ...categoryDraft, name: event.target.value })}
                placeholder="New category"
                type="text"
                value={categoryDraft.name}
              />
              <input
                aria-label="Category description"
                maxLength={140}
                onChange={(event) => setCategoryDraft({ ...categoryDraft, description: event.target.value })}
                placeholder="Short description"
                type="text"
                value={categoryDraft.description}
              />
              <CategoryIconPicker
                label="Category icon"
                value={categoryDraft.icon ?? defaultCategoryIcon}
                onChange={(icon) => setCategoryDraft({ ...categoryDraft, icon })}
              />
              <button type="submit" className="addCategoryAction compactCategoryAction">
                <Plus aria-hidden="true" />
                Add Category
              </button>
            </form>
          </section>
        ) : controlMode === "archive" ? (
          <section className="recoveryList" aria-label={`Archived URLs in ${selectedCategoryName()}`}>
            <p>Archived URLs in {selectedCategoryName()}</p>
            {archivedTabs.length === 0 ? <span className="emptyRecoveryText">None</span> : null}
            {archivedTabs.map((tab) => (
              <div className="archivedTabItem" key={tab.id}>
                <span>{tab.title}</span>
                <small>{getUrlHost(tab.url)}</small>
                <div className="archivedTabActions">
                  <button type="button" className="restoreAction" onClick={() => restoreArchivedTab(tab.id)}>
                    <RotateCcw aria-hidden="true" />
                    Return to Session
                  </button>
                  <button type="button" className="permanentDeleteAction" onClick={() => permanentlyDeleteArchivedTab(tab)}>
                    <Trash2 aria-hidden="true" />
                    Delete Permanently
                  </button>
                </div>
              </div>
            ))}
          </section>
        ) : controlMode === "recovery" ? (
          <section className="recoveryList" aria-label="Recover categories">
            <p>Removed categories</p>
            {deletedCategories.length === 0 ? <span className="emptyRecoveryText">None</span> : null}
            {deletedCategories.map((category) => (
              <button
                type="button"
                className="restoreAction"
                key={category.id}
                onClick={() => restoreDeletedCategory(category.id)}
              >
                Restore {category.name}
              </button>
            ))}
            <p>Removed URLs in {selectedCategoryName()}</p>
            {deletedTabs.length === 0 ? <span className="emptyRecoveryText">None</span> : null}
            {deletedTabs.map((tab) => (
              <button
                type="button"
                className="restoreAction"
                key={tab.id}
                onClick={() => restoreDeletedTab(tab.id)}
              >
                Restore {tab.title}
              </button>
            ))}
          </section>
        ) : controlMode === "extension" ? (
          <section className="extensionPanel" aria-label="Browser extension">
            <div className={bridgeStatus?.running ? "extensionState extensionState-ready" : "extensionState extensionState-warning"}>
              {bridgeStatus?.running ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
              <div>
                <strong>{bridgeStatus?.running ? "Bridge ready" : "Bridge offline"}</strong>
                <span>{bridgeEndpointText}</span>
              </div>
            </div>
            <div className={extensionInfo?.manifestPresent ? "extensionState extensionState-ready" : "extensionState extensionState-warning"}>
              {extensionInfo?.manifestPresent ? <CheckCircle2 aria-hidden="true" /> : <AlertTriangle aria-hidden="true" />}
              <div>
                <strong>{extensionInfo?.manifestPresent ? "Manifest found" : "Manifest missing"}</strong>
                <span>{extensionInfo?.manifestPath ?? "browser-extension/manifest.json"}</span>
              </div>
            </div>
            <div className="extensionPathBox">
              <Puzzle aria-hidden="true" />
              <div>
                <span>Load unpacked</span>
                <code>{extensionPathText}</code>
              </div>
            </div>
            <div className="extensionBrowserList" aria-label="Supported browsers">
              {supportedBrowsers.map((browser) => (
                <span key={browser}>{browser}</span>
              ))}
            </div>
          </section>
        ) : null}
        </div>
      </aside>

      <button
        type="button"
        className="controlRailToggle"
        aria-controls="browser-pilot-control-rail"
        aria-expanded={!controlRailCollapsed}
        aria-label={controlRailCollapsed ? "Expand BrowserPilot controls" : "Collapse BrowserPilot controls"}
        title={controlRailCollapsed ? "Expand BrowserPilot controls" : "Collapse BrowserPilot controls"}
        onClick={() => setControlRailCollapsed((isCollapsed) => !isCollapsed)}
      >
        {controlRailCollapsed ? <ChevronRight aria-hidden="true" /> : <ChevronLeft aria-hidden="true" />}
      </button>

      <section
        className={isCategoryListDragging ? "categoryList categoryList-dragging" : "categoryList"}
        aria-label="Session categories. Drag horizontally to browse."
        title="Drag horizontally to browse categories"
        onClickCapture={(event) => {
          if (suppressCategoryClick.current) {
            event.preventDefault();
            event.stopPropagation();
            suppressCategoryClick.current = false;
          }
        }}
        onPointerCancel={finishCategoryListDrag}
        onPointerDown={handleCategoryListPointerDown}
        onPointerMove={handleCategoryListPointerMove}
        onPointerUp={finishCategoryListDrag}
      >
        {categories.map((category) => {
          const boardTabs = getBoardTabs(category.id);

          return (
          <article
            className={`categoryCard ${selectedCategoryId === category.id ? "categoryCard-selected" : ""}`}
            data-category-id={category.id}
            key={category.id}
            onClick={() => setSelectedCategoryId(category.id)}
          >
            <div className="categoryIcon" data-category-icon={category.icon}>
              <CategoryGlyph icon={category.icon} />
            </div>
            <div className="categoryBody">
              {editingCategoryId === category.id ? (
                <div className="editStack">
                  <input
                    aria-label={`Rename ${category.name}`}
                    maxLength={40}
                    onChange={(event) => setEditDraft({ ...editDraft, name: event.target.value })}
                    type="text"
                    value={editDraft.name}
                  />
                  <textarea
                    aria-label={`Description for ${category.name}`}
                    maxLength={140}
                    onChange={(event) => setEditDraft({ ...editDraft, description: event.target.value })}
                    value={editDraft.description}
                  />
                  <CategoryIconPicker
                    label="Category icon"
                    value={editDraft.icon ?? defaultCategoryIcon}
                    onChange={(icon) => setEditDraft({ ...editDraft, icon })}
                  />
                  <div className="cardActions">
                    <button
                      type="button"
                      className="iconAction"
                      onClick={(event) => {
                        event.stopPropagation();
                        saveCategoryEdit(category.id);
                      }}
                      title="Save category"
                    >
                      <Save aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="iconAction"
                      onClick={(event) => {
                        event.stopPropagation();
                        cancelEditingCategory();
                      }}
                      title="Cancel editing"
                    >
                      <X aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="categoryTitleRow">
                    <h2>{category.name}</h2>
                    <button
                      type="button"
                      className="categoryOpenAction"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleOpenCategory(category.id);
                      }}
                      aria-label={`Open ${category.name} category`}
                    >
                      <PanelTopOpen aria-hidden="true" />
                      Open
                    </button>
                  </div>
                  <p>{category.description}</p>
                  {category.tabCount > 0 ? (
                    <div className="categoryMeta">
                      <span>{savedTabsLabel(category.tabCount)}</span>
                    </div>
                  ) : null}
                  <div
                    className="sessionBoardList"
                    data-category-id={category.id}
                    onDragOver={handleBoardDragOver}
                    onDrop={(event) => handleBoardDrop(event, category.id, boardTabs.length)}
                    role="list"
                    aria-label={`Saved tabs in ${category.name}`}
                  >
                    {boardTabs.length === 0 ? <span className="sessionBoardEmpty">No saved tabs yet</span> : null}
                    {boardTabs.map((tab, index) => (
                      <div
                        className={
                          draggedTab?.id === tab.id ? "sessionBoardTab sessionBoardTab-dragging" : "sessionBoardTab"
                        }
                        data-category-id={category.id}
                        data-tab-id={tab.id}
                        draggable={isStorageWritable}
                        key={tab.id}
                        onClick={(event) => event.stopPropagation()}
                        onDragEnd={() => setDraggedTab(null)}
                        onDragOver={handleBoardDragOver}
                        onDragStart={(event) => handleBoardDragStart(event, tab)}
                        onDrop={(event) => {
                          const rect = event.currentTarget.getBoundingClientRect();
                          const nextPosition = event.clientY > rect.top + rect.height / 2 ? index + 1 : index;
                          handleBoardDrop(event, category.id, nextPosition);
                        }}
                        role="listitem"
                      >
                        <GripVertical aria-hidden="true" />
                        <div>
                          <span>{tab.title}</span>
                          <small>{getUrlHost(tab.url)}</small>
                        </div>
                        <div className="sessionBoardTabActions">
                          <button
                            type="button"
                            className="sessionBoardOpenAction"
                            onClick={(event) => {
                              event.stopPropagation();
                              archiveSavedTab(tab.id, category.id);
                            }}
                            title="Archive saved tab"
                            aria-label={`Archive ${tab.title}`}
                          >
                            <Archive aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="sessionBoardOpenAction"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleOpenTab(tab);
                            }}
                            title="Open saved tab"
                            aria-label={`Open ${tab.title}`}
                          >
                            <ExternalLink aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="sessionBoardOpenAction sessionBoardRemoveAction"
                            onClick={(event) => {
                              event.stopPropagation();
                              removeTab(tab);
                            }}
                            title="Remove saved tab"
                            aria-label={`Remove ${tab.title}`}
                          >
                            <X aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="cardActions">
                    <button
                      type="button"
                      className="iconAction"
                      onClick={(event) => {
                        event.stopPropagation();
                        startEditingCategory(category);
                      }}
                      title="Edit category"
                    >
                      <Pencil aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="iconAction dangerAction"
                      onClick={(event) => {
                        event.stopPropagation();
                        removeCategory(category.id);
                      }}
                      title="Remove category"
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </article>
          );
        })}
      </section>
    </main>
  );
}

function App() {
  const [operationMessage, setOperationMessage] = useState("");
  const [layoutMode, setLayoutMode] = useState<WindowPreferences["layoutMode"]>("standard");
  const [storageRestoreResult, setStorageRestoreResult] = useState<StorageRestoreResult | null>(null);

  return (
    <DeskPilotShell
      layoutMode={layoutMode}
      settings={
        <SettingsPilot
          onOperationMessage={setOperationMessage}
          onStorageRestore={setStorageRestoreResult}
          onDisplayLayoutModeChange={setLayoutMode}
        />
      }
      toastMessage={operationMessage}
    >
      <BrowserPilot
        layoutMode={layoutMode}
        onOperationMessage={setOperationMessage}
        storageRestoreResult={storageRestoreResult}
      />
    </DeskPilotShell>
  );
}

export default App;
