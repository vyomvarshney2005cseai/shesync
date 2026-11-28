import assert from 'node:assert/strict';
import { parseImport, periodsToCycles, mergeImport, describeImport, buildBackup, logsToCsv, periodsToCsv, readDate, daysToLogs } from '@/lib/dataPortability';

const NOW = new Date('2026-11-10T10:00:00Z');
let n = 0;
const test = (name: string, fn: () => void) => { fn(); n++; console.log('  ✓', name); };
const emptyLocal = (): any => ({
  profile: { userName: 'A', focusAreas: [], isAssessmentCompleted: false, assessmentAnswers: {}, fineTuningSettings: {}, healthCheck: {}, healthCheckCompleted: false, syncCompletedAt: '', rememberedCyclesCount: 0 },
  cycles: [], logs: [], sleep: [], contacts: [],
  docs: { fitness: { weights: [], sessions: [] }, study: { sessions: [], tasks: [], wins: [] }, games: { records: [] }, pcos: { checkins: [], checklist: {} }, confidence: { proud: [], saved: [], levels: {}, glow: {}, challenges: {} } },
});

test('dates: ISO, day-first, epoch; rejects nonsense', () => {
  assert.equal(readDate('2026-03-05T10:00:00Z', 2026), '2026-03-05');
  assert.equal(readDate('05/03/2026', 2026), '2026-03-05');
  assert.equal(readDate('03/25/2026', 2026), '2026-03-25');
  assert.equal(readDate(1772668800000, 2026), '2026-03-05');
  assert.equal(readDate('2026-02-31', 2026), null);
  assert.equal(readDate('hello', 2026), null);
  assert.equal(readDate('2099-01-01', 2026), null);
});

test('Clue-style: measurements with type "period" per day', () => {
  const file = JSON.stringify({ settings: { cycle_length: 29 }, measurements: [
    { date: '2026-08-02', type: 'period', value: { option: 'light' } },
    { date: '2026-08-03', type: 'period', value: { option: 'heavy' } },
    { date: '2026-08-04', type: 'period', value: { option: 'medium' } },
    { date: '2026-08-06', type: 'period', value: { option: 'light' } },
    { date: '2026-08-15', type: 'spotting', value: { option: 'red' } },
    { date: '2026-08-20', type: 'pain', value: { option: 'cramps' } },
    { date: '2026-08-31', type: 'period', value: { option: 'medium' } },
    { date: '2026-09-01', type: 'period', value: { option: 'heavy' } },
    { date: '2026-09-29', type: 'period', value: { option: 'medium' } },
  ] });
  const r = parseImport(file, 'ClueDataDownload/measurements.json', NOW);
  assert.equal(r.source, 'clue');
  assert.deepEqual(r.periods.map((p) => p.start), ['2026-09-29', '2026-08-31', '2026-08-02']);
  assert.equal(r.periods[2].end, '2026-08-06', 'one unmarked day stays in the same period');
  assert.equal(r.days.find((d) => d.date === '2026-08-03')?.flow, 'heavy');
  const cycles = periodsToCycles(r.periods);
  assert.equal(cycles.find((c) => c.startDate === '2026-08-02')!.lengthDays, 29);
  assert.equal(cycles.find((c) => c.startDate === '2026-08-02')!.periodDurationDays, 5);
});

test('Clue older style: data[] with day + period string', () => {
  const file = JSON.stringify({ data: [
    { day: '2025-01-10T00:00:00Z', period: 'heavy', pain: ['cramps'] },
    { day: '2025-01-11T00:00:00Z', period: 'medium' },
    { day: '2025-01-12T00:00:00Z', period: 'spotting' },
    { day: '2025-02-08T00:00:00Z', period: 'light' },
    { day: '2025-02-20T00:00:00Z', mood: ['happy'] },
  ] });
  const r = parseImport(file, 'ClueBackup.cluedata', NOW);
  assert.deepEqual(r.periods.map((p) => p.start), ['2025-02-08', '2025-01-10']);
  assert.equal(r.periods[1].end, '2025-01-11', 'spotting is not counted as a period day');
});

test('Flo-style: cycles with period_start_date / period_end_date; forecasts ignored', () => {
  const file = JSON.stringify({ operationalData: { cycles: [
    { period_start_date: '2026-07-01', period_end_date: '2026-07-05', cycle_length: 28 },
    { period_start_date: '2026-07-29', period_end_date: '2026-08-02' },
    { period_start_date: '2026-08-27', period_end_date: '2026-08-31' },
  ], predictions: [{ period_start_date: '2026-09-24', period_end_date: '2026-09-28' }] },
    profile: { start_date: '2020-01-01', name: 'x' } });
  const r = parseImport(file, 'flo_export.json', NOW);
  assert.equal(r.source, 'flo');
  assert.deepEqual(r.periods.map((p) => p.start), ['2026-08-27', '2026-07-29', '2026-07-01']);
  assert.equal(periodsToCycles(r.periods)[2].lengthDays, 28);
});

test('future dates are never imported', () => {
  const r = parseImport(JSON.stringify([{ period_start_date: '2026-12-25' }, { period_start_date: '2026-10-20' }]), 'x.json', NOW);
  assert.deepEqual(r.periods.map((p) => p.start), ['2026-10-20']);
});

