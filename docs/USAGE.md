# DeskPilot Usage

This document explains how to run the current DeskPilot development build.

## Current State

DeskPilot is currently an early desktop skeleton.

Working today:
- Electron desktop shell
- React control-panel UI
- default browser-session categories loaded from local SQLite storage: Work, Research, Entertainment, Projects, Later / Inbox
- isolated Development and Productive data profiles
- visible active profile and Productive cutover status in the control panel
- one-time Productive cutover from the old prototype database when Productive storage is first created
- create, rename and remove active categories
- restore removed categories
- save http/https URLs into a selected category
- open saved URLs from the selected category together in saved order in a new Chrome/Edge browser window
- view saved tabs under each category on the Session Board
- move saved tabs between categories with mouse-first drag and drop
- reorder saved tabs within a category with mouse-first drag and drop
- open individual saved tabs from the Session Board
- view and remove saved URLs in the selected category
- restore removed URLs from the selected category
- remember the desktop window size and position between app runs
- close the window to the system tray and quit explicitly from the tray menu
- relaunch DeskPilot while it is already running without opening a second app instance
- create manual local SQLite backup snapshots from Safety mode
- restore, export and import local SQLite backup snapshots from Safety mode
- inspect and restore the latest automatic rolling backup from Safety mode
- automatically recover a corrupted active database from a valid rolling backup at startup
- show a native recovery dialog when neither active nor rolling database can be opened
- wide, low touch-display layout
- visible browser-bridge status in the control panel
- guided Extension mode with bridge, manifest and load-unpacked status
- unpacked browser-extension prototype for saving the current browser window
- one-click current-tab save from the browser extension into the active DeskPilot category
- persistent Productive/Development profile badge in the browser-extension popup
- profile-aware extension bridge ports so Productive saves are not silently intercepted by a hidden Development instance
- automatic Electron UI refresh after browser-extension saves
- append or replace mode when capturing a browser window
- local prototype package command for a double-click launcher
- local development, lint and build commands

Not implemented yet:
- packaged extension installation flow
- signed installer or portable standalone executable

## Requirements

- Windows
- Node.js 20.16 or newer in the Node 20 line
- npm

## Install

Run this once after cloning or after dependency changes:

```bash
npm install
```

## Start The App

For the full desktop shell:

```bash
npm run dev:electron
```

`npm run dev:electron` uses the Development data profile by default.

For an explicit Productive profile run:

```bash
npm run dev:electron:productive
```

For renderer-only UI work in a browser:

```bash
npm run dev
```

Vite will print a local URL, usually:

```text
http://127.0.0.1:5173/
```

## Verify The Project

Before ending a work session, run:

```bash
npm run lint
npm run build
npm run test:storage
npm run test:extension
npm audit
```

`npm run test:extension` opens the real unpacked-extension popup in an isolated Electron smoke app. It supplies a fake Productive bridge and browser tab, saves that tab through the popup, and verifies that the Productive badge remains visible after the save result replaces the general status message.

## Package A Local Prototype

To create a local prototype folder:

```bash
npm run package:prototype
```

The output lives at:

```text
dist-prototype/DeskPilot/
```

Start it with:

```text
dist-prototype/DeskPilot/start-deskpilot.vbs
```

`start-deskpilot.vbs` opens the Electron desktop app without a visible console window. `start-deskpilot.cmd` is kept as a compatibility launcher and starts Electron detached so the console closes immediately. If startup fails, run `start-deskpilot-debug.cmd` to keep a diagnostic console open.

This is not a signed installer. It is a local development prototype that uses the repository's installed Electron runtime. The generated launchers force the Development data profile and refuse the Productive profile.

## Data Profiles

DeskPilot uses explicit local data profiles under Electron's DeskPilot user-data folder:

```text
profiles/development/storage/
profiles/productive/storage/
```

Development is the default for normal development and prototype launchers. Productive must be selected deliberately with `npm run dev:electron:productive` or `DESKPILOT_DATA_PROFILE=productive`.

When the Productive profile is created for the first time, DeskPilot looks for the old prototype database at:

```text
storage/deskpilot.sqlite
```

If that legacy database exists, DeskPilot copies it once into the Productive profile and records the cutover in `profiles/productive/profile-state.json`. The source database is left untouched. Later changes to the old prototype database are not imported automatically.

## Touch Display Assumption

DeskPilot is intended to live below the main monitors on a small secondary touch display.

