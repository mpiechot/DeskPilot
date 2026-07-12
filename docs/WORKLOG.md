# Worklog

## 2026-06-25

Initial project planning created.

Current status:
- Project name: DeskPilot
- Repository name: deskpilot
- Initial product vision defined
- Autonomous Codex workflow defined
- Initial roadmap defined

Next expected step:
Bootstrap the Electron + React + TypeScript application.

### Implementation session

Completed:
- Created GitHub issue #1: Bootstrap v0.1 control panel skeleton.
- Created GitHub milestone: v0.1 - Control Panel Skeleton.
- Bootstrapped Electron + React + TypeScript project structure.
- Added Vite renderer build, Electron main/preload TypeScript build and ESLint.
- Built the first DeskPilot control-panel UI with default browser-session categories.
- Added safe placeholder copy that makes it clear real storage must be recoverable before browser writes are enabled.
- Verified `npm run lint`, `npm run build` and `npm audit`.
- Performed a local Vite browser screenshot check at 420x720 and 1280x900.

Actual effort:
- First implementation pass, small/medium.

Current status:
- The repository now contains a buildable MVP application shell.
- No real browser data is read or written yet.

Next recommended step:
- Implement local SQLite-backed category/session storage before adding browser-extension writes.

### Documentation and touch layout session

Completed:
- Read the updated agent instructions and Definition of Done.
- Verified the repository-local Git identity is `portfolio-pirat <mattzeal@gmail.com>`.
- Created GitHub issue #3 for usage documentation and wide touch-panel layout work.
- Moved rule-oriented project documents into `docs/rules/`.
- Added `docs/USAGE.md` with install, start, verification and touch-display notes.
- Updated the initial Electron window size for a wide, low control panel.
- Reworked the renderer layout into a horizontal control rail plus category tile grid.

Current status:
- The app is still placeholder-only, but it is now shaped for the intended under-monitor touch display.

Next recommended step:
- Continue with issue #2: implement SQLite-backed local category and session storage.

### Local storage session

Completed:
- Relaxed push identity rules so normal Git pushes can use the machine credential while local commits remain `portfolio-pirat`.
- Pushed the previously completed usage-documentation and touch-layout work.
- Added an initial SQLite-backed storage layer in the Electron main process.
- Seeded default categories into the local database on first run.
- Exposed category reads to the renderer through a preload IPC API.
- Updated the UI to load categories from local storage with a fallback message if storage is unavailable.

Current status:
- Categories are now local-storage backed.
- Browser tabs are still not saved or restored.

Next recommended step:
- Add category create/rename/delete operations with soft-delete behavior and then add session-tab persistence.

### Default category correction

Completed:
- Added the missing `Entertainment` category to the implemented default category seed list.
- Confirmed the product vision and Definition of Done already expected this category.
- Documented that future missing default categories are seeded without deleting existing local data.

Current status:
- New and existing local databases will receive `Entertainment` on startup if it is missing.

Next recommended step:
- Continue with category create/rename/delete operations and soft-delete behavior.

### Category management session

Completed:
- Added storage APIs for creating, renaming and soft-deleting categories.
- Added IPC/preload bindings for category writes.
- Added a compact touch-friendly category form.
- Added edit and remove controls to category cards.
- Added confirmation before removing a category from the active list.
- Added `npm run test:storage` smoke coverage for defaults, create, rename, soft-delete, recreate-after-delete and backup file creation.
- Rechecked wide and low touch layouts after adding category controls.

Current status:
- Categories can be managed locally in the Electron app.
- Browser preview remains read-only fallback data.

Next recommended step:
- Implement saved tab/session persistence per category and wire the existing Save/Open buttons to stored data.

### Saved URL session

Completed:
- Added storage APIs for saved URLs per category.
- Added soft-delete behavior for saved URLs.
- Added IPC/preload bindings for listing, adding, removing and opening saved URLs.
- Wired `Save URL` to store a manual http/https URL in the selected category.
- Wired `Open Selected` to open saved URLs for the selected category.
- Added selected-category highlighting and a compact session/category mode switch for the low touch layout.
- Extended `npm run test:storage` to cover saved URL add/count/delete behavior.

Current status:
- DeskPilot can now persist categories and manually saved URLs locally.
- The browser extension is still needed before DeskPilot can save the current browser window automatically.

Next recommended step:
- Add restore/recovery affordances for soft-deleted categories and URLs, or start the browser-extension bridge.

### Window placement session

Completed:
- Added local window settings storage.
- Persisted Electron window bounds on close.
- Restored the previous window bounds on startup.
- Added smoke coverage for window bounds round-trip behavior.

