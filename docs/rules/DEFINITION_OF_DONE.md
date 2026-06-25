# Definition Of Done

This document defines when DeskPilot version 1.0 is considered complete.

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

The application must provide:

- a dedicated desktop window
- touch-friendly controls
- configurable window size
- configurable monitor placement
- system tray integration
- automatic startup with Windows
- persistent window position

The application should not require a normal taskbar entry.

---

# Categories

The user must be able to:

- create categories
- rename categories
- delete categories
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

---

# Sleep Lists

DeskPilot must support:

- inactive tabs
- archived tabs
- sleep lists

The user must:

- review sleeping tabs
- restore sleeping tabs
- permanently delete sleeping tabs

Automatic deletion must provide advance warning.

---

# Bookmarks

The user must be able to:

- create bookmark folders
- move tabs into bookmarks
- organize bookmarks per category

Bookmarks and sessions are separate concepts.

---

# Inbox

DeskPilot must provide:

- a temporary holding area
- "look at this later" functionality

The Inbox should prevent permanent tab accumulation.

---

# Notifications

DeskPilot should warn the user about:

- large categories
- stale tabs
- pending deletions
- review reminders

---

# Touch Display Support

DeskPilot must support:

- small touch displays
- large buttons
- readable text
- touch interaction
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

- all required features are implemented
- the application is stable
- no critical data-loss bugs are known
- the user can realistically use DeskPilot every day

Perfection is not required.

Usability is required.