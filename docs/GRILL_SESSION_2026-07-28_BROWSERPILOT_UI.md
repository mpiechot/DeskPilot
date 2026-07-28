# Grill Session: BrowserPilot UI Information Density

## Status

Decision-complete for the current scope. This document records the confirmed BrowserPilot UI decisions and is the source for the follow-up implementation tickets derived after the session.

## Confirmed decisions

### Compact Category Card

The compact Category Card shows only:

- Category icon;
- Category name;
- selected state;
- an icon-only `Open` action;
- an icon-only `Details` action;
- a dedicated Category Reorder Handle for changing Category order.

The compact card does not show the saved-tab count or the saved-tab list.

Compact Category Cards are arranged in a responsive grid that can occupy multiple rows. The Category Creation Shell is the final grid item. The Category Reorder Handle is a distinct gesture target from grid scrolling; ordinary card selection and the explicit `Open` action must remain unambiguous.

`Open` is the primary Category Card action and uses the Theme's accent treatment. `Details` is a secondary icon-only action using the Category panel's neutral/subtle surface so the primary action remains visually dominant. Both actions have accessible names and tooltips; the exact Theme colors are not inferred from annotated reference-image colors.

The visible controls contain icons only: no button text, emoji or decorative placeholder glyphs. The semantic glyph selection belongs to the shared icon-system decision in #47; this UI Grill fixes the action roles and visual hierarchy.

### Category Card Interaction

Clicking the Category Card selects the Category. It does not open the browser Session or the Details view. `Open` remains an explicit action for restoring the browser Session, and `Details` is a separate explicit action for entering the secondary Category surface.

### Touch Presentation

The `Open` action must remain easy to target with a mouse in Standard layout and receive larger hit targets and more generous spacing in Touch Mode. The Grill does not introduce separate action semantics for Touch Mode.

Touch Mode is the same BrowserPilot with touch-oriented sizing, spacing and interaction geometry. Its activation remains a Settings/display concern, potentially including a prompt when a suitable attached display is detected. BrowserPilot keeps the same responsibilities and available functions in both Standard and Touch Mode.

### Details Surface

The first Details surface is an in-app Category Details View inside the existing DeskPilot window. It has explicit navigation back to the compact Category overview and does not introduce a second native window or a second source of truth.

The Category Details View is the complete work area for the selected Category. It owns the Category header and description, the active Saved Tab list, Category-specific open/archive/remove/reorder/move actions and Category editing. The compact overview remains an orientation and entry surface rather than a second copy of those controls. The desktop UI does not provide a manual `Save URL` form; new Saved Tabs enter through the Browser Extension's current-tab or current-window capture workflows.

### Pilot Top Navigation and BrowserPilot Settings

The BrowserPilot overview does not keep the existing Control Rail as a primary area. A narrow Pilot Top Navigation keeps the BrowserPilot title, Bridge status and a small BrowserPilot Settings button visible. The BrowserPilot Settings button opens the BrowserPilot-owned secondary view for the infrequent BrowserPilot controls moved out of the former expandable Control Rail.

The BrowserPilot Settings button opens one in-app BrowserPilot Settings View with internal sections rather than separate settings windows. The Bridge Status Indicator is clickable and opens that view at its Extension Details section or subview. `Ready` uses a green status icon when the local Bridge is running. `Unavailable` uses a red status icon when the Bridge cannot be used. The current app cannot detect whether the browser has actually loaded or enabled the Extension, so no yellow `Setup needed` status is invented for the Top Navigation. A missing local Extension manifest is shown as detailed `Extension Setup Status` in BrowserPilot Settings. Host, port, manifest path and exact error details remain there; the normal installed UI does not expose the development-only `Electron app required` fallback.

The BrowserPilot Settings View is the home for infrequent BrowserPilot-wide controls moved out of the former expandable Control Rail. Category-specific work remains in Category Details; BrowserPilot-wide Recovery and Archived Tab Cleanup remain in BrowserPilot Settings.

### Category Creation Shell

