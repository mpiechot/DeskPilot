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
- tray icon - initial embedded icon done
- close-to-tray behavior - initial pass done
- usage/start documentation - done
- persistent window position - done
- basic categories displayed - done

## v0.2 - Local Session Storage

Goal:
Store browser-session data locally.

Status:
In progress. Default categories now load from local SQLite storage.

Expected features:
- SQLite storage - initial pass done
- categories - create/read/update/soft-delete done, default set includes Entertainment
- category recovery - initial pass done
- saved URLs - manual save/open/list/soft-delete done
- URL recovery - initial pass done
- create/edit/delete categories - initial pass done with soft-delete
- open category URLs in browser - initial pass done

## v0.3 - Browser Extension

Goal:
Read the current browser window and save it into DeskPilot.

Status:
Started. A local bridge and unpacked extension prototype exist, including append/replace capture behavior.

Expected features:
- Chrome/Edge-compatible extension - prototype done
- read tabs from current browser window - prototype done
- send tab list to DeskPilot - prototype done
- save current window into selected category - prototype done
- optionally close saved browser window - prototype done with popup checkbox
- choose append or replace when capturing - initial pass done with replace using soft-delete
- visible bridge status in the app - initial pass done
- extension error handling - initial pass done
- guided extension install/status view - initial pass done

## v0.4 - Safe Restore And Backup

Goal:
Make session restore reliable.

Status:
Started. The app can create, restore, export and import SQLite backup snapshots from Safety mode.

Expected features:
- backups - initial manual snapshot and pre-restore/pre-import safety backup pass done
- export/import - initial local file-dialog pass done
- restore history - manual snapshot list started
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

## v0.7 - Prototype Packaging

Goal:
Make DeskPilot easy to launch for local trial use.

Status:
Started. `npm run package:prototype` creates a local prototype folder with a double-click launcher.

Expected features:
- local prototype folder - initial pass done
- double-click launcher - initial pass done
- signed installer
- standalone runtime bundle
