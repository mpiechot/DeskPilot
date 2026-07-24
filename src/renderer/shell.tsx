import { Info, Keyboard, Lightbulb, Settings } from "lucide-react";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import {
  themeToCssCustomProperties,
  type ResolvedTheme,
  type ThemeAssetId,
  type ThemeAssets
} from "./theme";

type PilotId = "browser" | "desktop" | "environment";
type ShellDestination = PilotId | "settings";

type DeskPilotShellProps = {
  children: ReactNode;
  settings: ReactNode;
  toastMessage: string;
  layoutMode?: "standard" | "touch";
  theme: ResolvedTheme;
};

const pilotNavigationItems: Array<{ id: PilotId; label: string; description: string }> = [
  {
    id: "browser",
    label: "BrowserPilot",
    description: "Browser sessions"
  },
  {
    id: "desktop",
    label: "DesktopPilot",
    description: "Desktop hotkeys"
  },
  {
    id: "environment",
    label: "EnvironmentPilot",
    description: "Desk and environment controls"
  }
];

export function ThemeIcon({ assetId }: { assetId: ThemeAssetId }) {
  if (assetId === "keyboard") {
    return <Keyboard aria-hidden="true" />;
  }

  if (assetId === "lightbulb") {
    return <Lightbulb aria-hidden="true" />;
  }

  if (assetId === "settings") {
    return <Settings aria-hidden="true" />;
  }

  if (assetId === "browser-pilot") {
    return <BrowserPilotIcon />;
  }

  return <span aria-hidden="true">DP</span>;
}

function PilotNavigationIcon({ id, assets }: { id: PilotId; assets: ThemeAssets }) {
  return <ThemeIcon assetId={assets.navigation[id]} />;
}

function PilotEmptyState({
  id,
  title,
  description,
  assets
}: {
  id: PilotId;
  title: string;
  description: string;
  assets: ThemeAssets;
}) {
  return (
    <main className="pilotEmptyState" data-pilot={id} data-pilot-empty-state={id} aria-label={title}>
      <div className="pilotEmptyStateIcon" aria-hidden="true">
        <PilotNavigationIcon id={id} assets={assets} />
      </div>
      <span className="pilotEmptyStateEyebrow">In development</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </main>
  );
}

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
        <strong>DeskPilot message</strong>
        <span>{message}</span>
      </div>
      <button type="button" className="shellToastCopy" onClick={() => void copyDetails()}>
        {copyLabel}
      </button>
    </aside>
  );
}

export function DeskPilotShell({
  children,
  settings,
  toastMessage,
  layoutMode = "standard",
  theme
}: DeskPilotShellProps) {
  const [activeDestination, setActiveDestination] = useState<ShellDestination>("browser");
  const [dataProfile, setDataProfile] = useState({ id: "development", label: "Development" });

  useEffect(() => {
    window.deskPilot?.storageInfo().then((info) => {
      setDataProfile({ id: info.dataProfile.id, label: info.dataProfile.label });
    }).catch(() => undefined);
  }, []);

  const navigationClass = (destination: ShellDestination) =>
    activeDestination === destination ? "pilotNavigationItem pilotNavigationItem-active" : "pilotNavigationItem";
  const themeStyle = themeToCssCustomProperties(theme) as CSSProperties;

  return (
    <div
      className={layoutMode === "touch" ? "deskPilotShell deskPilotShell-touch" : "deskPilotShell"}
      data-shell="deskpilot"
      data-theme={theme.id}
      data-theme-animation={theme.effects.animations.toastEntrance === "disabled" ? "disabled" : "enabled"}
      data-theme-sound={theme.effects.sounds.notification === "disabled" ? "disabled" : "enabled"}
      style={themeStyle}
    >
      <div className="pilotNavigationBrand" aria-label="DeskPilot">
        <ThemeIcon assetId={theme.assets.brand} />
      </div>
      <aside className="pilotNavigation" aria-label="Pilot Navigation">
        <nav className="pilotNavigationItems" aria-label="Pilots">
          {pilotNavigationItems.map((pilot) => (
            <button
              type="button"
              className={navigationClass(pilot.id)}
              data-pilot-id={pilot.id}
              key={pilot.id}
              onClick={() => setActiveDestination(pilot.id)}
              aria-current={activeDestination === pilot.id ? "page" : undefined}
              aria-label={pilot.label}
              title={`${pilot.label}: ${pilot.description}`}
            >
              <span className="pilotNavigationGlyph" aria-hidden="true">
                <PilotNavigationIcon id={pilot.id} assets={theme.assets} />
              </span>
            </button>
          ))}
        </nav>
        <div className="pilotNavigationBottom">
          <button
            type="button"
            className={navigationClass("settings")}
            data-shell-destination="settings"
            onClick={() => setActiveDestination("settings")}
            aria-current={activeDestination === "settings" ? "page" : undefined}
            aria-label="Settings"
            title="Settings: DeskPilot-wide configuration"
          >
            <span className="pilotNavigationGlyph" aria-hidden="true">
              <ThemeIcon assetId={theme.assets.navigation.settings} />
            </span>
          </button>
          <div
            className={dataProfile.id === "productive" ? "pilotNavigationMeta pilotNavigationMeta-productive" : "pilotNavigationMeta"}
            data-shell-meta
            aria-label={`DeskPilot version ${window.deskPilot?.version ?? "0.1.1"}, ${dataProfile.label} data profile`}
          >
            <strong>DeskPilot</strong>
            <span>v{window.deskPilot?.version ?? "0.1.1"}</span>
            <span>{dataProfile.label}</span>
          </div>
        </div>
      </aside>
      <section className="deskPilotShellContent" aria-label="DeskPilot content">
        <div hidden={activeDestination !== "browser"} data-shell-destination="browser">
          {children}
        </div>
        <div hidden={activeDestination !== "desktop"} data-shell-destination="desktop">
          <PilotEmptyState
            id="desktop"
            title="DesktopPilot"
            description="Desktop hotkeys and workflow actions will be configured here in a later step."
            assets={theme.assets}
          />
        </div>
        <div hidden={activeDestination !== "environment"} data-shell-destination="environment">
          <PilotEmptyState
            id="environment"
            title="EnvironmentPilot"
            description="Desk and environment controls will be connected here in a later step."
            assets={theme.assets}
          />
        </div>
        <div hidden={activeDestination !== "settings"} data-shell-destination="settings">
          {settings}
        </div>
      </section>
      {toastMessage ? <ShellToast message={toastMessage} /> : null}
    </div>
  );
}
