# Roadmap

## v0.1 - Control Panel Skeleton

Goal:
Create a Windows desktop control-panel application.

Status:
In progress. The initial Electron + React + TypeScript shell and wide touch-panel category UI exist.

Expected features:
- Electron + React + TypeScript application - done
- small control-panel window
- wide low control-panel window - initial pass done
- large touch-friendly buttons - initial pass done
- tray icon - basic placeholder behavior exists, icon asset still needed
- hidden from normal taskbar when appropriate
- usage/start documentation - done
- persistent window position
- basic categories displayed - done

## v0.2 - Local Session Storage

Goal:
Store browser-session data locally.

Status:
In progress. Default categories now load from local SQLite storage.

Expected features:
- SQLite storage - initial pass done
- categories - read/seed done
- saved URLs
- create/edit/delete categories
- open category URLs in browser

## v0.3 - Browser Extension

Goal:
Read the current browser window and save it into DeskPilot.

Expected features:
- Chrome/Edge-compatible extension
- read tabs from current browser window
- send tab list to DeskPilot
- save current window into selected category
- optionally close saved browser window

## v0.4 - Safe Restore And Backup

Goal:
Make session restore reliable.

Expected features:
- backups
- export/import
- restore history
- no silent data loss
- recovery after app crash

## v0.5 - Cleanup Workflow

Goal:
Prevent categories from becoming huge tab graveyards.

Expected features:
- sleep lists per category
- manual archive
- stale-tab detection
- review reminders
- deletion only after warning

## v0.6 - Touch Display Polish

Goal:
Make DeskPilot pleasant on a small touch display.

Expected features:
- touch-sized buttons
- configurable layout
- monitor selection
- launch on selected display
- kiosk-like mode if useful
