import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Check, CircleDashed, CircleHelp, Dumbbell, FileText, HeartHandshake, Minus, Stethoscope, Trash2, Utensils } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { AuthGate } from '@/components/common/AuthGate';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Card, Chip, ProgressBar, SectionHeader } from '@/components/common/ui';
import { useAppStore } from '@/store/useAppStore';
import { useFitnessStore } from '@/store/useFitnessStore';
import { usePcosStore, type SignLevel, type Told } from '@/store/usePcosStore';
import { shortDateLabel, startOfWeekKey } from '@/lib/dates';
import { ROUTES } from '@/lib/routes';
import {
  CHECKLIST_TOTAL,
  DOCTOR_CHECKLIST,
  EXERCISE_NOTE,
  EXERCISE_PLAN,
  MEAL_NOTE,
  MEAL_PRINCIPLES,
  SAMPLE_DAY,
  SIGN_LEVELS,
  SIGN_QUESTIONS,
  WEEKLY_MINUTES_GOAL,
  summariseCriteria,
  type SignStatus,
} from '@/constants/pcos';

type Tab = 'signs' | 'food' | 'move' | 'doctor';
const TABS: { id: Tab; label: string }[] = [
  { id: 'signs', label: 'Signs' },
  { id: 'food', label: 'Food' },
  { id: 'move', label: 'Move' },
  { id: 'doctor', label: 'Doctor' },
];

const STATUS: Record<SignStatus, { label: string; color: string; bg: string }> = {
  yes: { label: 'Sign noted', color: '#B45309', bg: '#FEF3C7' },
  maybe: { label: 'Possible', color: '#6E55B5', bg: '#F2EDFB' },
  no: { label: 'Not seen', color: '#2F7D69', bg: '#E8F5F1' },
  unknown: { label: 'Not known yet', color: '#6E6478', bg: '#F1EFF4' },
};

function StatusIcon({ status }: { status: SignStatus }) {
  const color = themed(STATUS[status].color);
  if (status === 'yes') return <Check size={16} color={color} />;
  if (status === 'no') return <Minus size={16} color={color} />;
  if (status === 'maybe') return <CircleDashed size={16} color={color} />;
  return <CircleHelp size={16} color={color} />;
}

function CriterionRow({ n, title, status, detail }: { n: number; title: string; status: SignStatus; detail: string }) {
  const s = STATUS[status];
  return (
    <View style={styles.criterion}>
      <View style={[styles.criterionIcon, { backgroundColor: themed(s.bg) }]}>
        <StatusIcon status={status} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.criterionTop}>
          <Text style={styles.criterionTitle}>
            {n}. {title}
          </Text>
          <Text style={[styles.criterionTag, { color: themed(s.color) }]}>{s.label}</Text>
        </View>
        <Text style={styles.body}>{detail}</Text>
      </View>
    </View>
  );
}

const toNumber = (text: string, min: number, max: number): number | undefined => {
  const n = parseFloat(text.replace(',', '.'));
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n * 10) / 10 : undefined;
};

