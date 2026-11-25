// Round 8: design tokens (light + dark), WCAG AA contrast of every token
// pair, the 8-pt scales, bespoke icons, reminders, the privacy dashboard,
// settings defaults and reduce motion.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { COLOR_TOKENS, Theme, fixedColor, setThemeMode, themed, tokenValue, type ThemeMode } from '@/constants/theme';
import { badgeColors, type BadgeTone } from '@/components/ds/tones';
import { BRAND_ICONS, BRAND_ICON_LABELS, BRAND_ICON_NAMES, iconSvg, type Shape } from '@/components/icons/brandIconData';
import { hourLabel, periodReminderAt, REMINDER_HOURS } from '@/lib/reminderTimes';
import { NEVER_ROWS, backedUpRows, backupSummary, onPhoneRows, timeAgo, type InventoryInput } from '@/lib/privacySummary';
import { DOC_NAMES, logToRow } from '@/lib/sync/mappers';
import { useSettingsStore } from '@/store/useSettingsStore';
import { __setReduceMotion, reduceMotionNow } from '@/lib/motion';

(globalThis as { __DEV__?: boolean }).__DEV__ = false;

const tests: [string, () => void | Promise<void>][] = [];
const test = (name: string, f: () => void | Promise<void>) => tests.push([name, f]);

// ── Colour maths (WCAG 2.x) ──
function rgb(c: string): [number, number, number] {
  const hex = c.match(/^#([0-9a-f]{6})$/i);
  if (hex) return [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)) as [number, number, number];
  const m = c.match(/^rgba?\(([^)]+)\)$/i);
  assert.ok(m, `not a colour: ${c}`);
  const [r, g, b] = m![1].split(',').map((x) => parseFloat(x));
  return [r, g, b];
}
function luminance(c: string): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const [r, g, b] = rgb(c);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrast(a: string, b: string): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
const MODES: ThemeMode[] = ['light', 'dark'];
type Token = (typeof COLOR_TOKENS)[number];

// ── 2. Theme system ──
test('tokens: light and dark define the same names, all valid colours', () => {
  assert.ok(COLOR_TOKENS.length >= 40);
  for (const name of COLOR_TOKENS) {
    for (const mode of MODES) assert.ok(rgb(tokenValue(name, mode)).every((v) => v >= 0 && v <= 255), `${name} (${mode})`);
  }
});

test('tokens: dark mode is deep slate with raised surfaces, never pure black', () => {
  assert.equal(tokenValue('background', 'dark'), '#0F172A');
  for (const name of COLOR_TOKENS) assert.notEqual(tokenValue(name, 'dark').toUpperCase(), '#000000', name);
  // Surfaces get lighter as they rise: page < card < raised.
  const l = (t: Token) => luminance(tokenValue(t, 'dark'));
  assert.ok(l('background') < l('card') && l('card') < l('surfaceRaised'));
});

test('themed(): tokens map to their designed dark value, idempotently, and back in light', () => {
  try {
    setThemeMode('dark');
    for (const name of ['primary', 'card', 'textPrimary', 'cardBorder', 'secondaryLight'] as Token[]) {
      const once = themed(tokenValue(name, 'light'));
      assert.deepEqual(rgb(once), rgb(tokenValue(name, 'dark')), name);
      assert.equal(themed(once), once, `${name} converted twice`);
      assert.deepEqual(rgb(Theme.colors[name]), rgb(tokenValue(name, 'dark')), `Theme.colors.${name}`);
    }
    const darkPrimary = themed(tokenValue('primary', 'light'));
    setThemeMode('light');
    assert.equal(themed(darkPrimary), tokenValue('primary', 'light'));
  } finally {
    setThemeMode('light');
  }
});

test('fixedColor(): brand colours and photo scrims stay the same in both modes', () => {
  const red = fixedColor('#CC0000');
  try {
    setThemeMode('dark');
    assert.equal(themed(red), red);
    setThemeMode('light');
    assert.equal(themed(red), red);
  } finally {
    setThemeMode('light');
  }
});

