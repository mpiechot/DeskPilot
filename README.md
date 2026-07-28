# DeskPilot

DeskPilot is an autonomous desktop control panel for managing browser sessions, desktop workflows and later physical desk-related controls.

The first product goal is a local Windows desktop application with a small control-panel window that can later run on a touch display.

The initial core feature is browser session management:
- open categorized browser sessions
- save the current browser window into a category
- restore saved sessions reliably
- reduce tab clutter
- protect the user from losing browser sessions
- later move unused tabs into sleep lists or bookmarks

This project is intended to be developed autonomously by Codex.

## Development

Requirements:
- Node.js 22.12 or newer for development and Windows installer packaging
- npm

Commands:
- `npm install` installs project dependencies.
- `npm run dev` starts the React renderer in Vite for quick UI work.
- `npm run dev:electron` starts the Electron shell with the renderer in the Development data profile.
- `npm run dev:electron:productive` starts the Electron shell in the Productive data profile.
- `npm run lint` checks TypeScript and React source files.
- `npm run build` builds the Electron main/preload code and renderer.
- `npm run test:extension` loads the real extension popup in an isolated Electron smoke app and verifies a Productive current-tab save.
- `npm run test:update` verifies stable release comparison, one startup request, Development isolation and validated release-page opening.
- `npm run package:prototype` creates a local Windows prototype folder under `dist-prototype/DeskPilot`.
- `npm run package:productive` creates an explicit Productive launcher folder under `dist-productive/DeskPilot Productive`.
- `npm run package:windows` creates an unsigned local NSIS test installer under `dist-installer`.
- `npm run package:windows:signed` requires `CSC_LINK` and `CSC_KEY_PASSWORD` and refuses to produce a falsely labeled signed build.
- `npm run test:prototype` regenerates the local prototype and verifies the desktop launchers, renderer workflow and extension popup.

More detailed run and verification notes live in `docs/USAGE.md`.

Current state:
- The DeskPilot Shell now hosts BrowserPilot, DesktopPilot and EnvironmentPilot, with the latter two presenting explicit development empty states.
- Pilot Navigation is icon-only, visually separated from Pilot content, and switches between vertical rail and compact horizontal layout responsively; the light DeskPilot `DP` brand sits outside the dark navigation surface and shell-level Settings is available separately.
- The navigation keeps DeskPilot's version and active data profile visible in a small footer and uses a styleable monochrome BrowserPilot SVG icon.
- DeskPilot uses a real PNG/ICO application icon for its Windows tray, installer and shortcuts.
- Shell-owned Toast Messages keep BrowserPilot errors visible and provide copyable details.
- The Electron control panel exists in a wide, low touch-display layout.
- Categories and saved URLs are stored locally in a SQLite database.
- Development and Productive data profiles have separate SQLite storage locations.
- The app shows the active data profile and Productive cutover status in the UI.
- Productive storage copies existing prototype data once when it is first created and leaves the source untouched.
- Categories and saved URLs use soft-delete recovery flows.
- BrowserPilot opens on a compact responsive multi-row Category Grid with fixed cards, icon-only Open/Details actions and persisted drag ordering.
- Categories have dedicated Creation and Details views with explicit drafts, unsaved-change choices, safe removal and persisted monochrome icons.
- Saved URLs have persisted tab positions and are restored in that stored order.
- Category Details owns active Saved Tabs, explicit cross-category moves, release-based drag ordering, individual Open, Archive and recoverable Remove actions.
- New tabs enter DeskPilot through the Browser Extension; the desktop manual Save URL path has been removed.
- Saved tabs can be archived without deletion and returned to the active Session from the Category Details Archive view.
- Saved URLs from a selected category open together in a new Chrome/Edge browser window named exactly after the Category.
- BrowserPilot Top Navigation keeps measured Bridge Ready/Unavailable state and BrowserPilot Settings available across its views.
- BrowserPilot Settings separates Extension diagnostics, global removed-Category Recovery and confirmed global Archived Tab Cleanup; Category-specific Archive and Recovery stay in Category Details.
- Manual SQLite backup snapshots can be created, restored, exported and imported from shell-level Settings, and the latest automatic rolling backup can be restored safely.
- A corrupted active database is recovered automatically from the valid rolling backup at startup, while the corrupted source file is preserved for diagnosis.
- If both database copies are unusable, a native read-only recovery menu can export either file, show both paths and open the affected storage folder.
- A Chrome/Edge unpacked extension prototype can capture the current browser window through the local bridge in append or replace mode.
- The extension can save the current tab into the active DeskPilot category with duplicate protection and keeps the connected data profile visible in its popup.
- The local browser bridge is origin-restricted to browser-extension origins, visible in the app status area and profile-aware.
- Productive and Development use separate bridge ports so a hidden Development instance cannot silently receive Productive extension saves.
- A local prototype package can be generated for double-click launch during development.
- The Productive package includes its own Electron runtime and can run outside the repository.
- Settings keeps Display and Safety outside BrowserPilot and exposes the active declarative Theme; the shipped Default Theme is the complete fallback for Shell and Pilot presentation, while Display settings independently control Standard or Touch layout, launch monitor and optional kiosk-like fullscreen mode.
- Installed builds check the latest stable public GitHub Release once at app startup and highlight a newer installer in the header.
- Starting DeskPilot again while it is already running focuses the existing instance instead of opening a second bridge.
- Browser-extension saves refresh the visible category counts in the Electron UI.
- The current Productive build is version `1.1.0`; the unsigned Windows installer is generated as `DeskPilot-Setup-1.1.0.exe`.
