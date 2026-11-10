import { StyleSheet } from 'react-native';

/**
 * SheSync "Soft Bloom" palette — calm blush, dusty rose, lavender and sage.
 * Saturation is kept low so screens feel soothing, while buttons and text
 * keep readable contrast (white on `primary` ≈ 4:1, body text ≈ 12:1).
 */
const LIGHT = {
  colors: {
    // Blush backgrounds
    background: "#FFF7F9",
    backgroundAlt: "#FDF1F5",
    backgroundMuted: "#FAE8EF",

    // Card & Surface
    card: "rgba(255, 255, 255, 0.9)",
    cardGlass: "rgba(255, 255, 255, 0.8)",
    cardBorder: "#F5DCE6",
    cardBorderLight: "rgba(240, 200, 218, 0.5)",

    // Primary — dusty rose
    primary: "#C9578C",
    primaryDark: "#A8436F",
    primaryLight: "#FBE7F0",
    primaryGlow: "rgba(201, 87, 140, 0.22)",

    // Secondary — lavender
    secondary: "#8E74CF",
    secondaryDark: "#6E55B5",
    secondaryLight: "#F2EDFB",
    secondaryBorder: "#DFD5F5",

    // Text — soft plum ink instead of pure black
    textPrimary: "#3A2E48",
    textSecondary: "#6E6478",
    textTertiary: "#A39AAE",
    textRose: "#A8436F",
    textLilac: "#6E55B5",

    // Status colours (softened)
    strainHigh: "#E07088",
    strainAmber: "#E3A048",
    strainOptimal: "#3E9E86",
    strainTeal: "#4FA9BD",

    // Brand
    welcomePink: "#FFEEF4",
    welcomePinkDark: "#F9E1EA",
    feminismAccent: "#D9638F",
    sageTeal: "#6FB4A5",
    sageLight: "#E8F5F1",
    roseGold: "#C68B7E",
    roseGoldLight: "#F8ECE9",
    peach: "#FDEBDD",
    peachDark: "#C77B4A",

    // Deep accents (dark pills & CTAs) — plum rather than black
    obsidian: "#46375A",
    black: "#2B2236",
    white: "#FFFFFF",
  },

  shadows: {
    soft: {
      shadowColor: "#C9578C",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 14,
      elevation: 2,
    },
    glowing: {
      shadowColor: "#C9578C",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 18,
      elevation: 5,
    },
    card: {
      shadowColor: "#3A2E48",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 10,
      elevation: 2,
    },
  },

  radius: {
    sm: 10,
    md: 16,
    lg: 22,
    xl: 28,
    full: 9999,
  },
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

/** Light colour -> its calm night-time partner (deep plum surfaces, soft light text). */
function darken(input: string): string {
  const rgba = parse(input);
  if (!rgba) return input; // 'transparent', gradients, etc.
  const [h0, s, l] = rgbToHsl(rgba[0], rgba[1], rgba[2]);
  const grey = s < 0.12;
  const h = grey ? 0.75 : h0; // neutral greys lean plum, like the rest of the app
  let L: number;
  let S: number;
  if (l >= 0.995) {
    L = 0.165; S = 0.2; // white cards sit slightly above the page
  } else if (l >= 0.9) {
    L = Math.min(0.27, Math.max(0.105, 0.105 + (0.985 - l) * 3)); // page + soft tints
    S = Math.min(s, 0.6) * 0.5 + 0.06;
  } else if (l >= 0.65) {
    L = 0.27 + (0.9 - l) * 0.5; // borders, light mid-tones
    S = s * 0.5;
  } else if (l >= 0.4) {
    L = l + (grey || s < 0.25 ? 0.2 : 0.09); // accents stay recognisable, a little brighter
    S = s * 0.85;
  } else {
    L = 0.92 - l * 0.7; // dark ink -> soft light text
    S = Math.min(s, 0.5) * 0.55;
  }
  const [r, g, b] = hslToRgb(h, grey ? Math.max(S, 0.08) : S, L);
  return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${rgba[3].toFixed(3)})`;
}

/**
 * Converts a colour for the current mode. Safe to call on any colour, any
 * number of times: already-converted values pass through, and in light mode
 * a converted value turns back into its original.
 */
export function themed<T>(color: T): T {
  if (typeof color !== 'string') return color;
  if (mode === 'light') return (toLight.get(color) ?? color) as T;
  if (TONED.test(color)) return color;
  let out = toDark.get(color);
  if (out === undefined) {
    out = darken(color);
    toDark.set(color, out);
    if (out !== color) toLight.set(out, color);
  }
  return out as T;
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