Current status:
- DeskPilot now remembers where its control panel was placed.

Next recommended step:
- Add a small recovery view for soft-deleted categories/URLs or begin the browser-extension bridge.

### Tray reliability session

Completed:
- Replaced the missing tray icon file dependency with an embedded native image.
- Kept the tray menu minimal: show DeskPilot and quit.

Current status:
- Tray creation should no longer fail because of a missing icon asset.

Next recommended step:
- Add hide-to-tray behavior and decide whether DeskPilot should appear in the normal taskbar.

### Close-to-tray session

Completed:
- Changed normal window close into hide-to-tray behavior.
- Kept explicit quit in the tray menu.
- Preserved window bounds before hiding.

Current status:
- DeskPilot behaves more like a resident control panel and is less likely to be closed accidentally.

Next recommended step:
- Add a user-visible recovery/settings view for soft-deleted data or begin the browser-extension bridge.

### Category recovery session

Completed:
- Added storage support for listing soft-deleted categories.
- Added storage support for restoring soft-deleted categories.
- Added IPC/preload bindings for category recovery.
- Added a Recovery mode to the control rail.
- Extended smoke coverage to prove soft-deleted categories are recoverable.

Current status:
- Removed categories can now be restored from the app.
- Removed URLs are still soft-deleted but do not yet have a UI recovery surface.

Next recommended step:
- Add URL recovery or start the browser-extension bridge for capturing live browser windows.

### URL recovery session

Completed:
- Added storage support for listing soft-deleted URLs per category.
- Added storage support for restoring soft-deleted URLs.
- Added IPC/preload bindings for URL recovery.
- Extended Recovery mode to show removed URLs for the selected category.
- Extended storage smoke coverage to prove removed URLs can be restored.

Current status:
- Removed categories and removed URLs are both recoverable.

Next recommended step:
- Begin the browser-extension bridge for capturing live browser windows.

### Browser extension bridge session

Completed:
- Added a local HTTP bridge bound to `127.0.0.1:17383`.
- Added bridge endpoints for categories and tab capture.
- Added an unpacked Chrome/Edge MV3 extension prototype.
- The extension popup can read the current window tabs and post them to DeskPilot.
- Captured tabs are saved into the selected local category.

Current status:
- Browser-window capture has a first end-to-end prototype path.

Next recommended step:
- Harden the bridge/extension UX, then add optional close-window-after-save behavior.

### Extension close-after-save session

Completed:
- Added an opt-in `Close saved tabs` checkbox to the extension popup.
- The extension removes current-window tabs only after a successful save response.
- Documented the opt-in behavior.

Current status:
- The extension prototype can save the current window and optionally close those tabs afterwards.

Next recommended step:
- Harden bridge security and improve extension install/error UX.

### Bridge hardening session

Completed:
- Tightened the local browser bridge origin check.
- Bridge requests now require a Chrome/Edge extension origin.

Current status:
- The bridge is still a prototype, but it no longer accepts origin-less browser requests.

Next recommended step:
- Add better extension error handling and a visible bridge status in the app.

### Bridge status and extension UX session

Completed:
- Added an Electron IPC/preload API for reading browser-bridge status.
- Displayed the local bridge host and port in the control panel status area.
- Improved the extension popup's disabled state and error messages.
- Ignored non-http/https tabs when saving the current browser window.
- Extended smoke coverage for bridge status and forbidden origin-less bridge requests.

Current status:
- The browser capture prototype is easier to diagnose from both the app and the extension popup.

Next recommended step:
- Add a guided extension install/checklist view or start export/import backup work before deeper browser workflow polish.

## 2026-06-30

### PR quality workflow and extension install view session

Completed:
- Adopted the single working-pull-request quality-gate workflow in `AGENTS.md`.
- Confirmed the repository-local Git identity is `portfolio-pirat <mattzeal@gmail.com>`.
- Created the `codex/deskpilot-working-pr` branch for ongoing quality-gate work.
- Added a main-process extension install-info API that exposes the local unpacked extension path and manifest status.
- Added an Extension mode to the control panel with bridge readiness, manifest status, load-unpacked path and supported browser chips.
- Extended the smoke test to verify the browser-extension manifest is discoverable.
- Updated roadmap, usage notes and technical decisions for the new PR workflow and Extension mode.
- Verified `npm run lint`, `npm run build`, `npm run test:storage` and `npm audit`.
- Committed and pushed `codex/deskpilot-working-pr` to `origin`.

Current status:
- DeskPilot now has an in-app place to diagnose the extension prototype setup before using the popup.
- The working branch exists on GitHub and is ready for a pull request.
- The local `gh` CLI is still authenticated as `mpiechot`, so PR creation must use an allowed connector path or a future `portfolio-pirat` GitHub CLI login.

