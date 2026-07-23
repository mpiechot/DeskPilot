import { Globe2, Info } from "lucide-react";
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
                <Globe2 />
              </span>
            </button>
          ))}
        </nav>
      </aside>
      <section className="deskPilotShellContent" aria-label="DeskPilot content">
        {activePilotId === "browser" ? children : null}
      </section>
      {toastMessage ? <ShellToast message={toastMessage} /> : null}
    </div>
  );
}
