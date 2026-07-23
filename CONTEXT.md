# DeskPilot

DeskPilot is a local browser-session control panel. This glossary keeps product language precise while planning the path to productive use.

## Language

**Browser Session**:
A named collection of saved browser URLs that can be restored together as a working context.
_Avoid_: Tab dump, bookmark folder

**Saved Tab**:
A saved browser tab represented by its URL, title, category, and position inside a browser session.
_Avoid_: Bookmark, live tab

**Archived Tab**:
A saved tab deliberately removed from the active Browser Session while remaining recoverable inside its original Category.
_Avoid_: Deleted tab, bookmark, sleeping tab

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

**DeskPilot Shell**:
The product-level application layer that provides responsive navigation, shared presentation, and access to the active Pilot or Settings.
_Avoid_: Plugin host, generic dashboard

**Pilot Navigation**:
The compact responsive shell navigation that exposes Pilots and Settings as icon-only controls at the edge of the available display area.
_Avoid_: Main menu, labeled sidebar, plugin list

**Pilot**:
A named DeskPilot product area with its own user-facing purpose and view, reached through the DeskPilot Shell.
_Avoid_: Plugin, arbitrary action group, page

**Pilot Presentation Contract**:
The minimum user-facing contract every Pilot keeps inside the DeskPilot Shell: it responds to the available space, does not own global navigation, shows its name at the upper-left of its available content area, and can report errors or other transient states as Toast Messages. Error Toast Messages additionally offer a Copy-to-Clipboard action.
_Avoid_: Shared Pilot implementation, generic page template

**Toast Message**:
A transient user-facing message used by a Pilot to report an error or other state without replacing the Pilot's main content. Error Toast Messages include a Copy-to-Clipboard action. If a condition requires user action, the Pilot may additionally show a persistent state in its content area.
_Avoid_: Dialog, inline validation, permanent status panel

**BrowserPilot**:
The Pilot that owns the complete existing browser-session workflow, including Categories, the Session Board, saved tabs, archive/recovery, browser capture, restore, and related safety functions.
_Avoid_: Session view, browser extension, temporary MVP module

**DesktopPilot**:
A planned Pilot for user-defined hotkeys intended for general desktop use.
_Avoid_: Generic Windows automation, SystemPilot

**EnvironmentPilot**:
A planned Pilot for user-defined hotkeys that control the user's physical or environmental desk setup, such as lighting or desk height.
_Avoid_: DesktopPilot, device plugin

**Touch Input Isolation**:
The product requirement that a DeskPilot touch action leaves the system cursor where it was and preserves the foreground focus of the user's main application. These are hard requirements for any touch configuration that claims isolation compliance. Responsive layout handles different available resolutions; display mapping is a separate setup concern. A configuration that fails the isolation tests may remain usable in an explicitly warned compatibility state, but DeskPilot must not claim that it is isolated. General Windows-touchscreen support means supporting setups that pass a documented capability and isolation test matrix, not promising compatibility with every possible device and driver combination.
_Avoid_: Display resolution, responsive layout, cursor restoration

**Touch Mode**:
The DeskPilot operating state in which the application is shown on a user-selected attached touch display and uses the touch-oriented Control Surface. The presence of a touch display alone does not move DeskPilot or claim the display for the application.
_Avoid_: Automatic display takeover, kiosk mode, touch detection

**Attached Touch Display**:
A display that Windows reports as capable of touch input and that DeskPilot can assess for Touch Input Isolation. DeskPilot discovers it as a possible destination, but the user controls whether DeskPilot moves there when the application is already running.
_Avoid_: Any newly connected monitor, automatically claimed display

**Isolation Warning**:
A persistent, non-modal visual warning for a direct-touch configuration that has not passed all isolation gates or has not been accepted by the user after testing. It names each failed gate and explains its concrete impact, such as possible cursor movement, foreground-focus changes, or unreliable control activation. It does not disable or restrict any DeskPilot function; it communicates that use is at the user's own risk.
_Avoid_: Generic unsupported-device banner, blocking error dialog, permission gate

**User-Accepted Touch Setup**:
A direct-touch display and connection that the user has tested personally and explicitly accepted for future use. This suppresses the Isolation Warning for the accepted setup but remains distinct from an automated isolation result and does not create a universal compatibility guarantee.
_Avoid_: Automatically verified device, universal support certification, permanent waiver

**Foreground Target**:
The application that is active on the user's main desktop when a DesktopPilot action executes. DesktopPilot actions target this application by default, capture it at action start, and execute only if it is still the same target immediately before execution; EnvironmentPilot actions target their configured physical or environmental destination instead.
_Avoid_: Selected Pilot, configured window title, touch display

**Touch Control Surface**:
The touch-oriented DeskPilot surface for frequent, keyboard-free actions such as switching Pilots, choosing Categories, opening saved browser Sessions, executing configured actions, and viewing host/profile status.
_Avoid_: Full configuration screen, generic touchscreen mirror

**PC Configuration Surface**:
The keyboard- and dialog-capable DeskPilot surface for infrequent configuration and safety work such as editing Categories, managing actions, selecting display preferences, installing extensions, and performing backup or recovery operations.
_Avoid_: Touch dashboard, second source of truth

**Settings**:
The shell-level area that uses the same main content region as a Pilot and contains product-wide configuration, with optional sections for individual Pilots. The first Settings surface contains the existing Display and Safety functions moved out of the BrowserPilot context, plus Theme selection and the control for choosing and using an attached touch display. It does not duplicate those functions inside BrowserPilot.
_Avoid_: Settings Pilot, hidden preferences, BrowserPilot configuration

**Theme**:
A complete declarative presentation definition for DeskPilot, covering visual tokens, backgrounds, typography, navigation styling, assets, component states, and optional animation and sound behavior. Themes are sparse overlays: omitted values inherit from the Default Theme, while an explicit disabled/off value suppresses an inherited optional effect. Themes may later be layered on other Themes.
_Avoid_: Color scheme, CSS skin, plugin

**Default Theme**:
The complete fallback Theme that represents the current DeskPilot appearance. Other Themes override only explicitly defined presentation values; every missing value, including animations and sounds, inherits from the Default Theme. An empty Theme therefore behaves exactly like the Default Theme. The Default Theme intentionally defines no animation or sound behavior for the current product.
_Avoid_: Browser default, incomplete base theme
