import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  Download,
  FolderOpen,
  PanelTopOpen,
  Pencil,
  Plus,
  Puzzle,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import type {
  BridgeStatus,
  CategoryInput,
  CategoryRecoveryResult,
  ExtensionInstallInfo,
  SessionMutationResult,
  SessionTab,
  SessionTabInput,
  StorageExportResult,
  StorageBackupInfo,
  StorageRestoreResult
} from "../shared/deskPilotApi";
import { defaultCategories, type SessionCategory } from "../shared/sessions";
import "./styles.css";

function statusLabel(status: SessionCategory["status"]): string {
  if (status === "ready") {
    return "Ready";
  }

  if (status === "needs-review") {
    return "Review";
  }

  return "Empty";
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

function App() {
  const [categories, setCategories] = useState<SessionCategory[]>(defaultCategories);
  const [storageStatus, setStorageStatus] = useState<"loading" | "ready" | "fallback" | "error">("loading");
  const [categoryDraft, setCategoryDraft] = useState<CategoryInput>({ name: "", description: "" });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CategoryInput>({ name: "", description: "" });
  const [selectedCategoryId, setSelectedCategoryId] = useState(defaultCategories[0]?.id ?? "");
  const [deletedCategories, setDeletedCategories] = useState<SessionCategory[]>([]);
  const [deletedTabs, setDeletedTabs] = useState<SessionTab[]>([]);
  const [tabs, setTabs] = useState<SessionTab[]>([]);
  const [tabDraft, setTabDraft] = useState<SessionTabInput>({ categoryId: selectedCategoryId, url: "", title: "" });
  const [controlMode, setControlMode] = useState<"session" | "categories" | "recovery" | "extension" | "safety">("session");
  const [operationMessage, setOperationMessage] = useState("");
  const [bridgeStatus, setBridgeStatus] = useState<BridgeStatus | null>(null);
  const [extensionInfo, setExtensionInfo] = useState<ExtensionInstallInfo | null>(null);
  const [storageInfo, setStorageInfo] = useState<StorageBackupInfo | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!window.deskPilot) {
      setStorageStatus("fallback");
      return () => {
        isMounted = false;
      };
    }

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

    window.deskPilot
      .storageInfo()
      .then((info: StorageBackupInfo) => {
        if (isMounted) {
          setStorageInfo(info);
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
    };
  }, []);

  useEffect(() => {
    setTabDraft((currentDraft) => ({ ...currentDraft, categoryId: selectedCategoryId }));

    if (!window.deskPilot || !selectedCategoryId) {
      setTabs([]);
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
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!window.deskPilot || storageStatus !== "ready" || !selectedCategoryId) {
      return;
    }

    window.deskPilot.setActiveCategory(selectedCategoryId).catch(() => undefined);
  }, [selectedCategoryId, storageStatus]);

  useEffect(() => {
    if (!window.deskPilot?.onSessionsChanged) {
      return;
    }

    let isMounted = true;
    const unsubscribe = window.deskPilot.onSessionsChanged(() => {
      const currentCategoryId = selectedCategoryId;
      const tabsPromise = currentCategoryId ? window.deskPilot?.listTabs(currentCategoryId) : Promise.resolve([]);
      const deletedTabsPromise = currentCategoryId ? window.deskPilot?.listDeletedTabs(currentCategoryId) : Promise.resolve([]);

      Promise.all([window.deskPilot?.listCategories(), tabsPromise, deletedTabsPromise])
        .then(([nextCategories, nextTabs, nextDeletedTabs]) => {
          if (!isMounted || !nextCategories || !nextTabs || !nextDeletedTabs) {
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

  const isStorageWritable = storageStatus === "ready" && Boolean(window.deskPilot);
  const latestManualBackup = storageInfo?.manualBackups[0] ?? null;
  const activeDataProfile = storageInfo?.dataProfile ?? null;
  const storageReadyMessage = activeDataProfile
    ? `${activeDataProfile.label} data profile is active.`
    : "Local SQLite storage is active.";
  const storageMessage = operationMessage
    ? operationMessage
    : storageStatus === "ready"
      ? storageReadyMessage
      : storageStatus === "fallback"
        ? "Browser preview is using fallback categories."
        : storageStatus === "error"
          ? "Storage unavailable; showing fallback categories."
          : "Loading local storage.";
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

  function updateRecoveryResult(result: CategoryRecoveryResult): void {
    updateCategories(result.categories);
    setDeletedCategories(result.deletedCategories);
  }

  function applyStorageRestoreResult(result: StorageRestoreResult): void {
    setStorageInfo(result.storageInfo);
    setCategories(result.categories);
    setDeletedCategories(result.deletedCategories);
    setSelectedCategoryId(result.selectedCategoryId);
    setTabs(result.tabs);
    setDeletedTabs(result.deletedTabs);
    setStorageStatus("ready");
  }

  function handleStorageError(): void {
    setStorageStatus("error");
    setOperationMessage("Storage write failed. Existing data was left untouched.");
  }

  function handleBackupError(): void {
    setOperationMessage("Could not create backup. Existing data was left untouched.");
  }

  function selectedCategoryName(): string {
    return categories.find((category) => category.id === selectedCategoryId)?.name ?? "category";
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

  function handleOpenCategory(): void {
    if (!selectedCategoryId) {
      setOperationMessage("Select a category first.");
      return;
    }

    if (!window.deskPilot) {
      setOperationMessage("Opening saved URLs requires the Electron app.");
      return;
    }

    window.deskPilot
      .openCategory(selectedCategoryId)
      .then((openedTabs: SessionTab[]) => {
        setTabs(openedTabs);
        setOperationMessage(
          openedTabs.length > 0 ? `Opened ${openedTabs.length} saved URLs.` : `${selectedCategoryName()} has no saved URLs yet.`
        );
      })
      .catch(() => setOperationMessage("Could not open saved URLs."));
  }

  function handleCreateStorageBackup(): void {
    if (!window.deskPilot) {
      setOperationMessage("Backups require the Electron app.");
      return;
    }

    window.deskPilot
      .createStorageBackup()
      .then((info: StorageBackupInfo) => {
        setStorageInfo(info);
        setOperationMessage("Created local database backup.");
      })
      .catch(handleBackupError);
  }

  function handleRestoreStorageBackup(fileName: string): void {
    if (!window.deskPilot) {
      setOperationMessage("Restoring backups requires the Electron app.");
      return;
    }

    if (!window.confirm(`Restore "${fileName}"? DeskPilot will create a safety backup before replacing active data.`)) {
      return;
    }

    window.deskPilot
      .restoreStorageBackup(fileName)
      .then((result: StorageRestoreResult) => {
        applyStorageRestoreResult(result);
        setOperationMessage(`Restored backup. Safety backup: ${result.safetyBackupFileName}.`);
      })
      .catch(() => setOperationMessage("Could not restore backup. Existing data was left untouched."));
  }

  function handleExportStorageBackup(fileName?: string): void {
    if (!window.deskPilot) {
      setOperationMessage("Export requires the Electron app.");
      return;
    }

    window.deskPilot
      .exportStorageBackup(fileName)
      .then((result: StorageExportResult | null) => {
        if (!result) {
          setOperationMessage("Export canceled.");
          return;
        }

        setStorageInfo(result.storageInfo);
        setOperationMessage(`Exported backup to ${result.filePath}.`);
      })
      .catch(() => setOperationMessage("Could not export backup."));
  }

  function handleImportStorageBackup(): void {
    if (!window.deskPilot) {
      setOperationMessage("Import requires the Electron app.");
      return;
    }

    if (!window.confirm("Importing a backup replaces active data after creating a safety backup. Continue?")) {
      return;
    }

    window.deskPilot
      .importStorageBackup()
      .then((result: StorageRestoreResult | null) => {
        if (!result) {
          setOperationMessage("Import canceled.");
          return;
        }

        applyStorageRestoreResult(result);
        setOperationMessage(`Imported backup. Safety backup: ${result.safetyBackupFileName}.`);
      })
      .catch(() => setOperationMessage("Could not import backup. Existing data was left untouched."));
  }

  function removeTab(id: string): void {
    if (!isStorageWritable) {
      setOperationMessage("Removing URLs requires the Electron app.");
      return;
    }

    window.deskPilot
      ?.deleteTab(id)
      .then((result: SessionMutationResult) => {
        updateSessionResult(result);
        refreshDeletedTabs();
        setOperationMessage("Saved URL removed safely.");
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
        setCategoryDraft({ name: "", description: "" });
        setOperationMessage("Category added.");
      })
      .catch(handleStorageError);
  }

  function startEditingCategory(category: SessionCategory): void {
    setEditingCategoryId(category.id);
    setEditDraft({ name: category.name, description: category.description });
    setOperationMessage("");
  }

  function cancelEditingCategory(): void {
    setEditingCategoryId(null);
    setEditDraft({ name: "", description: "" });
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

  function removeCategory(id: string): void {
    const category = categories.find((item) => item.id === id);

    if (!category || !window.confirm(`Remove "${category.name}" from active categories?`)) {
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
    <main className="shell">
      <aside className="controlRail" aria-label="DeskPilot controls">
        <header className="appHeader">
          <div>
            <p className="eyebrow">DeskPilot</p>
            <h1>Browser Sessions</h1>
          </div>
          <div className="headerMeta">
            <div className="version">v{window.deskPilot?.version ?? "0.1.0"}</div>
            <div
              className={
                activeDataProfile?.id === "productive" ? "profileBadge profileBadge-productive" : "profileBadge"
              }
            >
              {activeDataProfile?.label ?? "Profile"}
            </div>
            <div className={bridgeStatus?.running ? "bridgeStatus bridgeStatus-ready" : "bridgeStatus"}>{bridgeStatusText}</div>
          </div>
        </header>

        <section className="quickActions" aria-label="Session actions">
          <button type="button" className="primaryAction" onClick={handleOpenCategory}>
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
            className={controlMode === "extension" ? "modeButton modeButton-active" : "modeButton"}
            onClick={() => setControlMode("extension")}
          >
            Extension
          </button>
          <button
            type="button"
            className={controlMode === "safety" ? "modeButton modeButton-active" : "modeButton"}
            onClick={() => setControlMode("safety")}
          >
            Safety
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
            <section className="savedUrlManager" aria-label={`Saved URLs in ${selectedCategoryName()}`}>
              <div className="savedUrlManagerHeader">
                <strong>Saved URLs</strong>
                <span>{selectedCategoryName()}</span>
              </div>
              {tabs.length === 0 ? <span className="emptyRecoveryText">None</span> : null}
              {tabs.length > 0 ? (
                <div className="savedUrlManagerList">
                  {tabs.map((tab) => (
                    <div className="savedUrlManagerItem" key={tab.id}>
                      <div>
                        <span>{tab.title}</span>
                        <small>{getUrlHost(tab.url)}</small>
                      </div>
                      <button type="button" className="miniDangerAction" onClick={() => removeTab(tab.id)} title="Remove URL">
                        <X aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          </section>
        ) : controlMode === "categories" ? (
          <form className="categoryForm" onSubmit={handleCreateCategory}>
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
            <button type="submit" className="addCategoryAction">
              <Plus aria-hidden="true" />
              Add Category
            </button>
          </form>
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
        ) : (
          <section className="safetyPanel" aria-label="Storage safety">
            <div
              className={
                activeDataProfile?.id === "productive" ? "profileSummary profileSummary-productive" : "profileSummary"
              }
            >
              <strong>{activeDataProfile ? `${activeDataProfile.label} profile` : "Data profile"}</strong>
              <span>{activeDataProfile?.description ?? "Profile status unavailable."}</span>
              <small>{activeDataProfile?.cutover.message ?? "Cutover status unavailable."}</small>
            </div>
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
        )}

        <footer className="safetyNote">
          <ShieldCheck aria-hidden="true" />
          <span>{storageMessage}</span>
        </footer>
      </aside>

      <section className="categoryList" aria-label="Session categories">
        {categories.map((category) => (
          <article
            className={`categoryCard ${selectedCategoryId === category.id ? "categoryCard-selected" : ""}`}
            key={category.id}
            onClick={() => setSelectedCategoryId(category.id)}
          >
            <div className="categoryIcon">
              <FolderOpen aria-hidden="true" />
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
                    <span className={`status status-${category.status}`}>{statusLabel(category.status)}</span>
                  </div>
                  <p>{category.description}</p>
                  <div className="categoryMeta">
                    <span>{category.tabCount} tabs</span>
                    <span>{category.lastSavedLabel}</span>
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
        ))}
      </section>
    </main>
  );
}

export default App;
