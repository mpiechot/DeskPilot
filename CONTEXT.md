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

**Archived Tab Cleanup**:
An explicitly confirmed BrowserPilot Settings action that permanently deletes all Archived Tabs in one operation. It remains a stable, disabled action when no Archived Tabs exist. It is distinct from returning an Archived Tab to a Session and from recoverable soft-delete flows.
_Avoid_: Archive, empty archive view, bulk soft-delete

**Category Recovery**:
The stable recovery surface inside a Category Details View for Saved Tabs that were removed from that Category through the recoverable soft-delete flow. It remains visible but disabled with an explanatory empty state when no such Saved Tabs exist. It does not restore whole Categories.
_Avoid_: BrowserPilot Recovery, Archive, global recovery

**BrowserPilot Recovery**:
The stable BrowserPilot Settings surface for restoring removed Categories together with their associated recoverable data. It remains visible but disabled with an explanatory empty state when no removed Categories can be restored.
_Avoid_: Category Recovery, Archive, database recovery

**Disabled BrowserPilot Action**:
A stable BrowserPilot control that remains present when its action is unavailable and explains the unavailable condition through accessible helper text or a tooltip-capable wrapper. Disabled appearance alone is not sufficient communication.
_Avoid_: Hidden action, unexplained disabled control, color-only state

**Category**:
A user-facing container for one browser session, such as Work, Research, Entertainment, Projects, or Later / Inbox.
_Avoid_: Folder, workspace, project

**Tab Order**:
The user-defined order of saved tabs within a category, used when restoring that category as a browser session.
_Avoid_: Sort order, save time order

**Session Board**:
The BrowserPilot overview and Category Details workflow where a responsive Category grid provides Category selection, ordering and entry into Category work areas, while Category Details supports Saved Tab organization.
_Avoid_: Sidebar list, extension popup, horizontal card strip

**Category Card Summary**:
The compact identity shown on a Session Board category card: the Category icon, name, selected state, icon-only `Open` and `Details` actions, and Category Reorder Handle. It deliberately does not include the saved-tab list or a tab count.
_Avoid_: Readiness badge, save-state indicator, live-tab count

**Category Card Action Hierarchy**:
The compact visual distinction between Category Card actions: `Open` is the primary action with the Theme's accent treatment, while `Details` is a secondary icon-only action using the Category panel's neutral/subtle surface. Both actions retain accessible names and discoverable tooltips.
_Avoid_: Text button pair, color-only meaning, hidden card gesture

**Category Reorder Handle**:
A dedicated drag target used to change the order of Categories in the responsive Category grid. It is distinct from grid scrolling and must not make an ordinary Category selection or open action ambiguous.
_Avoid_: Category drag surface, pan handle, tab drag handle

**Category Reorder Preview**:
The visible provisional insertion marker shown while a Category is being dragged. It communicates where the Category will be inserted; the new order is committed only when the drag is released successfully.
_Avoid_: Selection highlight, permanent placeholder, board scroll indicator

**Category Details View**:
An in-app BrowserPilot surface for the selected Category's full information and less-frequent actions. It is a secondary view inside the existing DeskPilot window, not a second source of truth or a separate native window by default.
_Avoid_: Separate Category window, modal details popup, second BrowserPilot

**Pilot Top Navigation**:
A narrow BrowserPilot header that keeps the current Pilot title, essential connection/status information and the BrowserPilot Settings entry visible without occupying the Category overview or a Category Details View. The global DeskPilot Settings entry remains a separate shell concern. The Bridge status is also an entry to BrowserPilot extension diagnostics.
_Avoid_: Control rail, sidebar, global action drawer

**Extension Details View**:
An in-app BrowserPilot Settings section or subview for browser-extension installation guidance, manifest state, supported-browser information and Bridge diagnostics. It is reached from the compact Bridge status in Pilot Top Navigation and does not become part of the Category overview.
_Avoid_: Extension control rail, Bridge popup, browser extension UI

**Bridge Status Indicator**:
A compact BrowserPilot Top Navigation status consisting of a semantic label and status icon. `Ready` means the local Bridge is running; `Unavailable` means the Bridge cannot be used. Extension package/setup diagnostics are shown in BrowserPilot Settings because the desktop app cannot currently detect whether a browser has loaded the Extension.
_Avoid_: Host/port diagnostic, Electron app required, raw connection badge, inferred Extension heartbeat

**Extension Setup Status**:
A detailed BrowserPilot Settings status for the locally available Extension package, including whether its manifest exists at the expected path. It is not a claim that the browser has loaded or enabled the Extension.
_Avoid_: Bridge Status Indicator, installed Extension guarantee, browser heartbeat

**BrowserPilot Settings**:
The BrowserPilot-owned secondary view reached from the BrowserPilot Settings button in Pilot Top Navigation. It contains the infrequent BrowserPilot controls moved out of the former expandable Control Rail; it is distinct from the global DeskPilot Settings view.
_Avoid_: Global Settings, shell Settings, Control Rail

