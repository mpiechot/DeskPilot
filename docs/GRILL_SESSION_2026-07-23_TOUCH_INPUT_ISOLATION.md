# Grill Session: Touch Input Isolation — Product And Implementation Scope

- Date: 2026-07-23
- Status: Ready for hardware-independent implementation; hardware validation is separated
- Decision context: [Research #28](https://github.com/mpiechot/DeskPilot/issues/28)
- Related shell session: [Pilot Shell And Themes](GRILL_SESSION_2026-07-22_PILOT_SHELL_AND_THEMES.md)

This document is the source of truth for the hardware-independent product contracts from the touchscreen Grill session. It can be implemented with mouse-driven development workflows and simulated diagnostic results, but it must never claim that a real setup is Touch Input Isolation compliant without the validation described in [Touch Hardware Validation And Windows Integration](GRILL_SESSION_2026-07-23_TOUCH_HARDWARE_VALIDATION.md).

## Confirmed decisions

### Hard touch requirements

- Touch Input Isolation is a hard product requirement, not an optional hardware enhancement.
- A touch action must leave the system cursor where it was.
- A touch action must preserve the foreground focus of the user's main application.
- Responsive layout handles different available resolutions; resolution is not an isolation-warning condition.
- Display mapping is treated as a separate setup and diagnostic concern, not as a synonym for cursor or focus isolation.

### Hardware boundary

- The product contract requires unchanged cursor, unchanged foreground focus and exact supported-control action delivery.
- The actual Windows touchscreen classification, hardware capability matrix, display mapping and isolation evidence are hardware-gated and live in [Touch Hardware Validation And Windows Integration](GRILL_SESSION_2026-07-23_TOUCH_HARDWARE_VALIDATION.md).
- Before hardware exists, implementation may build the state model, UI, workflow routing, warning/acceptance presentation and diagnostic adapter contract with simulated results.
- No development or simulated result may be shown as `Diagnostically verified` for a real setup.

### Conditional topology boundary

- The intended direct-touch topology is one host with a Touch Control Surface and a PC Configuration Surface.
- The Touch Control Surface is non-focusable and keyboard-free; the PC Configuration Surface remains focusable and supports configuration workflows.
- Whether direct attachment is accepted, rejected or routed to a separate touch device is a hardware decision documented separately.

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
- The stored acceptance is a product state distinct from automated diagnostics; its hardware identity and topology fingerprint are defined in the separate hardware specification.
- User acceptance must survive normal DeskPilot restarts and Windows reboots once a hardware identity is available.
- The user can run the diagnostic again or revoke acceptance from the PC Configuration Surface.

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

### Status presentation

- The PC Configuration Surface distinguishes `Diagnostically verified`, `User accepted`, and `Unverified` touch setups.
- The Touch Control Surface shows the corresponding compact status; `Unverified` shows the persistent Isolation Warning.
- User acceptance never gets presented as an automated diagnostic result.

### Hardware-dependent behavior

Touch classification, setup identity, hardware diagnostics, lock-state verification and display discovery/mode switching are specified separately in [Touch Hardware Validation And Windows Integration](GRILL_SESSION_2026-07-23_TOUCH_HARDWARE_VALIDATION.md).

## Deferred decisions

The following topics are intentionally not required to complete the direct-touch MVP and should be revisited only if the direct path fails or the related feature is implemented:

- Detailed troubleshooting and configuration guidance for elevated DesktopPilot targets.
- Cost, network transport, and client-platform choices for the separate touch-device fallback.
- QR pairing and other concrete fallback enrollment mechanics.
- Fallback implementation timing remains conditional on a failed direct-touch path.

## Implementation frontier

The pre-hardware implementation frontier ends after the product state, surface boundary, workflow routing, warning/acceptance UI and diagnostic adapter contract exist. The next ticket after that frontier must wait for representative hardware and the validation record in the separate specification.

## Resume point

Derive hardware-independent implementation tickets from this document. Revisit the hardware specification when representative hardware is available or when a diagnostic adapter needs to be connected to real Windows behavior.
