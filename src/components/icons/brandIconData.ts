// ============================================================
// SheSync's own icons — "warm, rounded and gently empowering".
//
// One visual language for every icon:
//   - 24 × 24 viewBox, drawn on a 2px inner margin
//   - 1.75px strokes with round caps and joins (currentColor)
//   - duotone: key shapes get a soft accent fill at 18% opacity
//   - domain metaphors: a hot-water bottle for pain, a droplet with a
//     clock for the pad timer, a lotus for Mind, a sneaker for Move …
//
// Shapes are plain data so the same drawing renders on phones (react-native-svg)
// and in tests/previews.
// ============================================================

/** stroke = outline only, accent = soft fill only, both = soft fill + outline, solid = filled with currentColor. */
export type Paint = 'stroke' | 'accent' | 'both' | 'solid';

export type Shape =
  | { p: string; paint?: Paint; evenOdd?: boolean }
  | { c: [cx: number, cy: number, r: number]; paint?: Paint }
  | { r: [x: number, y: number, w: number, h: number, rx: number]; paint?: Paint }
  | { e: [cx: number, cy: number, rx: number, ry: number]; paint?: Paint };

/** Micro-interaction played when the icon's card or button is pressed or hovered. */
export type IconMotion = 'ring' | 'pulse' | 'tilt' | 'bounce' | 'spin' | 'none';

const f = (n: number) => Number(n.toFixed(2));

/** A rounded heart centred on (cx, cy), s wide. */
function heart(cx: number, cy: number, s: number): string {
  const p = (dx: number, dy: number) => `${f(cx + dx * s)} ${f(cy + dy * s)}`;
  return (
    `M${p(0, 0.4)}` +
    `C${p(-0.5, 0.06)} ${p(-0.56, -0.38)} ${p(-0.24, -0.42)}` +
    `C${p(-0.09, -0.44)} ${p(0, -0.32)} ${p(0, -0.2)}` +
    `C${p(0, -0.32)} ${p(0.09, -0.44)} ${p(0.24, -0.42)}` +
    `C${p(0.56, -0.38)} ${p(0.5, 0.06)} ${p(0, 0.4)}Z`
  );
}

/** A four-point sparkle with soft concave sides. */
function sparkle(cx: number, cy: number, r: number): string {
  const k = r * 0.18;
  return (
    `M${f(cx)} ${f(cy - r)}` +
    `C${f(cx + k)} ${f(cy - k)} ${f(cx + k)} ${f(cy - k)} ${f(cx + r)} ${f(cy)}` +
    `C${f(cx + k)} ${f(cy + k)} ${f(cx + k)} ${f(cy + k)} ${f(cx)} ${f(cy + r)}` +
    `C${f(cx - k)} ${f(cy + k)} ${f(cx - k)} ${f(cy + k)} ${f(cx - r)} ${f(cy)}` +
    `C${f(cx - k)} ${f(cy - k)} ${f(cx - k)} ${f(cy - k)} ${f(cx)} ${f(cy - r)}Z`
  );
}

/** An n-point star. */
function star(cx: number, cy: number, outer: number, inner: number, n = 5): string {
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    pts.push(`${f(cx + r * Math.cos(a))} ${f(cy + r * Math.sin(a))}`);
  }
  return `M${pts.join('L')}Z`;
}

/** A cog with rounded teeth (the joins round off in the stroke). */
function gear(cx: number, cy: number, outer: number, inner: number, teeth = 8): string {
  const pts: string[] = [];
  const step = (Math.PI * 2) / teeth;
  for (let i = 0; i < teeth; i++) {
    const a = i * step - Math.PI / 2;
    const at = (r: number, d: number) => `${f(cx + r * Math.cos(a + d))} ${f(cy + r * Math.sin(a + d))}`;
    pts.push(at(inner, -step * 0.5), at(inner, -step * 0.3), at(outer, -step * 0.18), at(outer, step * 0.18), at(inner, step * 0.3));
  }
  return `M${pts.join('L')}Z`;
}

const SHIELD = 'M12 3l7 2.8v5.4c0 4.4-3 8-7 9.8-4-1.8-7-5.4-7-9.8V5.8z';
const ENVELOPE: Shape[] = [{ r: [3, 5.5, 18, 13, 2.5], paint: 'both' }, { p: 'M3.7 6.8 12 12.6l8.3-5.8' }];