/** PCOS mode: notice the signs doctors look for, eat and move well, and prepare for a doctor's visit. */
export default function PcosScreen() {
  const pastCycles = useAppStore((s) => s.pastCycles);
  const sessions = useFitnessStore((s) => s.sessions);
  const { diagnosed, scan, checkins, checklist } = usePcosStore();
  const setDiagnosed = usePcosStore((s) => s.setDiagnosed);
  const setScan = usePcosStore((s) => s.setScan);
  const saveCheckin = usePcosStore((s) => s.saveCheckin);
  const removeCheckin = usePcosStore((s) => s.removeCheckin);
  const toggleChecklist = usePcosStore((s) => s.toggleChecklist);

  const [tab, setTab] = useState<Tab>('signs');
  const latest = checkins[0];
  const [levels, setLevels] = useState<Record<string, SignLevel>>({
    bodyHair: latest?.bodyHair ?? 0,
    acne: latest?.acne ?? 0,
    hairThinning: latest?.hairThinning ?? 0,
    darkPatches: latest?.darkPatches ?? 0,
  });
  const [waist, setWaist] = useState(latest?.waistCm ? String(latest.waistCm) : '');
  const [weight, setWeight] = useState(latest?.weightKg ? String(latest.weightKg) : '');
  const [saved, setSaved] = useState(false);

  const summary = useMemo(() => summariseCriteria(pastCycles, latest, scan), [pastCycles, latest, scan]);
  const weekMinutes = useMemo(() => {
    const week = startOfWeekKey();
    return sessions.filter((s) => s.date >= week).reduce((a, s) => a + s.minutes, 0);
  }, [sessions]);
  const ticked = Object.values(checklist).filter(Boolean).length;

  const save = () => {
    saveCheckin({
      bodyHair: levels.bodyHair,
      acne: levels.acne,
      hairThinning: levels.hairThinning,
      darkPatches: levels.darkPatches,
      waistCm: toNumber(waist, 40, 200),
      weightKg: toNumber(weight, 25, 250),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const toldRow = (value: Told, onChange: (v: Told) => void) => (
    <View style={styles.chips}>
      {(['yes', 'no', 'unknown'] as const).map((v) => (
        <Chip key={v} small label={v === 'yes' ? 'Yes' : v === 'no' ? 'No' : 'Not sure'} selected={value === v} onPress={() => onChange(v)} />
      ))}
    </View>
  );

  return (
    <AuthGate>
      <Screen>
        <ScreenHeader title="PCOS Care" subtitle="Notice the signs, eat and move well, see a doctor prepared" />

        <View style={styles.tabs}>
          {TABS.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.tab, tab === t.id && styles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === t.id }}
            >
              <Text style={[styles.tabText, tab === t.id && styles.tabTextActive]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        {tab === 'signs' ? (
          <>
            <Card tone="lilac" style={styles.gap}>
              <Text style={styles.cardTitle}>What doctors look for</Text>
              <Text style={styles.body}>
                PCOS (polycystic ovary syndrome) is common — about 1 in 5 Indian women aged 18–40. Doctors diagnose it when 2 of these 3 are
                present and other causes are ruled out. For teenagers, the first two are both needed and scans are not used.
              </Text>
            </Card>

            <Card style={styles.gap}>
              <CriterionRow n={1} title="Irregular periods" status={summary.cycles.status} detail={summary.cycles.detail} />
              <View style={styles.divider} />
              <CriterionRow n={2} title="Signs of higher androgens" status={summary.androgens.status} detail={summary.androgens.detail} />
              <View style={styles.divider} />
              <CriterionRow n={3} title="Polycystic ovaries on a scan" status={summary.ovaries.status} detail={summary.ovaries.detail} />
              <Text style={styles.question}>Has a scan or AMH blood test shown polycystic ovaries?</Text>
              {toldRow(scan, setScan)}
            </Card>

            <Card tone={summary.worthChecking ? 'amber' : 'mint'} style={styles.gap}>
              <Text style={styles.cardTitle}>
                {diagnosed === 'yes'
                  ? 'You have a PCOS diagnosis'
                  : summary.worthChecking
                    ? 'Worth talking to a gynaecologist'
                    : 'Nothing here points strongly to PCOS'}
              </Text>
              <Text style={styles.body}>
                {diagnosed === 'yes'
                  ? 'Use the Food, Move and Doctor tabs to manage it day to day, and keep logging so your doctor sees your pattern.'
                  : summary.worthChecking
                    ? 'Some signs doctors use are showing in what you logged. This is not a diagnosis — only a doctor can confirm or rule out PCOS, usually with a blood test.'
                    : 'Keep saving your periods and do a check-in each month. See a doctor if your periods become irregular or new signs appear.'}
              </Text>
              {summary.worthChecking || diagnosed === 'yes' ? (
                <PrimaryButton
                  title="Find a doctor in Care Connect"
                  variant="dark"
                  icon={<HeartHandshake size={16} color={themed('#FFFFFF')} />}
                  onPress={() => router.push(ROUTES.care)}
                  style={{ marginTop: 12 }}
                  fullWidth
                />
              ) : null}
              <Text style={styles.question}>Has a doctor told you that you have PCOS?</Text>
              {toldRow(diagnosed, setDiagnosed)}
            </Card>

            <SectionHeader title="Monthly check-in" subtitle="Takes 20 seconds. Saving again today replaces today’s entry." />
            <Card style={styles.gap}>
              {SIGN_QUESTIONS.map((q) => (
                <View key={q.id} style={styles.signBlock}>
                  <Text style={styles.signLabel}>{q.label}</Text>
                  <Text style={styles.help}>{q.help}</Text>
                  <View style={styles.chips}>
                    {SIGN_LEVELS.map((label, i) => (
                      <Chip
                        key={label}
                        small
                        label={label}
                        selected={levels[q.id] === i}
                        onPress={() => setLevels((prev) => ({ ...prev, [q.id]: i as SignLevel }))}
                      />
                    ))}
                  </View>
                </View>
              ))}
              <View style={styles.measureRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.signLabel}>Waist (cm)</Text>
                  <TextInput
                    value={waist}
                    onChangeText={setWaist}
                    keyboardType="decimal-pad"
                    placeholder="Optional"
                    placeholderTextColor={Theme.colors.textTertiary}
                    style={styles.input}
                    maxLength={5}
                    accessibilityLabel="Waist in centimetres"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.signLabel}>Weight (kg)</Text>
                  <TextInput
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="decimal-pad"
                    placeholder="Optional"
                    placeholderTextColor={Theme.colors.textTertiary}
                    style={styles.input}
                    maxLength={5}
                    accessibilityLabel="Weight in kilograms"
                  />
                </View>
              </View>
              <PrimaryButton title={saved ? 'Saved' : 'Save check-in'} onPress={save} fullWidth style={{ marginTop: 14 }} />
            </Card>

            {checkins.length > 0 ? (
              <>
                <SectionHeader title="Your check-ins" />
                <Card style={styles.gap}>
                  {checkins.slice(0, 6).map((c, i) => (
                    <View key={c.id} style={[styles.historyRow, i > 0 && styles.historyBorder]}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyDate}>{shortDateLabel(c.date)}</Text>
                        <Text style={styles.help}>
                          Hair {SIGN_LEVELS[c.bodyHair].toLowerCase()} · Acne {SIGN_LEVELS[c.acne].toLowerCase()} · Scalp{' '}
                          {SIGN_LEVELS[c.hairThinning].toLowerCase()} · Patches {SIGN_LEVELS[c.darkPatches].toLowerCase()}
                          {c.waistCm ? ` · Waist ${c.waistCm} cm` : ''}
                          {c.weightKg ? ` · ${c.weightKg} kg` : ''}
                        </Text>
                      </View>
                      <Pressable onPress={() => removeCheckin(c.id)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Delete check-in">
                        <Trash2 size={16} color={Theme.colors.textTertiary} />
                      </Pressable>
                    </View>
                  ))}
                </Card>
              </>
            ) : null}
          </>
        ) : null}

        {tab === 'food' ? (
          <>
            <SectionHeader title="Eating well with PCOS" subtitle="Everyday Indian food, no special products" />
            <Card style={styles.gap}>
              {MEAL_PRINCIPLES.map((m, i) => (
                <View key={m.title} style={[styles.tipRow, i > 0 && styles.historyBorder]}>
                  <View style={styles.tipIcon}>
                    <Utensils size={15} color={Theme.colors.primaryDark} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.signLabel}>{m.title}</Text>
                    <Text style={styles.body}>{m.text}</Text>
                  </View>
                </View>
              ))}
            </Card>
            <SectionHeader title="A sample day" />
            <Card style={styles.gap}>
              {SAMPLE_DAY.map((d, i) => (
                <View key={d.meal} style={[styles.mealRow, i > 0 && styles.historyBorder]}>
                  <Text style={styles.mealName}>{d.meal}</Text>
                  <Text style={[styles.body, { flex: 1 }]}>{d.ideas}</Text>
                </View>
              ))}
            </Card>
            <Text style={styles.note}>{MEAL_NOTE}</Text>
          </>
        ) : null}

        {tab === 'move' ? (
          <>
            <SectionHeader title="This week" subtitle="From the workouts you log in Fitness" />
            <Card style={styles.gap}>
              <View style={styles.weekTop}>
                <Text style={styles.weekValue}>{weekMinutes}</Text>
                <Text style={styles.body}> / {WEEKLY_MINUTES_GOAL} active minutes</Text>
              </View>
              <ProgressBar value={weekMinutes / WEEKLY_MINUTES_GOAL} color={themed('#3E9E86')} track={themed('rgba(62,158,134,0.15)')} />
              <PrimaryButton
                title="Open Fitness & Weight"
                variant="outline"
                icon={<Dumbbell size={16} color={Theme.colors.textPrimary} />}
                onPress={() => router.push('/fitness')}
                style={{ marginTop: 14 }}
                fullWidth
              />
            </Card>
            <SectionHeader title="A simple weekly plan" />
            <Card style={styles.gap}>
              {EXERCISE_PLAN.map((d, i) => (
                <View key={d.day} style={[styles.mealRow, i > 0 && styles.historyBorder]}>
                  <Text style={styles.mealName}>{d.day}</Text>
                  <Text style={[styles.body, { flex: 1 }]}>{d.plan}</Text>
                  <Text style={styles.minutes}>{d.minutes ? `${d.minutes} min` : '—'}</Text>
                </View>
              ))}
            </Card>
            <Text style={styles.note}>{EXERCISE_NOTE}</Text>
          </>
        ) : null}

        {tab === 'doctor' ? (
          <>
            <SectionHeader title="Doctor checklist" subtitle={`${ticked} of ${CHECKLIST_TOTAL} done`} />
            {DOCTOR_CHECKLIST.map((g) => (
              <Card key={g.group} style={styles.gap}>
                <View style={styles.groupHead}>
                  <Stethoscope size={15} color={Theme.colors.primaryDark} />
                  <Text style={styles.cardTitle}>{g.group}</Text>
                </View>
                {g.items.map((item) => {
                  const on = !!checklist[item.id];
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggleChecklist(item.id)}
                      style={styles.checkRow}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                    >
                      <View style={[styles.box, on && styles.boxOn]}>{on ? <Check size={13} color={themed('#FFFFFF')} /> : null}</View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.checkLabel, on && styles.checkLabelOn]}>{item.label}</Text>
                        {item.why ? <Text style={styles.help}>{item.why}</Text> : null}
                      </View>
                    </Pressable>
                  );
                })}
              </Card>
            ))}
            <PrimaryButton
              title="Open my doctor report"
              icon={<FileText size={16} color={themed('#FFFFFF')} />}
              onPress={() => router.push('/(tabs)/report')}
              fullWidth
            />
            <Text style={styles.note}>
              Based on the 2023 International Evidence-based Guideline for PCOS. SheSync does not diagnose or prescribe; your doctor decides
              which tests and treatment you need.
            </Text>
          </>
        ) : null}
      </Screen>
    </AuthGate>
  );
}

