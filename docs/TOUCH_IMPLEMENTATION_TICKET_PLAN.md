# Touch Implementation Ticket Plan

- Status: Published as GitHub issues #37–#42
- Parent: [Research #28](https://github.com/mpiechot/DeskPilot/issues/28)
- Hardware boundary: [Touch Hardware Validation And Windows Integration](GRILL_SESSION_2026-07-23_TOUCH_HARDWARE_VALIDATION.md)
- Related shell/action context: [Research #29](https://github.com/mpiechot/DeskPilot/issues/29)

This plan contains only the pre-hardware implementation frontier. The issues below must be demonstrable with mouse-driven development workflows and simulated diagnostic results. They must not claim that a real Windows touchscreen is isolated. Hardware validation begins only after these slices are complete and representative hardware is available.

## Touch slices

### [#37 Touch setup state and diagnostic adapter](https://github.com/mpiechot/DeskPilot/issues/37)

- **Blocked by:** None — can start immediately
- **User stories:** As a user, I can see whether DeskPilot considers a touch setup unverified, diagnostically verified or user accepted. As a developer, I can exercise the complete state flow without hardware through a deterministic diagnostic adapter.
- **Complete slice:** Define the persisted setup state, diagnostic result, warning reasons, acceptance and revoke behavior; expose it through the application boundary; render the Settings status surface; and cover simulated pass/fail/stale/revoked transitions.
- **Important boundary:** The simulated adapter never produces a real hardware compliance claim.

### [#38 Touch Control Surface and PC Configuration Surface boundary](https://github.com/mpiechot/DeskPilot/issues/38)

- **Blocked by:** Touch setup state and diagnostic adapter
- **User stories:** As a touch-oriented user, I can use a keyboard-free control surface for frequent workflows. As a configuration user, I can reach a separate focusable surface for text-heavy and administrative work.
- **Complete slice:** Add the two-surface contract, explicit surface/mode state, routing between them, touch-sized shared controls, status presentation and a development switch that can be driven with a mouse. Keep responsive geometry independent from Theme values.

### [#39 Keyboard-free BrowserPilot touch workflow](https://github.com/mpiechot/DeskPilot/issues/39)

- **Blocked by:** Touch Control Surface and PC Configuration Surface boundary
- **User stories:** As a touch user, I can switch Pilots, choose a Category, open a Category or saved Tab, archive and restore with touch-sized confirmations, and return to configuration without exposing daily text-entry work on the control surface.
- **Complete slice:** Integrate BrowserPilot into the Touch Control Surface, move infrequent category editing, manual URL saving, backup/recovery and extension diagnostics to the PC Configuration Surface, and cover the workflow with renderer smoke tests.

## Hardware frontier

No implementation issue is published yet for the following behavior. It belongs to the separate hardware specification and waits for representative hardware:

- actual touch-display classification and Windows capability discovery;
- cursor/focus/exact-action isolation evidence;
- display mapping, physical connection identity and topology invalidation;
- discovery prompts, automatic/manual Touch Mode switching and disconnect recovery;
- lock-screen and reconnect validation;
- the conditional separate touch-device-plus-PC-agent fallback.

DesktopPilot/EnvironmentPilot foreground-target execution remains a related action-foundation dependency. It should be ticketed when those Pilots have real executable actions, not folded into the hardware-independent BrowserPilot slice.

## Theme Grill tickets

These are independent specification sessions under [#34](https://github.com/mpiechot/DeskPilot/issues/34). Each session must fully define the theme before implementation tickets are created for it.

### [#40 Space/Holo Theme Grill](https://github.com/mpiechot/DeskPilot/issues/40)

- **Blocked by:** None
- **Goal:** Explore a calm space-oriented DeskPilot theme with holographic-display language.
- **Required output:** A complete theme specification covering visual principles, semantic tokens, typography, surfaces, navigation, Pilot/Settings states, icons/assets, empty/error/success states, motion/sound rules, accessibility and implementation/asset requirements.

### [#41 Gladiator/Roman Theme Grill](https://github.com/mpiechot/DeskPilot/issues/41)

- **Blocked by:** None
- **Goal:** Explore a restrained Roman Empire / gladiator direction with a QuestBook-like sense of quests, surfaces and progression without turning DeskPilot into a game UI.
- **Required output:** The same complete theme specification, including how the direction remains usable for browser-session management and how its decorative language maps to semantic Theme tokens.

### [#42 Cyberpunk/Glitch Theme Grill](https://github.com/mpiechot/DeskPilot/issues/42)

- **Blocked by:** None
- **Goal:** Explore a cyberpunk direction with controlled glitch language, clear system status and deliberate failure/error presentation.
- **Required output:** The same complete theme specification, including glitch boundaries, reduced-motion behavior, accessibility, sound policy, state semantics and implementation/asset requirements.

## Pilot Grill tickets

These independent product-specification sessions extend the empty Pilot destinations from #32. They are parented by the broader modular shell and action context in #29 and deliberately create no Pilot implementation by themselves.

### [#43 DesktopPilot Grill](https://github.com/mpiechot/DeskPilot/issues/43)

- **Blocked by:** None
- **Scope:** Define DesktopPilot's purpose, digital desktop action kinds, foreground-target rules, elevation failures, configuration workflow, persistence, safety and future implementation slices.

### [#44 EnvironmentPilot Grill](https://github.com/mpiechot/DeskPilot/issues/44)

- **Blocked by:** None
- **Scope:** Define EnvironmentPilot's purpose, physical/environmental action kinds, device and scene semantics, safety boundaries, discovery/pairing model, configuration workflow, persistence and the hardware boundary.