export const BRAND_ICONS = {
  // ── Tabs ──
  home: {
    motion: 'bounce',
    shapes: [
      { p: 'M5.5 10.3 12 5l6.5 5.3v8.2a1.5 1.5 0 0 1-1.5 1.5H7a1.5 1.5 0 0 1-1.5-1.5z', paint: 'both' },
      { p: 'M3.5 11.8 12 4.5l8.5 7.3' },
      { p: heart(12, 15.3, 5.4) },
    ],
  },
  chat: {
    motion: 'bounce',
    shapes: [
      { p: 'M4 7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6.5a3 3 0 0 1-3 3h-6.2L7 19.8v-3.3a3 3 0 0 1-3-3z', paint: 'both' },
      { p: sparkle(12, 10.25, 3.6) },
    ],
  },
  move: {
    motion: 'tilt',
    shapes: [
      {
        p: 'M3.5 16.5v-4.3a1.5 1.5 0 0 1 1.1-1.45l3.4-.95 2.2-3.05a1.3 1.3 0 0 1 2.05-.04l1.25 1.55a4.8 4.8 0 0 0 3.75 1.79H18a2.5 2.5 0 0 1 2.5 2.5v3.95z',
        paint: 'both',
      },
      { p: 'M3.5 16.5h17v1a1.5 1.5 0 0 1-1.5 1.5H5a1.5 1.5 0 0 1-1.5-1.5z' },
      { p: 'M9.6 9.9l1.5 1.1M11.2 8.1l1.4 1.1' },
    ],
  },
  lotus: {
    motion: 'pulse',
    shapes: [
      { p: 'M12 4.6c1.9 2.2 2.3 5.6 0 9.4-2.3-3.8-1.9-7.2 0-9.4z', paint: 'both' },
      { p: 'M12 14c-2.9-.2-5.6-1.9-6.4-5 2.9-.1 5.5 1.6 6.4 5zM12 14c2.9-.2 5.6-1.9 6.4-5-2.9-.1-5.5 1.6-6.4 5z' },
      { p: 'M3.8 14.2c1.9 3 4.9 4.6 8.2 4.6s6.3-1.6 8.2-4.6M8.5 21h7' },
    ],
  },
  report: {
    motion: 'bounce',
    shapes: [
      { r: [5, 4.5, 14, 16.5, 2.5], paint: 'both' },
      { r: [9, 3, 6, 3.2, 1.2] },
      { p: 'M8 13.5h2l1.3-3 2 6 1.4-3H16' },
    ],
  },
  profile: {
    motion: 'bounce',
    shapes: [
      { c: [12, 8.8, 3.6], paint: 'both' },
      { p: 'M5 20c.9-3.6 3.7-5.6 7-5.6s6.1 2 7 5.6' },
      { p: 'M19 3.4v2.6M17.7 4.7h2.6' },
    ],
  },

  // ── Logging ──
  checkIn: { motion: 'pulse', shapes: [{ p: heart(12, 12.4, 18), paint: 'both' }, { p: 'M8.7 12.1l2.3 2.2 4.4-4.3' }] },
  calendar: {
    motion: 'bounce',
    shapes: [
      { r: [3.5, 5, 17, 15.5, 3], paint: 'both' },
      { p: 'M3.5 10h17M8 3v4M16 3v4' },
      { p: 'M12 12.3s-2.1 2.2-2.1 3.8a2.1 2.1 0 0 0 4.2 0c0-1.6-2.1-3.8-2.1-3.8z' },
    ],
  },
  mood: {
    motion: 'bounce',
    shapes: [
      { c: [12, 12, 8.75], paint: 'both' },
      { p: 'M9.2 10.1v.7M14.8 10.1v.7' },
      { p: 'M8.6 14.1c1.9 2.3 4.9 2.3 6.8 0' },
    ],
  },
  pain: {
    motion: 'tilt',
    shapes: [
      { r: [6, 8, 12, 13, 4], paint: 'both' },
      { p: 'M10 8V5.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V8' },
      { p: 'M9 12.6c1-.8 2-.8 3 0s2 .8 3 0M9 16.1c1-.8 2-.8 3 0s2 .8 3 0' },
    ],
  },
  flow: {
    motion: 'bounce',
    shapes: [
      { p: 'M12 3s-6.5 7-6.5 11.5a6.5 6.5 0 0 0 13 0C18.5 10 12 3 12 3z', paint: 'both' },
      { p: 'M9.2 14.8a3 3 0 0 0 2.8 2.9' },
    ],
  },
  padCare: {
    motion: 'tilt',
    shapes: [
      { p: 'M12 3.2s-6 6.3-6 10.8a6 6 0 0 0 12 0c0-4.5-6-10.8-6-10.8z', paint: 'both' },
      { p: 'M12 11v3.2l2.2 1.3' },
    ],
  },
  voice: {
    motion: 'pulse',
    shapes: [{ r: [9, 3, 6, 11.5, 3], paint: 'both' }, { p: 'M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6' }],
  },
  sleep: {
    motion: 'tilt',
    shapes: [{ p: 'M19.5 14.6A8 8 0 1 1 9.4 4.5a6.3 6.3 0 0 0 10.1 10.1z', paint: 'both' }, { p: 'M17 3.4v2.6M15.7 4.7h2.6' }],
  },

  // ── Features ──
  fitness: {
    motion: 'tilt',
    shapes: [
      { r: [4.4, 7, 3.3, 10, 1.3], paint: 'both' },
      { r: [16.3, 7, 3.3, 10, 1.3], paint: 'both' },
      { p: 'M7.7 12h8.6M2.4 10v4M21.6 10v4' },
    ],
  },
  pcos: {
    motion: 'pulse',
    shapes: [
      { p: 'M8.6 9.6C8.6 8 10.1 7 12 7s3.4 1 3.4 2.6v2.7c0 1.5-.9 2.7-2.2 3.3V19h-2.4v-3.4c-1.3-.6-2.2-1.8-2.2-3.3z', paint: 'both' },
      { p: 'M8.6 9.8C7.4 8.4 6 8.1 4.8 8.8M15.4 9.8c1.2-1.4 2.6-1.7 3.8-1' },
      { c: [4.6, 11.3, 1.7], paint: 'both' },
      { c: [19.4, 11.3, 1.7], paint: 'both' },
    ],
  },
  confidence: { motion: 'spin', shapes: [{ p: star(12, 12.8, 8.4, 3.9), paint: 'both' }, { p: 'M19.6 2.8v2.4M18.4 4h2.4' }] },
  care: {
    motion: 'pulse',
    shapes: [
      { p: 'M6.6 3.5H5.2v5a4.3 4.3 0 0 0 8.6 0v-5h-1.4' },
      { p: 'M9.5 12.8v1.7a4.75 4.75 0 0 0 9.5 0v-1.8' },
      { c: [19, 10.5, 2.2], paint: 'both' },
    ],
  },
  study: {
    motion: 'tilt',
    shapes: [
      { p: 'M12 6.3C10.2 5 7.7 4.5 4.5 4.6v13.2c3.2-.1 5.7.4 7.5 1.7 1.8-1.3 4.3-1.8 7.5-1.7V4.6c-3.2-.1-5.7.4-7.5 1.7z', paint: 'both' },
      { p: 'M12 6.3v13.2' },
    ],
  },
  exam: {
    motion: 'tilt',
    shapes: [{ p: 'M2.8 9.5 12 5l9.2 4.5L12 14z', paint: 'both' }, { p: 'M6.8 11.5v4c1.4 1.4 3.2 2.1 5.2 2.1s3.8-.7 5.2-2.1v-4M21.2 9.5v4.8' }],
  },
  games: {
    motion: 'tilt',
    shapes: [{ p: 'M5 8h3.2a2.05 2.05 0 1 1 4.1 0h3.2v3.2a2.05 2.05 0 1 1 0 4.1v4.2H5z', paint: 'both' }],
  },
  breathe: {
    motion: 'pulse',
    shapes: [
      { p: 'M3 9h10.5a2.5 2.5 0 1 0-2.4-3.2M3 13h14.5a2.5 2.5 0 1 1-2.4 3.2M3 17h6' },
      { p: 'M17.4 4.4c2.6 0 3.6 1.6 3.6 4.1-2.6 0-3.6-1.6-3.6-4.1z', paint: 'both' },
    ],
  },
  sounds: {
    motion: 'pulse',
    shapes: [
      { p: 'M4.5 15.5v-3a7.5 7.5 0 0 1 15 0v3' },
      { r: [3.5, 13.8, 4.2, 6.7, 1.8], paint: 'both' },
      { r: [16.3, 13.8, 4.2, 6.7, 1.8], paint: 'both' },
    ],
  },
  sos: {
    motion: 'pulse',
    shapes: [
      { p: 'M12 3.25a8.75 8.75 0 1 0 0 17.5 8.75 8.75 0 1 0 0-17.5zm0 5a3.75 3.75 0 1 1 0 7.5 3.75 3.75 0 1 1 0-7.5z', paint: 'accent', evenOdd: true },
      { c: [12, 12, 8.75] },
      { c: [12, 12, 3.75] },
      { p: 'M5.8 5.8l3.55 3.55M14.65 14.65l3.55 3.55M18.2 5.8l-3.55 3.55M9.35 14.65 5.8 18.2' },
    ],
  },
  leaveNote: { motion: 'tilt', shapes: ENVELOPE },
  healthCheck: { motion: 'pulse', shapes: [{ p: SHIELD, paint: 'both' }, { p: heart(12, 11.7, 7.6) }] },
  sparkle: { motion: 'spin', shapes: [{ p: sparkle(10.5, 13, 7), paint: 'both' }, { p: sparkle(18.4, 5.4, 2.8) }] },

  // ── Settings & privacy ──
  settings: { motion: 'spin', shapes: [{ p: gear(12, 12, 9, 6.6), paint: 'both' }, { c: [12, 12, 2.8] }] },
  account: {
    motion: 'bounce',
    shapes: [
      { r: [3, 5, 18, 14, 3], paint: 'both' },
      { c: [8.8, 10.4, 2.1] },
      { p: 'M5.8 16c.6-1.5 1.7-2.3 3-2.3s2.4.8 3 2.3M14.5 10h4M14.5 13.5h3' },
    ],
  },
  privacy: { motion: 'pulse', shapes: [{ p: SHIELD, paint: 'both' }, { c: [12, 10.4, 1.7] }, { p: 'M12 12.1v3.4' }] },
  bell: {
    motion: 'ring',
    shapes: [{ p: 'M6.2 16.5V11a5.8 5.8 0 0 1 11.6 0v5.5l1.7 1.8H4.5z', paint: 'both' }, { p: 'M10 20.6a2.1 2.1 0 0 0 4 0M12 3.4v1.8' }],
  },
  data: {
    motion: 'bounce',
    shapes: [
      { e: [12, 6.5, 7, 2.8], paint: 'both' },
      { p: 'M5 6.5v11c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8v-11M5 12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8' },
    ],
  },
  about: { motion: 'bounce', shapes: [{ c: [12, 12, 8.75], paint: 'both' }, { p: 'M12 11.2v5M12 7.9v.2' }] },
  lock: {
    motion: 'ring',
    shapes: [{ r: [5, 10, 14, 10.5, 3], paint: 'both' }, { p: 'M8.2 10V7.8a3.8 3.8 0 0 1 7.6 0V10' }, { p: heart(12, 15.3, 4.8) }],
  },
  eye: {
    motion: 'pulse',
    shapes: [{ p: 'M2.5 12c2.3-4.2 5.6-6.5 9.5-6.5s7.2 2.3 9.5 6.5c-2.3 4.2-5.6 6.5-9.5 6.5S4.8 16.2 2.5 12z', paint: 'both' }, { c: [12, 12, 3] }],
  },
  cloud: {
    motion: 'bounce',
    shapes: [
      { p: 'M7.2 18.5a4.2 4.2 0 0 1-.5-8.37 5.6 5.6 0 0 1 10.8 1.27 3.6 3.6 0 0 1-.4 7.1z', paint: 'both' },
      { p: 'M9.6 14.2l1.9 1.9 3.4-3.5' },
    ],
  },
  cloudOff: {
    motion: 'none',
    shapes: [
      { p: 'M7.2 18.5a4.2 4.2 0 0 1-.5-8.37 5.6 5.6 0 0 1 10.8 1.27 3.6 3.6 0 0 1-.4 7.1z', paint: 'both' },
      { p: 'M3.5 3.5l17 17' },
    ],
  },
  phone: { motion: 'tilt', shapes: [{ r: [6.5, 2.75, 11, 18.5, 3], paint: 'both' }, { p: 'M10.5 5.5h3' }, { p: heart(12, 12.6, 5.6) }] },
  exportData: {
    motion: 'bounce',
    shapes: [
      { r: [4.5, 13, 15, 7, 2.5], paint: 'accent' },
      { p: 'M4.5 13v4.5A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5V13' },
      { p: 'M12 15V4.5M8.3 8.2 12 4.5l3.7 3.7' },
    ],
  },
  appearance: {
    motion: 'spin',
    shapes: [
      { c: [12, 12, 4.8] },
      { p: 'M12 7.2a4.8 4.8 0 0 1 0 9.6z', paint: 'solid' },
      { p: 'M12 2.8v1.8M12 19.4v1.8M2.8 12h1.8M19.4 12h1.8M5.5 5.5l1.3 1.3M17.2 17.2l1.3 1.3M18.5 5.5l-1.3 1.3M6.8 17.2l-1.3 1.3' },
    ],
  },
  update: {
    motion: 'spin',
    shapes: [
      { c: [12, 12, 2.4], paint: 'both' },
      { p: 'M19.5 12a7.5 7.5 0 0 1-13.1 5M4.5 12a7.5 7.5 0 0 1 13.1-5' },
      { p: 'M17.8 3.6v3.6h-3.6M6.2 20.4v-3.6h3.6' },
    ],
  },
  trash: {
    motion: 'tilt',
    shapes: [
      { p: 'M6 7.5h12l-.9 11.2a2 2 0 0 1-2 1.8H8.9a2 2 0 0 1-2-1.8z', paint: 'both' },
      { p: 'M4.5 7.5h15M9.5 7.5V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2v2.3M10.3 11v5.5M13.7 11v5.5' },
    ],
  },
  logout: {
    motion: 'tilt',
    shapes: [{ r: [5, 4, 8.5, 16, 2], paint: 'accent' }, { p: 'M13.5 4H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6.5' }, { p: 'M10.5 12H20M16.5 8.5 20 12l-3.5 3.5' }],
  },
  mail: { motion: 'tilt', shapes: ENVELOPE },
} satisfies Record<string, { motion: IconMotion; shapes: Shape[] }>;