const styles = createStyles(() => ({
  gap: { marginBottom: 14 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.backgroundMuted,
    borderRadius: 999,
    padding: 4,
    marginBottom: 14,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center' },
  tabActive: { backgroundColor: Theme.colors.white, ...Theme.shadows.card },
  tabText: { fontSize: 13, fontWeight: '600', color: Theme.colors.textSecondary },
  tabTextActive: { color: Theme.colors.primaryDark, fontWeight: '800' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 4 },
  body: { fontSize: 13, lineHeight: 19, color: Theme.colors.textSecondary },
  help: { fontSize: 12, lineHeight: 17, color: Theme.colors.textSecondary, marginTop: 1 },
  note: { fontSize: 12, lineHeight: 17, color: Theme.colors.textSecondary, marginTop: 4, marginBottom: 16, paddingHorizontal: 4 },
  question: { fontSize: 13, fontWeight: '700', color: Theme.colors.textPrimary, marginTop: 14, marginBottom: 8 },
  criterion: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  criterionIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  criterionTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  criterionTitle: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  criterionTag: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  divider: { height: 1, backgroundColor: Theme.colors.cardBorder, marginVertical: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  signBlock: { marginBottom: 14 },
  signLabel: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  measureRow: { flexDirection: 'row', gap: 12 },
  input: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  historyBorder: { borderTopWidth: 1, borderTopColor: Theme.colors.cardBorder },
  historyDate: { fontSize: 13, fontWeight: '700', color: Theme.colors.textPrimary },
  tipRow: { flexDirection: 'row', gap: 12, paddingVertical: 11, alignItems: 'flex-start' },
  tipIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  mealRow: { flexDirection: 'row', gap: 12, paddingVertical: 10, alignItems: 'flex-start' },
  mealName: { width: 76, fontSize: 13, fontWeight: '800', color: Theme.colors.primaryDark },
  minutes: { fontSize: 12, fontWeight: '700', color: Theme.colors.textSecondary },
  weekTop: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 10 },
  weekValue: { fontSize: 28, fontWeight: '800', color: '#2F7D69' },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  checkRow: { flexDirection: 'row', gap: 12, paddingVertical: 9, alignItems: 'flex-start' },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Theme.colors.secondaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxOn: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  checkLabel: { fontSize: 14, lineHeight: 20, color: Theme.colors.textPrimary, fontWeight: '600' },
  checkLabelOn: { color: Theme.colors.textSecondary, textDecorationLine: 'line-through' },
}));
