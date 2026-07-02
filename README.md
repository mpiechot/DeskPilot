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
- `npm run dev:electron` starts the Electron shell with the renderer.
- `npm run lint` checks TypeScript and React source files.
- `npm run build` builds the Electron main/preload code and renderer.

More detailed run and verification notes live in `docs/USAGE.md`.

Current state:
- The Electron control panel exists in a wide, low touch-display layout.
- Categories and saved URLs are stored locally in a SQLite database.
- Categories and saved URLs use soft-delete recovery flows.
- Saved URLs can be viewed and removed from the selected category.
- Manual SQLite backup snapshots can be created from the Safety mode.
- A Chrome/Edge unpacked extension prototype can capture the current browser window through the local bridge.
- The local browser bridge is origin-restricted to browser-extension origins and visible in the app status area.
