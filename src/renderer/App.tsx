import { FolderOpen, PanelTopOpen, Save, ShieldCheck } from "lucide-react";
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
          <button type="button" className="primaryAction">
            <PanelTopOpen aria-hidden="true" />
            Open Current
          </button>
          <button type="button" className="secondaryAction">
            <Save aria-hidden="true" />
            Save Window
          </button>
        </section>

        <footer className="safetyNote">
          <ShieldCheck aria-hidden="true" />
          <span>Local, recoverable storage comes before browser writes.</span>
        </footer>
      </aside>

      <section className="categoryList" aria-label="Session categories">
        {defaultCategories.map((category) => (
          <article className="categoryCard" key={category.id}>
            <div className="categoryIcon">
              <FolderOpen aria-hidden="true" />
            </div>
            <div className="categoryBody">
              <div className="categoryTitleRow">
                <h2>{category.name}</h2>
                <span className={`status status-${category.status}`}>{statusLabel(category.status)}</span>
              </div>
              <p>{category.description}</p>
              <div className="categoryMeta">
                <span>{category.tabCount} tabs</span>
                <span>{category.lastSavedLabel}</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default App;
