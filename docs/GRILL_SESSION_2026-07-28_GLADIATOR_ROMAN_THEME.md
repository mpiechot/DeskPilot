# Grill Session: Gladiator/Roman Theme

- Date: 2026-07-28
- Status: In progress
- Ticket: #41
- Parent: #34 declarative Default Theme foundation

This is a visual Theme specification for the existing DeskPilot product. It must not change DeskPilot's features, workflows, data model, navigation responsibilities, copy semantics or interaction behavior.

## Confirmed decisions

### Visual core

- The direction is primarily classical Roman rather than arena-focused gladiator styling.
- Material and form references may include stone, bronze, parchment, laurel and restrained engraving.
- Gladiator references remain subtle accents rather than the dominant visual language.
- The Theme must not introduce game semantics such as quests, progression, scoring, rewards, combat states or levels.

### Color and mood

- The foundation uses dark warm red-brown and charcoal tones.
- Primary work surfaces use aged ivory for readability and sustained daily use.
- Muted bronze is an accent rather than a dominant metallic effect.
- The overall mood is dignified and calm, not bloody, ostentatious or militaristic.

### Shell and Pilot separation

- The DeskPilot-Rahmen (DeskPilot Shell) keeps the strongest Roman identity as a stable visual frame.
- Shell-owned brand, navigation, profile metadata and global Settings affordances may use the darkest surfaces, stronger material contrast and the clearest Roman accents.
- Pilot surfaces remain calmer and task-focused, using the same Theme but with less ornament and lower visual intensity.
- Roman ornaments remain largely confined to the DeskPilot-Rahmen; Pilot surfaces are predominantly ornament-free.
- The Theme must make the Shell and the active Pilot visibly distinct without changing either one's responsibilities or interaction behavior.

### Typography

- A characterful classical serif is reserved for DeskPilot branding and large headings.
- Functional content uses a neutral sans-serif, including body copy, navigation, buttons, URLs and status messages.
- Decorative or engraved lettering must not reduce legibility or become the default UI typeface.

### Icons and assets

- Existing functional icons retain their clear semantic forms.
- Theme changes may affect icon color, stroke treatment, framing and selected brand or DeskPilot-Rahmen assets, giving the icons a Roman visual treatment without changing their meaning.
- Roman motifs such as shields, helmets, swords or laurel are decorative additions only; they do not replace functional icons.

### State treatment

- Success, warning, error, disabled, selected and informational states may use Roman-theme-specific colors instead of copying the Default Theme palette.
- State colors should feel materially coherent with the Theme, for example through patina, antique gold, oxblood, stone or slate variants.
- State meaning must remain clear through semantic role, sufficient contrast, text, icon and border treatment; color or ornament alone is insufficient.
- Theme adaptation must not change the underlying state meaning or the existing user flow.

### State palette direction

- Success may use patinated green or olive.
- Warning may use antique gold or ochre.
- Error may use oxblood red or terracotta.
- Informational states may use cool stone or slate gray.

### Material treatment

- Frames and panels must look materially Roman, not merely recolored.
- Possible cues include restrained relief, inset lines, layered stone-like surfaces and selective bronze edging.
- Material cues must remain quiet enough for everyday browser-session work and must not turn controls into decorative objects that obscure their affordance.
- The visual treatment should use controlled flat UI techniques such as lines, edges, shadows and layering.
- Avoid complex textures, photorealistic materials and heavy 3D or skeuomorphic effects.

### Form language

- The visual vocabulary is primarily civic and architectural: arches, plaques, laurel and inscriptions.
- Military or gladiator motifs remain rare accents rather than structural UI language.
- Frames and cards may use moderate chamfered corners and clear plaque-like geometry instead of strongly rounded default cards.
- Geometry must preserve existing touch targets, hit areas and responsive behavior.

### Empty states

- Existing empty-state copy and actions remain unchanged.
- Empty states may receive a small decorative Roman line or frame treatment, such as a restrained laurel fragment, arch line or stone plaque.
- Empty-state decoration must remain secondary to the explanation and next action; it must not imply a new feature or game state.

### Navigation

- Pilot Navigation remains the existing icon-only navigation and keeps its existing destinations and behavior; the Theme introduces no navigation logic.
- The navigation belongs to the Roman visual frame: dark warm surfaces, restrained edge treatment and selective bronze/ivory emphasis may establish the hierarchy.
- The selected destination should be unmistakable through more than color alone, using surface, border, icon and accessible state together.
- Global Settings remains visually part of the DeskPilot-Rahmen while remaining distinct from the Pilot group.

### Icon treatment

- Navigation icons keep their familiar silhouettes and semantic meaning.
- Roman treatment may use stronger engraved/relief-like line work, bronze/ivory contrast and restrained plaque or frame forms.
- The treatment must not make an icon look like a different action.

### Product branding boundary

- The identity of the complete DeskPilot product mark is not decided in this Theme Grill.
- The separate product-logo and application-icon Grill is tracked in #54.
- This Theme may later provide a declarative Roman presentation treatment for the resolved DeskPilot Product Mark, but it must not define or replace that identity.

## Accessibility

- Decorative material, state colors and icon treatment must not reduce text, control or focus visibility.
- Text and controls should meet the project's normal accessible contrast target; the Roman palette is not an exemption.
- Keyboard focus remains prominent through a dedicated high-contrast ring or edge treatment, not a subtle color shift.
- Selected, disabled and stateful controls remain distinguishable without relying on color alone.
- Reduced-motion preferences override any optional transition.

## Implementation and assets

- The Theme must be able to control the complete DeskPilot presentation through the declarative Theme system: colors, typography, surfaces, borders, shadows, component states, icon treatment, decorative assets and optional motion or sound policy.
- Every Theme uses the same component structure and presentation contract.
- A Theme may provide declarative token and asset values only; it may not add React components, feature behavior, navigation behavior or workflow semantics.
- The Roman Theme must therefore be expressible through an expanded, complete semantic token and asset vocabulary rather than one-off CSS or component exceptions.

## Motion and sound

- The Theme is silent: no notification sounds or decorative Roman sound effects.
- The Theme is mostly still: no decorative animations or dramatic effects.
- Short existing functional UI transitions may remain, with full `prefers-reduced-motion` support.
- Future expansion is possible, but this Theme does not require new sound or animation infrastructure now.

## Scope guardrails

- Existing DeskPilot controls retain their meaning and behavior.
- Theme values map onto existing declarative semantic tokens and assets.
- Responsive geometry remains owned by DeskPilot and is not defined by the Theme.
- The Theme must remain usable for everyday browser-session management.

## Open questions

- What emotional register should the material palette establish while remaining readable and calm?
- How prominently should Roman decorative motifs appear in navigation, panels and empty states?
- Which typography and icon treatment best express the direction without reducing clarity?
- Which states need distinct visual treatments, and how do those treatments preserve existing semantics?
- Are animation and sound needed, or should the Theme remain still and silent?
- Which assets are genuinely required, and which can be expressed through existing Theme tokens?
