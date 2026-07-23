# Grill Session: Pilot Shell And Themes

- Date: 2026-07-22
- Last updated: 2026-07-23
- Status: Complete for the shell and theme scope; touch decisions continue in a separate Grill session
- Decision context: [#28](https://github.com/mpiechot/DeskPilot/issues/28), [#29](https://github.com/mpiechot/DeskPilot/issues/29)
- Resulting implementation issues: [#31](https://github.com/mpiechot/DeskPilot/issues/31), [#32](https://github.com/mpiechot/DeskPilot/issues/32), [#33](https://github.com/mpiechot/DeskPilot/issues/33), [#34](https://github.com/mpiechot/DeskPilot/issues/34)
- Working PR: [#30](https://github.com/mpiechot/DeskPilot/pull/30)

This document is the decision record for the shell and theme Grill session. The confirmed decisions in this document, together with the separate touch-input Grill session, are the source of truth for the working PR. The former research alternatives are intentionally not part of the PR result.

## Confirmed decisions

### Product shape

- DeskPilot should grow toward its intended product size: a shell with several named Pilots.
- `BrowserPilot` is the complete existing DeskPilot browser-session product, not a temporary MVP view. All current browser behavior belongs inside it.
- The first visible Pilot set is `BrowserPilot`, `DesktopPilot`, and `EnvironmentPilot`.
- `DesktopPilot` is for user-defined hotkeys for general digital desktop and application use.
- `EnvironmentPilot` is for user-defined hotkeys for physical or environmental controls such as lighting and desk height.
- `DesktopPilot` and `EnvironmentPilot` may share a technical hotkey foundation, but `HotkeyPilot` is not a user-facing Pilot.

### MVP shell

- The MVP introduces the Pilot Navigation and makes all three Pilots reachable.
- `BrowserPilot` is fully functional through the new shell and retains its current internal structure initially.
- `DesktopPilot` and `EnvironmentPilot` are navigable empty states with a friendly, lightly humorous message about the new Pilot being built.
- `Settings` is a shell-level area, not a Pilot. It uses the same main content region as a Pilot and may contain sections for individual Pilots.

### Responsive navigation

- DeskPilot should respond to the available window shape rather than use one fixed navigation placement.
- A very wide, low display uses a compact, scrollable vertical navigation rail on the left.
- A small normal display uses a compact horizontal navigation arrangement.
- Pilot Navigation is icon-only and stays small at the edge of the display.
- Settings is separated from the Pilot group: anchored at the bottom of a vertical rail or separated at the right edge of a horizontal layout.
- The responsive layout choice should be automatic from available space.
- Pilot Navigation uses a fixed built-in set of semantic icon identifiers for BrowserPilot, DesktopPilot, EnvironmentPilot, and Settings.
- Themes may change icon colors, states, or later provide alternative icon assets, but users do not customize navigation icons in this MVP.

### Themes

- The current appearance is translated into a declarative `Default Theme`.
- No second visual theme needs to be created for this MVP.
- Settings already exposes theme selection, even while only the Default Theme exists.
- A Theme covers the complete presentation layer: colors, backgrounds, typography, navigation appearance, assets, component states, optional animations, and optional sounds.
- Theme presentation must not determine responsive geometry; it styles the shell and its states while the shell remains responsive independently.
- Themes are declarative and must not contain theme-specific React code or executable plugins.
- The Default Theme is complete and is the fallback for all other Themes.
- A later Theme overrides only values it explicitly defines. Every missing value inherits from the Default Theme, including animations and sounds.
- An empty Theme behaves exactly like the Default Theme.
- A Theme explicitly disables an inherited animation or sound with an `off` or `disabled` value; omission always means inheritance.
- The Default Theme intentionally defines no animation or sound behavior for the current product.
- Theme-on-Theme inheritance is a later extensibility direction and is not required for the MVP.

### Migration and generalization

- The first shell step encapsulates the existing BrowserPilot without changing its proven behavior or data ownership.
- Generalization of shared concepts is a deliberate follow-up after another Pilot exists for comparison.
- The project should not invent broad abstractions before there is a real second Pilot that needs them.

### Pilot presentation contract

- Every Pilot responds to the available space.
- A Pilot does not own global navigation.
- A Pilot displays its name in the upper-left of its available content area.
- A Pilot can report errors and other transient states as Toast Messages.
- Error Toast Messages include a Copy-to-Clipboard action.
- Toast Messages are transient notifications and do not replace the Pilot's main content.
- A Pilot may additionally show a persistent in-content state when the condition requires user action.

### First Settings surface

- The first shell-level Settings surface contains Theme selection, Display settings, and Safety settings.
- Display settings and Safety settings are the existing functions currently exposed in the BrowserPilot context; shell extraction moves them to Settings instead of duplicating them.
- Safety settings include the active data profile and backup/recovery functions.
- Extension status and browser-bridge setup remain BrowserPilot-specific for now.
- The update indicator remains shell-level behavior but is not a configurable Setting.

### BrowserPilot internal navigation

- BrowserPilot keeps its existing internal navigation after shell extraction.
- The MVP keeps `Session`, `Categories`, `Archive`, `Recovery`, and `Extension` inside BrowserPilot.
- `Display` and `Safety` leave the BrowserPilot navigation because they belong to shell-level Settings.

## Open questions

There are no remaining open questions in the shell and theme scope. Touch-input questions continue in `docs/GRILL_SESSION_2026-07-23_TOUCH_INPUT_ISOLATION.md`.

## Resume point

Shell and theme decisions are complete. Continue touch-input decisions in the separate session document.

## Ticket outcome

The shell and theme result is represented by implementation issues #31–#34: shell extraction and BrowserPilot preservation, Pilot empty states, shell-level Settings, and the declarative Default Theme foundation. Issue #31 is the next implementation slice; the later issues remain dependent on it. The former research alternatives and unresolved proposals are not implementation scope for this PR.
