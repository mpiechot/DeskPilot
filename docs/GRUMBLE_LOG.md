# Grumble Log

This file is for constructive complaints, risks and annoyances discovered during development.

Use it to document things like:
- annoying APIs
- unstable assumptions
- unclear requirements
- bad developer experience
- technical risks
- places where the user is probably overcomplicating the project

Be honest, but useful.

## 2026-06-25

No complaints yet. Suspiciously peaceful.

Bootstrap note:
Using `latest` for Electron/Vite/ESLint immediately pulled packages that wanted a newer Node than the current local runtime. The project now pins the toolchain so a fresh install remains predictable on Node 20.16.

Touch layout note:
The first skeleton was too portrait-oriented for the intended hardware. Future UI work should assume a wide, low display first and only then adapt down to narrow windows.

SQLite note:
Native SQLite packages are awkward in Electron because they need rebuild handling. The first storage pass uses `sql.js` to get a real local SQLite database file without native module friction. This may be revisited before packaging.

Bridge note:
The local browser bridge is convenient, but every localhost bridge deserves suspicion. Keep the origin checks tight and revisit authentication before treating the extension path as production-ready.

Extension UX note:
Unpacked extensions fail in ways that look like "nothing happened" unless the popup is blunt about connection, origin and tab filtering problems. Keep error text boring and explicit until the install flow is packaged.

PR workflow note:
The local GitHub CLI is currently configured as `mpiechot`, which project rules forbid for `gh` and GitHub API work. The new PR quality workflow needs either a `portfolio-pirat` GitHub CLI login or connector-based PR creation that does not use the forbidden identity.

Manual backup note:
Creating backup snapshots is straightforward, but import/restore is where data-loss bugs usually hide. Do not add a one-click restore until DeskPilot has an explicit pre-restore backup, clear conflict behavior and a visible result path.

Prototype packaging note:
The current prototype package is intentionally not a real installer. It launches from a generated folder but still relies on the repository's installed Electron runtime, which is acceptable for local trial use and not acceptable for sharing with non-developers.

Extension bridge test note:
The production bridge needs a stable localhost port so the browser extension can find it, but tests should not assume that port is free. The bridge smoke test now asks the OS for a free port so it can run while the normal DeskPilot app is already open.

MV3 origin note:
Do not assume every browser-extension popup request will carry a useful `Origin` header. The bridge now accepts a DeskPilot-specific extension client header when `Origin` is missing, while still rejecting ordinary origin-less browser requests.

Close-to-tray note:
A resident tray app must be single-instance from the beginning. Otherwise a normal relaunch after closing the window looks like a crash because the hidden first instance still owns the local bridge port.

Data profile note:
Separating Productive and Development storage is necessary, but it makes launch paths matter. Every prototype launcher and smoke test must keep forcing Development, and any future installer must make Productive startup explicit instead of inheriting a random developer environment variable.

Extension bridge profile note:
Sharing one localhost bridge port between Productive and Development is unsafe for a tray app. A hidden Development instance can keep accepting extension writes even after Productive is opened. Keep Productive on the stable extension port and move Development to a separate fallback port.

Rolling backup restore note:
Creating the required pre-restore safety snapshot normally updates the rolling backup file. A rolling restore must therefore read and validate its source before creating that snapshot, or it will quietly replace the recovery source with the current database and restore nothing.

Corrupted startup note:
Preserving a broken database with a normal `.sqlite` name makes it look restorable even though validation must reject it. Mark preserved evidence as `.sqlite.corrupt`, keep it out of the backup picker and show its path in the recovery report instead.

Double-failure note:
An unhandled startup promise is not a recovery experience. When neither database copy works, the app must stop before creating its normal window, name both files, offer the storage folder and quit deliberately instead of leaving a hidden or half-started tray process.
