import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultTheme,
  resolveTheme,
  themeToCssCustomProperties,
  type ThemeAnimation,
  type ThemeSound
} from "../src/renderer/theme.js";

test("the Default Theme is a complete deterministic fallback", () => {
  const resolvedWithoutOverlay = resolveTheme();

  assert.deepEqual(resolvedWithoutOverlay, defaultTheme);
  assert.equal(resolvedWithoutOverlay.effects.animations.toastEntrance, "disabled");
  assert.equal(resolvedWithoutOverlay.effects.sounds.notification, "disabled");
});

test("an empty Theme behaves exactly like the Default Theme", () => {
  assert.deepEqual(resolveTheme({}), defaultTheme);
});

test("a sparse Theme inherits every omitted presentation and asset value", () => {
  const resolved = resolveTheme({
    id: "future-theme",
    name: "Future Theme",
    presentation: {
      "color-text": "#010203"
    },
    assets: {
      navigation: {
        browser: "lightbulb"
      }
    }
  });

  assert.equal(resolved.presentation["color-text"], "#010203");
  assert.equal(resolved.presentation["surface-canvas"], defaultTheme.presentation["surface-canvas"]);
  assert.equal(resolved.assets.navigation.browser, "lightbulb");
  assert.equal(resolved.assets.navigation.desktop, defaultTheme.assets.navigation.desktop);
});

test("off and disabled explicitly suppress optional animation and sound values", () => {
  const inheritedAnimation: ThemeAnimation = { durationMs: 180, easing: "ease-out" };
  const inheritedSound: ThemeSound = { asset: "notification.wav", volume: 0.4 };
  const withEffects = resolveTheme({
    effects: {
      animations: { toastEntrance: inheritedAnimation },
      sounds: { notification: inheritedSound }
    }
  });
  const disabled = resolveTheme({
    effects: {
      animations: { toastEntrance: "off" },
      sounds: { notification: "disabled" }
    }
  });

  assert.deepEqual(withEffects.effects.animations.toastEntrance, inheritedAnimation);
  assert.deepEqual(withEffects.effects.sounds.notification, inheritedSound);
  assert.equal(disabled.effects.animations.toastEntrance, "disabled");
  assert.equal(disabled.effects.sounds.notification, "disabled");
});

test("theme CSS variables contain presentation only and exclude responsive geometry", () => {
  const cssProperties = themeToCssCustomProperties(defaultTheme);
  const propertyNames = Object.keys(cssProperties);

  assert.equal(propertyNames.length, Object.keys(defaultTheme.presentation).length);
  assert.equal(cssProperties["--theme-color-text"], defaultTheme.presentation["color-text"]);
  assert.equal(cssProperties["--theme-font-family-body"], defaultTheme.presentation["font-family-body"]);
  assert.equal(
    propertyNames.some((name) =>
      /^--theme-(?:layout|responsive|width|height|gap|padding|breakpoint)(?:-|$)/i.test(name)
    ),
    false
  );
});
