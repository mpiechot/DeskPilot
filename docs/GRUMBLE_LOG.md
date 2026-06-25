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
