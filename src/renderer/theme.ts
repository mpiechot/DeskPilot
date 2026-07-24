export type ThemeAnimation = Readonly<{
  durationMs: number;
  easing: string;
}>;

export type ThemeSound = Readonly<{
  asset: string;
  volume: number;
}>;

export type OptionalThemeEffect<T> = T | "disabled";
export type OptionalThemeEffectOverride<T> = T | "disabled" | "off";

const defaultThemePresentation = {
  "font-family-body":
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  "font-synthesis": "none",
  "text-rendering": "optimizeLegibility",
  "font-size-2xs": "0.56rem",
  "font-size-xs": "0.6rem",
  "font-size-sm": "0.68rem",
  "font-size-sm-emphasis": "0.7rem",
  "font-size-caption": "0.72rem",
  "font-size-caption-strong": "0.74rem",
  "font-size-control": "0.76rem",
  "font-size-label": "0.78rem",
  "font-size-body-small": "0.8rem",
  "font-size-body-compact": "0.82rem",
  "font-size-body-medium": "0.84rem",
  "font-size-body": "0.86rem",
  "font-size-body-relaxed": "0.88rem",
  "font-size-title-secondary": "1rem",
  "font-size-title": "1.45rem",
  "font-size-empty-state": "clamp(2rem, 5vw, 3.4rem)",
  "font-size-settings-title": "clamp(2rem, 5vw, 3rem)",
  "font-weight-strong": "700",
  "font-weight-control": "800",
  "font-weight-emphasis": "900",
  "line-height-tightest": "1",
  "line-height-title": "1.1",
  "line-height-compact": "1.15",
  "line-height-heading": "1.2",
  "line-height-copy-compact": "1.3",
  "line-height-copy": "1.35",
  "line-height-copy-relaxed": "1.4",
  "line-height-empty-state": "1.55",
  "letter-spacing-brand": "0.04em",
  "letter-spacing-eyebrow": "0.08em",
  "text-case-eyebrow": "uppercase",
  "border-width": "1px",
  "focus-outline-width": "3px",
  "focus-outline-offset": "2px",
  "radius-compact": "6px",
  "radius-small": "7px",
  "radius-control": "8px",
  "radius-toast": "10px",
  "radius-surface": "14px",
  "radius-illustration": "15px",
  "radius-navigation": "18px",
  "radius-empty-state": "20px",
  "radius-pill": "999px",
  "state-dragging-opacity": "0.46",
  "color-text": "#22252a",
  "color-heading": "#1c2025",
  "color-heading-secondary": "#20242a",
  "color-text-strong": "#27312d",
  "color-text-muted": "#5c625d",
  "color-text-subtle": "#6d726c",
  "color-text-control": "#4f5852",
  "color-text-disabled": "#8a8d88",
  "color-text-on-dark": "#fffaf0",
  "color-text-on-navigation": "#dcecdf",
  "color-text-on-navigation-muted": "#b9d1be",
  "color-text-on-navigation-strong": "#f2faef",
  "color-text-on-navigation-warning": "#f0d79c",
  "color-text-body-strong": "#26312a",
  "color-text-accent-strong": "#1f3a2c",
  "color-text-accent": "#243d32",
  "color-text-accent-muted": "#315a43",
  "color-text-accent-soft": "#2e493d",
  "color-text-accent-subtle": "#65806b",
  "color-icon-accent": "#789282",
  "color-text-warning": "#70480c",
  "color-text-warning-muted": "#7c5620",
  "color-text-warning-strong": "#5f4317",
  "color-text-danger": "#70352d",
  "color-text-danger-strong": "#7c2f27",
  "surface-canvas": "#f5f1e8",
  "surface-canvas-gradient-start": "rgba(245, 241, 232, 0.96)",
  "surface-canvas-gradient-end": "rgba(229, 235, 230, 0.96)",
  "surface-navigation-start": "#294438",
  "surface-navigation-end": "#1f342b",
  "surface-navigation-control": "rgba(255, 250, 240, 0.08)",
  "surface-navigation-selected": "#426850",
  "surface-brand": "#dcecdf",
  "surface-accent": "#e7efe5",
  "surface-accent-secondary": "#e5f0e5",
  "surface-accent-strong": "#26352f",
  "surface-panel": "#fffaf0",
  "surface-panel-soft": "rgba(255, 250, 240, 0.62)",
  "surface-panel-raised": "rgba(255, 250, 240, 0.72)",
  "surface-panel-subtle": "rgba(255, 250, 240, 0.76)",
  "surface-panel-card": "rgba(255, 250, 240, 0.78)",
  "surface-panel-tab": "rgba(255, 250, 240, 0.82)",
  "surface-panel-opaque": "rgba(255, 250, 240, 0.9)",
  "surface-accent-soft": "rgba(231, 239, 229, 0.66)",
  "surface-accent-raised": "rgba(231, 239, 229, 0.72)",
  "surface-warning": "#fff0d2",
  "surface-warning-muted": "#f0e4c7",
  "surface-warning-soft": "rgba(240, 228, 199, 0.78)",
  "surface-danger": "#f8dfda",
  "surface-disabled": "#ebe4d8",
  "border-navigation": "#1b3026",
  "border-navigation-control": "rgba(205, 232, 211, 0.42)",
  "border-navigation-selected": "#c2e2c9",
  "border-brand": "#90b29b",
  "border-content": "#b6c8b9",
  "border-accent": "#789282",
  "border-accent-soft": "#b9c9b8",
  "border-accent-muted": "#c3d5c6",
  "border-section": "#c5d2c5",
  "border-control": "#c9c0b2",
  "border-panel": "#d2cabc",
  "border-subtle": "#d7d0c2",
  "border-card": "#d8d1c3",
  "border-note": "#d9d1c3",
  "border-danger": "#d0b6ad",
  "border-danger-strong": "#c67f77",
  "border-warning": "#c99b55",
  "border-warning-muted": "#c7a35c",
  "focus-ring": "rgba(66, 104, 80, 0.3)",
  "selection-ring": "rgba(69, 103, 83, 0.18)",
  "shadow-navigation": "0 10px 24px rgba(31, 52, 43, 0.2)",
  "shadow-brand": "0 2px 8px rgba(13, 31, 23, 0.18)",
  "shadow-navigation-selected":
    "0 0 0 3px rgba(194, 226, 201, 0.2), 0 3px 10px rgba(13, 31, 23, 0.22)",
  "shadow-toast": "0 8px 24px rgba(39, 49, 45, 0.16)",
  "shadow-control": "0 4px 14px rgba(31, 52, 43, 0.18)"
} as const;