// ── 3. Contrast (WCAG AA) ──
const SURFACES: Token[] = ['background', 'backgroundAlt', 'card', 'surfaceRaised', 'backgroundMuted'];
const TEXT_PAIRS: [Token, Token][] = [
  ...(['textPrimary', 'textSecondary', 'textTertiary'] as Token[]).flatMap((t) => SURFACES.map((s) => [t, s] as [Token, Token])),
  ...(
    ['textRose', 'textLilac', 'primary', 'primaryDark', 'secondary', 'secondaryDark', 'danger', 'strainHigh', 'strainAmber', 'strainOptimal', 'strainTeal', 'sageTeal', 'roseGold', 'feminismAccent'] as Token[]
  ).flatMap((t) => (['background', 'card'] as Token[]).map((s) => [t, s] as [Token, Token])),
  ['primary', 'primaryLight'],
  ['primaryDark', 'primaryLight'],
  ['textRose', 'primaryLight'],
  ['secondary', 'secondaryLight'],
  ['secondaryDark', 'secondaryLight'],
  ['textLilac', 'secondaryLight'],
  ['danger', 'dangerLight'],
  ['strainOptimal', 'successLight'],
  ['strainAmber', 'warningLight'],
  ['strainTeal', 'infoLight'],
  ['sageTeal', 'sageLight'],
  ['peachDark', 'peach'],
  // Text on filled buttons and selected chips.
  ...(['primary', 'primaryDark', 'secondary', 'strainHigh', 'strainAmber', 'strainOptimal', 'strainTeal', 'sageTeal', 'danger'] as Token[]).map(
    (bg) => ['onPrimary', bg] as [Token, Token]
  ),
  ['obsidian', 'background'],
  ['white', 'obsidian'],
];

test(`contrast: ${TEXT_PAIRS.length} text/icon token pairs are at least 4.5:1 in light and dark`, () => {
  const failures: string[] = [];
  for (const mode of MODES) {
    for (const [fg, bg] of TEXT_PAIRS) {
      const r = contrast(tokenValue(fg, mode), tokenValue(bg, mode));
      if (r < 4.5) failures.push(`${mode}: ${fg} on ${bg} = ${r.toFixed(2)}`);
    }
  }
  assert.deepEqual(failures, []);
});

test('contrast: focus ring and the switch outline are at least 3:1 (non-text, WCAG 1.4.11)', () => {
  for (const mode of MODES) {
    for (const bg of ['background', 'card'] as Token[]) {
      assert.ok(contrast(tokenValue('focusRing', mode), tokenValue(bg, mode)) >= 3, `${mode} focus ring on ${bg}`);
      assert.ok(contrast(tokenValue('textTertiary', mode), tokenValue(bg, mode)) >= 3, `${mode} switch on ${bg}`);
    }
  }
});

test('contrast: every icon-badge tone is at least 4.5:1 in light and dark', () => {
  const tones: BadgeTone[] = ['rose', 'lilac', 'mint', 'amber', 'sky', 'peach', 'neutral', 'danger'];
  try {
    for (const mode of MODES) {
      setThemeMode(mode);
      for (const tone of tones) {
        const { fg, bg } = badgeColors(tone);
        const r = contrast(fg, bg);
        assert.ok(r >= 4.5, `${mode} ${tone}: ${r.toFixed(2)}`);
      }
    }
  } finally {
    setThemeMode('light');
  }
});

// ── 1 / 5. Layout scales ──
test('scales: 8-pt spacing grid, radius scale, 44pt targets, readable type', () => {
  const space = Object.values(Theme.space) as number[];
  for (const v of space) assert.equal(v % 4, 0, `space ${v}`);
  for (const k of ['xs', 'md', 'lg', 'xl', 'xxl', 'xxxl'] as const) assert.equal(Theme.space[k] % 8, 0, k);
  assert.deepEqual([Theme.radius.sm, Theme.radius.md, Theme.radius.lg, Theme.radius.xl], [8, 12, 16, 24]);
  assert.equal(Theme.touch, 44);
  assert.ok(Theme.type.body.fontSize >= 16);
  assert.ok(Theme.type.bodySm.fontSize >= 14);
  for (const [name, t] of Object.entries(Theme.type)) {
    assert.ok(t.fontSize >= 12, name);
    assert.ok(t.lineHeight >= t.fontSize * 1.2, `${name} line height`);
  }
  // Cards use borders, not drop shadows.
  assert.equal(Theme.shadows.card.shadowOpacity, 0);
  assert.equal(Theme.shadows.card.elevation, 0);
});

