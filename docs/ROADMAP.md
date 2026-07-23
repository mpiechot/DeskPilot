# Roadmap

## v1.0 - Productive MVP

Goal:
Make DeskPilot safe and useful as the user's real local browser-session system while development continues separately.

Status:
The Productive MVP browser-session workflow has passed a real user trial. The former real-use validation blocker is cleared: no blocker was reported for saving, organizing, restoring or using the current productive workflow. Touchscreen cursor/focus isolation remains a separate post-MVP hardware decision and is not implied by this result.

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

## Post-MVP Architecture Research

Goal:
Prepare DeskPilot's transition from a browser-session control panel into a broader local PC helper without committing to an untested touchscreen or plugin architecture.

Status:
Shell and theme decisions are complete for implementation. Touch hardware remains a separate decision stream and is intentionally not part of the shell implementation tickets.

Research results:
- [#28 touchscreen input isolation and keyboard-free workflows](research/0028-touchscreen-input-isolation.md) - complete, with target-hardware validation gate documented
- [#29 modular DeskPilot shell and system-control layer](research/0029-modular-deskpilot-shell.md) - complete, with multiple navigation/module/action designs compared

Shell implementation tickets:
- #31 introduce the DeskPilot Shell and preserve the BrowserPilot workflow - ready-for-agent
- #32 add DesktopPilot and EnvironmentPilot empty states - blocked by #31
- #33 move Display and Safety controls into shell-level Settings - blocked by #31
- #34 introduce the declarative Default Theme foundation - blocked by #31 and #33

Recommended next implementation step:
- Start with #31. Keep the separate touch-input research and fallback architecture out of this shell ticket sequence.

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
- categories - create/read/update/soft-delete done, with a visible selected-category management surface
- category navigation - horizontal drag-to-scroll done for compact windows
- category icons - persisted monochrome built-in icon picker done, with folder fallback for existing data
- category recovery - initial pass done
- saved URLs - manual save/open/list/soft-delete done
- URL recovery - initial pass done
- create/edit/delete categories - initial pass done with soft-delete
- open category URLs in browser - initial pass done
- open saved category as a new browser window instead of reusing an existing browser window - initial pass done with Chrome/Edge launcher
- name restored Chrome/Edge windows after their DeskPilot Category - done with Chromium's `--window-name` launch argument

Recent tracking issues:
- #21 horizontal category drag navigation - done
- #22 visible category rename and safe removal - done
- #23 persisted monochrome category icon picker - done

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
- recovery after app crash - automatic rolling recovery plus read-only double-failure export workflow done

## v0.5 - Cleanup Workflow

Goal:
Prevent categories from becoming huge tab graveyards.

Status:
Started. Manual per-category archiving is available from the Session Board and selected-category URL list, with a dedicated Archive view for returning tabs to the active Session.

Expected features:
- sleep lists per category
- manual archive - initial per-category archive and restore flow done
- stale-tab detection
- review reminders
- deletion only after warning

## v0.6 - Touch Display Polish

Goal:
Make DeskPilot pleasant on a small touch display.

Status:
Started. Standard/Touch layout, persisted monitor selection, launch-on-selected-display, optional kiosk-like fullscreen and horizontal category drag navigation are implemented.

Expected features:
- touch-sized buttons
- configurable layout - Standard and Touch modes done
- monitor selection - done
- launch on selected display - done with safe work-area placement
- kiosk-like mode if useful - optional persisted mode done

## v0.7 - Prototype Packaging

Goal:
Make DeskPilot easy to launch for local trial use.

Status:
Started. Separate generated folders now provide a guarded Development prototype launcher and an explicitly named Productive double-click launcher.

Expected features:
- local prototype folder - initial pass done
- double-click launcher - initial pass done
- explicit Productive no-console launcher - done
- signed installer - signing workflow ready; certificate still required for a real signature
- standalone runtime bundle - Productive package now includes Electron runtime
- unsigned NSIS test installer - done
- installed-app startup update check - done with one stable GitHub Release request and an explicit installer-page button
- recurring/background update polling - intentionally not implemented
- automatic update download/restart - intentionally not implemented while installers remain unsigned

Recent tracking issue:
- #24 one-time installed-app startup update check and explicit update action - done
