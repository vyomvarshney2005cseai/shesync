// Writes Unnmegh's bespoke icon set as plain SVG files (for the website,
// docs and design tools):  npx tsx scripts/export-icons.ts
//
//   assets/icons/<name>.svg     24 × 24, currentColor strokes, --accent-color duotone fill, role="img" + aria-label
//   assets/icons/icons.css      hover / active micro-animations (off under prefers-reduced-motion)
//   assets/icons/preview.html   every icon on light and dark badges
import fs from 'node:fs';
import path from 'node:path';
import { BRAND_ICONS, BRAND_ICON_LABELS, BRAND_ICON_NAMES, iconSvg } from '../src/components/icons/brandIconData';

const out = path.join(__dirname, '..', 'assets', 'icons');
fs.mkdirSync(out, { recursive: true });

for (const name of BRAND_ICON_NAMES) {
  const svg = iconSvg(name).replace('<svg ', `<svg class="ss-icon" data-motion="${BRAND_ICONS[name].motion ?? 'none'}" `);
  fs.writeFileSync(path.join(out, `${name}.svg`), `${svg}\n`);
}

const css = `/* Unnmegh icons — micro-interactions for the SVGs in this folder.
   Colour: set \`color\` for the outline and --accent-color for the soft duotone fill. */
.ss-icon { color: inherit; --accent-color: currentColor; transform-origin: 50% 50%; }
.ss-badge { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 16px;
  border: 1px solid color-mix(in srgb, currentColor 22%, transparent); background: color-mix(in srgb, currentColor 10%, transparent); }
.ss-badge:focus-visible { outline: 2px solid var(--focus-ring, #7B3FD6); outline-offset: 2px; }
@keyframes ss-ring { 0%,100% { transform: rotate(0) } 20% { transform: rotate(14deg) } 40% { transform: rotate(-12deg) } 60% { transform: rotate(8deg) } 80% { transform: rotate(-4deg) } }
@keyframes ss-pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.12) } }
@keyframes ss-tilt { 0%,100% { transform: rotate(0) } 50% { transform: rotate(-10deg) } }
@keyframes ss-bounce { 0%,100% { transform: translateY(0) } 45% { transform: translateY(-3px) } }
@keyframes ss-spin { from { transform: rotate(0) } to { transform: rotate(90deg) } }
:is(a, button, [role="button"], .ss-badge):is(:hover, :active, :focus-visible) .ss-icon[data-motion="ring"] { animation: ss-ring .6s ease-out; }
:is(a, button, [role="button"], .ss-badge):is(:hover, :active, :focus-visible) .ss-icon[data-motion="pulse"] { animation: ss-pulse .32s ease-out; }
:is(a, button, [role="button"], .ss-badge):is(:hover, :active, :focus-visible) .ss-icon[data-motion="tilt"] { animation: ss-tilt .32s ease-out; }
:is(a, button, [role="button"], .ss-badge):is(:hover, :active, :focus-visible) .ss-icon[data-motion="bounce"] { animation: ss-bounce .32s ease-out; }
:is(a, button, [role="button"], .ss-badge):is(:hover, :active, :focus-visible) .ss-icon[data-motion="spin"] { animation: ss-spin .65s ease-out; }
@media (prefers-reduced-motion: reduce) { .ss-icon { animation: none !important; } }
`;
fs.writeFileSync(path.join(out, 'icons.css'), css);

const tones = [
  ['#B0346B', '#FBEAF2', '#F48FC0', '#3A2236'],
  ['#6447B0', '#F1EDFB', '#B9A7F5', '#2B2747'],
  ['#1D7457', '#E6F4EE', '#5FD3A8', '#14302A'],
  ['#9A5A00', '#FFF4DD', '#F5B95A', '#3A2E17'],
  ['#1C6A86', '#E6F1F6', '#7DD3F0', '#16303D'],
];
const grid = (dark: boolean) =>
  BRAND_ICON_NAMES.map((n, i) => {
    const [lf, lb, df, db] = tones[i % tones.length];
    const fg = dark ? df : lf;
    const bg = dark ? db : lb;
    return `<figure><span class="ss-badge" tabindex="0" style="color:${fg};background:${bg}">${fs.readFileSync(path.join(out, `${n}.svg`), 'utf8').trim()}</span><figcaption>${BRAND_ICON_LABELS[n]}</figcaption></figure>`;
  }).join('');
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Unnmegh icons</title><link rel="stylesheet" href="icons.css">
<style>body{margin:0;font:14px/20px system-ui,sans-serif}section{padding:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(96px,1fr));gap:16px}
.light{background:#FBF8FA;color:#221A29}.dark{background:#0F172A;color:#F1F5F9}figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
.ss-badge .ss-icon{width:28px;height:28px}figcaption{font-size:12px;line-height:16px}h2{margin:0;padding:24px 24px 0;font-size:18px}</style></head>
<body><div class="light"><h2>Light</h2><section>${grid(false)}</section></div><div class="dark"><h2>Dark</h2><section>${grid(true)}</section></div></body></html>`;
fs.writeFileSync(path.join(out, 'preview.html'), html);
console.log(`Wrote ${BRAND_ICON_NAMES.length} icons to assets/icons`);