export type ThemePresentationToken = keyof typeof defaultThemePresentation;
export type ThemePresentation = Readonly<Record<ThemePresentationToken, string>>;

export type ThemeAssetId =
  | "brand-dp"
  | "browser-pilot"
  | "keyboard"
  | "lightbulb"
  | "settings";

export type ThemeAssets = Readonly<{
  brand: ThemeAssetId;
  settingsTheme: ThemeAssetId;
  navigation: Readonly<{
    browser: ThemeAssetId;
    desktop: ThemeAssetId;
    environment: ThemeAssetId;
    settings: ThemeAssetId;
  }>;
}>;

export type ThemeEffects = Readonly<{
  animations: Readonly<{
    toastEntrance: OptionalThemeEffect<ThemeAnimation>;
  }>;
  sounds: Readonly<{
    notification: OptionalThemeEffect<ThemeSound>;
  }>;
}>;

export type ResolvedTheme = Readonly<{
  id: string;
  name: string;
  presentation: ThemePresentation;
  assets: ThemeAssets;
  effects: ThemeEffects;
}>;

export type ThemeOverlay = Readonly<{
  id?: string;
  name?: string;
  presentation?: Partial<ThemePresentation>;
  assets?: Readonly<{
    brand?: ThemeAssetId;
    settingsTheme?: ThemeAssetId;
    navigation?: Partial<ThemeAssets["navigation"]>;
  }>;
  effects?: Readonly<{
    animations?: Readonly<{
      toastEntrance?: OptionalThemeEffectOverride<ThemeAnimation>;
    }>;
    sounds?: Readonly<{
      notification?: OptionalThemeEffectOverride<ThemeSound>;
    }>;
  }>;
}>;

const defaultThemeValue: ResolvedTheme = {
  id: "default",
  name: "Default Theme",
  presentation: defaultThemePresentation,
  assets: {
    brand: "brand-dp",
    settingsTheme: "lightbulb",
    navigation: {
      browser: "browser-pilot",
      desktop: "keyboard",
      environment: "lightbulb",
      settings: "settings"
    }
  },
  effects: {
    animations: {
      toastEntrance: "disabled"
    },
    sounds: {
      notification: "disabled"
    }
  }
};

function resolveOptionalEffect<T>(
  override: OptionalThemeEffectOverride<T> | undefined,
  fallback: OptionalThemeEffect<T>
): OptionalThemeEffect<T> {
  if (override === undefined) {
    return fallback;
  }

  return override === "off" ? "disabled" : override;
}

export const defaultTheme = resolveTheme();
export const availableThemes: readonly ResolvedTheme[] = [defaultTheme];

export function resolveTheme(overlay: ThemeOverlay = {}): ResolvedTheme {
  return {
    id: overlay.id ?? defaultThemeValue.id,
    name: overlay.name ?? defaultThemeValue.name,
    presentation: {
      ...defaultThemeValue.presentation,
      ...overlay.presentation
    },
    assets: {
      brand: overlay.assets?.brand ?? defaultThemeValue.assets.brand,
      settingsTheme: overlay.assets?.settingsTheme ?? defaultThemeValue.assets.settingsTheme,
      navigation: {
        ...defaultThemeValue.assets.navigation,
        ...overlay.assets?.navigation
      }
    },
    effects: {
      animations: {
        toastEntrance: resolveOptionalEffect(
          overlay.effects?.animations?.toastEntrance,
          defaultThemeValue.effects.animations.toastEntrance
        )
      },
      sounds: {
        notification: resolveOptionalEffect(
          overlay.effects?.sounds?.notification,
          defaultThemeValue.effects.sounds.notification
        )
      }
    }
  };
}

export function themeToCssCustomProperties(theme: ResolvedTheme): Record<`--theme-${string}`, string> {
  return Object.fromEntries(
    Object.entries(theme.presentation).map(([token, value]) => [`--theme-${token}`, value])
  ) as Record<`--theme-${string}`, string>;
}