export type BrandIconName = keyof typeof BRAND_ICONS;
export const BRAND_ICON_NAMES = Object.keys(BRAND_ICONS) as BrandIconName[];

/** What each icon means, for aria-labels and the exported SVG files. */
export const BRAND_ICON_LABELS: Record<BrandIconName, string> = {
  home: 'Home', chat: 'YourGoGirl chat', move: 'Move', lotus: 'Mind', report: 'Report', profile: 'Profile',
  checkIn: 'Daily check-in', calendar: 'Period calendar', mood: 'Mood', pain: 'Pain', flow: 'Flow', padCare: 'Pad Care',
  voice: 'Voice journal', sleep: 'Sleep', fitness: 'Fitness', pcos: 'PCOS mode', confidence: 'Confidence booster',
  care: 'Care Connect', study: 'Study focus', exam: 'Exams', games: 'Mind games', breathe: 'Breathing', sounds: 'Calm sounds',
  sos: 'SOS', leaveNote: 'Leave note', healthCheck: 'Health check', sparkle: 'Highlights', settings: 'Settings',
  account: 'Account', privacy: 'Privacy', bell: 'Reminders', data: 'Your data', about: 'About', lock: 'App lock',
  eye: 'Visibility', cloud: 'Backed up', cloudOff: 'Not backed up', phone: 'On this phone', exportData: 'Export data',
  appearance: 'Appearance', update: 'Updates', trash: 'Delete', logout: 'Sign out', mail: 'Email',
};

