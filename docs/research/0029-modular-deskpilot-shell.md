# Research 0029: Modular DeskPilot Shell And System-Control Layer

- GitHub ticket: [#29](https://github.com/mpiechot/DeskPilot/issues/29)
- Related research: [Research 0028](0028-touchscreen-input-isolation.md)
- Status: Research complete; product choices remain for Grill session
- Date: 2026-07-18

## Purpose

Define plausible upper-layer designs that make DeskPilot a desktop control surface rather than only a browser-session manager. Compare navigation, module, action-execution, persistence, extension, deployment, and migration choices without locking the project into speculative infrastructure.

## Executive conclusion

DeskPilot should be the product and shell. The current browser-session experience should become the first substantial Pilot, **BrowserPilot**. The recommended default module is **SystemPilot**, shown simply as **System** in the compact UI. `SystemPilot` is clearer than `DesktopPilot`, less platform-specific than `WindowsPilot`, and does not repeat the product name.

For the target 1180×390 wide/low display, use a persistent top navigation bar while there are five or fewer primary Pilots. Microsoft recommends top navigation for five or fewer equally important destinations and when content space matters. A compact utility/settings entry belongs at the end of the bar but should not be treated as a Pilot.

Use a fixed, compile-time internal Pilot registry. Do not build an external plugin system now. A manifest-driven or third-party code model creates validation, compatibility, permission, signing, update, and recovery work before a second real Pilot exists.

The first architectural seam worth creating is not a generic plugin interface. It is a deep **Action Execution module** in the Electron main process:

```ts
executeAction(actionId: string): Promise<ActionExecutionResult>
```

The renderer sends only a stored action ID. The main process loads the locally persisted typed action, validates it again, selects a built-in adapter, executes it, and returns a structured result. The renderer must never send an arbitrary executable, argument list, PowerShell fragment, or shell command for immediate execution.

Start SystemPilot with three user-configurable action kinds:

1. open a folder;
2. open a terminal at a folder;
3. send an explicit keyboard chord to the current foreground application.

Add application launching and validated HTTP(S) URLs soon after. Do not add arbitrary scripts in the first implementation.

Persist SystemPilot actions in the existing SQLite database so automatic rolling backups, manual snapshots, export/import, Productive/Development isolation, and startup recovery include them. Keep display/window preferences in their existing recoverable settings file.

The shell should support the two deployment outcomes from Research 0028:

- same-PC Electron Control Surface plus Configuration Surface;
- later separate touch client plus PC host agent.

Do not create a transport abstraction until the separate-device direction is actually chosen. One adapter is only a hypothetical seam; build the action interface first and add a second transport only when it exists.

## Product constraints

The proposal must preserve the fixed project vision:

- local-first and fully useful offline;
- no required account, subscription, or cloud service;
- user-owned and recoverable data;
- browser-session management remains a first-class feature;
- small, wide, low touch display remains the primary control-surface shape;
- user actions must not silently delete data or execute surprising commands;
- DeskPilot may grow into workflow and desk automation, but must not collapse into a generic unsafe launcher.

## Current DeskPilot architecture

### Useful foundations

- Electron main process owns SQLite, browser launching, native dialogs, display selection, tray behavior, updates, and the browser bridge.
- React renderer accesses privileged behavior through a context-isolated preload interface.
- Productive and Development data profiles are isolated.
- SQLite writes produce a rolling backup; manual backup, restore, import, export, and corruption recovery exist.
- Window position, selected display, touch layout, and kiosk preference are persisted separately with a `.bak` recovery copy.
- The extension is intentionally limited to browser capture and a loopback-only bridge.
- The current display defaults to 1180×390 and has an 860×320 minimum.

These are strong reasons to evolve the current application rather than create a new product or rewrite the stack.

### Architectural pressure points

| Area | Current shape | Pressure created by multiple Pilots |
| --- | --- | --- |
| Renderer | `App.tsx` is 1,696 lines | Shell, BrowserPilot, configuration, recovery, display, extension, and safety concerns are interleaved |
| Navigation | Seven browser-oriented modes in one `controlMode` union | Modes mix top-level product destinations with BrowserPilot pages and utilities |
| Preload interface | One flat `DeskPilotApi` with many methods | Future system actions would make a broad shallow interface larger |
| Main process | `index.ts` registers all IPC handlers directly | Privileged action validation and execution need a focused module |
| Storage | `storage.ts` is 1,795 lines | Action persistence could deepen this monolith unless a repository seam is extracted intentionally |
| Browser bridge | Loopback HTTP with extension origin/header checks | Not safe or sufficient as a remote-device control protocol |
| Touch UI | Current left control rail consumes 250–360 px | A Pilot shell needs navigation that preserves low-height content area |

The migration should reduce these pressures without a big-bang rewrite.

## Product language and naming

### Recommended hierarchy

```text
DeskPilot                   Product and persistent shell
├── SystemPilot             Default operating-system control surface
├── BrowserPilot            Existing browser-session workflow
├── ApplicationPilot        Future app-specific control collections
├── GamePilot               Future game-specific control collections
└── future Pilots           Explicitly shipped when their outcome is known
```

### Name comparison for the default Pilot

| Name | Strengths | Weaknesses | Recommendation |
| --- | --- | --- | --- |
| SystemPilot | Clear system-level scope; pairs naturally with BrowserPilot; not tied to Windows forever | Slightly technical; long in compact UI | Recommended concept name; show `System` in nav |
| DesktopPilot | Friendly and PC-oriented | Easily confused with DeskPilot; "desktop" can mean files/workspaces rather than OS controls | Reject |
| WindowsPilot | Immediately clear for current implementation | Locks product language to Windows and ages poorly if a separate/non-Windows touch client appears | Use only in technical adapter names |
| ControlPilot | Broad and short | Says little about what it controls; overlaps DeskPilot itself | Reject |
| OSPilot | Short | Awkward spoken name and acronym-heavy UI | Reject |
| Home | Familiar default destination | Hides the important system-control concept and becomes a miscellaneous dumping ground | Could be a future dashboard, not the first SystemPilot name |

### Pilot versus page versus action

- **Pilot:** a top-level work domain with its own coherent state and workflows.
- **Page:** a view inside a Pilot, such as BrowserPilot Session, Categories, Archive, and Recovery.
- **Action:** an executable command represented as a keycap/tile, such as opening Projects or sending `Win+Shift+S`.
- **Utility:** cross-product configuration or safety, such as Settings, Display, Extension setup, Backup, and Recovery diagnostics.

This prevents every current `controlMode` from becoming a fake Pilot.

## Navigation alternatives

### Option A: Persistent top Pilot bar

```text
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ DeskPilot   [ System ] [ Browser ] [ Apps ] [ Games ]                 Productive   ⚙        │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                            │
│                              selected Pilot content                                        │
│                                                                                            │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Advantages**

- Matches a wide/low display.
- Preserves width for cards and keycaps.
- Keeps four or five equally important destinations visible.
- Labels can remain visible; icons alone are not required.
- Aligns with Microsoft's top-navigation guidance for five or fewer categories.

**Disadvantages**

- Costs vertical pixels on a 320–390 px high window.
- Future Pilots need a deliberate overflow policy.
- Pilot-specific secondary navigation needs another compact row or in-content tabs.

**Assessment**

Recommended. Use one 48–56 px touch row, then let each Pilot own its page navigation inside content.

### Option B: Persistent left icon rail

```text
┌──────────┬─────────────────────────────────────────────────────────────────────────────────┐
│ System   │                                                                                 │
│ Browser  │                          selected Pilot content                                  │
│ Apps     │                                                                                 │
│ Games    │                                                                                 │
│ ⚙        │                                                                                 │
└──────────┴─────────────────────────────────────────────────────────────────────────────────┘
```

**Advantages**

- More vertical room for labels as Pilots grow.
- Similar to DeskPilot's current control rail.
- Easy to keep Settings pinned at the bottom.

**Disadvantages**

- Uses the scarce horizontal space needed for BrowserPilot category cards and SystemPilot keycaps.
- A low 320 px window has limited vertical capacity for comfortable 44 px targets.
- Icon-only labels reduce clarity; text labels make the rail wider.

**Assessment**

Good fallback for a taller configuration window, not the primary low touch surface.

### Option C: Bottom dock

```text
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                            │
│                              selected Pilot content                                        │
│                                                                                            │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ [ System ] [ Browser ] [ Apps ] [ Games ] [ Settings ]                                    │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Advantages**

- Strong thumb reach on handheld devices.
- Visually resembles a dedicated hardware controller.

**Disadvantages**

- DeskPilot is a fixed under-monitor panel, not a handheld phone.
- Hands can occlude the content above the touched destination.
- Future touch keyboard and Windows taskbar interactions compete for the lower edge.

**Assessment**

Viable aesthetic alternative, but top navigation is more discoverable and consistent with the fixed desk posture.

### Option D: Home dashboard with Pilot tiles

**Advantages**

- Scales to many modules without persistent navigation.
- Can show status summaries.

**Disadvantages**

- Every Pilot switch requires returning Home or a hidden gesture.
- Adds navigation depth to a tool whose value is low-friction switching.
- Encourages a miscellaneous dashboard before Pilot workflows are mature.

**Assessment**

Reject as the only navigation. A later optional Home page can coexist with persistent Pilot navigation.

### Navigation decision matrix

| Criterion | Top bar | Left rail | Bottom dock | Home tiles |
| --- | ---: | ---: | ---: | ---: |
| Wide/low fit | 5 | 2 | 4 | 4 |
| All primary Pilots visible | 5 | 4 | 5 | 1 |
| Content space | 4 | 2 | 4 | 5 |
| Growth beyond five Pilots | 3 | 5 | 2 | 5 |
| Touch clarity with labels | 5 | 3 | 4 | 5 |
| Switch speed | 5 | 5 | 5 | 2 |
| Recommended | Yes | Config surface | Alternative | Later supplement |

## Pilot architecture alternatives

### Option 1: Fixed compile-time internal registry

```ts
type PilotId = "system" | "browser" | "applications" | "games";

type PilotDefinition = {
  id: PilotId;
  label: string;
  icon: LucideIcon;
  render: () => React.ReactNode;
};
```

Only shipped TypeScript modules can register. The shell owns selection, layout, utility access, host/profile status, and error containment. Each Pilot owns its pages and content.

**Advantages**

- Compile-time type checking and ordinary bundling.
- No executable external content.
- Easy incremental extraction from `App.tsx`.
- Small interface with meaningful leverage.
- Versioning follows the DeskPilot release.

**Disadvantages**

- New Pilots require a DeskPilot release.
- Third parties cannot add code.

**Assessment**

Recommended. DeskPilot has one implemented Pilot and several ideas; release-time registration is a feature, not a limitation.

### Option 2: Manifest-driven internal modules

A JSON manifest describes IDs, labels, icons, routes, and capabilities while all implementations remain compiled into DeskPilot.

**Advantages**

- Navigation metadata is data-driven.
- Feature flags and availability can be expressed without importing every view eagerly.
- Could support edition/platform filters.

**Disadvantages**

- Duplicates information already represented in TypeScript.
- Requires runtime schema validation and manifest/module consistency checks.
- Does not provide real third-party extensibility.
- Can become a shallow metadata layer that merely passes values through.

**Assessment**

Do not add until two or more real conditions require data-driven availability. A TypeScript registry can contain the same metadata now.

### Option 3: External declarative action packs

External files can add pages of typed actions but cannot execute code. For example, a GamePilot pack might reference built-in `launch-app`, `open-url`, and `send-hotkey` action kinds.

**Advantages**

- User-shareable configurations without arbitrary JavaScript.
- Safer than plugins because execution stays in built-in adapters.
- Could serve ApplicationPilot and GamePilot without new code for every app.

**Disadvantages**

- Import, schema versioning, path portability, conflicts, signatures/trust, and recovery still need design.
- Shared packs can reference applications or paths that do not exist.
- Could blur the distinction between a Pilot and an action page.

**Assessment**

Promising later extension. First persist user-created local actions; add export/import only after the data model is stable.

### Option 4: External code plugin system

Plugins contribute UI and executable behavior.

**Advantages**

- Maximum flexibility.
- Independent release cadence and community expansion.

**Disadvantages**

- Equivalent to installing local code with DeskPilot's filesystem, process-launch, input-injection, and session-data privileges.
- Requires permissions, sandboxing, API/version compatibility, crash isolation, signing/trust, update/revocation, UI consistency, and recovery behavior.
- Electron renderer plugins create a major supply-chain and context-isolation risk.
- No near-term second implementation proves that the interface is real.

**Assessment**

Reject for the foreseeable roadmap. Prefer built-in adapters plus declarative action data.

### Architecture decision matrix

| Criterion | Fixed registry | Internal manifest | Declarative action packs | Code plugins |
| --- | ---: | ---: | ---: | ---: |
| Near-term value | 5 | 2 | 3 | 1 |
| Safety | 5 | 4 | 4 | 1 |
| Testability | 5 | 4 | 4 | 2 |
| User extensibility | 2 | 2 | 5 | 5 |
| Compatibility burden | 5 | 3 | 3 | 1 |
| Implementation cost | 5 | 3 | 2 | 1 |
| Recommendation | Build now | Defer | Explore later | Reject |

## Recommended deep modules and seams

The vocabulary here is intentional: a module has an interface and implementation; a seam is where that interface lives; an adapter satisfies the interface.

### 1. DeskPilot Shell module

**Owns**

- selected Pilot;
- persistent top navigation;
- global profile/host/connection status;
- utility/settings entry;
- placement of Control versus Configuration Surface;
- error containment when one Pilot fails.

**Does not own**

- Category state or browser-session operations;
- persisted SystemPilot action details;
- privileged action execution;
- per-Pilot page navigation.

Its interface should be a small registry of `PilotDefinition` values. Do not put every Pilot command into the shell interface.

### 2. Action Execution module

**External interface**

```ts
type ActionExecutionResult =
  | { status: "completed"; actionId: string; message: string }
  | { status: "blocked"; actionId: string; reason: "invalid" | "missing-target" | "elevation" | "confirmation-required"; message: string }
  | { status: "failed"; actionId: string; message: string };

interface ActionExecutor {
  execute(actionId: string): Promise<ActionExecutionResult>;
}
```

This interface is deliberately smaller than `execute(actionPayload)`. Callers cannot bypass persisted validation by supplying a one-off command.

**Implementation responsibilities**

1. Load action from the repository.
2. Reject missing, disabled, deleted, or invalid actions.
3. Revalidate its versioned payload.
4. Resolve the built-in adapter by action kind.
5. Check confirmation and runtime preconditions.
6. Execute without a command shell unless the adapter explicitly requires one.
7. Return a structured result and record minimal local diagnostics.

**Internal adapters**

- `OpenFolderAdapter`
- `OpenTerminalAdapter`
- `OpenApplicationAdapter`
- `OpenUrlAdapter`
- `SendHotkeyAdapter`

These are internal seams only where platform behavior genuinely varies or needs fakes in tests. They should not leak into the renderer.

### 3. Action Repository module

**Interface**

```ts
interface ActionRepository {
  list(pilotId: PilotId): PilotAction[];
  get(id: string): PilotAction | null;
  save(input: PilotActionInput): PilotAction;
  reorder(ids: string[]): PilotAction[];
  remove(id: string): void; // soft delete
  restore(id: string): void;
}
```

It owns SQLite migrations, normalized positions, soft delete, and payload serialization. Backup/export/import remain database-level behavior and should not be reimplemented here.

### 4. BrowserPilot module

Extract existing Browser Session, Categories, Archive, and Recovery pages behind one Pilot definition. BrowserPilot continues using the existing browser-session main/preload interfaces during migration. Do not first rewrite storage or the extension.

### 5. Configuration Surface module

Owns editors, validation presentation, file/folder pickers, extension setup, backup, display diagnostics, and pairing. It is a surface, not a Pilot: the same action or Category data may be configured here and used by a Pilot on the touch surface.

## Action model alternatives

### Alternative A: Arbitrary command string

```ts
{ command: "powershell -Command ..." }
```

Flexible but unsafe. Quoting, shell metacharacters, environment expansion, working directory, encoding, and error handling become user-data problems. Imported data becomes executable code. Reject for the first SystemPilot.

### Alternative B: Executable plus free-form argument string

```ts
{ executable: "wt.exe", arguments: "-d C:\\Projects" }
```

Better than one command string but still requires parsing and quoting. It encourages `shell: true` and makes review difficult. Reject as the persisted public model.

### Alternative C: Typed discriminated union

```ts
type PilotActionPayload =
  | { kind: "open-folder"; path: string }
  | { kind: "open-terminal"; path: string; terminal: "windows-terminal" | "powershell" | "cmd" }
  | { kind: "launch-application"; executablePath: string; args: string[]; workingDirectory?: string }
  | { kind: "open-url"; url: string }
  | { kind: "send-hotkey"; modifiers: Array<"Ctrl" | "Alt" | "Shift" | "Win">; key: string; target: "foreground" };
```

Each kind has a validator and adapter. This is the recommended in-memory model.

### Alternative D: Named built-in action catalog only

Users choose `Open Projects`, `Open terminal`, or `Mute` from fixed code-defined actions.

Safest and easiest, but insufficient for custom paths and user-defined hotkeys. Use built-in templates to create typed actions, not as the only model.

## Recommended persisted model

Use a common table with a versioned validated JSON payload:

```sql
CREATE TABLE pilot_actions (
  id TEXT PRIMARY KEY,
  pilot_id TEXT NOT NULL,
  label TEXT NOT NULL,
  icon TEXT NOT NULL,
  action_kind TEXT NOT NULL,
  payload_version INTEGER NOT NULL DEFAULT 1,
  payload_json TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  enabled INTEGER NOT NULL DEFAULT 1,
  confirmation_mode TEXT NOT NULL DEFAULT 'none',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
```

### Why JSON payload instead of one table per action kind

- Common list/order/edit/delete behavior stays simple.
- New built-in kinds do not require many nullable columns.
- Payload versioning supports explicit migrations.
- The JSON is data, not code, and must be parsed into the discriminated union before use.

### Required invariants

- `pilot_id` and `action_kind` must be allowlisted values.
- Payload size is bounded.
- Unknown kind or payload version is disabled, not executed.
- Paths are absolute and normalized during validation.
- `open-url` initially allows only `https:` and optionally `http:`.
- Application arguments are stored as an array, never reparsed from a shell string.
- Every write updates the rolling backup through the existing storage path.
- Removal is a soft delete and is recoverable.
- Import validation must accept the new table while still rejecting unrelated SQLite files.

The current backup validator requires `categories` and `session_tabs`; adding `pilot_actions` must not make old valid DeskPilot backups impossible to import. Migration should create the table after the existing identity check.

## Action execution and security

### Renderer-to-main rule

The Control Surface calls:

```ts
window.deskPilot.actions.execute(actionId)
```

The main process must validate the IPC sender frame and then load the action by ID. Electron's security guidance explicitly recommends validating the sender for privileged IPC and validating protocols before `shell.openExternal`.

### Action-kind matrix

| Kind | Preferred implementation | Validation | Important failure modes | Initial confirmation |
| --- | --- | --- | --- | --- |
| Open folder | `shell.openPath(absolutePath)` | Existing directory; user-selected in Configuration Surface | Missing path; default handler error | None |
| Open terminal at folder | `spawn/execFile("wt.exe", ["-d", path], { shell: false })` with explicit fallback | Existing directory; known terminal enum | Windows Terminal absent; path unavailable | None |
| Launch application | `spawn/execFile(executable, args, { shell: false, cwd })` | Existing executable; bounded args; no shell | Missing binary; elevation; bad working directory | Optional for newly imported action |
| Open URL | `shell.openExternal(validatedUrl)` | Parsed URL; allowlisted scheme/host policy | Custom protocol abuse; malformed URL | None for HTTP(S) |
| Send hotkey | Native helper wrapping `SendInput` | Known key codes; bounded modifiers; foreground target exists | UIPI; stuck modifiers; target changed | Visible target; optional hold |
| Script | Not supported initially | N/A | Arbitrary execution | N/A |

Node's `execFile`/`spawn` avoids a shell by default; `exec` or `shell: true` must never receive unsanitized user input. For Windows Terminal, Microsoft documents `wt.exe -d <directory>` as the supported starting-directory argument.

### Hotkey-specific risks

Hotkeys are more dangerous than their small data shape suggests:

- The command affects the foreground window, not an abstract application.
- A focusable DeskPilot surface may become the target itself.
- The target can change between pointer-down and execution.
- A physical modifier key already held by the user can alter the chord.
- `SendInput` cannot inject into a higher-integrity application from normal DeskPilot.
- Some chords are destructive or stateful in the target application.
- A crash or partial injection must not leave a modifier logically down.

Recommended first contract:

- Control Surface is non-focusable if the hardware proof permits it.
- UI shows `Send to: <foreground process/window>` immediately before execution.
- Main process samples and validates the foreground target at execution time.
- Adapter emits key-downs and corresponding key-ups in one `SendInput` batch.
- Result reports blocked/elevation instead of pretending success.
- Imported hotkeys start disabled until reviewed.
- Dangerous chords can use press-and-hold or explicit confirmation.

Targeting a specific configured window is a separate future action kind because it requires process/window discovery, activation policy, multiple-instance rules, and title instability.

## SystemPilot interaction concepts

### Recommended default view

```text
┌────────────────────────────────────────────────────────────────────────────────────────────┐
│ DeskPilot   [ System ] [ Browser ] [ Apps ] [ Games ]                         Productive ⚙  │
├────────────────────────────────────────────────────────────────────────────────────────────┤
│ SYSTEM                                                                                     │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐       │
│ │ 📁 Projects  │ │ >_ Terminal  │ │ Win Shift S  │ │ Ctrl Alt T   │ │ 🔊 Mute      │       │
│ │ Open folder  │ │ at Projects  │ │ Screenshot   │ │ Current app  │ │ System       │       │
│ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘       │
│                                                                                            │
│ Foreground target: Visual Studio Code                                  [ Configure on PC ] │
└────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Keycap requirements

- Effective target at least 44×44 px with visible spacing.
- Label and optional secondary description; icon alone is insufficient for custom actions.
- Keyboard chords render as actual keycap tokens (`Ctrl` `Shift` `P`), not an opaque string.
- Color communicates state or risk, not arbitrary user decoration.
- Disabled/missing-target actions stay visible with a reason.
- Press produces immediate visual feedback; completion/failure follows asynchronously.
- Reordering and editing belong in Configuration Surface, not behind long-press magic on the runtime surface.
- Consequential actions are separated spatially from frequent harmless actions.

### Pages versus action groups

SystemPilot initially needs one action grid with optional user-named groups such as `Projects`, `Windows`, and `Audio`. Do not turn every group into a Pilot. If groups outgrow the screen, use horizontal pages or a compact group selector within SystemPilot.

## Configuration Surface concept

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│ DeskPilot Configuration                                                     │
├───────────────┬──────────────────────────────────────────────────────────────┤
│ System actions│ Label      [Open Projects________________]                   │
│ Browser       │ Icon       [folder ▾]                                       │
│ Display       │ Type       [Open folder ▾]                                  │
│ Extension     │ Folder     [C:\Projects________________] [Browse…]           │
│ Safety        │ Confirm    [Never ▾]                                        │
│ Pairing       │                                                              │
│               │ [Test safely] [Save] [Remove to Recovery]                   │
└───────────────┴──────────────────────────────────────────────────────────────┘
```

The Configuration Surface can use a taller normal window on a main monitor. It may keep left navigation because the ergonomics differ from the fixed low touch display.

## Relation to ApplicationPilot and GamePilot

Two plausible product interpretations must be grilled:

### Interpretation 1: Pilots are distinct coded workflows

- BrowserPilot has browser-session domain behavior.
- SystemPilot has OS actions.
- ApplicationPilot later integrates with specific application state/protocols.
- GamePilot later integrates launch profiles, overlays, audio/lighting scenes, or game-specific controls.

This preserves strong Pilot meaning but requires implementation for each domain.

### Interpretation 2: ApplicationPilot and GamePilot are declarative action collections

- Both are views over the same typed action engine.
- Users group actions by application/game.
- New built-in action kinds are added only when a real integration needs them.

This is much cheaper and may be enough for a long time, but it risks making the named Pilots cosmetic categories.

Recommended starting position: build SystemPilot and BrowserPilot as real Pilots. Treat Application/Game as disabled roadmap entries or omit them until the Grill session defines outcomes beyond grouped launch/hotkey actions.

## Deployment architecture alternatives

### Same-PC, one Electron process, two windows

Recommended if Research 0028's direct-touch gate passes.

- Main process contains shell-independent host modules.
- Touch Control Surface renders the selected Pilot.
- PC Configuration Surface edits data.
- Preload exposes separate namespaced interfaces appropriate to each surface.
- Both receive change notifications from the same source of truth.

### Same-PC, separate executables

Not recommended initially. It creates process coordination and SQLite ownership problems without improving mouse isolation.

### Separate touch client plus PC host

Required fallback if direct touch moves the mouse or cannot preserve focus.

The same Action Execution module remains valuable. The remote client should invoke an action ID through a separately designed authenticated transport. Do not expose the existing extension bridge to the LAN: its loopback binding and extension-client checks were designed for a different threat model.

### Browser extension as shell

Reject. The extension is ideal for browser context capture and poor as the persistent upper layer for OS, apps, games, display settings, and data recovery.

## Incremental migration plan

### Stage 0: Resolve input topology

- Complete Research 0028 hardware test.
- Choose direct dual-surface or separate-device host/client.
- Do not implement hotkeys until foreground focus semantics are known.

### Stage 1: Extract the visual shell without changing behavior

- Add a fixed internal Pilot registry.
- Introduce `DeskPilotShell` and `BrowserPilot` renderer modules.
- Move current Browser Session/Categories/Archive/Recovery views under BrowserPilot.
- Keep existing main/preload/storage interfaces temporarily.
- Move Display, Extension, Safety, and general settings to a utility/configuration area.

### Stage 2: Add Control and Configuration surfaces

- Add a dedicated touch route/window containing no text editors.
- Add a normal PC configuration route/window.
- Share the same host data and change notifications.
- Preserve existing tray and single-instance behavior.

### Stage 3: Add persisted SystemPilot actions

- Add `pilot_actions` migration and repository module.
- Implement create/list/update/reorder/soft-delete/recovery.
- Include storage smoke coverage, backup restore/import, and old-backup migration.
- Seed example templates only with explicit user confirmation; do not overwrite user actions.

### Stage 4: Add safe action execution

- Implement open-folder and open-terminal adapters first.
- Add typed IPC sender validation.
- Add structured success/blocked/failure results.
- Add launch-app and open-URL after path/protocol validation tests.

### Stage 5: Add hotkeys behind the input gate

- Implement a small native `SendInput` helper.
- Prove non-focusable Control Surface behavior.
- Display foreground target and UIPI failures.
- Test modifier cleanup and target races.

### Stage 6: Consider declarative packs or remote transport

- Add only if a real second adapter/use case exists.
- Keep external content declarative and non-executable.
- Do not add general code plugins.

## Architectural risks and mitigations

| Risk | Consequence | Mitigation |
| --- | --- | --- |
| Shell becomes a giant router with every command | New monolith replaces old `App.tsx` monolith | Shell owns navigation/status only; Pilot and Action modules keep their state/behavior |
| Flat preload keeps growing | Renderer learns every privileged detail | Namespace by domain/surface and keep `execute(actionId)` narrow |
| Arbitrary command strings enter SQLite | Imported data becomes code execution | Typed action kinds, versioned payload validators, no shell strings |
| Hotkey targets DeskPilot | Wrong app receives command | Non-focusable Control Surface, visible foreground target, execution-time check |
| User runs elevated app | Silent hotkey failure | UIPI-aware blocked result; do not elevate DeskPilot globally |
| New action table breaks old backups | Recovery regression | Keep legacy identity check, migrate optional new table, test old and new snapshots |
| External plugins execute with app privileges | Data/process compromise | No external code plugins; declarative data only if later needed |
| Remote client reuses loopback bridge design | LAN command-execution exposure | Separate paired authenticated protocol and explicit opt-in |
| Too many Pilots crowd top nav | Lost discoverability | Five-primary-item limit, deliberate overflow, Grill before adding each Pilot |
| SystemPilot becomes generic launcher | Product loses workflow focus | Require each action/group to support a defined PC-helper workflow |

## Decisions recommended before implementation

1. DeskPilot is the shell/product; BrowserPilot is the current browser domain.
2. Use `SystemPilot` in architecture and `System` as the UI label.
3. Start with persistent top navigation.
4. Use a compile-time internal registry.
5. Do not build code plugins or manifests initially.
6. Separate touch runtime and PC configuration surfaces.
7. Persist actions in SQLite with soft deletion and backup coverage.
8. Use typed built-in actions; no arbitrary scripts initially.
9. Execute by stored action ID in the main process.
10. Defer foreground hotkeys until the input-isolation gate is resolved.

## Grill questions

### Product meaning

1. Is a Pilot a distinct workflow with unique behavior, or can it be only a named collection of actions?
2. What does ApplicationPilot do that a SystemPilot group named after an application cannot do?
3. What does GamePilot do beyond launch + hotkeys + future lighting/audio scenes?
4. Should Apps and Games appear disabled in navigation before they have real outcomes, or remain absent?
5. Is a future Home/dashboard desired, and if so what unique decision does it help the user make?

### Navigation

6. Top bar, bottom dock, or left rail for the actual under-monitor posture?
7. Should Pilot labels always be visible, or are icon-only states acceptable?
8. What is the maximum number of primary Pilots before the product needs an overflow decision?
9. Should Settings be permanently visible or available only from the PC Configuration Surface?
10. Should BrowserPilot remember its last internal page when switching Pilots?

### SystemPilot actions

11. Are the first three kinds—folder, terminal-at-folder, foreground hotkey—sufficient for the first useful slice?
12. Should launching applications be in SystemPilot or reserved for ApplicationPilot?
13. Are user-supplied application arguments required, or can the first version launch only an executable/path?
14. Is arbitrary scripting ever a product requirement? If yes, what explicit trust/confirmation model is acceptable?
15. Should actions be single-step only, or are multi-step scenes/workflows essential?
16. Should failed/missing paths remain visible for repair or be hidden automatically? This report recommends visible-disabled.

### Hotkey targeting

17. Does a hotkey always target the current foreground window?
18. Is a configured target application required?
19. Must DeskPilot work with elevated applications? Elevating the whole resident app is not recommended.
20. Which chords are dangerous enough to require hold-to-run or confirmation?
21. Should the current target window name always be shown on the Control Surface?

### Data and sharing

22. Should action layout be included in existing SQLite backup/export? This report recommends yes.
23. Should users be able to export/import declarative action packs later?
24. Are machine-specific paths acceptable in backups restored on another PC?
25. Should missing paths support environment-variable templates, known folders, or explicit per-machine rebinding?
26. Is multi-controller support needed if the separate-device architecture is chosen?

### Architecture appetite

27. Is the project comfortable with a small native helper for `SendInput`?
28. Should the first refactor extract BrowserPilot before adding visible SystemPilot UI, or can a tracer-bullet SystemPilot be added alongside the current monolith?
29. How much temporary duplication between old and new routes is acceptable during migration?
30. Which action/audit history, if any, is useful without becoming surveillance or a large log-management feature?

## Follow-up ticket candidates

Do not create these until the Grill session confirms direction.

1. Extract `DeskPilotShell` and register BrowserPilot through a fixed internal registry.
2. Move cross-product utilities out of BrowserPilot navigation.
3. Add separate touch Control and PC Configuration windows/routes.
4. Add recoverable `pilot_actions` SQLite storage and migration tests.
5. Implement SystemPilot keycap grid and Configuration Surface editor.
6. Implement open-folder action through validated `shell.openPath`.
7. Implement terminal-at-folder action through `wt.exe -d` with safe fallbacks.
8. Implement launch-app and HTTP(S)-URL actions with typed validation.
9. Build native `SendInput` helper and foreground-target safety tests.
10. Add action recovery and ensure old/new backup import compatibility.
11. If selected, prototype paired remote Control Surface transport.
12. Only after real demand, research declarative action-pack import/export.

## Sources

### Navigation and touch design

- Microsoft Learn: [`NavigationView`](https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/navigationview) — top navigation guidance for five or fewer equally important destinations and adaptive alternatives.
- Microsoft Learn: [Touch interactions](https://learn.microsoft.com/en-us/windows/apps/develop/input/touch-interactions) — target sizing, feedback, spacing, and touch-keyboard viewport impact.
- Microsoft Learn: [Guidelines for touch targets](https://learn.microsoft.com/en-us/windows/apps/develop/input/guidelines-for-targeting) — physical target sizing and increased protection for consequential actions.
- Microsoft Learn: [Commanding in Windows apps](https://learn.microsoft.com/en-us/windows/apps/develop/ui/controls/commanding) — reusable commands across multiple input surfaces.

### Electron and process security

- Electron: [Security](https://www.electronjs.org/docs/latest/tutorial/security) — context isolation, IPC sender validation, and external protocol validation.
- Electron: [`shell`](https://www.electronjs.org/docs/latest/api/shell) — `openPath`, `showItemInFolder`, and `openExternal` behavior.
- Electron: [`BrowserWindow`](https://www.electronjs.org/docs/latest/api/browser-window) and [`BaseWindow`](https://www.electronjs.org/docs/latest/api/base-window) — multiple windows, focusability, and supported native window controls.
- Node.js: [`child_process`](https://nodejs.org/docs/latest-v22.x/api/child_process.html) — direct process spawning, `execFile`, shell behavior, and unsanitized-input warnings.

### Windows actions

- Microsoft Learn: [Windows Terminal command-line arguments](https://learn.microsoft.com/en-us/windows/terminal/command-line-arguments) — `wt.exe` and `-d` starting directory.
- Microsoft Learn: [`SendInput`](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendinput) — serialized input injection, current key-state caveats, and UIPI limits.