Next recommended step:
- Open the working pull request for `codex/deskpilot-working-pr` once an allowed GitHub identity is available, then inspect SonarQube and ReviewDog feedback.

## 2026-07-02

### Working PR and manual backup session

Completed:
- Confirmed the repository-local Git identity is `portfolio-pirat <mattzeal@gmail.com>`.
- Opened draft working pull request #4 from `codex/deskpilot-working-pr` to `main` through the GitHub connector as `portfolio-pirat`.
- Checked PR #4 comments, review threads and commit statuses; none were reported yet.
- Added storage APIs for reading database backup status and creating manual SQLite snapshot backups.
- Added IPC/preload bindings for the backup status and manual backup action.
- Added a Safety mode to the control panel with database path, manual backup folder, latest backup and `Create Backup`.
- Extended `npm run test:storage` to verify manual backup creation and file metadata.
- Updated README, usage notes, roadmap, technical decisions and grumble log for the backup step.
- Verified `npm run build`, `npm run lint`, `npm run test:storage` and `npm audit`.

Current status:
- The working PR quality gate exists and the app has a first visible v0.4 safety feature.
- Manual backup creation is implemented, but import/restore from a selected backup is not implemented yet.
- UI screenshot verification was not available in this session because no in-app browser backend was exposed; local build, lint, storage smoke and audit checks passed.

Next recommended step:
- Start the next session by planning the next DeskPilot tasks as small, independently implementable steps.
- If GitHub is reachable, create GitHub issues for those planned tasks before implementing them. The user explicitly allowed GitHub issue creation for this next-session planning pass.
- Then inspect PR #4 automated feedback once checks appear and continue with the highest-priority issue, likely a cautious restore/import workflow that always creates a pre-restore backup before replacing data.

### Issue planning and URL list session

Completed:
- Confirmed the repository-local Git identity is `portfolio-pirat <mattzeal@gmail.com>`.
- Confirmed GitHub was reachable through the connector and PR #4 is the single open working pull request against `main`.
- Checked PR #4 comments, review threads and commit status; none were reported.
- Created new GitHub planning issues:
  - #5 Restore data from manual backup safely.
  - #6 Export and import DeskPilot backup files.
  - #7 Choose append or replace when capturing browser windows.
  - #8 Show saved URLs as a manageable list.
  - #9 Package a first local prototype build.
- Implemented issue #8 locally by adding a scrollable saved-URL list to Session mode with title, host and soft-delete remove action.
- Updated README, usage notes and roadmap to reflect the saved URL list.

