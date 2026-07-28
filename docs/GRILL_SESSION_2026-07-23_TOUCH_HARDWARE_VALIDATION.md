# Touch Hardware Validation And Windows Integration

- Date: 2026-07-23
- Status: Deferred until representative Windows touch hardware is available
- Parent specification: [Touch Input Isolation](GRILL_SESSION_2026-07-23_TOUCH_INPUT_ISOLATION.md)
- Decision context: [Research #28](https://github.com/mpiechot/DeskPilot/issues/28)

This document owns the parts of the Touch Input Isolation decision that require a real Windows touchscreen, its driver stack, its display mapping and physical reconnect/disconnect behavior. It is intentionally not an implementation backlog yet. The hardware-independent product contracts remain in the parent specification and can be implemented before this document is executed.

## Hardware gate

DeskPilot must not present a setup as isolated merely because the renderer has a Touch layout. A representative hardware setup must pass all core gates:

- the selected display/input setup is actually classified as a touch display;
- an intentional tap triggers exactly one intended DeskPilot action;
- the system cursor remains unchanged;
- the foreground application remains unchanged;
- touch actions do not get lost, duplicated or reordered;
- Windows lock/unlock and reconnect behavior is understood for the setup.

Isolation is all-or-nothing across the unchanged cursor, unchanged foreground focus and exact supported-control action delivery. A failure keeps the Isolation Warning active.

## Supported hardware class

- DeskPilot follows a general Windows-touchscreen path rather than targeting one already-selected display or controller.
- No fixed target hardware exists yet.
- Hardware validation defines a supported class of Windows touchscreen setups instead of certifying only one installation.
- “General Windows-touchscreen support” means supporting any setup that passes the documented capability and isolation test matrix. It does not promise compatibility with every device and driver combination.
- Resolution and display mapping are evaluated separately from cursor/focus isolation.

## Direct-touch topology

- If direct touch attachment passes all isolation gates, DeskPilot uses one host with a Touch Control Surface and a PC Configuration Surface.
- The Touch Control Surface is non-focusable and keyboard-free; the PC Configuration Surface remains focusable and supports configuration workflows.
- If direct attachment fails cursor or focus isolation, the separate touch-device-plus-PC-agent topology becomes the route to isolated operation.
- Cursor save-and-restore is not a product solution.
- The separate runtime is not implemented before the direct-touch path has been tested and failed.

## Setup identity and acceptance evidence

- Automated isolation diagnostics provide evidence but cannot guarantee identical behavior across every Windows, driver, display and connection combination.
- The first implementation ties User-Accepted Touch Setup to the display, touch device and connection topology, including the relevant USB connection.
- A topology change invalidates the acceptance conservatively, even if a later test shows that a port change is behaviorally irrelevant.
- Display, touch-device or connection-topology changes make stored acceptance stale and show the Isolation Warning again.
- User acceptance survives normal DeskPilot restarts and Windows reboots, but it is never presented as an automated diagnostic result.
- The user can rerun the diagnostic or revoke acceptance from the PC Configuration Surface.

## Touch display discovery and mode switching

- DeskPilot does not claim or move to a newly attached touch display merely because Windows reports touch capability.
- If DeskPilot is already running when a touch display is attached, it detects the display, runs the isolation assessment in the background and opens a prompt offering a switch to Touch Mode.
- The prompt states whether the isolation assessment passed or failed. A failed assessment includes the visual Isolation Warning, but the user may still choose to move DeskPilot there.
- If DeskPilot starts after a touch display is already attached and the assessment passes, DeskPilot starts in Touch Mode on that display.
- If the assessment fails, DeskPilot starts on the normal display and shows the equivalent prompt and warning instead of moving automatically.
- If multiple possible touch displays are present at startup, the prompt provides a display selector.
- With no attached touch display, DeskPilot remains in its normal mouse-oriented presentation.
- Dismissing the switch prompt keeps DeskPilot on its current display and does not reopen the prompt during that session.
- Settings can reopen the same prompt through `Touch display verwenden`.
- If no touch display is attached, that control shows a short error Toast instead of opening a prompt.
- If the active touch display is disconnected while DeskPilot is in Touch Mode, DeskPilot exits Touch Mode, moves to the last used normal display and shows an informational Toast.
- Settings provides `Normales Display verwenden` while the touch display remains connected.
- A deliberate return to the normal display is remembered across restarts while the selected touch display remains connected.
- The remembered display preference is independent from diagnostic and User-Accepted Touch Setup status.
- A known display with an explicit normal-display preference does not auto-enter Touch Mode or reopen repeated prompts.
- A newly detected, previously unknown touch display triggers the discovery prompt once even when the normal display is preferred.

## Windows lock state

- DeskPilot does not execute Touch Control Surface actions while Windows is at the lock screen.
- DeskPilot resumes normal interaction after Windows is unlocked.

## Separate-device fallback

The fallback remains conditional on a failed direct-touch gate and is not part of the pre-hardware implementation tranche:

- A future separate touch device must explicitly pair and authenticate with the DeskPilot PC agent before it may execute any action.
- The PC agent remains the source of truth for DeskPilot data and action execution.
- A disconnected paired device may show cached labels and icons read-only, but all actions are disabled and none are queued locally.
- The MVP needs only pairing status, explicit pair, revoke and pair again.
- DeskPilot does not need a general device manager, fleet view or multi-device administration surface.
- The MVP supports one active paired remote touch client.
- Other locally connected input devices are not remote touch clients and do not count against that limit.

## Hardware validation deliverable

Before this specification becomes implementation work, record for each representative setup:

- Windows version, display model, touch controller and driver versions;
- display mapping and connection topology;
- cursor position before and after a test tap;
- foreground window before and after a test tap;
- exact action delivery result, including duplicate/lost/reordered input;
- lock/unlock behavior;
- reconnect behavior and whether the stored acceptance becomes stale.