**Category Creation Shell**:
A hollow Session Board slot rendered at the same size as a Category Card. Its plus action starts creation of a new Category and routes directly to the Category Details View for completing its identity and configuration.
_Avoid_: Empty Category Card, placeholder Category, add-category button

**Category Creation Callout**:
A short empty-overview hint that points visually to the Category Creation Shell when no active Categories exist. It explains the next action without becoming another Category control or a blocking empty state.
_Avoid_: Empty Category error, onboarding wizard, disabled overview

**Category Creation View**:
A dedicated in-app BrowserPilot surface for creating a new Category from an unsaved draft. It is distinct from the Category Details View even when both reuse the same form controls; the Creation View commits a new Category, while the Details View edits an existing one.
_Avoid_: New Category Details View, empty Category page, add-category modal

**Unsaved Changes**:
A visible editing state in a Category Creation View or Category Details View indicating that the current form differs from the last committed Category data. It requires an explicit Save or Cancel outcome before the draft is treated as settled.
_Avoid_: Autosave pending, temporary value, dirty form without user-facing state

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

**DeskPilot-Rahmen (DeskPilot Shell)**:
The fixed outer DeskPilot application layer that provides responsive navigation, shared presentation, global Settings access and access to the active Pilot or Settings. It is visually distinct from the active Pilot surface.
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
A DeskPilot Pilot destination for user-defined hotkeys intended for general desktop use. Its current surface is an explicit development empty state; hotkey functionality is not yet implemented.
_Avoid_: Generic Windows automation, SystemPilot

**EnvironmentPilot**:
A DeskPilot Pilot destination for user-defined hotkeys that control the user's physical or environmental desk setup, such as lighting or desk height. Its current surface is an explicit development empty state; device-control functionality is not yet implemented.
_Avoid_: DesktopPilot, device plugin

**Touch Input Isolation**:
The product requirement that a DeskPilot touch action leaves the system cursor where it was and preserves the foreground focus of the user's main application. These are hard requirements for any touch configuration that claims isolation compliance. Responsive layout handles different available resolutions; display mapping is a separate setup concern. A configuration that fails the isolation tests may remain usable in an explicitly warned compatibility state, but DeskPilot must not claim that it is isolated. General Windows-touchscreen support means supporting setups that pass a documented capability and isolation test matrix, not promising compatibility with every possible device and driver combination.
_Avoid_: Display resolution, responsive layout, cursor restoration

**Touch Mode**:
The DeskPilot operating state in which the application is shown on a user-selected attached touch display with touch-oriented sizing, spacing and interaction geometry. Touch Mode keeps the same Pilot responsibilities and user-facing functions as Standard layout; it does not create a different BrowserPilot. The presence of a touch display alone does not move DeskPilot or claim the display for the application.
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

**DeskPilot Product Mark**:
The visual identity of the complete DeskPilot product across the application, Windows tray, installer, shortcuts, extension branding and large-format presentation. It is distinct from semantic Category, Pilot and action icons and is defined by its own identity decision.
_Avoid_: BrowserPilot icon, Category icon, action icon, Theme decoration

**Roman Theme Direction**:
A purely visual Theme direction for the existing DeskPilot product, using classical Roman material and form language such as stone, bronze, parchment, laurel and restrained engraving. Its visual vocabulary is primarily civic and architectural—arches, plaques, laurel and inscriptions—with military or gladiator motifs limited to rare accents. Its palette is grounded in dark warm red-brown and charcoal, with aged ivory work surfaces and muted bronze accents; the mood is dignified and calm. DeskPilot frames and panels use material cues such as restrained relief, inset lines, stone-like layering or bronze edging, not color changes alone, and may use moderate chamfered plaque-like geometry rather than strongly rounded cards. The DeskPilot Shell keeps the strongest Roman identity as a stable frame, including its unchanged navigation and global Settings boundary, while each Pilot surface remains calmer and task-focused so Shell and Pilot UI are visibly distinct. Classical serif typography is limited to branding and large headings; functional content uses a neutral sans-serif. Existing functional icons retain their clear semantic forms while receiving Roman visual treatment; Roman motifs remain decorative or limited to brand and frame assets. Theme-specific state colors may be adapted to the Roman palette, but state meaning must remain clear through role, contrast, text, icon and border—not color or ornament alone. Accessibility and focus visibility remain first-class constraints. The initial direction is silent and mostly still, with only restrained functional transitions and reduced-motion support. The Theme must control the complete presentation through a shared declarative token and asset vocabulary; no Theme may add React components, feature code, navigation behavior or workflow semantics. Gladiator references are limited to subtle accents; the direction does not introduce arena, combat, progression, scoring or other game semantics.
_Avoid_: Game UI, fantasy quest system, military dashboard, decorative theme-specific workflow
