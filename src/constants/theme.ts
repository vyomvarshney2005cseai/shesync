import { StyleSheet } from 'react-native';

/**
 * SheSync design tokens — "Soft Bloom".
 *
 * Every colour has a light and a dark value. Dark mode sits on deep slate
 * (never pure black) with lighter surfaces for higher elevation:
 *   background #0F172A → card #1E293B → raised #273449.
 * Text and interactive colours meet WCAG AA (4.5:1) on the page, card and
 * muted surfaces in both modes (checked in tests/unit/round8.test.ts).
 *
 * Spacing follows an 8-point grid with 4-point half steps; radius and type
 * come from the small scales below. Cards use a 1px border, not shadows.
 */
const LIGHT_COLORS = {
  // Surfaces
  background: '#FBF8FA', // page
  backgroundAlt: '#F7F2F5', // subtle page tint
  backgroundMuted: '#F4EEF2', // chips, tracks, input wells
  card: '#FFFFFF', // surface (level 1)
  cardGlass: '#FFFFFE', // translucent surfaces in old code — now solid
  surfaceRaised: '#FFFFFD', // sheets, menus, pressed rows (level 2)
  cardBorder: '#E8DEE5', // 1px card and input borders
  cardBorderLight: '#F0E8EE', // hairline dividers
  borderStrong: '#CDBDC8', // selected outlines, focus-adjacent borders

  // Accent — dusty rose (white text on it ≥ 5.9:1)
  primary: '#B0346B',
  primaryDark: '#962A5A', // hover / pressed / strong accent text
  primaryLight: '#FBEAF2', // soft accent background
  primaryGlow: 'rgba(176, 52, 107, 0.18)',
  onPrimary: '#FFFFFF',

  // Second accent — lavender
  secondary: '#6447B0',
  secondaryDark: '#523896',
  secondaryLight: '#F1EDFB',
  secondaryBorder: '#DCD3F3',

  // Text
  textPrimary: '#221A29',
  textSecondary: '#544A5E',
  textTertiary: '#6B6175',
  textRose: '#9C2D5E',
  textLilac: '#523896',

  // Status (each works as text on white and as a fill under white text)
  strainHigh: '#B8324F',
  strainAmber: '#9A5A00',
  strainOptimal: '#1D7457',
  strainTeal: '#1C6A86',
  danger: '#B42318',
  dangerLight: '#FDECEC',
  warningLight: '#FFF4DD',
  successLight: '#E6F4EE',
  infoLight: '#E6F1F6',

  // Brand tints
  welcomePink: '#FDEFF5',
  welcomePinkDark: '#F7E1EB',
  feminismAccent: '#B0346B',
  sageTeal: '#276C5C',
  sageLight: '#E7F4EF',
  roseGold: '#8E5446',
  roseGoldLight: '#F8ECE9',
  peach: '#FDEBDD',
  peachDark: '#99522A',

  // Inverse surfaces (dark in light mode, light in dark mode)
  obsidian: '#2A2033',
  black: '#221A29',
  white: '#FFFFFF',

  // Interaction
  focusRing: '#7B3FD6',
  overlay: 'rgba(34, 26, 41, 0.45)',
  skeleton: '#EEE6EB',
  skeletonHighlight: '#F7F2F5',
};

type ColorName = keyof typeof LIGHT_COLORS;

/** The same names in dark mode. */
const DARK_COLORS: Record<ColorName, string> = {
  background: '#0F172A',
  backgroundAlt: '#131C31',
  backgroundMuted: '#273449',
  card: '#1E293B',
  cardGlass: '#1E293B',
  surfaceRaised: '#273449',
  cardBorder: '#334155',
  cardBorderLight: '#2A3649',
  borderStrong: '#55657E',

  primary: '#F48FC0',
  primaryDark: '#F7A8CF',
  primaryLight: '#3A2236',
  primaryGlow: 'rgba(244, 143, 192, 0.22)',
  onPrimary: '#1E293B',

  secondary: '#B9A7F5',
  secondaryDark: '#CEC2F8',
  secondaryLight: '#2A2647',
  secondaryBorder: '#433C6E',

  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textTertiary: '#94A3B8',
  textRose: '#F7A8CF',
  textLilac: '#CEC2F8',

  strainHigh: '#FF8FA6',
  strainAmber: '#F5B95A',
  strainOptimal: '#5FD3A8',
  strainTeal: '#7DD3F0',
  danger: '#FF8A80',
  dangerLight: '#3B1F26',
  warningLight: '#33281A',
  successLight: '#14302A',
  infoLight: '#142C3A',

  welcomePink: '#2B2133',
  welcomePinkDark: '#34273F',
  feminismAccent: '#F48FC0',
  sageTeal: '#5FD3A8',
  sageLight: '#14302A',
  roseGold: '#E3B1A4',
  roseGoldLight: '#2E2421',
  peach: '#33261C',
  peachDark: '#F2B48A',

  obsidian: '#E2E8F0',
  black: '#F1F5F9',
  white: '#1E293B',

  focusRing: '#C4B5FD',
  overlay: 'rgba(2, 6, 23, 0.6)',
  skeleton: '#273449',
  skeletonHighlight: '#334155',
};

