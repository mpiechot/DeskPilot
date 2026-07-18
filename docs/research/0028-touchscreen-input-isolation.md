# Research 0028: Touchscreen Input Isolation And Keyboard-Free Workflows

- GitHub ticket: [#28](https://github.com/mpiechot/DeskPilot/issues/28)
- Status: Research complete; target-hardware validation still required
- Date: 2026-07-18

## Purpose

Determine whether DeskPilot can run on a secondary Windows touchscreen without disrupting the mouse pointer or keyboard focus on the main desktop, and determine where DeskPilot's remaining text-entry workflows should live.

This report deliberately separates:

- documented platform behavior;
- observations from the current DeskPilot implementation;
- plausible designs that still require a hardware proof;
- product decisions to resolve in the planned Grill session.

## Executive conclusion

DeskPilot must not assume that a directly connected Windows touchscreen is independent from the system mouse or the active desktop window.

Windows has separate touch/pointer messages, but legacy and compatibility paths can promote the primary touch contact to mouse input. Microsoft's Win32 documentation explicitly states that the system mouse position follows the primary `WM_TOUCH` contact. Modern pointer-aware applications can behave differently, which explains conflicting field reports, but that variance makes a hardware test mandatory rather than optional.

Focus is a separate problem from cursor position. A normal inactive Windows window gets an activation opportunity when the primary pointer touches it. DeskPilot's current Electron window is focusable, and normal DeskPilot actions therefore have no guarantee that the application on the main display keeps keyboard focus.

The recommended direction is conditional:

1. Build and run a small instrumented hardware proof on the intended touchscreen.
2. If direct touch does not move the mouse and an Electron `focusable: false` control surface remains interactive without taking focus, keep the display attached to the PC.
3. Split the existing app into two surfaces within the same DeskPilot installation:
   - a non-focusable, keyboard-free **Control Surface** on the touchscreen;
   - a normal focusable **Configuration Surface** on a main PC monitor.
4. Keep the browser extension responsible for browser capture, not for all DeskPilot configuration.
5. If the direct touchscreen still moves the shared cursor or cannot reliably activate controls without focus, use a separate touch device with a local authenticated DeskPilot host agent on the PC.

Do not build cursor save-and-restore behavior as a product solution. It races the user's real mouse movement, still visibly jumps, and can restore the cursor to a stale position.

The existing keyboard dependency is smaller than it first appears. Every current text field is either a browser-capture fallback or infrequent configuration. The daily touch runtime can become keyboard-free without removing functionality.

## Evidence confidence

| Level | Meaning |
| --- | --- |
| A | Direct statement in Microsoft, Electron, Node.js, W3C, or current DeskPilot source documentation |
| B | Behavior implied by documented APIs but requiring an Electron/Windows integration proof |
| C | Microsoft support/community field report or architecture inference; useful but not a guarantee |
| D | Untested hypothesis retained only as a Grill option |

## Current test environment

The research machine was inspected without injecting input or moving the user's cursor.

| Observation | Result |
| --- | --- |
| Windows session | Local session, not Remote Desktop |
| Displays reported by `GetSystemMetrics(SM_CMONITORS)` | 2 |
| Digitizer flags | `0x8c`: ready, pen capability; no integrated or external touch flag |
| Maximum reported touch contacts | 1, associated with the pen/tablet environment rather than a touch display |
| Relevant hardware | XP-Pen tablet/pen devices are present |
| Real finger-touch test possible in this session | No |

This environment can validate DeskPilot code, window configuration, and a future instrumentation harness, but it cannot honestly resolve the hardware-dependent cursor question. The acceptance criterion requiring real touch remains a target-hardware validation gate.

## What Windows actually separates

### Display mapping is not input isolation

Windows can map a digitizer to the intended monitor. This solves the problem "a touch on display B lands on display A." It does not create a second independent mouse pointer and does not guarantee that the normal cursor remains at its prior position.

The mapping must be checked after reconnecting hardware or changing HDMI/DisplayPort/USB topology. Microsoft documentation for multi-display touch systems describes mappings being associated with the input device and display and potentially requiring remapping after device or port changes. Microsoft support guidance also points users to Tablet PC Settings for assigning a touchscreen to the correct display.

DeskPilot should treat these as distinct test assertions:

- **coordinate mapping:** touch hits DeskPilot on the correct monitor;
- **cursor isolation:** the system mouse pointer remains where it was;
- **focus isolation:** the main desktop application remains the foreground window;
- **command targeting:** a hotkey reaches the intended application.

Passing one assertion does not imply the others.

### Touch can be promoted to mouse input

Windows supports `WM_TOUCH` and the newer unified `WM_POINTER*` model. In the older touch model, Microsoft's `TOUCHINPUT` documentation states that the system mouse position follows the primary touch point and that primary touch also generates mouse button and movement messages.

The pointer model gives pointer-aware applications more control. Microsoft documents that applications which do not process pointer input can have the primary pointer promoted to mouse events. The W3C Pointer Events model likewise defines compatibility mouse-event generation for non-mouse pointers.

Electron uses Chromium, so DeskPilot receives web Pointer Events and can distinguish `event.pointerType === "touch"` from mouse and pen. That is useful for logging, gestures, and touch-specific presentation. It does not, by itself, prove that Windows leaves the shared system cursor untouched.

This produces the key research answer:

> It is technically possible for DeskPilot to receive touch as touch, but the current evidence does not justify promising cursor independence for every Windows touchscreen/controller/driver combination.

### Focus activation is independently controllable in native Windows

Windows sends `WM_POINTERACTIVATE` when a primary pointer contacts an inactive window. A native application can return `PA_NOACTIVATE`. Mouse compatibility activation has a parallel `WM_MOUSEACTIVATE` path that can return `MA_NOACTIVATE`.

Electron exposes a simpler supported control: `BrowserWindow` can be created with `focusable: false`, and a hidden window can be shown with `showInactive()` without focusing it. Electron also exposes `hookWindowMessage`, but its documented callback observes `wParam` and `lParam`; the documented interface does not provide a supported return-value override for `WM_POINTERACTIVATE`. A true native message-return override would therefore require a native helper/addon or unsupported window subclassing.

`focusable: false` is the first option to test because it stays inside Electron's supported interface. It has an intentional consequence: keyboard-focused HTML inputs cannot be the main interaction model on that surface.

### No-focus control is valuable for future hotkeys

If SystemPilot later injects `Ctrl`, `Alt`, `Win`, or letter key combinations, the intended foreground application must still own focus. Windows `SendInput` inserts synthetic keyboard/mouse events into the system input stream and is limited by User Interface Privilege Isolation: a normal DeskPilot process cannot inject into a higher-integrity application.

A focusable DeskPilot window would first become the active window and then risk sending a shortcut to itself. A non-focusable Control Surface makes "send to the current foreground application" a coherent action contract, although it still needs tests for races and elevated targets.

## Current DeskPilot keyboard-input inventory

The inventory is based on `src/renderer/App.tsx`, the browser extension popup, and the native file dialogs used by the Electron main process.

| Workflow | Current input | Frequency | Needed on touch runtime? | Recommended home |
| --- | --- | ---: | --- | --- |
| Manually save a URL | URL and optional title text fields | Low after extension setup | No | Configuration Surface; keep as recovery/fallback |
| Capture current tab/window | Browser extension reads URL/title; category is a select | High | No typing required | Browser extension |
| Create a Category | Name and description; icon buttons | Low | No | Configuration Surface |
| Rename/describe a Category | Name and description; icon buttons | Low | No | Configuration Surface |
| Inline Category card edit | Duplicates name/description editing | Low | No | Remove from Control Surface; consolidate in Configuration Surface |
| Select layout/display/kiosk | Selects and checkbox | Very low | Optional | Configuration Surface; read-only status on Control Surface |
| Backup import/export | Native file picker | Very low | No | Configuration Surface on main monitor |
| Restore/delete confirmations | Buttons in browser confirm dialogs | Occasional | Yes, but no typing | Control Surface with touch-sized in-app confirmation UI |
| Reorder/move tabs | Pointer drag and drop | Common | Yes | BrowserPilot Control Surface; requires real touch polish |
| Open Category/tab | Button | Common | Yes | BrowserPilot Control Surface |
| Future SystemPilot actions | Button/keycap | Common | Yes | SystemPilot Control Surface |

The extension already eliminates the most awkward runtime text entry: saving a real browser URL and title. Moving Category and backup configuration away from the touchscreen therefore does not damage the daily control-panel workflow.

## Solution space

### Option A: Current focusable Electron window on a directly connected touchscreen

**Shape**

- Display and USB touch controller connect to the same PC.
- Existing DeskPilot window remains focusable.
- Windows touch keyboard handles occasional text input.

**Advantages**

- Lowest implementation cost.
- No network, pairing, second runtime, or cross-device update problem.
- Existing SQLite, IPC, backup, extension, and packaging paths remain unchanged.

**Disadvantages**

- Cursor movement is hardware/driver/application dependent.
- Touch normally has an opportunity to activate DeskPilot and steal focus.
- Touch keyboard may occupy roughly half a low display and is user/Windows-setting dependent.
- A physical keyboard attached to the PC can prevent the expected auto-invocation behavior.
- Future foreground-target hotkeys become ambiguous after DeskPilot takes focus.

**Assessment**

Suitable only if the user's real workflow tolerates focus loss. It does not meet the stronger "helper surface while continuing to work with mouse and keyboard" goal.

### Option B: Direct touchscreen plus non-focusable Control Surface and focusable Configuration Surface

**Shape**

- One DeskPilot installation and one data profile.
- A dedicated `BrowserWindow({ focusable: false, skipTaskbar: true })` lives on the touch display.
- A second normal DeskPilot window is opened from the tray on a main monitor for text/configuration.
- Both windows call the same main-process modules through tightly scoped IPC.

**Advantages**

- Keeps all data and privileged behavior in one PC process.
- Avoids a second executable and avoids synchronizing two stores.
- Can preserve main-application focus if the Electron behavior passes the hardware proof.
- Removes the need for a keyboard on the touch surface.
- Provides the cleanest target semantics for foreground hotkeys.
- Configuration remains fully available with the PC keyboard.

**Disadvantages**

- `focusable: false` interaction behavior with real touch must be proven on the target Electron/Windows/hardware combination.
- It may solve focus without solving cursor movement.
- Native dialogs cannot sensibly belong to the non-focusable surface.
- The renderer must stop being one 1,696-line view with all runtime and configuration modes interleaved.

**Assessment**

Preferred direct-attached architecture if it passes the hardware gate.

### Option C: Direct touchscreen plus native no-activation shim

**Shape**

- Keep an Electron surface but add a native Windows helper that returns `PA_NOACTIVATE` and `MA_NOACTIVATE` from the window procedure.

**Advantages**

- Finer control than Electron's cross-platform window options.
- Could keep some interactions on an inactive window when `focusable: false` proves insufficient.

**Disadvantages**

- Native addon/helper packaging, architecture, signing, ABI, and Electron upgrade work.
- Electron documents observation of window messages, not replacing their return value.
- Does not inherently prevent the system mouse position following touch.
- Text input still requires focus and therefore contradicts the no-activation goal.

**Assessment**

Keep as a narrowly scoped spike only after Option B fails for a clearly diagnosed reason. Do not make it the baseline architecture.

### Option D: Save and restore the cursor position

**Shape**

- Read `GetCursorPos` before touch and call `SetCursorPos` after the DeskPilot action.

**Advantages**

- Superficially simple.
- Can hide the final changed location in a controlled demo.

**Disadvantages**

- The cursor still jumps during interaction.
- Races with legitimate mouse movement by the user.
- A multi-touch/drag sequence has no unambiguous restore moment.
- Can move the cursor back after the user deliberately moved it.
- Does not restore keyboard focus.
- Global cursor mutation is exactly the class of surprising behavior DeskPilot should avoid.

**Assessment**

Reject for production. It may be useful only as a disposable diagnostic to prove that cursor movement is the remaining blocker.

### Option E: Use the Windows touch keyboard

**Shape**

- Keep text fields on the touch display and rely on Windows' touch keyboard/TabTip.

**Advantages**

- No DeskPilot keyboard implementation.
- Standard accessibility and language features when it appears correctly.
- HTML text inputs can benefit from Chromium's text services integration.

**Disadvantages**

- Windows behavior depends on OS version, settings, tablet posture, input focus, and whether a hardware keyboard is attached.
- The intended PC already has a keyboard, so "show when no keyboard is attached" is not a dependable condition.
- The keyboard can consume about half of a small display and force major reflow.
- Text focus necessarily conflicts with a permanently non-focusable control surface.

**Assessment**

Useful as an accessibility fallback in the Configuration Surface, not as the primary DeskPilot runtime architecture.

### Option F: Build an in-app touch keyboard or constrained editors

**Shape**

- Provide DeskPilot-owned keys, recent values, templates, folder pickers, and icon pickers.

**Advantages**

- Can update React state without depending on the Windows touch keyboard.
- A URL keypad or preset selector can be tightly optimized for one task.
- Does not require hardware keyboard focus for each virtual key.

**Disadvantages**

- A full keyboard requires layouts, modifiers, locale, accessibility, selection, clipboard, IME, composition, and password considerations.
- It spends valuable touchscreen area on infrequent configuration.
- It creates a large shallow interface for a problem already solved by the PC keyboard.

**Assessment**

Reject a general keyboard. Consider only constrained pickers, presets, recent paths, or a numeric keypad for future domain-specific tasks.

### Option G: Move configuration into the browser extension

**Shape**

- Add Category/action/settings editing to the Chrome/Edge extension.

**Advantages**

- The user's PC keyboard and browser are already available.
- Browser-related workflows are close to their source context.
- Reuses the existing loopback bridge.

**Disadvantages**

- Makes general DeskPilot configuration dependent on a browser being installed and the extension being loaded.
- Mixes browser capture permissions and system-control configuration.
- The popup is small and ephemeral; larger options pages add another UI deployment.
- The current bridge is intentionally origin-restricted and only exposes browser-session operations.
- It moves DeskPilot toward "browser product" when the product direction is broader.

**Assessment**

Keep browser-specific capture choices in the extension. Do not make it the canonical SystemPilot or DeskPilot configuration surface.

### Option H: Separate touch device plus local PC host agent

**Shape**

- DeskPilot's privileged host and SQLite data stay on the Windows PC.
- The touch UI runs on another device (small Windows PC, tablet, Raspberry Pi-class device, or browser/PWA).
- Commands travel over an authenticated local connection.

**Advantages**

- True physical pointer and focus isolation: touching the device cannot move the PC's local mouse merely by being a touch digitizer.
- The touch device can have its own software keyboard.
- UI and PC execution become independently restartable.
- Provides a natural future path for a removable or wireless desk controller.

**Disadvantages**

- Highest operational complexity: power, boot, network, discovery, pairing, updates, reconnection, latency, and diagnostics.
- The current bridge binds `127.0.0.1`; it is deliberately inaccessible from another device.
- Binding to the LAN without authentication would create a serious local command-execution vulnerability.
- Browser/PWA delivery over a LAN requires deliberate secure-origin/TLS handling for some platform features.
- A second-device UI must handle host unavailable, version mismatch, and replay/idempotency.

**Minimum security shape**

- Keep SQLite and action execution on the PC only.
- Pair physically with a short-lived code or QR secret shown by the PC Configuration Surface.
- Store a per-device revocable credential.
- Authenticate every command; do not rely on CORS or a custom header as authentication.
- Use encrypted transport or a mutually authenticated local channel.
- Expose typed action IDs, never raw shell command strings.
- Rate-limit and log execution results locally.
- Bind only after the user enables remote control and configure the Windows firewall narrowly.
- Provide a visible "revoke all controllers" action.

**Assessment**

Preferred fallback if direct-attached hardware fails cursor isolation. It may later become the premium architecture, but it should not be built before the cheap hardware gate is run.

### Option I: Separate companion executable on the same PC

**Shape**

- One executable hosts the touch runtime; another hosts settings.

**Advantages**

- Process-level failure isolation.
- Independently focusable windows and packaging are possible.

**Disadvantages**

- Duplicates lifecycle, installation, update, single-instance, IPC, and data-locking concerns.
- Provides no cursor isolation benefit over two windows in one Electron app.
- Risks two processes writing the same SQLite file.

**Assessment**

Inferior to Option B unless a later security boundary requires separate processes. Start with two surfaces in one installation.

## Comparative matrix

Scores are 1 (poor) to 5 (strong). "Unproven" means the score depends on target-hardware validation.

| Option | Cursor isolation | Focus isolation | Text-entry UX | Local/offline | Security simplicity | Implementation cost | Overall |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| A. Current direct/focusable | 2, unproven | 1 | 2 | 5 | 5 | 5 | Too disruptive |
| B. Direct dual surface/non-focusable runtime | 2, unproven | 4, unproven | 5 | 5 | 5 | 3 | Preferred if gate passes |
| C. Native no-activation shim | 2, unproven | 4 | 2 | 5 | 3 | 1 | Diagnostic fallback |
| D. Cursor restore hack | 2 | 1 | 2 | 5 | 2 | 3 | Reject |
| E. Touch keyboard | 1 | 1 | 2 | 5 | 5 | 4 | Fallback only |
| F. Custom keyboard | 1 | 3 | 2 | 5 | 4 | 1 | Reject general keyboard |
| G. Extension configuration | 1 | 5 | 4 | 4 | 2 | 3 | Browser-only scope |
| H. Separate touch device + PC agent | 5 | 5 | 5 | 4 | 2 | 1 | Best isolation; expensive |
| I. Separate same-PC companion executable | 2 | 4 | 5 | 5 | 3 | 2 | Two windows are simpler |

## Recommended product topology

### Preferred topology when direct touch passes

```text
Windows PC
├── DeskPilot host (Electron main process)
│   ├── SQLite Productive/Development profiles
│   ├── browser bridge on loopback
│   ├── BrowserPilot operations
│   └── future typed system-action executor
├── Touch Control Surface (non-focusable BrowserWindow)
│   ├── SystemPilot keycaps
│   ├── BrowserPilot daily actions
│   └── no text fields or native file dialogs
├── PC Configuration Surface (focusable BrowserWindow)
│   ├── Categories and actions
│   ├── paths and labels
│   ├── display/hardware diagnostics
│   └── backup/import/export
└── Chrome/Edge extension
    └── browser tab/window capture only
```

This is not "another app" in the product sense. It is a second surface over the same deep host modules and data. That gives the user a PC control panel without duplicating the backend.

### Fallback topology when direct touch fails

```text
Separate touch device                      Windows PC
┌────────────────────────┐    paired      ┌──────────────────────────┐
│ DeskPilot touch client │◀──────────────▶│ DeskPilot host agent     │
│ no privileged actions  │ authenticated │ typed commands only      │
│ optional local cache   │ encrypted     │ SQLite + action executor │
└────────────────────────┘               └──────────────────────────┘
```

The host remains the source of truth. The touch client should not independently edit or synchronize a second SQLite database.

## Required target-hardware proof

### Instrumentation

Create a disposable diagnostic mode or test app that records:

- timestamp;
- pointer event type and `pointerType` in Chromium;
- `GetCursorPos` before contact, during movement, on release, and 250 ms after release;
- foreground HWND/process from `GetForegroundWindow`;
- Electron `focus` and `blur` events;
- DeskPilot button activation count;
- Windows version, Electron version, display IDs, scale factors, and window bounds;
- digitizer vendor/product ID and display/USB port topology.

Do not record typed text or unrelated key content.

### Test matrix

| ID | DeskPilot window | Main-display setup | Touch action | Required observations |
| --- | --- | --- | --- | --- |
| T1 | Normal focusable | Notepad/terminal actively receiving typed characters | Tap a DeskPilot button | Cursor before/after, foreground window before/after, action fired |
| T2 | Normal focusable | Mouse stationary over a known main-display target | Drag/scroll DeskPilot | Cursor path, synthetic mouse events, DeskPilot pointer events |
| T3 | `focusable: false` | Notepad/terminal active | Tap a DeskPilot button | Action fires while foreground window remains unchanged |
| T4 | `focusable: false` | Mouse moves concurrently on main display | Repeated DeskPilot taps | No cursor jump and no lost mouse input |
| T5 | `focusable: false` | Elevated app active | Trigger harmless test hotkey | Expected UIPI failure is visible and safe |
| T6 | Normal focusable | Physical keyboard attached | Tap URL/name input | Touch keyboard appearance and usable remaining viewport |
| T7 | Normal focusable | Touch keyboard manually enabled | Enter/edit/cancel text | Composition, backspace, focus, layout, and cancel behavior |
| T8 | Kiosk and non-kiosk | Main app active | Use all daily BrowserPilot buttons | No hidden focus-taking path or native dialog |
| T9 | Reconnect touch USB/display ports | Correct display mapping configured | Tap four corners | Touch lands on intended monitor after restart/reconnect |
| T10 | Separate-device prototype | Main app active | Trigger harmless action remotely | No cursor/focus movement; latency and reconnect behavior |

### Pass/fail gates

Direct-attached Control Surface passes only if:

- every touch lands on the intended display;
- a normal button works while the Control Surface is non-focusable;
- the system cursor stays within a small measurement tolerance of its pre-touch position;
- the foreground main application does not change;
- rapid mixed mouse-and-touch use does not lose or reorder actions;
- behavior remains stable after reboot and touch-controller reconnect;
- failure is visible rather than silently targeting the wrong window.

One hardware model passing is enough for the user's fixed desk installation, but not enough to claim generic touchscreen compatibility in release notes.

## UX rules implied by this research

- Daily Control Surface flows contain no free-form text fields.
- Do not rely on hover for meaning or actions.
- Use at least 40×40 effective pixels for ordinary targets; prefer 44×44 with visible spacing for frequent actions.
- Consequential actions require more separation and an in-app confirmation, not a tiny adjacent icon.
- Confirmations on the Control Surface must not open text-entry or native dialogs.
- Always show which PC/host and data profile will receive a command.
- Future hotkeys must state their target semantics, for example `Current foreground app`.
- A failed action must not be presented as successful, especially when UIPI blocks input.
- Configuration Surface changes should appear on the Control Surface without restart.

## Recommended allocation of current workflows

### Touch Control Surface

- switch Pilot;
- choose Category;
- open Category or Saved Tab;
- save via browser extension status/action, not manual typing;
- archive/restore with touch-sized confirmation;
- execute configured SystemPilot actions;
- show connection, profile, and host status;
- offer a `Configure on PC` button that opens/shows the Configuration Surface without moving it to the touch display.

### PC Configuration Surface

- create/rename/describe Categories;
- create/edit/reorder SystemPilot actions;
- choose folders, applications, terminal profiles, labels, and icons;
- manage display mapping guidance and run the input diagnostic;
- backup/import/export/recovery;
- extension installation and diagnostics;
- remote-device pairing/revocation if Option H is chosen.

### Browser extension

- capture current tab/window;
- select destination Category;
- choose append/replace and close-after-save;
- show the connected profile;
- optionally offer a link that opens the PC Configuration Surface;
- do not become a generic SystemPilot editor.

## Grill questions

### Hardware and deployment

1. Is the touchscreen hardware already selected? If yes, what model/controller and connection topology?
2. Must DeskPilot support arbitrary Windows touchscreens, or only the user's fixed desk installation?
3. Is a second low-power device acceptable in cost, power, boot time, and maintenance?
4. Is wired Ethernet/USB networking acceptable if Wi-Fi pairing is considered too fragile?
5. Must DeskPilot keep working while the main PC is at the Windows lock screen? Most actions should probably be disabled there.

### Focus and command semantics

6. Is preserving keyboard focus a hard requirement for every touch, or only for SystemPilot hotkeys?
7. Should a hotkey target whichever app is currently focused, or a configured application/window?
8. What should happen if the foreground app changes between touch-down and action execution?
9. Should foreground-target hotkeys require press-and-hold or a visible target label?
10. Is failure against an elevated application acceptable if DeskPilot clearly reports it?

### Configuration

11. Is opening a second DeskPilot window on the main monitor acceptable, or does the user specifically want a separately named companion application?
12. Should the touch surface ever allow emergency Category creation through presets or a constrained keyboard?
13. Can manual URL entry be considered a PC-only recovery tool now that the extension exists?
14. Should backups and destructive recovery be entirely absent from the touch surface?

### Separate-device fallback

15. Which client platform is preferred: browser/PWA, Windows mini-PC, Android tablet, or dedicated Linux device?
16. Is a one-time QR pairing flow acceptable?
17. Should multiple controllers be supported, or exactly one paired device?
18. What is the expected behavior when the LAN is down or the host restarts?
19. May the touch client cache labels/icons for an offline shell, while keeping every action disabled until authenticated?

## Follow-up ticket candidates

Do not create these until the Grill session chooses a direction.

1. Build the instrumented Windows/Electron touch, cursor, and focus diagnostic.
2. Run and document the target-hardware test matrix.
3. Split DeskPilot into touch Control Surface and PC Configuration Surface.
4. Remove free-form text and native dialogs from the Control Surface.
5. Add a supported non-focusable runtime mode and foreground-target integration tests.
6. If required, spike native `WM_POINTERACTIVATE`/`WM_MOUSEACTIVATE` handling.
7. If direct touch fails, prototype paired separate-device control over an authenticated local channel.
8. Add action-target visibility and UIPI-aware error reporting before hotkeys ship.

## Sources

### Windows input and focus

- Microsoft Learn: [`TOUCHINPUT` structure](https://learn.microsoft.com/en-us/windows/win32/api/winuser/ns-winuser-touchinput) — primary touch, mouse position, and compatibility mouse messages.
- Microsoft Learn: [Pointer message flags](https://learn.microsoft.com/en-us/windows/win32/inputmsg/pointer-message-flags) — primary pointer and mouse promotion for applications that do not process pointer input.
- Microsoft Learn: [`WM_POINTERACTIVATE`](https://learn.microsoft.com/en-us/windows/win32/inputmsg/wm-pointeractivate) — activation opportunity and `PA_NOACTIVATE`.
- Microsoft Learn: [`WM_MOUSEACTIVATE`](https://learn.microsoft.com/en-us/windows/win32/inputdev/wm-mouseactivate) — mouse activation and `MA_NOACTIVATE`.
- Microsoft Learn: [`SendInput`](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendinput) — input injection and UIPI limitations.
- Microsoft Learn: [About cursors](https://learn.microsoft.com/en-us/windows/win32/menurc/about-cursors) — global cursor position and `GetCursorPos`/`SetCursorPos`.
- Microsoft Learn: [Multi-display input framework](https://learn.microsoft.com/en-us/mdep/architecture/core-os/input-framework) — input-device/display mapping behavior in a multi-display Windows system.
- Microsoft Q&A: [Stop a secondary touchscreen moving the mouse cursor](https://learn.microsoft.com/en-us/answers/questions/3193219/is-there-a-way-to-separate-touch-screen-input-and) — support answer stating that no general Windows setting provides the requested isolation; treated as Level C evidence.
- Microsoft Q&A: [Separate touchscreen and mouse inputs](https://learn.microsoft.com/en-us/answers/questions/2689747/separate-touch-screen-and-mouse-inputs) — conflicting field observation where cursor position was preserved but focus changed; treated as Level C evidence and a reason to test the real hardware.

### Electron and web input

- Electron: [`BrowserWindow`](https://www.electronjs.org/docs/latest/api/browser-window) — `show()`, `showInactive()`, focus state, and `setFocusable()`.
- Electron: [`BaseWindow`](https://www.electronjs.org/docs/latest/api/base-window) — `focusable: false`, `skipTaskbar`, native handle, and window-message hooks.
- W3C: [Pointer Events](https://www.w3.org/TR/pointerevents/) — unified mouse/pen/touch events, `pointerType`, and compatibility mouse events.

### Touch keyboard and ergonomics

- Microsoft Support: [Enable and disable the touch keyboard in Windows](https://support.microsoft.com/en-us/windows/hardware/input-devices/enable-and-disable-the-touch-keyboard-in-windows) — attached-keyboard and user-setting-dependent behavior.
- Microsoft Learn: [Touch interactions](https://learn.microsoft.com/en-us/windows/apps/develop/input/touch-interactions) — touch keyboard behavior, viewport impact, and touch target guidance.
- Microsoft Learn: [Guidelines for touch targets](https://learn.microsoft.com/en-us/windows/apps/develop/input/guidelines-for-targeting) — approximately 7.5 mm / 40×40 pixel targets and larger targets for frequent or consequential actions.
