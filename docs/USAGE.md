# DeskPilot Usage

This document explains how to run the current DeskPilot development build.

## Current State

DeskPilot is currently an early desktop skeleton.

Working today:
- Electron desktop shell
- React control-panel UI
- default browser-session categories loaded from local SQLite storage: Work, Research, Entertainment, Projects, Later / Inbox
- create, rename and remove active categories
- save http/https URLs into a selected category
- open saved URLs from the selected category
- wide, low touch-display layout
- local development, lint and build commands

Not implemented yet:
- browser extension integration
- opening or saving browser windows
- reading the current browser window automatically

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

## Data Safety

DeskPilot creates its first local SQLite database in Electron's user-data folder.

At this stage, SQLite stores categories and manually saved URLs.
If a default category is added in a later build, DeskPilot seeds the missing category on the next start without deleting existing data.

Removing a category currently performs a soft delete. The category is hidden from the active list, but the row remains in the local database for recovery-oriented future work.
Removing a saved URL also performs a soft delete.

Future storage work must preserve these rules:
- all session data stays local
- no silent overwrite
- no silent deletion
- recoverable writes before browser integration