// ── Bespoke icons ──
test('icons: clean 24×24 SVGs with currentColor, --accent-color, 1.75 strokes and an aria-label', () => {
  assert.ok(BRAND_ICON_NAMES.length >= 40);
  for (const name of BRAND_ICON_NAMES) {
    const svg = iconSvg(name);
    assert.match(svg, /viewBox="0 0 24 24"/, name);
    assert.match(svg, /role="img" aria-label="[^"]+"/, name);
    assert.match(svg, /stroke="currentColor"/, name);
    assert.doesNotMatch(svg, /stroke-width="(?!1\.75")/, name);
    assert.doesNotMatch(svg, /#[0-9A-F]{3,6}"/i, `${name} has a hard-coded colour`);
    const shapes = BRAND_ICONS[name].shapes as Shape[];
    const depth = shapes.some((s) => s.paint === 'both' || s.paint === 'accent' || s.paint === 'solid');
    assert.ok(depth, `${name} has no duotone layer`);
    if (shapes.some((s) => s.paint === 'both' || s.paint === 'accent')) assert.match(svg, /fill="var\(--accent-color, currentColor\)" fill-opacity="0\.18"/, name);
    assert.ok(BRAND_ICON_LABELS[name].length > 1, name);
    // Every coordinate stays inside the 24 × 24 box.
    for (const sh of shapes) {
      const nums = 'p' in sh ? sh.p.match(/-?\d*\.?\d+/g)!.map(Number) : 'c' in sh ? sh.c : 'r' in sh ? sh.r : sh.e;
      for (const n of nums) assert.ok(n >= -24 && n <= 24, `${name}: ${n}`);
    }
  }
  assert.match(iconSvg('bell', undefined, undefined, 24, null), /aria-hidden="true"/);
});

test('icons: the exported files in assets/icons match the source', () => {
  const dir = path.join(__dirname, '..', '..', 'assets', 'icons');
  for (const name of BRAND_ICON_NAMES) {
    const file = fs.readFileSync(path.join(dir, `${name}.svg`), 'utf8').trim();
    const expected = iconSvg(name).replace('<svg ', `<svg class="ss-icon" data-motion="${BRAND_ICONS[name].motion}" `);
    assert.equal(file, expected, `${name}.svg is stale — run npx tsx scripts/export-icons.ts`);
  }
  const css = fs.readFileSync(path.join(dir, 'icons.css'), 'utf8');
  assert.match(css, /prefers-reduced-motion: reduce/);
});

// ── Settings → Reminders ──
test('reminders: period heads-up at 9 am two days before, never in the past', () => {
  const now = new Date(2026, 10, 24, 18, 30);
  const at = periodReminderAt(10, true, now)!;
  assert.equal(at.getDate(), 2);
  assert.equal(at.getMonth(), 11);
  assert.equal(at.getHours(), 9);
  assert.equal(periodReminderAt(2, true, now), null);
  assert.equal(periodReminderAt(10, false, now), null);
  assert.equal(periodReminderAt(undefined, true, now), null);
});
test('reminders: hour labels for the check-in time chips', () => {
  assert.deepEqual(REMINDER_HOURS.map(hourLabel), ['9 am', '1 pm', '8 pm', '10 pm']);
  assert.equal(hourLabel(0), '12 am');
  assert.equal(hourLabel(12), '12 pm');
});

