# Technical Decisions

## 2026-06-25 - Initial Stack

Decision:
Use Electron + React + TypeScript for the main application.

Reason:
The project is intended to be implemented autonomously by Codex. A TypeScript-based stack keeps the desktop app, UI logic, local backend and browser extension close together.

## 2026-06-25 - Storage

Decision:
Use SQLite for local persistent storage.

Reason:
Browser sessions must survive crashes, browser issues and app restarts. SQLite is simple, local and reliable enough for the first version.

## 2026-06-25 - Browser Integration

Decision:
Use a browser extension for reading current tabs and windows.

Reason:
An external desktop app cannot reliably inspect browser tabs on its own. The extension can access tab/window APIs and communicate with the local DeskPilot app.

## 2026-06-25 - No Pull Requests

Decision:
Codex works directly on `main`.

Reason:
This project is intentionally autonomous. The user will not review pull requests.

## 2026-06-25 - Toolchain Pinning

Decision:
Pin the initial npm toolchain versions instead of using `latest`.

Reason:
The local Node version is 20.16. Recent package `latest` releases already require newer Node versions, so fixed compatible versions keep the bootstrap reproducible.

## 2026-06-25 - Primary Layout Shape

Decision:
Design the DeskPilot control panel for a wide, low touch display before optimizing for portrait layouts.

Reason:
The intended physical placement is below the main monitors, so horizontal scanning and short vertical height matter more than a tall sidebar-style app.
