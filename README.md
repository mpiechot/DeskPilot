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
- Node.js 20.16 or newer in the Node 20 line
- npm

Commands:
- `npm install` installs project dependencies.
- `npm run dev` starts the React renderer in Vite for quick UI work.
- `npm run dev:electron` starts the Electron shell with the renderer in the Development data profile.
- `npm run dev:electron:productive` starts the Electron shell in the Productive data profile.
- `npm run lint` checks TypeScript and React source files.
- `npm run build` builds the Electron main/preload code and renderer.
- `npm run package:prototype` creates a local Windows prototype folder under `dist-prototype/DeskPilot`.
- `npm run test:prototype` regenerates the local prototype and verifies the desktop launchers do not fall back to the browser dev server.

More detailed run and verification notes live in `docs/USAGE.md`.

Current state:
- The Electron control panel exists in a wide, low touch-display layout.
- Categories and saved URLs are stored locally in a SQLite database.
- Development and Productive data profiles have separate SQLite storage locations.
- The app shows the active data profile and Productive cutover status in the UI.
- Productive storage copies existing prototype data once when it is first created and leaves the source untouched.
- Categories and saved URLs use soft-delete recovery flows.
- Saved URLs have persisted tab positions and are restored in that stored order.
- The Session Board shows saved tabs under each category.
- Saved tabs can be moved between categories and reordered with mouse-first drag and drop.
- Individual saved tabs can be opened from the Session Board.
- Saved URLs can be viewed and removed from the selected category.
- Saved URLs from a selected category open together in a new Chrome/Edge browser window.
- Manual SQLite backup snapshots can be created, restored, exported and imported from the Safety mode.
- A Chrome/Edge unpacked extension prototype can capture the current browser window through the local bridge in append or replace mode.
- The extension can save the current tab into the active DeskPilot category with duplicate protection.
- The local browser bridge is origin-restricted to browser-extension origins and visible in the app status area.
- A local prototype package can be generated for double-click launch during development.
- Starting DeskPilot again while it is already running focuses the existing instance instead of opening a second bridge.
- Browser-extension saves refresh the visible category counts in the Electron UI.