/** 8-point grid with 4-point half steps. */
const SPACE = { xxs: 4, xs: 8, sm: 12, md: 16, lg: 24, xl: 32, xxl: 40, xxxl: 48 } as const;

const RADIUS = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 } as const;

/** Type scale: 12 is only for captions and badges; body text is 14 or 16. */
const TYPE = {
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
  bodySm: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  label: { fontSize: 14, lineHeight: 20, fontWeight: '700' as const },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
  h3: { fontSize: 20, lineHeight: 28, fontWeight: '800' as const },
  h2: { fontSize: 24, lineHeight: 32, fontWeight: '800' as const },
  h1: { fontSize: 28, lineHeight: 36, fontWeight: '800' as const },
  display: { fontSize: 32, lineHeight: 40, fontWeight: '800' as const },
} as const;

/** Minimum touch target (points). */
const TOUCH = 44;

const NO_SHADOW = {
  shadowColor: 'transparent',
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0,
  shadowRadius: 0,
  elevation: 0,
};

const LIGHT = {
  colors: LIGHT_COLORS,
  // Cards and buttons no longer cast shadows; only floating things do.
  shadows: {
    soft: NO_SHADOW,
    glowing: NO_SHADOW,
    card: NO_SHADOW,
    floating: {
      shadowColor: '#221A29',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 16,
      elevation: 6,
    },
  },
  radius: RADIUS,
  space: SPACE,
  type: TYPE,
  touch: TOUCH,
};

// ============================================================
// Night mode
//
// Screens keep being written with the light palette. In night mode every
// colour is converted by `themed()`:
//   - `Theme.colors.x` converts automatically,
//   - styles made with `createStyles()` are converted as a whole,
//   - colours kept in variables/arrays are converted with `themed(value)`.
// The root layout remounts the screens when the mode changes.
// ============================================================
export type ThemeMode = 'light' | 'dark';
let mode: ThemeMode = 'light';
let rawDepth = 0; // > 0 while a style factory runs: Theme returns light values

export const getThemeMode = () => mode;
export const isNight = () => mode === 'dark';
export function setThemeMode(next: ThemeMode) {
  mode = next;
}

const TONED = /^rgba\(\d+,\d+,\d+,\d\.\d{3}\)$/; // the format themed() produces
const toDark = new Map<string, string>();
const toLight = new Map<string, string>();
const NAMED: Record<string, string> = { white: '#FFFFFF', black: '#000000' };

function parse(input: string): [number, number, number, number] | null {
  const c = NAMED[input.toLowerCase()] ?? input.trim();
  if (c[0] === '#') {
    let h = c.slice(1);
    if (h.length === 3 || h.length === 4) h = h.split('').map((x) => x + x).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = parseInt(h.slice(0, 6), 16);
    if (Number.isNaN(n)) return null;
    const a = h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
  }
  const m = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)$/i);
  return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

/** "rgba(r,g,b,a.aaa)": the exact format of converted colours (so they are never converted twice). */
function toned(input: string): string {
  const rgba = parse(input);
  if (!rgba) return input;
  return `rgba(${Math.round(rgba[0])},${Math.round(rgba[1])},${Math.round(rgba[2])},${rgba[3].toFixed(3)})`;
}

const key = (c: string) => c.trim().toUpperCase().replace(/\s+/g, '');

/**
 * Light colour -> its dark-mode partner, for colours that are not tokens
 * (tokens use the DARK_COLORS table). Neutrals turn deep slate, soft tints
 * become dark tinted surfaces, accents get lighter so they stay readable.
 */
