# DeskPilot Usage

This document explains how to run the current DeskPilot development build.

## Current State

DeskPilot is currently an early desktop skeleton.

Working today:
- Electron desktop shell
- React control-panel UI
- default browser-session categories loaded from local SQLite storage: Work, Research, Entertainment, Projects, Later / Inbox
- create, rename and remove active categories
- restore removed categories
- save http/https URLs into a selected category
- open saved URLs from the selected category
- restore removed URLs from the selected category
- remember the desktop window size and position between app runs
- close the window to the system tray and quit explicitly from the tray menu
- create manual local SQLite backup snapshots from Safety mode
- wide, low touch-display layout
- visible browser-bridge status in the control panel
- guided Extension mode with bridge, manifest and load-unpacked status
- unpacked browser-extension prototype for saving the current browser window
- local development, lint and build commands

Not implemented yet:
- packaged extension installation flow
- browser-window capture polish

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
npm audit
```

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
- use the extension popup to save the current browser window to a DeskPilot category
- enable `Close saved tabs` in the popup only when the current tabs should be closed after a successful save

The control panel shows whether the local browser bridge is running. The prototype bridge listens on:

```text
127.0.0.1:17383
```

The bridge currently accepts requests only from Chrome/Edge extension origins. Browser tabs without `http` or `https` URLs are ignored by the popup and are not closed by the optional close-after-save action.

The control panel's Extension mode shows the current load-unpacked folder and whether the extension manifest is present.

## Data Safety

DeskPilot creates its first local SQLite database in Electron's user-data folder.

At this stage, SQLite stores categories and manually saved URLs.
If a default category is added in a later build, DeskPilot seeds the missing category on the next start without deleting existing data.

The Safety mode can create manual SQLite snapshots in the app storage folder under `storage/manual-backups/`. DeskPilot also keeps a rolling `deskpilot.sqlite.bak` file beside the active database after writes.

Removing a category currently performs a soft delete. The category is hidden from the active list, but the row remains in the local database for recovery-oriented future work.
Removed categories can be restored from the Recovery mode in the control panel.
Removing a saved URL also performs a soft delete. Removed URLs for the selected category can be restored from Recovery mode.

Future storage work must preserve these rules:
- all session data stays local
- no silent overwrite
- no silent deletion
- recoverable writes before browser integration
