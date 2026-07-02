import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  FolderOpen,
  PanelTopOpen,
  Pencil,
  Plus,
  Puzzle,
  Save,
  ShieldCheck,
  Trash2,
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
  StorageBackupInfo
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

    window.deskPilot
      .listCategories()
      .then((storedCategories: SessionCategory[]) => {
        if (!isMounted) {
          return;
        }

        setCategories(storedCategories);
        setSelectedCategoryId((currentId) => currentId || storedCategories[0]?.id || "");
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

  const storageMessage = operationMessage
    ? operationMessage
    : storageStatus === "ready"
      ? "Local SQLite storage is active."
      : storageStatus === "fallback"
        ? "Browser preview is using fallback categories."
        : storageStatus === "error"
          ? "Storage unavailable; showing fallback categories."
          : "Loading local storage.";

  const isStorageWritable = storageStatus === "ready" && Boolean(window.deskPilot);
  const latestManualBackup = storageInfo?.manualBackups[0] ?? null;
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
        setOperationMessage(`Saved URL to ${selectedCategoryName()}.`);
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
            <button type="button" className="backupAction" onClick={handleCreateStorageBackup}>
              <DatabaseBackup aria-hidden="true" />
              Create Backup
            </button>
            <div className="backupPathBox">
              <strong>Database</strong>
              <code>{storageInfo?.databasePath ?? "Electron storage path unavailable"}</code>
            </div>
            <div className="backupPathBox">
              <strong>Manual backups</strong>
              <code>{storageInfo?.manualBackupDirectory ?? "No backup directory yet"}</code>
            </div>
            <div className="backupList">
              <p>Latest backup</p>
              {latestManualBackup ? (
                <div className="backupListItem">
                  <span title={latestManualBackup.path}>{latestManualBackup.fileName}</span>
                  <small>
                    {formatBackupSize(latestManualBackup.sizeBytes)} - {formatBackupTime(latestManualBackup.createdAt)}
                  </small>
                </div>
              ) : (
                <span className="emptyRecoveryText">None</span>
              )}
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
              {selectedCategoryId === category.id && tabs.length > 0 ? (
                <div className="savedUrlList">
                  {tabs.slice(0, 3).map((tab) => (
                    <div className="savedUrlItem" key={tab.id}>
                      <span>{tab.title}</span>
                      <button type="button" className="miniDangerAction" onClick={() => removeTab(tab.id)} title="Remove URL">
                        <X aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;
