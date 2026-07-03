# DeskPilot

DeskPilot is a local browser-session control panel. This glossary keeps product language precise while planning the path to productive use.

## Language

**Browser Session**:
A named collection of saved browser URLs that can be restored together as a working context.
_Avoid_: Tab dump, bookmark folder

**Saved Tab**:
A saved browser tab represented by its URL, title, category, and position inside a browser session.
_Avoid_: Bookmark, live tab

**Category**:
A user-facing container for one browser session, such as Work, Research, Entertainment, Projects, or Later / Inbox.
_Avoid_: Folder, workspace, project

**Tab Order**:
The user-defined order of saved tabs within a category, used when restoring that category as a browser session.
_Avoid_: Sort order, save time order

**Session Board**:
The app view where categories show their saved tabs and support drag-and-drop organization between categories and within each category.
_Avoid_: Sidebar list, extension popup

**Productive Use**:
Using DeskPilot as the user's real local browser-session system, where saved windows and tabs must remain trustworthy independently of ongoing development.
_Avoid_: Demo use, smoke test

**Productive MVP**:
DeskPilot 1.0: the smallest release that makes the existing browser-session workflow safe and useful enough for productive use.
_Avoid_: Prototype, full feature set

**Development Use**:
Using DeskPilot while building, testing, debugging, or packaging the app, where generated data must not mix with productive user data.
_Avoid_: Productive use, real use

**Data Profile**:
An isolated DeskPilot data environment with its own storage location and intended purpose.
_Avoid_: Mode, config

**Productive Data Profile**:
The data profile used for the user's real browser sessions and backups.
_Avoid_: Default test data, prototype data

**Development Data Profile**:
A data profile used for development, testing, debugging, or smoke checks that must never silently read from or write to the productive data profile.
_Avoid_: Productive data, user data

**Profile Migration**:
A deliberate copy or import of existing DeskPilot data from one data profile into another, preserving the source profile until the user confirms the target is correct.
_Avoid_: Move, overwrite, reset

**Automatic Productive Migration**:
A one-time background profile migration that copies existing prototype data into the productive data profile when productive storage first becomes available.
_Avoid_: Manual import, destructive migration

**Productive Cutover**:
The point when the productive data profile is created, prototype data is copied into it once, and future productive work continues only in the productive profile.
_Avoid_: Release day, manual switch

**Daily Trial Hardening**:
A planning milestone focused on making the current save, restore, manage, backup, and recovery loop reliable enough for productive use before adding larger workflows.
_Avoid_: Stability sprint, polish pass
