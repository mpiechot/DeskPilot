# Grill Session: Gladiator/Roman Theme

- Date: 2026-07-28
- Status: Decision-complete
- Ticket: #41
- Parent: #34 declarative Default Theme foundation

This is a purely visual Theme specification for the existing DeskPilot product. It must not change features, workflows, data, navigation responsibilities, copy semantics or interaction behavior.

## Confirmed decisions

### Direction and mood

- The direction is classical Roman first, not arena-focused gladiator styling.
- The visual vocabulary is civic and architectural: arches, plaques, laurel, inscriptions, stone, bronze, parchment and restrained engraving.
- Military or gladiator motifs remain rare accents.
- The mood is dignified and calm, not bloody, ostentatious or militaristic.
- The Theme must not introduce quests, progression, scoring, rewards, combat states or levels.

### Palette

- Foundation: dark warm red-brown and charcoal.
- Work surfaces: aged ivory for sustained readability.
- Accent: muted bronze, not dominant metallic effects.
- Theme-specific state colors are allowed: patinated green/olive for success, antique gold/ochre for warning, oxblood/terracotta for error and stone/slate for information.
- State meaning remains clear through role, contrast, text, icon and border; color or ornament alone is insufficient.

### DeskPilot-Rahmen and Pilot surfaces

- The outer DeskPilot-Rahmen carries the strongest Roman identity: brand, Pilot Navigation, profile metadata and global Settings boundary.
- Pilot surfaces use the same Theme but remain calmer, task-focused and largely ornament-free.
- The visual treatment must distinguish the DeskPilot-Rahmen from the active Pilot without changing responsibilities or behavior.

### Typography and icons

- Classical serif typography is limited to DeskPilot branding and large headings.
- Functional content uses a neutral sans-serif: body copy, navigation, controls, URLs and statuses.
- Functional icons retain their familiar semantic silhouettes.
- Roman treatment may use engraved/relief-like line work, bronze/ivory contrast and restrained plaque or frame forms; it must not change an icon's meaning.
- Product-logo identity is deferred to the separate product-logo Grill in #54. This Theme may later style the resolved product mark but does not define it.

### Surfaces and form language

- Frames and panels must look materially Roman, not merely recolored.
- Use controllable flat UI techniques: inset lines, restrained relief, layered surfaces, selective bronze edging and low shadows.
- Moderate chamfered/plaque-like geometry may replace strongly rounded default cards.
- No complex textures, photorealistic materials, heavy 3D or skeuomorphic effects.
- Geometry must preserve existing touch targets, hit areas and responsive behavior.

### States and empty surfaces

- Existing state meaning, copy and actions remain unchanged.
- Empty states may receive a small decorative Roman line or frame treatment, such as a restrained laurel fragment, arch line or stone plaque.
- Decoration remains secondary to explanation and next action and must not imply a new feature or game state.
- Selected, disabled, error, warning, success and informational states remain distinguishable without color alone.

### Navigation, accessibility and motion

- Pilot Navigation remains icon-only with the same destinations and behavior; the Theme introduces no navigation logic.
- The selected destination uses surface, border, icon and accessible state together, not color alone.
- Text and controls retain the project's normal accessible contrast target.
- Keyboard focus uses a clearly visible high-contrast ring or edge treatment.
- The Theme is silent and mostly still. Only restrained existing functional transitions may remain, with `prefers-reduced-motion` support.

### Theme system boundary

- The Theme must control the complete presentation through the shared declarative system: colors, typography, surfaces, borders, shadows, states, icon treatment, decorative assets and optional effect policy.
- Every Theme uses the same component structure and presentation contract.
- No Theme may add React components, feature code, navigation behavior or workflow semantics.
- The Roman Theme therefore requires a complete semantic token and asset vocabulary, not one-off CSS or component exceptions.
- The Roman Theme is a sparse overlay on the complete Default Theme.
- Every omitted Roman Theme value automatically inherits the corresponding Default Theme value.
- Only an explicit `off` or `disabled` value suppresses an inherited optional animation or sound; omission never disables by accident.

### Final surface hierarchy

- DeskPilot-Rahmen: dark, strongest Roman materiality.
- Pilot work surface: aged ivory, calm and functional.
- Panels and cards: warm stepped surfaces with moderate plaque edges.
- Controls: clearer edges; bronze reserved for accent and focus.
- States: Theme-specific semantic colors with preserved text, icon, border and contrast support.

## Resulting implementation slices

### Slice A — Complete the declarative Theme contract

- Expand the shared semantic token and asset vocabulary so all presentation decisions above are Theme-controlled.
- Keep the Default Theme complete and deterministic.
- Preserve sparse-overlay inheritance: omitted values resolve from Default Theme; explicit `off`/`disabled` disables only optional effects.
- Add focused fallback, accessibility and renderer coverage.

### Slice B — Implement the Roman Theme overlay

- Add the Roman palette, five-level surface hierarchy, typography, icon treatment, material edges, state colors and restrained empty-state decoration through declarative values/assets.
- Keep all existing DeskPilot behavior, geometry, copy and component structure unchanged.
- Verify light/dark/monochrome/high-contrast presentation, focus visibility, reduced motion and small surfaces.

These are implementation follow-ups, not additional product features.

## Deferred

- DeskPilot product-logo identity: #54.
- Category, Pilot and action icon vocabulary: #47.