test('CSV with start/end columns (day-first dates, semicolons)', () => {
  const r = parseImport('Period Start;Period End;Notes\n01/09/2026;05/09/2026;"ok; fine"\n29/09/2026;03/10/2026;\n', 'export.csv', NOW);
  assert.deepEqual(r.periods, [{ start: '2026-09-29', end: '2026-10-03' }, { start: '2026-09-01', end: '2026-09-05' }]);
});

test('CSV with one row per day and a category column', () => {
  const r = parseImport('date,category,value\n2026-05-01,period,heavy\n2026-05-02,period,medium\n2026-05-02,mood,happy\n2026-05-30,period,light\n', 'clue.csv', NOW);
  assert.deepEqual(r.periods.map((p) => p.start), ['2026-05-30', '2026-05-01']);
});

test('JSON keyed by date', () => {
  const r = parseImport(JSON.stringify({ days: { '2026-04-01': { flow: 'heavy' }, '2026-04-02': { flow: 'light' }, '2026-04-10': { flow: 'none' } } }), 'x.json', NOW);
  assert.deepEqual(r.periods, [{ start: '2026-04-01', end: '2026-04-02' }]);
});

test('unrelated JSON, empty file and ZIP give a clear note, not a crash', () => {
  assert.equal(parseImport(JSON.stringify({ users: [{ name: 'a', created_at: '2024-01-01' }] }), 'a.json', NOW).periods.length, 0);
  assert.match(parseImport('', 'a.json', NOW).notes[0], /empty/);
  assert.match(parseImport('PK\u0003\u0004binary', 'clue.zip', NOW).notes[0], /ZIP/);
  assert.ok(parseImport('{"broken": ', 'a.json', NOW).notes.length >= 1);
});

test('import adds to her data and never replaces or duplicates it', () => {
  const local = emptyLocal();
  local.cycles = [{ id: 'mine', cycleNumber: 1, startDate: '2026-08-30', endDate: '2026-09-03', daysAgo: 0, lengthDays: 30, periodDurationDays: 5 }];
  local.logs = [{ id: 'log-1', date: '2026-08-31', timestamp: '2026-08-31T08:00:00Z', pain: 5 }];
  const r = parseImport(JSON.stringify([{ period_start_date: '2026-08-31', period_end_date: '2026-09-04' }, { period_start_date: '2026-08-02', period_end_date: '2026-08-06' }]), 'flo.json', NOW);
  const d = describeImport(local, r);
  assert.equal(d.newPeriods, 1, 'the overlapping period (1 day apart) is not added twice');
  assert.equal(d.merged.cycles.find((c: any) => c.startDate === '2026-08-30').id, 'mine');
  assert.equal(d.merged.logs.length, 1);
  // importing the same file again changes nothing
  const again = describeImport(d.merged, r);
  assert.equal(again.newPeriods, 0);
});

test('Unnmegh backup: export then import restores everything on an empty phone', () => {
  const full = emptyLocal();
  full.profile.isAssessmentCompleted = true; full.profile.assessmentAnswers = { q1: 'a' }; full.profile.syncCompletedAt = '2026-11-01T00:00:00Z';
  full.cycles = periodsToCycles([{ start: '2026-10-01', end: '2026-10-05' }, { start: '2026-09-02', end: '2026-09-06' }]);
  full.logs = [{ id: 'log-9', date: '2026-10-02', timestamp: '2026-10-02T09:00:00Z', pain: 6, flow: 'heavy', notes: 'rough' }];
  full.sleep = [{ date: '2026-10-02', hours: 7 }];
  full.contacts = [{ id: 'care-1', name: 'Dr M', role: 'gynaecologist', phone: '9' }];
  full.docs.pcos = { checkins: [{ id: 'p1', date: '2026-10-01', acne: 1, bodyHair: 0, hairThinning: 0, darkPatches: 0 }], checklist: { tsh: true }, diagnosed: 'unknown', scan: 'unknown' };
  full.docs.confidence = { proud: [{ id: 'x', date: '2026-10-01', text: 'spoke up' }], saved: [], levels: { '2026-10-01': 4 }, glow: {}, challenges: {} };
  const text = JSON.stringify(buildBackup(full, NOW));
  const r = parseImport(text, 'unnmegh-backup.json', NOW);
  assert.equal(r.source, 'unnmegh');
  const d = describeImport(emptyLocal(), r);
  assert.equal(d.merged.cycles.length, 2);
  assert.equal(d.merged.logs[0].notes, 'rough');
  assert.equal(d.merged.contacts.length, 1);
  assert.equal(d.merged.profile.isAssessmentCompleted, true);
  assert.equal((d.merged.docs.pcos as any).checkins.length, 1);
  assert.equal((d.merged.docs.confidence as any).proud[0].text, 'spoke up');
});

test('CSV export: quoting and no spreadsheet formulas', () => {
  const out = logsToCsv([{ id: 'a', date: '2026-10-02', timestamp: '2026-10-02T09:30:00Z', pain: 6, notes: '=SUM(A1) said "hi", ok', painLocation: ['back', 'pelvis'] } as any]);
  const line = out.split('\r\n')[1];
  assert.ok(line.includes(`"'=SUM(A1) said ""hi"", ok"`), line);
  assert.ok(line.includes('back; pelvis'));
  assert.match(periodsToCsv(periodsToCycles([{ start: '2026-10-01', end: '2026-10-05' }])), /2026-10-01,2026-10-05,5,28/);
  assert.equal(daysToLogs([{ date: '2026-08-03', flow: 'heavy' }], 'clue')[0].tags![0], 'Imported from Clue');
});

console.log(`\n${n} export/import tests passed`);
