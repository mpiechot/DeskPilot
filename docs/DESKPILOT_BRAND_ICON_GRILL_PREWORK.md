# DeskPilot Brand Icon Grill — Prework

- Date: 2026-07-28
- Status: Prework for a new product-identity Grill ticket
- Scope: DeskPilot product logo and application icon only
- Explicitly out of scope: Category icons, Pilot icons, action/hotkey icons and the shared semantic icon vocabulary in #47

## Current baseline

- The DeskPilot-Rahmen currently renders a readable `DP` lettermark.
- The browser extension ships a rounded-square icon containing a browser-window glyph. That asset is operationally useful, but its metaphor is closer to BrowserPilot than to the complete DeskPilot product.
- The Windows tray, installer and shortcut use packaged icon assets that must be treated as consumers of the eventual product mark, not as the design definition itself.
- The Roman Theme Grill may later provide a presentation treatment for the product mark, but it must not decide the product identity alone.

## Candidate families to evaluate without preselecting a winner

### Wordmark

Use `DeskPilot` as the primary identity, possibly with a distinctive typographic treatment.

- Strengths: explicit name, strong large-format branding, no invented metaphor.
- Risks: weak at small icon sizes, poor fit for tray/taskbar surfaces without a companion mark.

### Lettermark or monogram

Use `D`, `P` or a constructed `DP` as a compact mark.

- Strengths: compact, recognizable in small system surfaces, compatible with the existing brand tile.
- Risks: initials can be generic; `DP` may need a distinctive construction to avoid looking like plain text.

### Abstract geometric mark

Build a unique symbol from geometry such as planes, frames, paths, docking points or interlocking forms, without literal letters or a direct product metaphor.

- Strengths: can be distinctive and theme-flexible; scales well if kept simple.
- Risks: meaning must be learned; arbitrary geometry can become decoration without identity.

### Product metaphor

Use one carefully chosen visual metaphor for DeskPilot as a whole, such as a control surface, a guided route, a desk station or a coordinated set of panels.

- Strengths: can communicate the product promise without text.
- Risks: browser-window imagery collapses the brand into BrowserPilot; multiple metaphors quickly become cluttered.

### Architectural or emblematic mark

Use a seal, plaque, architectural frame, compass-like arrangement or other emblematic construction.

- Strengths: supports a durable product identity and can work with the Roman Theme without requiring it.
- Risks: can become heraldic, militaristic, ornamental or too detailed; needs strong small-size simplification.

### Combination mark

Use a symbol with the `DeskPilot` wordmark, with responsive variants for large branding and small system surfaces.

- Strengths: combines explicit naming with a compact mark; supports the full product identity and small icons.
- Risks: requires a coherent relationship between symbol and wordmark, not two unrelated assets.

### Other candidates

The Grill must remain free to introduce a better family if the research uncovers one. The list above is a starting search space, not a closed menu.

## Evaluation frame

Every candidate family should be checked against the same situations:

- 16/32 px tray or extension contexts;
- 48/128 px app and shortcut contexts;
- large DeskPilot branding in the application shell and installer imagery;
- light, dark and high-contrast presentation;
- monochrome reproduction and one-color fallback;
- recognition without the word `DeskPilot` nearby;
- distinction from BrowserPilot, Category icons and action icons;
- theme-neutral core with optional Theme presentation treatments;
- Windows packaging and icon-asset requirements;
- accessibility, legibility and licensing/originality concerns.

## Research guardrail

The prework must compare the candidate families and expose trade-offs before recommending anything. It must not quietly converge on `DP`, a browser metaphor, a Roman emblem or any other single answer before the Grill has evaluated the alternatives.

## Reference principles

- [Apple Human Interface Guidelines: App icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
- [Apple Human Interface Guidelines: Icons](https://developer.apple.com/design/human-interface-guidelines/icons)
- [Microsoft Windows app icon design guidelines](https://learn.microsoft.com/en-us/windows/apps/design/iconography/app-icon-design)
- [Microsoft Windows app icon construction](https://learn.microsoft.com/en-us/windows/apps/design/iconography/app-icon-construction)

These references support the prework constraints around simple silhouettes, small-size legibility, limited metaphors, light/dark variants, contrast and platform-specific asset sizes. They do not select DeskPilot's identity.
