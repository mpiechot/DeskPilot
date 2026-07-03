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

Status:
Superseded on 2026-06-30 by the single working-pull-request quality-gate workflow.

## 2026-06-30 - Working Pull Request Quality Gate

Decision:
Use one open working pull request as the continuous quality-gate workspace for CI, SonarQube and ReviewDog feedback.

Reason:
SonarQube and ReviewDog need pull request context, but the user still does not want to review many separate pull requests. A single ongoing working PR preserves autonomous development while giving automated review tools a stable place to comment.

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

## 2026-06-25 - Initial SQLite Runtime

Decision:
Use `sql.js` for the first local SQLite storage pass.

Reason:
It provides a real SQLite database file without native Electron rebuild friction, which keeps the MVP moving while data model and safety behavior are still taking shape.

## 2026-07-02 - Manual Backup Snapshots

Decision:
Add user-triggered SQLite snapshot backups before implementing import or restore flows.

Reason:
Backup creation is low-risk and directly supports the no-silent-data-loss rule. Import and restore can overwrite user data if designed poorly, so they should be implemented only after backup files and storage locations are visible in the app.

## 2026-07-02 - Prototype Packaging

Decision:
Use a local prototype folder with a Windows command launcher before adding a signed installer or standalone runtime bundle.

Reason:
The immediate need is daily local trial use, not distribution. A prototype folder can be generated without adding packaging dependencies, preserves local-first behavior and keeps the future installer decision separate.

## 2026-07-03 - Data Profiles

Decision:
Store Development and Productive data in separate profile directories under Electron user-data, with normal development and prototype launchers defaulting to Development.

Reason:
DeskPilot is now close enough to daily use that smoke tests, renderer checks and prototype launchers must not share the user's real browser-session database. Productive use is selected deliberately, and its first creation copies the old prototype database once without deleting or repeatedly importing the source.