The Session Board always includes a hollow Category Creation Shell at the Category-card size. Its plus action starts a new Category draft and takes the user directly to the Category Creation View so the Category name, icon and other identity/configuration can be completed there.

The plus action instead opens a dedicated Category Creation View with an unsaved draft. The Creation View is not the Category Details View: it commits a new Category, while the Details View edits an already existing Category. The two views may reuse form controls and visual primitives.

The Category Creation View contains a required Category name, an optional icon with the Folder icon as default and an optional description. It does not contain Saved Tabs or administrative actions. `Create Category` commits the new Category and navigates to its Category Details View; `Cancel` discards the draft without creating an empty Category.

When no active Categories remain, the compact overview continues to show the Category Creation Shell as the only grid item. A short Category Creation Callout points toward the Shell with a responsive visual arrow/pointer and says how to get started. It is not a blocking empty state and does not create another action path.

The Category Creation Callout remains focused on creating a new Category even when BrowserPilot Recovery has recoverable Categories available. Recovery stays reachable through BrowserPilot Settings and does not add a second action to the empty overview.

### Category Reordering

Dragging a Category Reorder Handle within the responsive Category grid shows a Category Reorder Preview with the provisional insertion position. The Category order is committed and persisted only on a successful drag release. Pointer cancellation, leaving the valid drop target or another aborted drag leaves the previous order unchanged.

### Saved Tab Movement in Details

The Category Details View keeps Saved Tab reordering with a visible insertion preview and release-based persistence. Moving a Saved Tab to another Category uses an explicit `Move to…` action with a Category choice instead of relying on a drag out of the current Details surface.

### Archive and Archived Tab Cleanup

The normal Archive view remains inside Category Details for the selected Category. It provides returning an Archived Tab to the active Session and the existing explicit permanent-delete action. BrowserPilot Settings additionally provides an `Archived Tab Cleanup` action that permanently deletes all Archived Tabs. The cleanup action always opens a clear confirmation popup before making the irreversible bulk change.

Archive and recovery entry points remain stable even when their lists are empty. They are disabled and explain why no action is available; no fake items or misleading active controls are shown. `Archived Tab Cleanup` follows the same rule and remains visible but disabled when no Archived Tabs exist.

Disabled BrowserPilot actions communicate their reason with visible helper text or a tooltip-capable wrapper that works for mouse and Touch Mode. Disabled appearance alone is not treated as sufficient explanation.

### Recovery Boundary

`Category Recovery` remains inside the Category Details View and shows only recoverable Saved Tabs removed from that selected Category. `BrowserPilot Recovery` belongs in BrowserPilot Settings and restores removed Categories together with their associated recoverable data. When no recovery candidates exist, the stable recovery entry remains visible but disabled with a clear empty state.

### Category Editing and Unsaved Changes

Editing an existing Category uses an explicit draft with `Save` and `Cancel`, matching the Category Creation View. Fields that differ from the committed Category data receive a visible unsaved-change indication, and the page exposes a clear `Unsaved changes` state in addition to the field-level cues. The indication must not rely on color alone and must remain understandable in Touch Mode and reduced-contrast conditions.

Leaving a Category Creation View or Category Details View with unsaved changes requires an explicit choice: `Save and leave`, `Discard changes and leave` or `Keep editing`. The application does not silently discard or autosave Category identity changes.

### Category Removal

`Remove Category` remains an explicitly marked destructive action in the Category Details View. Confirmation names the Category and explains that its Category and Saved Tabs move through the existing recoverable soft-delete flow. After confirmation, BrowserPilot returns to the compact overview; no user data is silently or permanently deleted.

## Non-regression constraints

- BrowserPilot remains the owner of Categories, Saved Tabs, Archive, Recovery and browser capture/restore behavior.
- Existing local-first storage, soft-delete and recovery guarantees remain unchanged.
- This Grill session decides information architecture and interaction boundaries; it does not implement the UI.
- The global DeskPilot Settings screen, including Themes and other global settings, remains outside this Grill. Only the BrowserPilot Settings view reached from the BrowserPilot Top Navigation is in scope.
- Colors used to annotate reference images are not product color decisions and must not be inferred as Theme or status semantics.
