# Grill Session: Touch Input Isolation

- Date: 2026-07-23
- Status: Complete for the direct-touch MVP scope; fallback topics remain deferred
- Decision context: [Research #28](https://github.com/mpiechot/DeskPilot/issues/28)
- Related shell session: [Pilot Shell And Themes](GRILL_SESSION_2026-07-22_PILOT_SHELL_AND_THEMES.md)

This document is the source of truth for the direct-touch MVP decisions from the touchscreen Grill session. Research #28 is retained only as decision context; its former research alternatives are not part of the working PR result.

## Confirmed decisions

### Hard touch requirements

- Touch Input Isolation is a hard product requirement, not an optional hardware enhancement.
- A touch action must leave the system cursor where it was.
- A touch action must preserve the foreground focus of the user's main application.
- Responsive layout handles different available resolutions; resolution is not an isolation-warning condition.
- Display mapping is treated as a separate setup and diagnostic concern, not as a synonym for cursor or focus isolation.

### Compatibility scope

- DeskPilot should follow a general Windows-touchscreen path rather than target one already-selected display or controller.
- No fixed target hardware exists yet.
- Hardware validation must therefore define and test a supported class of Windows touchscreen setups instead of validating only one known installation.
- “General Windows-touchscreen support” means supporting any setup that passes a documented capability and isolation test matrix; it does not promise compatibility with every possible device and driver combination.

### Conditional topology

- If direct touch attachment passes all isolation gates, DeskPilot uses one host with a Touch Control Surface and a PC Configuration Surface.
- The Touch Control Surface is non-focusable and keyboard-free; the PC Configuration Surface remains focusable and supports configuration workflows.
- If direct attachment fails cursor or focus isolation, DeskPilot uses a separate touch device with a local PC agent.
- Cursor save-and-restore is not a product solution.
- The separate touch-device-plus-PC-agent runtime is not implemented before the direct-touch path has been tested and failed.

### Failed isolation behavior

- A failed direct-touch isolation test does not block DeskPilot from being used.
- DeskPilot may remain usable in a compatibility state where cursor and foreground-focus changes are possible.
- That state must show an explicit warning and must not claim Touch Input Isolation compliance.
- The warning is visual only: all DeskPilot functions remain available without restrictions.
- The warning communicates “use at your own risk”; it is not a permission gate or safety lockout.
- The separate touch-device-plus-PC-agent topology remains the route to isolated operation when direct attachment cannot satisfy the gates.
- The warning is persistent and non-modal on the Touch Control Surface and in its status area.
- The warning names each failed isolation gate individually.
- The warning explains the concrete impact of each failed gate, such as possible cursor movement, foreground-focus changes, or unreliable control activation.
- The warning remains visible until a later diagnostic verifies isolation or the user explicitly accepts the tested setup; it does not interrupt every individual action with a dialog.

### User acceptance

- Automated isolation diagnostics provide evidence but cannot guarantee identical behavior across every Windows, driver, display, and connection combination.
- The user may test the direct-touch setup personally and choose “I tested this app and accept this display for future use.”
- DeskPilot stores that explicit User-Accepted Touch Setup and suppresses the warning for the accepted setup.
- User acceptance is distinct from an automated isolation result and is not presented as universal compatibility certification.
- The warning offers the user the acceptance action directly; acceptance is not hidden in a separate administration screen.
- For the first implementation, acceptance is tied to the display, touch device, and connection topology, including the relevant USB connection. A topology change invalidates the acceptance conservatively, even though a port change may later prove behaviorally irrelevant.
- User acceptance survives normal DeskPilot restarts and Windows reboots.
- Display, touch-device, or connection-topology changes make the stored acceptance stale and show the warning again.
- The user can run the diagnostic again or revoke the acceptance from the PC Configuration Surface.

### Workflow allocation

- The Touch Control Surface owns frequent, keyboard-free actions: switching Pilots, choosing Categories, opening Categories or saved Tabs, archiving and restoring with touch-sized confirmations, executing configured actions, showing host/profile/connection status, and opening the PC Configuration Surface.
- The PC Configuration Surface owns infrequent or dialog-dependent work: creating and editing Categories, configuring actions, display settings and diagnostics, backup/import/export/recovery, and extension installation and diagnostics.
- Manual URL saving remains a PC Configuration Surface fallback rather than a daily touch workflow.
- The browser extension remains responsible for capturing the current browser tab or window and choosing its destination Category.

### Action targeting

- A DesktopPilot hotkey targets the application that is in the foreground when the action executes.
- An EnvironmentPilot action targets its configured physical or environmental destination rather than a foreground application.
- The Touch Control Surface shows the relevant target semantics explicitly, including “Current foreground application” for DesktopPilot actions.
- DeskPilot captures the DesktopPilot foreground target when an action starts and rechecks it immediately before execution.
- If the target changed, DeskPilot aborts the action rather than sending input to the new application, and reports the failure with a copyable error detail.
- If Windows rejects input injection into an elevated application, the MVP reports a visible failure with a copyable error detail and does not claim success.
- Detailed user guidance for configuring a hotkey to work with elevated applications is deferred to a later improvement.

### Isolation verification

- An intentional tap on a supported control must trigger exactly one intended DeskPilot action.
- Lost, duplicate, or reordered activations are input-delivery failures.
- Responsive behavior across different resolutions and display mapping are evaluated separately from cursor/focus isolation.
- Isolation is an all-or-nothing status across unchanged cursor, unchanged foreground focus, and exact supported-control action delivery.
- A failure in any one core gate keeps the Isolation Warning active and prevents DeskPilot from presenting the setup as isolated.

### Windows lock state

- DeskPilot does not execute Touch Control Surface actions while Windows is at the lock screen.
- DeskPilot resumes normal interaction after Windows is unlocked.

### Status presentation

- The PC Configuration Surface distinguishes `Diagnostically verified`, `User accepted`, and `Unverified` touch setups.
- The Touch Control Surface shows the corresponding compact status; `Unverified` shows the persistent Isolation Warning.
- User acceptance never gets presented as an automated diagnostic result.

### Separate-device trust boundary

- A future separate touch device must explicitly pair and authenticate with the DeskPilot PC agent before it may execute any action.
- The PC agent remains the source of truth for DeskPilot data and action execution; the touch device does not maintain an independent authoritative database.
- When disconnected, a paired touch device may show cached labels and icons read-only, but all actions are disabled and no action is queued locally.
- The disconnected state is clearly visible to the user.
- The MVP needs only minimal pairing controls: show pairing status, explicitly pair, revoke, and pair again.
- DeskPilot does not need a general device manager, fleet view, or multi-device administration surface for this fallback.
- The MVP supports one active paired remote touch client.
- Other locally connected input devices, such as the XP-Pen graphics tablet, are not remote touch clients and do not count against that limit.

### Touch applicability

- DeskPilot first determines whether the selected display/input setup is a touch display.
- A touch display that passes the isolation gates is a valid isolated setup.
- A touch display that fails the isolation gates remains usable with the visual Isolation Warning.
- A setup that is not a touch display receives no touch-isolation assessment and no touch warning.
- The application remains usable on any display through normal mouse interaction, regardless of touch classification.

### Touch display discovery and mode switching

- DeskPilot does not claim or move to a newly attached touch display merely because Windows reports touch capability.
- If DeskPilot is already running when a touch display is attached, it detects the display, runs the isolation assessment in the background, and opens a prompt offering a switch to Touch Mode.
- That prompt states whether the isolation assessment passed or failed. A failed assessment includes the visual Isolation Warning, but the user may still choose to move DeskPilot there.
- If DeskPilot starts after a touch display is already attached and the assessment passes, DeskPilot starts in Touch Mode on that display.
- If DeskPilot starts with an attached touch display whose assessment fails, DeskPilot starts on the normal display and shows the equivalent prompt and warning instead of moving automatically.
- If multiple possible touch displays are present at startup, the prompt provides a display selector so the user chooses where DeskPilot should move.
- With no attached touch display, DeskPilot starts and remains in its normal mouse-oriented presentation.
- If the user dismisses the switch prompt, DeskPilot stays on its current display and does not repeatedly reopen the prompt during that session.
- `Settings` provides the persistent `Touch display verwenden` control, which reopens the same switch prompt so the user can revisit the choice later.
- If no touch display is attached when the Settings control is used, DeskPilot does not open the prompt and instead shows a short error Toast Message explaining that no touch display is connected.
- If the active touch display is disconnected while DeskPilot is in Touch Mode, DeskPilot exits Touch Mode, moves to the last used normal display, and shows a short informational Toast Message.
- `Settings` provides an explicit `Normales Display verwenden` action while the touch display remains connected; it exits Touch Mode and moves DeskPilot back to the last used normal display.
- A deliberate return to the normal display is remembered across DeskPilot restarts while the selected touch display remains connected.
- The user re-enters Touch Mode explicitly through `Touch display verwenden`.
- The remembered display preference is independent from the diagnostic result and User-Accepted Touch Setup status; leaving Touch Mode does not revoke either one.
- When the same known touch display is reconnected, an explicit normal-display preference suppresses automatic Touch Mode entry and repeated prompts.
- A newly detected, previously unknown touch display triggers the discovery prompt once even when the normal display is currently preferred; the user may decline it.

## Deferred decisions

The following topics are intentionally not required to complete the direct-touch MVP and should be revisited only if the direct path fails or the related feature is implemented:

- Detailed troubleshooting and configuration guidance for elevated DesktopPilot targets.
- Cost, network transport, and client-platform choices for the separate touch-device fallback.
- QR pairing and other concrete fallback enrollment mechanics.
- Fallback implementation timing remains conditional on a failed direct-touch path.

## Resume point

The direct-touch Grill session is complete. Revisit the deferred topics only when implementation evidence or a later product decision requires them.
