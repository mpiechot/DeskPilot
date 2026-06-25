# DeskPilot Usage

This document explains how to run the current DeskPilot development build.

## Current State

DeskPilot is currently an early desktop skeleton.

Working today:
- Electron desktop shell
- React control-panel UI
- default browser-session categories
- wide, low touch-display layout
- local development, lint and build commands

Not implemented yet:
- real browser session storage
- SQLite persistence
- browser extension integration
- category editing
- opening or saving browser windows

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

Until SQLite storage is implemented, DeskPilot only displays placeholder category data.

Future storage work must preserve these rules:
- all session data stays local
- no silent overwrite
- no silent deletion
- recoverable writes before browser integration
