# Grill Session: Pilot Shell And Themes

- Date: 2026-07-22
- Last updated: 2026-07-23
- Status: Paused; ready to resume at the next open question
- Related tickets: [#28](https://github.com/mpiechot/DeskPilot/issues/28), [#29](https://github.com/mpiechot/DeskPilot/issues/29)
- Working PR under review: [#30](https://github.com/mpiechot/DeskPilot/pull/30)

This document records the decisions made during the Grill session outside the GitHub tickets. The previous PR direction is not treated as accepted; the research tickets and PR will be rewritten after the session reaches shared understanding.

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
- A later Theme overrides only values it explicitly defines. Missing values inherit from the Default Theme.
- If a later Theme does not define an animation or sound, that behavior does not happen.

### Migration and generalization

- The first shell step encapsulates the existing BrowserPilot without changing its proven behavior or data ownership.
- Generalization of shared concepts is a deliberate follow-up after another Pilot exists for comparison.
- The project should not invent broad abstractions before there is a real second Pilot that needs them.

## Open questions

Questions are asked one at a time during the live session and moved to the confirmed section once resolved.

1. What exact visual and interaction contract must every Pilot satisfy inside the shell?
2. Which current global settings belong in the first Settings screen, and which Pilot-specific sections are needed immediately?
3. How much of the current BrowserPilot internal navigation should remain visible after shell extraction?
4. What is the minimum declarative Theme contract for tokens, assets, states, animations, and sounds?
5. Which decisions from Research #28 about touch input remain product requirements versus later hardware validation?

## Resume point

Continue with open question 1: define the minimum visual and interaction contract that every Pilot must satisfy inside the DeskPilot Shell.

## Ticket outcome

When the Grill session is complete, update Research #28 and #29 with their separate results. Derive implementation tickets only from confirmed decisions, separating shell extraction, responsive navigation, Default Theme translation, Settings, Pilot empty states, and later Pilot-specific behavior into small vertical slices.
