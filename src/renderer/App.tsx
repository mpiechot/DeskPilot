import { FolderOpen, PanelTopOpen, Pencil, Plus, Save, ShieldCheck, Trash2, X } from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";
import type { CategoryInput, SessionMutationResult, SessionTab, SessionTabInput } from "../shared/deskPilotApi";
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

function App() {
  const [categories, setCategories] = useState<SessionCategory[]>(defaultCategories);
  const [storageStatus, setStorageStatus] = useState<"loading" | "ready" | "fallback" | "error">("loading");
  const [categoryDraft, setCategoryDraft] = useState<CategoryInput>({ name: "", description: "" });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<CategoryInput>({ name: "", description: "" });
  const [selectedCategoryId, setSelectedCategoryId] = useState(defaultCategories[0]?.id ?? "");
  const [tabs, setTabs] = useState<SessionTab[]>([]);
  const [tabDraft, setTabDraft] = useState<SessionTabInput>({ categoryId: selectedCategoryId, url: "", title: "" });
  const [controlMode, setControlMode] = useState<"session" | "categories">("session");
  const [operationMessage, setOperationMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    if (!window.deskPilot) {
      setStorageStatus("fallback");
      return () => {
        isMounted = false;
      };
    }

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

  function handleStorageError(): void {
    setStorageStatus("error");
    setOperationMessage("Storage write failed. Existing data was left untouched.");
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

  function removeTab(id: string): void {
    if (!isStorageWritable) {
      setOperationMessage("Removing URLs requires the Electron app.");
      return;
    }

    window.deskPilot
      ?.deleteTab(id)
      .then((result: SessionMutationResult) => {
        updateSessionResult(result);
        setOperationMessage("Saved URL removed safely.");
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
        setOperationMessage("Category removed safely.");
      })
      .catch(handleStorageError);
  }

  const legacyStorageMessage =
    storageStatus === "ready"
      ? "Local SQLite storage is active."
      : storageStatus === "fallback"
        ? "Browser preview is using fallback categories."
      : storageStatus === "error"
        ? "Storage unavailable; showing fallback categories."
        : "Loading local storage.";

  return (
    <main className="shell">
      <aside className="controlRail" aria-label="DeskPilot controls">
        <header className="appHeader">
          <div>
            <p className="eyebrow">DeskPilot</p>
            <h1>Browser Sessions</h1>
          </div>
          <div className="version">v{window.deskPilot?.version ?? "0.1.0"}</div>
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
        ) : (
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
        )}

        <footer className="safetyNote">
          <ShieldCheck aria-hidden="true" />
          <span>{storageMessage || legacyStorageMessage}</span>
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