function darken(input: string): string {
  const rgba = parse(input);
  if (!rgba) return input; // 'transparent', gradients, etc.
  const [h0, s, l] = rgbToHsl(rgba[0], rgba[1], rgba[2]);
  const grey = s < 0.12;
  const h = grey ? 0.6 : h0; // neutrals lean slate blue
  let L: number;
  let S: number;
  if (l >= 0.995) {
    L = 0.175; S = 0.33; // white cards → #1E293B-like surface
  } else if (l >= 0.9) {
    L = Math.min(0.24, Math.max(0.13, 0.13 + (0.985 - l) * 1.2)); // page + soft tints
    S = grey ? 0.3 : Math.min(s, 0.6) * 0.45 + 0.08;
  } else if (l >= 0.65) {
    L = 0.26 + (0.9 - l) * 0.4; // borders, light mid-tones
    S = grey ? 0.2 : s * 0.45;
  } else if (l >= 0.4) {
    L = Math.min(0.82, Math.max(0.66, l + 0.18)); // accents: lighter so they read on slate
    S = s * 0.85;
  } else {
    L = Math.min(0.95, 0.93 - l * 0.6); // dark ink → soft light text
    S = Math.min(s, 0.5) * 0.6;
  }
  const [r, g, b] = hslToRgb(h, grey ? Math.max(S, 0.08) : S, L);
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${rgba[3].toFixed(3)})`;
}

// Tokens convert to their designed dark values, not computed ones.
for (const name of Object.keys(LIGHT_COLORS) as ColorName[]) {
  const light = LIGHT_COLORS[name];
  const dark = toned(DARK_COLORS[name]);
  const k = key(light);
  if (!toDark.has(k)) toDark.set(k, dark);
  if (!toLight.has(dark)) toLight.set(dark, light);
}

/** The designed value of a token in a given mode (for tests and docs). */
export function tokenValue(name: ColorName, which: ThemeMode): string {
  return which === 'dark' ? DARK_COLORS[name] : LIGHT_COLORS[name];
}
export const COLOR_TOKENS = Object.keys(LIGHT_COLORS) as ColorName[];

/**
 * Converts a colour for the current mode. Safe to call on any colour, any
 * number of times: already-converted values pass through, and in light mode
 * a converted value turns back into its original.
 */
export function themed<T>(color: T): T {
  if (typeof color !== 'string') return color;
  if (mode === 'light') return (toLight.get(color) ?? color) as T;
  if (TONED.test(color)) return color;
  const k = key(color);
  let out = toDark.get(k);
  if (out === undefined) {
    out = darken(color);
    toDark.set(k, out);
    if (out !== color && !toLight.has(out)) toLight.set(out, color);
  }
  return out as T;
}

/**
 * A colour that stays exactly the same in light and dark mode — for brand
 * colours (YouTube red) and scrims over photos, which must not be converted.
 */
export function fixedColor(color: string): string {
  return toned(color);
}

/** The same colour with a new opacity (works on light and night colours). */
export function withAlpha(color: string, alpha: number): string {
  const rgba = parse(color);
  return rgba ? `rgba(${rgba[0]},${rgba[1]},${rgba[2]},${alpha.toFixed(3)})` : color;
}

const SKIP = new Set(['shadowColor', 'textShadowColor']);
function toneStyles<T>(value: T): T {
  if (Array.isArray(value)) return value.map(toneStyles) as T;
  if (!value || typeof value !== 'object') return value;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'string' && /color$/i.test(k) && !SKIP.has(k)) out[k] = themed(v);
    else out[k] = v && typeof v === 'object' ? toneStyles(v) : v;
  }
  return out as T;
}

type AnyStyles = Parameters<typeof StyleSheet.create>[0];

/**
 * Drop-in replacement for `StyleSheet.create` that follows night mode:
 *   const styles = createStyles(() => ({ card: { backgroundColor: '#FFF' } }));
 */
export function createStyles<T extends AnyStyles>(factory: () => T & AnyStyles): Readonly<T> {
  const cache: Partial<Record<ThemeMode, T>> = {};
  const build = (): T => {
    const cached = cache[mode];
    if (cached) return cached;
    {
      rawDepth++;
      let raw: T;
      try {
        raw = factory();
      } finally {
        rawDepth--;
      }
      const made = StyleSheet.create(mode === 'dark' ? toneStyles(raw) : raw) as T;
      cache[mode] = made;
      return made;
    }
  };
  return new Proxy({} as object, {
    get: (_t, key) => (build() as Record<PropertyKey, unknown>)[key],
    has: (_t, key) => key in (build() as object),
    ownKeys: () => Reflect.ownKeys(build() as object),
    getOwnPropertyDescriptor: (_t, key) => {
      const d = Reflect.getOwnPropertyDescriptor(build() as object, key);
      return d ? { ...d, configurable: true } : undefined;
    },
  }) as T;
}

export const Theme = {
  ...LIGHT,
  colors: new Proxy(LIGHT.colors, {
    get(target, key: string) {
      const value = target[key as keyof typeof target];
      return rawDepth > 0 || typeof value !== 'string' ? value : themed(value);
    },
  }),
};