/**
 * Web-ready SVG markup for an icon: a clean 24 × 24 viewBox, strokes in
 * `currentColor`, the duotone fill in `var(--accent-color)` (falls back to
 * currentColor) at 18% opacity, and role="img" + aria-label — or
 * aria-hidden when `label` is null (decorative). Used for the files in
 * assets/icons and for previews.
 */
export function iconSvg(
  name: BrandIconName,
  color = 'currentColor',
  accent = 'var(--accent-color, currentColor)',
  size = 24,
  label: string | null = BRAND_ICON_LABELS[name]
): string {
  const body = (BRAND_ICONS[name].shapes as Shape[])
    .map((s) => {
      const paint = s.paint ?? 'stroke';
      const fill = paint === 'accent' || paint === 'both' ? `fill="${accent}" fill-opacity="0.18"` : paint === 'solid' ? `fill="${color}"` : 'fill="none"';
      const stroke = paint === 'accent' || paint === 'solid' ? 'stroke="none"' : `stroke="${color}"`;
      const common = `${fill} ${stroke} stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"`;
      if ('p' in s) return `<path d="${s.p}" ${common}${s.evenOdd ? ' fill-rule="evenodd"' : ''}/>`;
      if ('c' in s) return `<circle cx="${s.c[0]}" cy="${s.c[1]}" r="${s.c[2]}" ${common}/>`;
      if ('r' in s) return `<rect x="${s.r[0]}" y="${s.r[1]}" width="${s.r[2]}" height="${s.r[3]}" rx="${s.r[4]}" ${common}/>`;
      return `<ellipse cx="${s.e[0]}" cy="${s.e[1]}" rx="${s.e[2]}" ry="${s.e[3]}" ${common}/>`;
    })
    .join('');
  const a11y = label ? `role="img" aria-label="${label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true" focusable="false"';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" ${a11y}>${body}</svg>`;
}