The expected display shape is wide and not very tall. The UI should therefore prefer:
- horizontal space over vertical stacking
- large touch targets
- compact status text
- dense category tiles that remain readable at low height

## Browser Extension Prototype

An unpacked Chrome/Edge-compatible prototype lives in `browser-extension/`.

To try it during development:
- start DeskPilot with `npm run dev:electron`
- open the browser extension management page
- enable developer mode
- load `browser-extension/` as an unpacked extension
- pin the DeskPilot extension in the browser toolbar for quick access
- use `Save Current Tab` to append the active tab to the selected DeskPilot category
- use `Save Current Window` to save the current browser window to a DeskPilot category
- choose `Append` to add captured tabs to the selected category
- choose `Replace` to soft-delete existing active URLs in the selected category before saving the captured tabs
- enable `Close saved tabs` in the popup only when the current tabs should be closed after a successful save

The control panel shows whether the local browser bridge is running. Productive and Development use separate bridge ports:

```text
Productive:  127.0.0.1:17383
Development: 127.0.0.1:17384
```

The browser extension tries Productive first and falls back to Development only when Productive is not running. These bridge URLs are not the DeskPilot app UI. Opening one in a normal browser tab only shows a diagnostic message, while protected bridge endpoints still accept requests only from Chrome/Edge extension origins. Browser tabs without `http` or `https` URLs are skipped during window saves and are not closed by the optional close-after-save action.

The popup keeps the connected `Productive` or `Development` profile visible beside the DeskPilot heading. This badge remains visible while save results and errors change in the separate status line, so check it before saving real browser tabs.

The extension uses DeskPilot's active desktop category as the default `Save to` value. Changing the popup dropdown only affects that browser action; it does not change the desktop app selection. The bridge exposes explicit save routes for the current tab and current window, and the older `/capture` route is intentionally not kept as a compatibility alias.

Current-tab saves reject unsupported browser pages such as `chrome://...`. Same-category duplicates are not added twice; soft-deleted matching URLs in the same category are restored. If a URL is already active in another category, the extension asks before saving it into the selected category too.

The control panel's Extension mode shows the current load-unpacked folder and whether the extension manifest is present. For packaged prototype trials, load the `browser-extension/` folder from `dist-prototype/DeskPilot/`. After regenerating the prototype, reload the unpacked extension in the browser extension management page so the popup uses the latest bridge client headers.

## Data Safety

DeskPilot creates local SQLite databases inside the active data profile.

At this stage, SQLite stores categories and manually saved URLs.
If a default category is added in a later build, DeskPilot seeds the missing category on the next start without deleting existing data.
Saved URLs keep a persisted position inside their category. Existing databases with missing or duplicated tab positions are normalized deterministically on startup, and backup restore/import preserves the stored order.
Moving or reordering a saved tab updates the existing saved-tab row instead of deleting and recreating it.

The Safety mode can create manual SQLite snapshots in the active profile storage folder under `manual-backups/`. DeskPilot also keeps a rolling `deskpilot.sqlite.bak` file beside the active database after writes.

When the rolling backup exists, Safety mode shows its timestamp and size and offers an explicit restore action. Restoring it first reads and validates the backup, then creates a manual `pre-restore` safety snapshot of the current database before replacing active data. This preserves the state being replaced and avoids overwriting the rolling source while preparing the restore.

If the active database cannot be opened during startup, DeskPilot validates the rolling backup and recovers from it automatically. The unreadable source file is copied into `manual-backups/` with a `.sqlite.corrupt` suffix before active storage is replaced. It is deliberately excluded from the manual restore list, but its full path remains visible in Safety mode. DeskPilot also keeps the valid rolling backup intact during recovery.

If both the active database and rolling backup are unusable, DeskPilot leaves both files untouched and shows a native startup dialog. The dialog includes both paths and underlying errors, can open the affected storage folder and then exits cleanly. Preserve those files before moving them aside or importing a known valid DeskPilot backup.

Restoring or importing a backup creates a new safety backup before replacing the active database. Invalid imports are rejected before the active database is touched.

Removing a category currently performs a soft delete. The category is hidden from the active list, but the row remains in the local database for recovery-oriented future work.
Removed categories can be restored from the Recovery mode in the control panel.
Removing a saved URL also performs a soft delete. Removed URLs for the selected category can be restored from Recovery mode.

Future storage work must preserve these rules:
- all session data stays local
- no silent overwrite
- no silent deletion
- recoverable writes before browser integration
