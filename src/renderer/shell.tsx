import { Info } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type PilotId = "browser";

type DeskPilotShellProps = {
  children: ReactNode;
  toastMessage: string;
};

const pilotNavigationItems: Array<{ id: PilotId; label: string; description: string }> = [
  {
    id: "browser",
    label: "BrowserPilot",
    description: "Browser sessions"
  }
];

function BrowserPilotIcon() {
  return (
    <svg
      aria-hidden="true"
      data-icon="browser-pilot"
      fill="none"
      height="24"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
      width="24"
    >
      <rect height="15" rx="2.5" width="17" x="3.5" y="4.5" />
      <path d="M3.5 8.5h17" />
      <path d="M6.5 6.5h.01M9.5 6.5h.01M12.5 6.5h.01" strokeWidth="2.4" />
      <path d="m12 10.5 1.4 3.1 3.1 1.4-3.1 1.4-1.4 3.1-1.4-3.1-3.1-1.4 3.1-1.4L12 10.5Z" />
    </svg>
  );
}

function ShellToast({ message }: { message: string }) {
  const [isVisible, setIsVisible] = useState(true);
  const [copyLabel, setCopyLabel] = useState("Copy details");

  useEffect(() => {
    setIsVisible(true);
    setCopyLabel("Copy details");

    const timeoutId = window.setTimeout(() => setIsVisible(false), 8000);

    return () => window.clearTimeout(timeoutId);
  }, [message]);

  async function copyDetails(): Promise<void> {
    try {
      await navigator.clipboard.writeText(message);
      setCopyLabel("Copied");
    } catch {
      setCopyLabel("Copy unavailable");
    }
  }

  if (!isVisible) {
    return null;
  }

  return (
    <aside className="shellToast" role="status" aria-live="polite" data-toast-message={message}>
      <Info aria-hidden="true" />
      <div className="shellToastContent">
        <strong>BrowserPilot message</strong>
        <span>{message}</span>
      </div>
      <button type="button" className="shellToastCopy" onClick={() => void copyDetails()}>
        {copyLabel}
      </button>
    </aside>
  );
}

export function DeskPilotShell({ children, toastMessage }: DeskPilotShellProps) {
  const [activePilotId, setActivePilotId] = useState<PilotId>("browser");
  const [dataProfile, setDataProfile] = useState({ id: "development", label: "Development" });

  useEffect(() => {
    window.deskPilot?.storageInfo().then((info) => {
      setDataProfile({ id: info.dataProfile.id, label: info.dataProfile.label });
    }).catch(() => undefined);
  }, []);

  return (
    <div className="deskPilotShell" data-shell="deskpilot">
      <aside className="pilotNavigation" aria-label="Pilot Navigation">
        <div className="pilotNavigationBrand" aria-label="DeskPilot">
          DP
        </div>
        <nav className="pilotNavigationItems" aria-label="Pilots">
          {pilotNavigationItems.map((pilot) => (
            <button
              type="button"
              className={activePilotId === pilot.id ? "pilotNavigationItem pilotNavigationItem-active" : "pilotNavigationItem"}
              data-pilot-id={pilot.id}
              key={pilot.id}
              onClick={() => setActivePilotId(pilot.id)}
              aria-current={activePilotId === pilot.id ? "page" : undefined}
              aria-label={pilot.label}
              title={`${pilot.label}: ${pilot.description}`}
            >
              <span className="pilotNavigationGlyph" aria-hidden="true">
                <BrowserPilotIcon />
              </span>
            </button>
          ))}
        </nav>
        <div
          className={dataProfile.id === "productive" ? "pilotNavigationMeta pilotNavigationMeta-productive" : "pilotNavigationMeta"}
          data-shell-meta
          aria-label={`DeskPilot version ${window.deskPilot?.version ?? "0.1.1"}, ${dataProfile.label} data profile`}
        >
          <strong>DeskPilot</strong>
          <span>v{window.deskPilot?.version ?? "0.1.1"}</span>
          <span>{dataProfile.label}</span>
        </div>
      </aside>
      <section className="deskPilotShellContent" aria-label="DeskPilot content">
        {activePilotId === "browser" ? children : null}
      </section>
      {toastMessage ? <ShellToast message={toastMessage} /> : null}
    </div>
  );
}
