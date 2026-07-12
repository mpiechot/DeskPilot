# Roadmap

## v1.0 - Productive MVP

Goal:
Make DeskPilot safe and useful as the user's real local browser-session system while development continues separately.

Status:
Started. The planned Productive MVP implementation slices are now on the working PR branch. Daily Trial Hardening now includes an automated Productive extension-popup save check; the next step remains a real productive trial, quality-gate feedback and any stabilization that falls out of that trial before calling 1.0 complete.

Expected features:
1. Hard separation between Productive and Development data profiles - done.
2. One-time automatic Productive cutover that copies existing prototype data without deleting the source - done.
3. Visible profile and cutover status in the app - done.
4. Tests and prototype runs must not touch productive data - initial guard done.
5. Session Board with saved tabs shown under each category - done.
6. App-only drag-and-drop moving of saved tabs between categories - done.
7. App-only drag-and-drop reordering of saved tabs within a category - done.
8. Mouse-first drag-and-drop for v1.0, with deeper touch polish after productive use is safe - done.
9. Category restore opens tabs in the user-defined order - done.
10. Evaluate whether per-tab open icons replace or complement `Open Selected` - done, compact per-tab open icons complement `Open Selected`.

Tracking issues:
- #11 Productive MVP: add isolated data profiles and visible profile status - done
- #12 Productive MVP: copy existing prototype data during productive cutover - done
- #13 Productive MVP: make tests and prototype tooling unable to touch productive data - done
- #14 Productive MVP: persist saved tab order and restore categories in that order - done
- #15 Productive MVP: show saved tabs under each category in the Session Board - done
- #16 Productive MVP: move saved tabs between categories with app drag and drop - done
- #17 Productive MVP: reorder saved tabs within a category with app drag and drop - done
- #18 Productive MVP: evaluate and implement per-tab open controls on the Session Board - done

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
- open saved category as a new browser window instead of reusing an existing browser window - initial pass done with Chrome/Edge launcher

## v0.3 - Browser Extension

Goal:
Read the current browser window and save it into DeskPilot.

Status:
Started. A local bridge and unpacked extension prototype exist, including current-tab saving, append/replace window capture behavior and duplicate-safe save flows.

Expected features:
- Chrome/Edge-compatible extension - prototype done
- read tabs from current browser window - prototype done
- send tab list to DeskPilot - prototype done
- save current window into selected category - prototype done
- one-click save current tab into the currently selected DeskPilot category - done
- optionally close saved browser window - prototype done with popup checkbox
- choose append or replace when capturing - initial pass done with replace using soft-delete
- visible bridge status in the app - initial pass done
- extension error handling - initial pass done
- guided extension install/status view - initial pass done

## v0.4 - Safe Restore And Backup

Goal:
Make session restore reliable.

Status:
Started. The app can create, restore, export and import SQLite backup snapshots from Safety mode, including safe restore of the latest automatic rolling backup.

Expected features:
- backups - initial manual snapshot and pre-restore/pre-import safety backup pass done
- automatic rolling backup restore - done with validation and a pre-restore safety snapshot
- export/import - initial local file-dialog pass done
- restore history - manual snapshot list started
- no silent data loss
- recovery after app crash - automatic rolling recovery and native double-failure guidance done

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