// ── Privacy dashboard ──
test('privacy dashboard: backup status for every state', () => {
  const now = Date.UTC(2026, 10, 24, 12);
  const at = now - 5 * 60_000;
  assert.equal(backupSummary({ guest: true, onDevice: false, state: 'idle', now }).needsSignIn, true);
  assert.match(backupSummary({ guest: false, onDevice: true, state: 'idle', now }).detail, /this phone only/);
  assert.equal(backupSummary({ guest: false, onDevice: false, state: 'idle', lastSyncedAt: at, now }).title, 'Backed up 5 min ago');
  assert.equal(backupSummary({ guest: false, onDevice: false, state: 'syncing', lastSyncedAt: at, now }).title, 'Backing up…');
  assert.equal(backupSummary({ guest: false, onDevice: false, state: 'signin', now }).needsSignIn, true);
  const err = backupSummary({ guest: false, onDevice: false, state: 'error', lastSyncedAt: at, now });
  assert.equal(err.ok, false);
  assert.equal(err.canBackUp, true);
  assert.match(err.detail, /last backup 5 min ago/);
  assert.equal(timeAgo(now - 20_000, now), 'just now');
  assert.equal(timeAgo(now - 3 * 3_600_000, now), '3 h ago');
});

const INVENTORY: InventoryInput = {
  periods: 3, logs: 12, journalText: 2, voiceRecordings: 1, sleepLogs: 4, careContacts: 1, chatMessages: 9,
  padChanges: 0, padTimerOn: false, trustedContact: true, appLockOn: true, answersSaved: true,
  studySessions: 2, exams: 1, workouts: 3, gamesPlayed: 4, pcosCheckins: 0, proudMoments: 2, reportsWaiting: 0,
};
test('privacy dashboard: on-the-phone and backed-up lists match what sync sends', () => {
  const phone = onPhoneRows(INVENTORY).map((r) => r.id);
  for (const id of ['voice', 'chat', 'pad', 'sos', 'lock', 'settings']) assert.ok(phone.includes(id), id);
  const backed = backedUpRows(INVENTORY);
  assert.equal(backed.find((r) => r.id === 'periods')!.value, '3 periods');
  assert.equal(backed.find((r) => r.id === 'journal')!.value, '2 entries');
  const dashboards = backed.find((r) => r.id === 'dashboards')!;
  for (const doc of DOC_NAMES) assert.match(dashboards.label.toLowerCase(), new RegExp(doc), `${doc} is synced but not listed`);
  assert.equal(dashboards.value, '12 items');
  assert.ok(NEVER_ROWS.some((r) => /tracking/i.test(r.label)));
  // The voice recording stays on the phone: not even its file path is uploaded.
  const row = logToRow('u1', { id: 'l1', date: '2026-11-24', timestamp: '2026-11-24T10:00:00Z', notes: 'hi', voiceJournal: true, audioFile: 'file:///journal/l1.m4a' } as never);
  assert.doesNotMatch(JSON.stringify(row), /audio|m4a/);
  assert.equal((row.extra as Record<string, unknown>).voiceJournal, true);
});

// ── Settings defaults ──
test('settings: light theme by default; reminders start off', () => {
  const s = useSettingsStore.getState();
  assert.equal(s.nightMode, 'off');
  assert.equal(s.checkInReminder, false);
  assert.equal(s.periodReminder, false);
  assert.equal(s.checkInReminderHour, 20);
  s.setCheckInReminder(true, 25);
  assert.equal(useSettingsStore.getState().checkInReminderHour, 23);
  s.setCheckInReminder(false);
  assert.equal(useSettingsStore.getState().checkInReminderHour, 23);
});

// ── 8. Reduce motion ──
test('reduce motion: follows the phone setting', () => {
  assert.equal(reduceMotionNow(), false);
  __setReduceMotion(true);
  assert.equal(reduceMotionNow(), true);
  __setReduceMotion(false);
  assert.equal(reduceMotionNow(), false);
});

(async () => {
  let passed = 0;
  for (const [n, f] of tests) {
    try {
      await f();
      passed++;
    } catch (e: any) {
      console.log('FAIL', n, '\n ', e.message);
      process.exitCode = 1;
    }
  }
  console.log(`${passed}/${tests.length} round-8 tests passed`);
})();
