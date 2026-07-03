# Definition Of Done

This document defines when DeskPilot version 1.0, the productive MVP, is considered complete.

Codex may improve the implementation, but may not remove these requirements.

---

# Core Principles

DeskPilot must:

- work completely offline
- store all data locally
- survive application restarts
- survive browser crashes
- survive Windows restarts
- never silently lose user data

---

# Control Panel

The application must provide for version 1.0:

- a dedicated desktop window
- touch-friendly controls
- system tray integration
- persistent window position

The application should provide after version 1.0:

- configurable window size
- configurable monitor placement
- automatic startup with Windows

The application should not require a normal taskbar entry.

---

# Categories

The user must be able to for version 1.0:

- create categories
- rename categories
- delete categories

The user should be able to after version 1.0:

- reorder categories
- assign icons or colors
- mark favorite categories

Examples:

- Work
- Research
- Entertainment
- Projects
- Inbox

---

# Browser Sessions

The user must be able to:

- open a category
- save the current browser window into a category
- restore saved tabs
- append additional tabs to an existing category
- replace existing category tabs
- manually remove tabs
- move saved tabs between categories in the app
- reorder saved tabs within a category in the app
- support mouse-first saved-tab drag-and-drop for version 1.0

Browser sessions must survive:

- browser crashes
- application crashes
- Windows restarts

---

# Session Safety

DeskPilot must:

- automatically save changes
- maintain backups
- provide restore functionality
- never silently overwrite data
- never silently delete data
- keep productive user data isolated from development, prototype and test data
- automatically copy existing prototype data into the productive profile once, without deleting the prototype source or silently overwriting productive data
- clearly show after productive cutover that further prototype data changes will not be migrated automatically

---

# Post-1.0 Sleep Lists

DeskPilot should later support:

- inactive tabs
- archived tabs
- sleep lists

The user should later:

- review sleeping tabs
- restore sleeping tabs
- permanently delete sleeping tabs

Automatic deletion must provide advance warning.

---

# Post-1.0 Bookmarks

The user should later be able to:

- create bookmark folders
- move tabs into bookmarks
- organize bookmarks per category

Bookmarks and sessions are separate concepts.

---

# Post-1.0 Inbox

DeskPilot should later provide:

- a temporary holding area
- "look at this later" functionality

The Inbox should prevent permanent tab accumulation.

---

# Post-1.0 Notifications

DeskPilot should warn the user about:

- large categories
- stale tabs
- pending deletions
- review reminders

---

# Touch Display Support

DeskPilot must support for version 1.0:

- small touch displays
- large buttons
- readable text
- touch interaction

DeskPilot should support after version 1.0:

- monitor selection

---

# Future Features

The following features are explicitly outside Version 1:

- desk lighting control
- desk height control
- audio control
- focus scenes
- automation rules

These features may be implemented later.

---

# Version 1 Completion

DeskPilot Version 1 is complete when:

- the productive browser-session workflow is implemented
- the application is stable
- no critical data-loss bugs are known
- the user can realistically use DeskPilot every day
- development and testing data cannot silently mix with productive user data

Perfection is not required.

Usability is required.