Current status:
- DeskPilot now has a more usable daily session view: the selected category's saved URLs are visible and removable, not only previewed on category cards.
- The next high-value slices are safe backup restore (#5) and append/replace capture behavior (#7).

Next recommended step:
- Run final verification, commit and push the URL-list work, then continue with #5 or #7 depending on whether safety or browser capture polish is more important for the next session.

### Prototype completion push

Completed:
- Confirmed the repository-local Git identity is `portfolio-pirat <mattzeal@gmail.com>`.
- Checked PR #4 comments, review threads and commit status; none were reported.
- Implemented #5 safe backup restore from manual snapshots with pre-restore safety backup creation.
- Implemented #6 backup export/import through native Electron file dialogs with invalid import rejection and pre-import safety backups.
- Implemented #7 append/replace browser-window capture mode in the local bridge and extension popup. Replace soft-deletes active URLs before saving captured tabs.
- Implemented #9 local prototype packaging through `npm run package:prototype`, producing `dist-prototype/DeskPilot/start-deskpilot.cmd`.
- Extended storage smoke coverage for restore, invalid import rejection, import round-trip, append capture and replace capture.
- Updated README, usage notes, roadmap, technical decisions and grumble log.

Current status:
- DeskPilot now has the practical pieces needed for a first local trial prototype: capture, save, open, manage, recover, back up, restore/import/export and package locally.
- The prototype package is not a signed installer and still uses the repository's installed Electron runtime.

Next recommended step:
- Run final verification, commit and push. After that, use the local prototype for a real browser-session trial and log usability problems before adding larger v1 features such as sleep lists or monitor selection.

### Prototype launcher fix

Completed:
- Reproduced the reported launcher problem from `dist-prototype/DeskPilot/start-deskpilot.cmd`.
- Identified the generated `"%~dp0"` argument as the cause of the malformed trailing quote path passed through `electron.cmd`.
- Changed the generated launcher to `pushd` into the prototype folder and run Electron with `.` as the app path.
- Regenerated the local prototype folder and verified Electron starts as `electron.exe .` from the prototype directory.

Current status:
- The local prototype launcher no longer passes the prototype path with a trailing backslash quote hazard.

Next recommended step:
- Retest the double-click launcher manually, then continue with real-session usability feedback.

### Prototype desktop launcher follow-up

Completed:
- Reworked the generated prototype launchers so the normal path starts Electron detached from the console instead of running the npm `electron.cmd` shim in the foreground.
- Added `start-deskpilot.vbs` for launching the desktop app without a visible console window and `start-deskpilot-debug.cmd` for explicit diagnostics.
- Added a prototype launcher smoke test that rejects Vite/browser-dev-server launcher regressions.
- Changed the local bridge root URL to show a clear diagnostic message instead of `{"error":"Origin not allowed"}` while keeping protected endpoints origin-restricted.

Current status:
- The prototype package now has separate normal, no-console and debug launch paths.
- The bridge URL is explicitly labeled as an extension bridge, not the DeskPilot UI.

Next recommended step:
- Regenerate the prototype package and test the no-console launcher by double-clicking `dist-prototype/DeskPilot/start-deskpilot.vbs`.

### Prototype blank-window fix

Completed:
- Investigated a reported packaged Electron window that showed only the dark window background.
- Identified absolute Vite asset paths in `dist/index.html` as the likely cause: Electron `loadFile` cannot resolve `/assets/...` relative to the packaged renderer.
- Changed the Vite base path to emit relative renderer asset URLs.
- Extended the prototype launcher smoke test to reject absolute renderer asset paths.

Current status:
- The packaged prototype should load the React control panel instead of an empty window.

Next recommended step:
- Regenerate the prototype package and retest `dist-prototype/DeskPilot/start-deskpilot.vbs`.

### Prototype preload bridge fix

Completed:
- Reproduced the reported `Saving URLs requires the Electron app.` message in the packaged renderer.
- Added an Electron renderer smoke test that loads the packaged prototype, verifies `window.deskPilot`, enters a URL and clicks `Save URL`.
- Identified that the preload script was emitted as ESM and did not expose the Electron API in the packaged renderer.
- Changed the preload source to `.cts` so TypeScript emits `dist-electron/preload/index.cjs`.
- Updated the main process and renderer smoke test to load the CommonJS preload file.
- Extended ESLint config for CommonJS Electron smoke-test scripts.
- Verified `npm run test:prototype`, `npm run test:storage` and `npm run lint`.

Current status:
- The packaged prototype now exposes the Electron preload API to the renderer.
- `Save URL` should persist URLs instead of reporting that the Electron app is required.

Next recommended step:
- Relaunch the regenerated prototype and run a real manual save/open URL trial.

### Low-height session form fix

Completed:
- Reproduced the reported flow in the packaged Electron renderer: save a Work URL with a title, remove it, switch to Projects and enter a replacement URL/title.
- Found that the low-height control-panel layout could push the optional title input below the visible viewport after the save/delete/switch flow.
- Made the quick actions and mode switch more compact in the control rail.
- Allowed the session form area to scroll when the available rail height is tight.
- Extended the Electron renderer smoke test to cover the Work-delete-then-Projects-save flow and assert that the Projects title input is clickable and accepts text.
- Verified `npm run test:prototype`, `npm run test:storage` and `npm run lint`.

Current status:
- The optional URL title field should remain reachable in the low touch-display layout after moving a saved URL between categories.

Next recommended step:
- Relaunch the regenerated prototype and manually repeat the Work-to-Projects URL move flow.

### Recovery layout and capture friction feedback

Completed:
- Created GitHub issue #10 for one-click browser-extension saving of the current tab into the currently selected DeskPilot category.
- Reproduced the Recovery layout overflow with a long unbroken deleted URL title in the packaged Electron renderer smoke test.
- Fixed the control rail grid so long Recovery content cannot expand the rail into the category list.
- Ellipsized long Recovery restore buttons inside the rail.
- Extended the renderer smoke test to assert Recovery mode does not visually overlap the category list.
- Documented that opening a saved category should restore it as a new browser window, not reuse the current default-browser window.
- Verified `npm run test:prototype`, `npm run test:storage` and `npm run lint`.

Current status:
- Recovery should stay inside the left control rail even with long deleted URL titles.
- GitHub issue #10 tracks the lower-friction browser save flow.

Next recommended step:
- Implement browser-session restore as a new browser window, likely with a Chrome/Edge launch path and a safe fallback when no supported browser executable is found.

### Browser extension current-tab save session

Completed:
- Confirmed the repository-local Git identity is `portfolio-pirat <mattzeal@gmail.com>`.
- Confirmed PR #4 is the single open DeskPilot working pull request and has no review comments, review threads or status checks reported by the connector.
- Implemented GitHub issue #10's current-tab extension workflow.
- Added deterministic DeskPilot extension icon PNG assets and wired them in `manifest.json`.
- Persisted DeskPilot's active category in SQLite and exposed it to the desktop app and extension bridge.
- Replaced the old `/capture` bridge route with `/tabs/current/save`, `/windows/current/save` and `/app/show`.
- Added same-category duplicate prevention, soft-deleted URL restore-on-save and cross-category duplicate confirmation results.
- Updated the extension popup with `Save to`, `Save Current Tab`, `Save Current Window`, `Retry` and `Open DeskPilot`.
- Extended storage and bridge smoke coverage for current-tab saves, duplicate skips, soft-deleted restores, cross-category confirmation, route names, icon assets and `/capture` removal.
- Made bridge smoke tests use a dynamic test port so they can run while the normal DeskPilot bridge is open.
- Updated README, usage notes and roadmap for the new extension workflow.
- Verified `npm run build`, `npm run lint`, `npm run test:storage`, `npm run test:prototype` and `npm audit`.

Current status:
- The browser extension is now a lower-friction toolbar workflow for saving either the active tab or the current window.
- The active category survives app restart and hide-to-tray through SQLite app state.
- The local prototype was regenerated successfully after stopping stale local Electron processes that had locked `dist-prototype/DeskPilot`.

Next recommended step:
- Implement browser-session restore as a new browser window, keeping it separate from issue #10's save-side workflow.

## 2026-07-03

### Extension origin rejection fix

Completed:
- Reproduced the reported extension popup failure with a storage smoke test: a bridge request without an `Origin` header returned `403 Origin not allowed`.
- Kept ordinary origin-less bridge requests forbidden.
- Added a DeskPilot-specific browser-extension client header and taught the bridge to accept it only when `Origin` is missing.
- Updated the extension popup to send that client header for category loading, current-tab saves, current-window saves and app-show requests.
- Extended bridge smoke coverage for origin-less extension-client category loading and current-tab saving.
- Regenerated and verified the local prototype package.
- Verified `npm run test:storage`, `npm run lint`, `npm run build` and `npm run test:prototype`.

Current status:
- The unpacked browser extension no longer depends on a stable browser-provided `Origin` header, so the extension ID itself should not block local prototype testing.
- A previously loaded unpacked extension must be reloaded in the browser extension management page to pick up the new popup code.

Next recommended step:
- Reload the unpacked extension from `dist-prototype/DeskPilot/browser-extension/`, start DeskPilot from the regenerated prototype and manually test `Save Current Tab` plus `Save Current Window`.

### Single-instance and extension UI refresh fix

Completed:
- Reproduced the screenshot failure with a storage smoke test: starting the bridge on an occupied localhost port crashed with `EADDRINUSE`.
- Added bridge error handling so an occupied port no longer crashes the main process.
- Added an Electron single-instance lock so relaunching DeskPilot focuses the existing instance instead of starting a second bridge.
- Added a `sessions:changed` notification from extension bridge saves through Electron preload into the React renderer.
- Refreshed category counts, visible saved URLs and deleted URLs when extension saves complete.
- Removed the small saved-URL preview from category cards; the Session panel remains the scrollable saved-URL list.
- Extended prototype smoke coverage for the single-instance guard and renderer refresh after an external extension-style save.
- Regenerated and verified the local prototype package.
- Verified `npm run test:storage`, `npm run test:prototype`, `npm run lint` and `npm run build`.

Current status:
- Relaunching DeskPilot while a tray instance is still running should not produce the `127.0.0.1:17383 already in use` dialog.
- Extension saves should update the Electron category counters without needing to click the category first.

Next recommended step:
- Start the regenerated prototype, reload the unpacked browser extension and run a manual save-current-tab/window trial with DeskPilot left open and then hidden to tray.

### New-window restore fix

Completed:
- Reproduced the restore bug at the code seam: `Open Selected` opened each saved URL with Electron `shell.openExternal`, which lets the default browser reuse the current window.
- Added a Chrome/Edge restore launcher that starts one browser process with `--new-window` and all saved URLs as arguments.
- Kept an `openExternal` fallback for machines where no supported Chrome/Edge executable is found.
- Updated `Open Selected` to use the new-window launcher instead of opening URLs one by one.
- Extended storage smoke coverage for the new-window launch plan and prototype coverage to reject the old one-by-one `openExternal(tab.url)` path.
- Verified `npm run test:storage`, `npm run test:prototype`, `npm run lint` and `npm run build`.

Current status:
- `Open Selected` should restore the selected category as one new Chrome/Edge window containing all saved URLs.

Next recommended step:
- Manually retest `Open Selected` from the regenerated prototype with a category containing multiple saved URLs.

### Productive MVP planning session

Completed:
- Reframed DeskPilot 1.0 as the Productive MVP: safe, reliable productive use of the existing browser-session workflow.
- Moved larger enhancements such as sleep lists, bookmarks, notifications and deeper touch polish after 1.0.
- Defined Productive Use, Development Use, Productive MVP, Data Profile, Productive Cutover, Saved Tab, Tab Order and Session Board in `CONTEXT.md`.
- Recorded ADRs for Productive MVP scope, productive/development data separation, automatic prototype-to-productive migration and Session Board drag-and-drop organization.
- Decided that Productive and Development data must be hard-separated before further feature work.
- Decided that existing prototype data should be copied into the Productive data profile once, immediately when Productive storage is created.
- Chose Session Board drag-and-drop as the Productive MVP workflow feature.
- Scoped Session Board drag-and-drop to app-only and mouse-first for 1.0.
- Created GitHub issues #11 through #18 for the Productive MVP plan.
- Added `Blocked by` and `Blocks` issue references to represent dependencies because the available GitHub connector did not expose a native issue-relationship mutation.

Current status:
- The Productive MVP plan is clear and tracked in GitHub: implement data profile isolation and cutover first, then build the Session Board.

Next recommended step:
- Start with GitHub issue #11: implement Productive and Development data profiles with visible profile status.

### Data profile isolation and productive cutover session

Completed:
- Confirmed PR #4 was already merged and created a new working branch from updated `origin/main`.
- Carried forward the Productive MVP planning commit onto the new branch.
- Implemented GitHub issues #11, #12 and #13 locally.
- Added explicit Development and Productive data profiles under Electron user-data.
- Kept normal development and prototype launchers on the Development profile.
- Added an explicit `npm run dev:electron:productive` command for Productive startup.
- Added visible profile and cutover status to the Electron UI.
- Added one-time non-destructive Productive cutover from the old prototype database at `storage/deskpilot.sqlite`.
- Hardened storage and prototype smoke tests so Productive cannot be selected unintentionally.
- Updated README, usage notes, roadmap, technical decisions and grumble log.
- Verified `npm run build`, `npm run lint`, `npm run test:storage`, `npm run test:prototype` and `npm audit`.
- Pushed `codex/productive-mvp-data-profiles` and opened draft working pull request #19 against `main`.
- Checked PR #19 comments, review threads, commit statuses and workflow runs through the connector; none were reported yet.
- Closed completed GitHub issues #5 through #10 because their implementations are already merged through PR #4.

Current status:
- Development and Productive browser-session data are isolated.
- Productive startup copies existing prototype data once if the legacy prototype database exists, then records that later prototype changes are not imported automatically.
- The next Productive MVP dependency is saved-tab order.

Next recommended step:
- Implement GitHub issue #14: persist saved tab order and restore categories in that order.

### Saved tab order session

Completed:
- Confirmed PR #19 is the single open DeskPilot working pull request and has no comments, review threads, commit statuses or workflow runs reported yet.
- Implemented GitHub issue #14 locally.
- Returned saved-tab `position` values through the shared API.
- Listed saved URLs by persisted tab position with deterministic fallback ordering.
- Restored selected categories through the existing new-window launch path in persisted tab order.
- Hardened startup migration so existing databases with missing or duplicate tab positions are normalized deterministically.
- Made soft-deleted URL restore-on-save and Recovery restore assign a fresh active tab position.
- Extended storage smoke coverage for stable saved-tab positions, restart persistence, legacy duplicate-position normalization and backup restore preserving tab order.
- Updated README, usage notes, roadmap and technical decisions for the saved-tab order foundation.
- Verified `npm run build`, `npm run test:storage`, `npm run lint`, `npm run test:prototype` and `npm audit`.

Current status:
- Saved URLs now have a stable stored order inside their category, and `Open Selected` uses that order when restoring a browser session.
- The Productive MVP storage foundation for Session Board ordering is ready on the working PR branch.

Next recommended step:
- Implement GitHub issue #15: show saved tabs under each category in the Session Board.

### Session Board completion session

Completed:
- Confirmed PR #19 is still the single open DeskPilot working pull request and has no comments, review threads, commit statuses or workflow runs reported yet.
- Implemented GitHub issues #15 through #18 locally.
- Added Session Board saved-tab lists inside each category card.
- Added a storage/API `moveTab` operation that moves existing saved-tab rows between categories and reorders rows inside a category without deleting and recreating user data.
- Added mouse-first drag and drop for cross-category saved-tab moves.
- Added mouse-first drag and drop for same-category saved-tab reordering.
- Added compact per-tab open icons on Session Board rows while keeping `Open Selected` as the category-level restore action.
- Extended storage smoke coverage for cross-category moves, same-category reorder, restart persistence and restore order after reorder.
- Extended packaged renderer smoke coverage for Session Board rendering, drag/drop moves, drag/drop reorder, per-tab open controls and low-height layout safety.
- Updated README, usage notes, roadmap and technical decisions for the completed Session Board block.
- Verified `npm run build`, `npm run test:storage` and `npm run test:prototype` during implementation.

Current status:
- The planned Productive MVP implementation issues #11 through #18 are implemented on PR #19.
- DeskPilot can now show, open, move and reorder saved tabs in the app, with storage preserving the resulting order.

Next recommended step:
- Run final lint/audit verification, push PR #19, then use the regenerated prototype for a real productive browser-session trial and fix any quality-gate or daily-use issues before declaring 1.0 complete.

### Productive extension bridge profile fix

Completed:
- Investigated a data-profile mix-up where a hidden Development instance kept the browser-extension bridge while the user expected Productive saves.
- Split extension bridge defaults by profile: Productive keeps `127.0.0.1:17383`, Development now uses `127.0.0.1:17384`.
- Updated the browser extension to try Productive first and fall back to Development only when Productive is not running.
- Added storage smoke coverage so Development and Productive cannot regress to the same bridge port.
- Appended 19 active tabs from `deskpilot-prototype/profiles/development` into the Productive database without replacing existing Productive data.
- Created a Productive safety backup before the append migration.
- Regenerated and verified the local prototype package.
- Verified `npm run lint`, `npm run build`, `npm run test:storage`, `npm run test:prototype` and `npm audit`.

Current status:
- Productive contains 6 active categories, 40 active saved tabs and 3 soft-deleted tabs.
- Development still retains its source rows; the recovery migration did not delete the Development data.

Next recommended step:
- Reload the unpacked browser extension and verify the popup reports the intended profile before saving tabs.

## 2026-07-12

### Persistent extension profile indicator

Completed:
- Added a dedicated profile badge to the browser-extension popup so the connected Productive or Development profile remains visible after save status messages change.
- Gave Productive, Development and disconnected states distinct visual treatments.
- Kept the bridge categories response covered as the source of truth for the connected data profile.
- Added extension smoke checks that protect the persistent profile indicator from disappearing.

Current status:
- The extension popup now keeps the data destination visible throughout current-tab and current-window saves.

Next recommended step:
- Reload the unpacked extension and run a real Productive save trial while checking the persistent profile badge before each save.

### Productive extension popup smoke coverage

Completed:
- Added an isolated Electron smoke app that loads the real browser-extension popup rather than checking only source strings.
- Simulated a Productive bridge, active Work category and current browser tab through a test-only preload.
- Verified the popup selects the active category, enables saving, posts the current tab and reports `Saved to Work.`.
- Verified the Productive profile badge remains visible after the save status changes.
- Added `npm run test:extension` and included it in the full prototype verification command.

Current status:
- The highest-risk Productive popup path now has an executable end-to-end smoke check without touching Productive user data.

Next recommended step:
- Reload the unpacked extension and run the remaining real Productive save trial against the local DeskPilot instance.

### Automatic rolling backup restore

Completed:
- Added a real Safety-mode recovery action for the automatically maintained `deskpilot.sqlite.bak` file.
- Exposed rolling-backup availability, timestamp and size through the shared API and Electron preload.
- Added an explicit confirmation before restoring the automatic backup.
- Made rolling restore read and validate its source before creating the required manual pre-restore safety snapshot, preventing the normal backup write from overwriting the restore source.
- Refreshed categories, selected tabs, deleted data and backup status after restore.
- Added storage coverage proving the previous database state is restored and the replaced state remains preserved as a manual safety backup.
- Extended the packaged renderer smoke test through the real Safety UI restore control.

Current status:
- Users can now recover the previous automatically backed-up database state without locating or copying SQLite files manually.

Next recommended step:
- Add automatic startup recovery for a corrupted active database, using the same validated rolling-backup path and a visible recovery report.

### Corrupted database startup recovery

Completed:
- Added automatic startup fallback when the active SQLite database cannot be opened or migrated.
- Required the rolling backup to pass DeskPilot table validation before it can become active.
- Preserved the unreadable active file under `manual-backups/` with a `.sqlite.corrupt` suffix before replacement.
- Kept corrupted evidence out of the normal manual restore list while exposing its exact path in Safety mode.
- Prevented startup recovery from copying the corrupted active file over the valid rolling backup.
- Added a persistent footer warning and a detailed Safety-mode recovery report.
- Added storage coverage that corrupts a real database file, restarts storage, verifies recovered Session data and verifies byte-for-byte preservation of the corrupted source.
- Extended packaged renderer coverage for the visible startup recovery report.

Current status:
- DeskPilot can start successfully from its last valid automatic backup after active-database corruption without silently discarding the damaged source.

Next recommended step:
- Add a dedicated startup failure dialog for the case where both the active database and rolling backup are unusable, with paths and manual recovery guidance.

### Native double-database startup failure dialog

Completed:
- Added a structured `StorageStartupError` when neither the active database nor the automatic rolling backup can be opened.
- Exposed both file paths, storage directory and underlying validation errors without changing either file.
- Added a native Electron error dialog before the normal DeskPilot window and tray are created.
- Added `Open Storage Folder` and controlled `Quit` actions with explicit manual recovery guidance.
- Added storage coverage proving both corrupt files remain byte-for-byte unchanged.
- Added prompt coverage for both paths and available user actions.
- Extended packaged-main smoke coverage for the native dialog and folder-opening path.

Current status:
- DeskPilot now handles successful startup, automatic rolling recovery and unrecoverable double-database failure as explicit user-visible states.

Next recommended step:
- Add a read-only recovery launch option that starts without mutating storage and allows exporting preserved files from inside DeskPilot.

### Read-only startup recovery exports

Completed:
- Expanded the unrecoverable startup dialog into a persistent native recovery menu.
- Added separate `Export Active Database` and `Export Rolling Backup` actions with native save destinations.
- Kept each export byte-preserving and verified that the source remains unchanged.
- Blocked both DeskPilot source files as export destinations so neither can be overwritten through the save dialog.
- Kept recovery mode active after export, canceled export or storage-folder access until the user explicitly chooses `Quit`.
- Added success and failure feedback for recovery exports without starting the normal DeskPilot window or tray.
- Extended storage and packaged-main coverage for both export actions and explicit destinations.

Current status:
- Even when neither database is usable, the user can safely extract both files from DeskPilot before attempting manual repair or replacement.

Next recommended step:
- Add automatic creation of a compact recovery report text file alongside exported failure artifacts, containing profile, paths, timestamps and validation errors.

### Explicit Productive desktop launcher

Completed:
- Added `npm run package:productive` as a dedicated build path for real Productive use.
- Generated Productive into `dist-productive/DeskPilot Productive`, separate from the guarded Development prototype.
- Added console-free VBS, detached CMD and foreground debug launchers whose folder names, filenames and process profile all explicitly say Productive.
- Cleared the development-only profile guard inside every Productive launcher while keeping the existing prototype launchers forced to Development.
- Added a Productive launcher smoke test and included both package variants in the full prototype verification flow.
- Documented the no-console Productive start path and the need to regenerate the local package after application build changes.
- Verified `npm run lint`, `npm run test:storage`, `npm run test:prototype` and `npm audit` with zero reported vulnerabilities.

Current status:
- Productive DeskPilot can now be started by double-clicking `dist-productive/DeskPilot Productive/start-deskpilot-productive.vbs`; a console command is no longer required for normal launches.

Next recommended step:
- Use the new launcher for the real Productive browser-session trial, then prioritize any daily-use friction found there over additional speculative recovery polish.

### Post-MVP manual tab archive

Completed:
- Added a non-destructive Archived Tab state that remains separate from active Sessions and soft-deleted Recovery data.
- Migrated existing SQLite databases in place with an optional `archived_at` column while preserving all existing rows.
- Added storage, IPC and preload interfaces for listing, archiving and returning tabs to the active Session.
- Excluded archived tabs from category counts, browser restore, drag-and-drop order and active duplicate checks.
- Reactivated an archived same-category URL automatically when the user or browser extension saves it again.
- Added archive controls to the Session Board and selected-category URL list plus a dedicated Archive view.
- Added storage coverage and a packaged-renderer round trip through Archive and back to the active Session.
- Verified `npm run lint`, `npm run test:storage`, `npm run test:prototype` and `npm audit` with zero reported vulnerabilities.

Current status:
- The first v0.5 Cleanup Workflow slice is usable without deleting data: active Sessions can be trimmed and archived tabs remain recoverable per Category.

Next recommended step:
- Add archive age and saved-time visibility, then use it as the foundation for stale-tab detection and review reminders.
