import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import {
  Flame,
  Droplet,
  Footprints,
  Scale,
  Target,
  Play,
  ShieldCheck,
  Pencil,
  Dumbbell,
  Home as HomeIcon,
  Info,
} from 'lucide-react-native';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Card, Chip, MiniBars, ProgressBar, SectionHeader, StatTile, Stepper, uiStyles } from '@/components/common/ui';
import { VideoShelf } from '@/components/common/VideoShelf';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { WeightChart } from '@/components/fitness/WeightChart';
import { WorkoutListItem } from '@/components/fitness/WorkoutListItem';
import { Theme } from '@/constants/theme';
import {
  CATEGORY_LABELS,
  FITNESS_LIBRARY,
  INTENSITY_LABELS,
  STRENGTH_WORKOUT_IDS,
  type WorkoutCategory,
} from '@/constants/fitnessLibrary';
import { FITNESS_VIDEOS, FITNESS_VIDEO_CATEGORIES } from '@/constants/wellnessVideos';
import { useAppStore } from '@/store/useAppStore';
import { useFitnessStore } from '@/store/useFitnessStore';
import { useTodayPlan } from '@/hooks/useTodayPlan';
import { bmi, bmiBand, energyPlan, GOAL_LABELS } from '@/lib/fitness';
import { daysSinceKey, lastNDaysKeys, shortDateLabel, startOfWeekKey, todayKey, weekdayLabel } from '@/lib/dates';

export default function FitnessDashboard() {
  const plan = useTodayPlan();
  const phase = useAppStore((s) => s.cycle.phase);
  const cycleLabel = useAppStore((s) => s.cycle.label);
  const strainScore = useAppStore((s) => s.biometrics.strainScore);

  const profile = useFitnessStore((s) => s.profile);
  const weights = useFitnessStore((s) => s.weights);
  const sessions = useFitnessStore((s) => s.sessions);
  const habits = useFitnessStore((s) => s.habits);
  const setTrainingPlace = useFitnessStore((s) => s.setTrainingPlace);
  const logWeight = useFitnessStore((s) => s.logWeight);
  const addWater = useFitnessStore((s) => s.addWater);
  const setSteps = useFitnessStore((s) => s.setSteps);

  const [tab, setTab] = useState<WorkoutCategory>(profile?.trainingPlace === 'gym' ? 'gym' : 'home');
  const [weightInput, setWeightInput] = useState('');
  const [weightError, setWeightError] = useState('');

  const today = todayKey();
  const todayHabits = habits[today] ?? { water: 0, steps: 0 };

  const week = useMemo(() => {
    const start = startOfWeekKey();
    const days = lastNDaysKeys(7);
    const inWeek = sessions.filter((s) => s.date >= start);
    return {
      minutes: inWeek.reduce((a, s) => a + s.minutes, 0),
      kcal: inWeek.reduce((a, s) => a + s.kcal, 0),
      strengthDays: new Set(inWeek.filter((s) => STRENGTH_WORKOUT_IDS.has(s.workoutId)).map((s) => s.date)).size,
      count: inWeek.length,
      bars: days.map((d) => sessions.filter((s) => s.date === d).reduce((a, s) => a + s.minutes, 0)),
      labels: days.map((d) => weekdayLabel(d).slice(0, 2)),
    };
  }, [sessions]);

  const ep = profile ? energyPlan(profile) : null;
  const currentBmi = profile ? bmi(profile.heightCm, profile.weightKg) : 0;
  const band = bmiBand(currentBmi);

  const weightTrend = useMemo(() => {
    const thisWeek = weights.filter((w) => daysSinceKey(w.date) < 7);
    const lastWeek = weights.filter((w) => daysSinceKey(w.date) >= 7 && daysSinceKey(w.date) < 14);
    if (!thisWeek.length || !lastWeek.length) return null;
    const avg = (arr: typeof weights) => arr.reduce((a, w) => a + w.kg, 0) / arr.length;
    const change = Math.round((avg(thisWeek) - avg(lastWeek)) * 10) / 10;
    const pctPerWeek = (Math.abs(change) / avg(lastWeek)) * 100;
    return { change, fast: change < 0 && pctPerWeek > 1 };
  }, [weights]);

  const goalProgress = useMemo(() => {
    if (!profile?.targetWeightKg || profile.goal !== 'lose' || weights.length === 0) return null;
    const start = weights[weights.length - 1].kg;
    const span = start - profile.targetWeightKg;
    if (span <= 0) return null;
    return { start, value: Math.max(0, Math.min(1, (start - profile.weightKg) / span)) };
  }, [profile, weights]);

  const saveWeight = () => {
    const kg = parseFloat(weightInput.replace(',', '.'));
    if (!Number.isFinite(kg) || kg < 25 || kg > 300) {
      setWeightError('Enter your weight in kg, e.g. 58.4');
      return;
    }
    logWeight(kg);
    setWeightInput('');
    setWeightError('');
  };

  const waterGoal = ep ? Math.max(6, Math.round(ep.waterLitres / 0.25)) : 8;
  const recent = sessions.slice(0, 5);

  return (
    <Screen>
      <ScreenHeader
        title="Fitness & Weight"
        subtitle="Gym, home workouts & yoga — tuned to your cycle and strain"
        badge="Movement Engine"
      />

      {/* ── Today's plan ─────────────────────────────── */}
      <Card tone="dark" style={styles.todayCard}>
        <Text style={styles.todayLabel}>TODAY · {cycleLabel.toUpperCase()}</Text>
        <Text style={styles.todayTitle}>{plan.workout.title}</Text>
        <Text style={styles.todayMeta}>
          {plan.workout.minutes} min · {INTENSITY_LABELS[plan.workout.intensity]} · {CATEGORY_LABELS[plan.workout.category]}
        </Text>
        {plan.isOverride ? (
          <View style={styles.overridePill}>
            <ShieldCheck size={13} color="#FDE68A" />
            <Text style={styles.overrideText}>
              Swapped from “{plan.planned.title}” — strain {strainScore}/100
            </Text>
          </View>
        ) : null}
        <Text style={styles.todayReason}>{plan.isOverride ? plan.card.reason : plan.phaseNote}</Text>
        <View style={styles.placeRow}>
          <Text style={styles.placeLabel}>I train at</Text>
          {(['home', 'gym'] as const).map((p) => {
            const active = (profile?.trainingPlace ?? 'home') === p;
            return (
              <Pressable
                key={p}
                onPress={() => (profile ? setTrainingPlace(p) : router.push('/fitness/setup'))}
                style={[styles.placeChip, active && styles.placeChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                {p === 'gym' ? (
                  <Dumbbell size={13} color={active ? Theme.colors.obsidian : '#FFFFFF'} />
                ) : (
                  <HomeIcon size={13} color={active ? Theme.colors.obsidian : '#FFFFFF'} />
                )}
                <Text style={[styles.placeText, active && styles.placeTextActive]}>{p === 'gym' ? 'Gym' : 'Home'}</Text>
              </Pressable>
            );
          })}
        </View>
        <PrimaryButton
          title={`Start ${plan.workout.minutes}-min session`}
          icon={<Play size={16} color="#FFFFFF" fill="#FFFFFF" />}
          onPress={() => router.push(`/fitness/workout/${plan.workout.id}`)}
          fullWidth
          style={{ marginTop: 14 }}
        />
      </Card>

      {/* ── This week ────────────────────────────────── */}
      <SectionHeader title="This week" subtitle="WHO suggests 150+ active minutes and 2 strength days a week" />
      <View style={styles.tiles}>
        <StatTile
          label="Active min"
          value={`${week.minutes}`}
          hint="of 150"
          color={Theme.colors.primary}
          icon={<Flame size={16} color={Theme.colors.primary} />}
        />
        <StatTile
          label="Strength days"
          value={`${week.strengthDays}/2`}
          hint={week.strengthDays >= 2 ? 'Goal met' : 'Lift or bodyweight'}
          color="#0F766E"
          icon={<Dumbbell size={16} color="#0F766E" />}
        />
        <StatTile
          label="Burned"
          value={`${week.kcal}`}
          hint="kcal (estimate)"
          color={Theme.colors.strainAmber}
          icon={<Target size={16} color={Theme.colors.strainAmber} />}
        />
      </View>
      <Card style={{ marginTop: 10 }}>
        <ProgressBar value={week.minutes / 150} />
        <Text style={[uiStyles.muted, { marginTop: 8 }]}>
          {week.minutes >= 150
            ? 'You hit the weekly activity goal — anything extra is a bonus.'
            : `${150 - week.minutes} more active minutes to reach this week’s goal. Brisk walks count!`}
        </Text>
        <View style={{ marginTop: 12 }}>
          <MiniBars values={week.bars} labels={week.labels} unit=" min" />
        </View>
      </Card>

      {/* ── Body & weight ────────────────────────────── */}
      <SectionHeader
        title="Body & weight"
        subtitle="Safe, slow targets — never below 1,200 kcal or your BMR"
        right={
          profile ? (
            <Pressable onPress={() => router.push('/fitness/setup')} style={styles.editBtn} accessibilityRole="button">
              <Pencil size={13} color={Theme.colors.primary} />
              <Text style={styles.editText}>Edit</Text>
            </Pressable>
          ) : null
        }
      />
      {!profile || !ep ? (
        <Card tone="rose">
          <Text style={uiStyles.strong}>Set up your body profile</Text>
          <Text style={[uiStyles.body, { marginTop: 4 }]}>
            Height, weight, age and goal let SheSync work out your BMI, daily calories, protein and water — with
            safety limits built in.
          </Text>
          <PrimaryButton
            title="Set up in 30 seconds"
            onPress={() => router.push('/fitness/setup')}
            fullWidth
            style={{ marginTop: 12 }}
          />
        </Card>
      ) : (
        <Card>
          <View style={styles.bmiRow}>
            <View>
              <Text style={uiStyles.label}>BMI</Text>
              <Text style={[styles.bmiValue, { color: band.color }]}>{currentBmi.toFixed(1)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bandLabel, { color: band.color }]}>{band.label}</Text>
              <Text style={uiStyles.muted}>{band.note}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={uiStyles.label}>{GOAL_LABELS[profile.goal]}</Text>
          <View style={[styles.tiles, { marginTop: 8 }]}>
            <StatTile label="Eat about" value={`${ep.target}`} hint="kcal / day" color={Theme.colors.primary} />
            <StatTile label="Protein" value={`${ep.proteinGrams[0]}–${ep.proteinGrams[1]}g`} hint="per day" color="#0F766E" />
            <StatTile label="Water" value={`${ep.waterLitres} L`} hint="per day" color="#0284C7" />
          </View>
          <Text style={[uiStyles.muted, { marginTop: 10 }]}>
            Maintenance ≈ {ep.maintenance} kcal · BMR ≈ {ep.bmr} kcal. {ep.message}
          </Text>
          {ep.lossBlocked ? (
            <View style={[styles.notice, { backgroundColor: '#E0F2FE', borderColor: '#7DD3FC' }]}>
              <Info size={14} color="#0369A1" />
              <Text style={[styles.noticeText, { color: '#075985' }]}>Weight-loss target paused for your safety.</Text>
            </View>
          ) : null}
          {ep.floorApplied ? (
            <View style={[styles.notice, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
              <Info size={14} color="#B45309" />
              <Text style={[styles.noticeText, { color: '#92400E' }]}>
                Target raised to your safe minimum. Add activity rather than eating less.
              </Text>
            </View>
          ) : null}
          {goalProgress && profile.targetWeightKg ? (
            <View style={{ marginTop: 14 }}>
              <View style={uiStyles.row}>
                <Text style={[uiStyles.muted, { flex: 1 }]}>
                  {goalProgress.start} kg → {profile.targetWeightKg} kg
                </Text>
                <Text style={[uiStyles.muted, { fontWeight: '800', color: Theme.colors.primary }]}>
                  {Math.round(goalProgress.value * 100)}%
                </Text>
              </View>
              <View style={{ marginTop: 6 }}>
                <ProgressBar value={goalProgress.value} color="#10B981" track="rgba(16,185,129,0.15)" />
              </View>
              {ep.weeksToGoal ? (
                <Text style={[uiStyles.muted, { marginTop: 6 }]}>
                  At a gentle pace, about {ep.weeksToGoal} weeks to go. Slow and steady protects your cycle.
                </Text>
              ) : null}
            </View>
          ) : null}
        </Card>
      )}

      {/* ── Weight log ───────────────────────────────── */}
      <SectionHeader title="Weight log" subtitle="Weigh at the same time of day; compare week to week" />
      <Card>
        <View style={styles.weightRow}>
          <View style={styles.weightIcon}>
            <Scale size={18} color={Theme.colors.primary} />
          </View>
          <TextInput
            value={weightInput}
            onChangeText={(t) => {
              setWeightInput(t);
              if (weightError) setWeightError('');
            }}
            placeholder={profile ? `${profile.weightKg}` : 'e.g. 58.4'}
            placeholderTextColor={Theme.colors.textTertiary}
            keyboardType="decimal-pad"
            style={[uiStyles.input, { flex: 1 }]}
            accessibilityLabel="Today's weight in kilograms"
            onSubmitEditing={saveWeight}
            returnKeyType="done"
          />
          <Text style={styles.kg}>kg</Text>
          <PrimaryButton title="Save" onPress={saveWeight} style={{ paddingVertical: 11 }} />
        </View>
        {weightError ? <Text style={styles.error}>{weightError}</Text> : null}
        <View style={{ marginTop: 14 }}>
          <WeightChart entries={weights} target={profile?.goal === 'lose' ? profile.targetWeightKg : undefined} />
        </View>
        {weightTrend ? (
          <Text style={[uiStyles.muted, { marginTop: 8 }]}>
            7-day average {weightTrend.change > 0 ? 'up' : weightTrend.change < 0 ? 'down' : 'steady'}{' '}
            {weightTrend.change !== 0 ? `${Math.abs(weightTrend.change)} kg` : ''} vs last week.
          </Text>
        ) : null}
        {weightTrend?.fast ? (
          <View style={[styles.notice, { backgroundColor: '#FFF1F2', borderColor: '#FECDD3' }]}>
            <Info size={14} color={Theme.colors.strainHigh} />
            <Text style={[styles.noticeText, { color: Theme.colors.primaryDark }]}>
              You are losing more than 1% of your weight a week. Please eat a little more — fast loss can disrupt periods.
            </Text>
          </View>
        ) : null}
        <Text style={[uiStyles.muted, { marginTop: 10 }]}>
          Water retention before a period can add a kilo or two for a few days — it is not fat. Judge progress over weeks.
        </Text>
      </Card>

      {/* ── Daily habits ─────────────────────────────── */}
      <SectionHeader title="Today’s habits" />
      <View style={styles.habitRow}>
        <Card style={styles.habitCard}>
          <View style={uiStyles.row}>
            <Droplet size={16} color="#0284C7" />
            <Text style={styles.habitTitle}>Water</Text>
          </View>
          <Text style={styles.habitValue}>
            {todayHabits.water}
            <Text style={styles.habitGoal}> / {waterGoal} glasses</Text>
          </Text>
          <ProgressBar value={todayHabits.water / waterGoal} color="#0284C7" track="rgba(2,132,199,0.12)" />
          <View style={[uiStyles.row, { gap: 8, marginTop: 10 }]}>
            <Chip label="− 1" onPress={() => addWater(-1)} small accessibilityLabel="Remove a glass of water" />
            <Chip label="+ 1 glass" onPress={() => addWater(1)} selected color="#0284C7" small accessibilityLabel="Add a glass of water" />
          </View>
        </Card>
        <Card style={styles.habitCard}>
          <View style={uiStyles.row}>
            <Footprints size={16} color="#7C3AED" />
            <Text style={styles.habitTitle}>Steps</Text>
          </View>
          <Text style={styles.habitValue}>
            {todayHabits.steps.toLocaleString('en-IN')}
            <Text style={styles.habitGoal}> / 7,500</Text>
          </Text>
          <ProgressBar value={todayHabits.steps / 7500} color="#7C3AED" track="rgba(124,58,237,0.12)" />
          <View style={{ marginTop: 10, alignItems: 'flex-start' }}>
            <Stepper
              label="Steps"
              value={todayHabits.steps}
              onChange={setSteps}
              min={0}
              max={40000}
              step={500}
              format={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
            />
          </View>
        </Card>
      </View>

      {/* ── Library ──────────────────────────────────── */}
      <SectionHeader title="Workout library" subtitle="Tap any session to start the guided player" />
      <View style={[uiStyles.wrap, { marginBottom: 12 }]}>
        {(['gym', 'home', 'yoga'] as WorkoutCategory[]).map((c) => (
          <Chip
            key={c}
            label={CATEGORY_LABELS[c]}
            selected={tab === c}
            onPress={() => setTab(c)}
            accessibilityLabel={`${CATEGORY_LABELS[c]} workouts`}
          />
        ))}
      </View>
      {FITNESS_LIBRARY.filter((w) => w.category === tab).map((w) => (
        <WorkoutListItem key={w.id} workout={w} phase={phase} />
      ))}

      {/* ── Recent sessions ──────────────────────────── */}
      {recent.length ? (
        <>
          <SectionHeader title="Recent sessions" />
          <Card>
            {recent.map((s, i) => (
              <View key={s.id} style={[styles.recentRow, i > 0 && styles.recentBorder]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentTitle}>{s.title}</Text>
                  <Text style={uiStyles.muted}>
                    {shortDateLabel(s.date)} · {s.minutes} min · ~{s.kcal} kcal
                  </Text>
                </View>
                {s.feel ? (
                  <Text style={styles.feel}>{s.feel === 'easy' ? '😌 Easy' : s.feel === 'right' ? '💪 Just right' : '🥵 Hard'}</Text>
                ) : null}
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {/* ── Videos ───────────────────────────────────── */}
      <SectionHeader title="Video classes" subtitle="Follow along with trusted YouTube trainers" />
      <VideoShelf videos={FITNESS_VIDEOS} categories={FITNESS_VIDEO_CATEGORIES} />

      <Card tone="amber" style={{ marginTop: 18 }}>
        <Text style={[uiStyles.body, { color: '#92400E' }]}>
          Stop and rest if you feel dizzy, faint, short of breath or have chest pain. If you are pregnant, injured,
          have very heavy bleeding or a health condition, check with a doctor before starting a new routine.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  todayCard: { marginTop: 4 },
  todayLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: '#FDA4AF' },
  todayTitle: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', marginTop: 6, letterSpacing: -0.4 },
  todayMeta: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4, fontWeight: '600' },
  overridePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(253, 230, 138, 0.12)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
  },
  overrideText: { color: '#FDE68A', fontSize: 11, fontWeight: '700', flexShrink: 1 },
  todayReason: { fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.85)', marginTop: 10 },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  placeLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginRight: 2 },
  placeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  placeChipActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  placeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  placeTextActive: { color: Theme.colors.obsidian },
  tiles: { flexDirection: 'row', gap: 10 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, backgroundColor: Theme.colors.primaryLight },
  editText: { fontSize: 12, fontWeight: '800', color: Theme.colors.primary },
  bmiRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  bmiValue: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  bandLabel: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  divider: { height: 1, backgroundColor: Theme.colors.cardBorder, marginVertical: 14 },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Theme.radius.md,
    padding: 10,
    marginTop: 10,
  },
  noticeText: { fontSize: 12, fontWeight: '600', flex: 1, lineHeight: 17 },
  weightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weightIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Theme.colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  kg: { fontSize: 13, fontWeight: '700', color: Theme.colors.textSecondary },
  error: { color: Theme.colors.primaryDark, fontSize: 12, marginTop: 6, fontWeight: '600' },
  habitRow: { flexDirection: 'row', gap: 10 },
  habitCard: { flex: 1, padding: 14 },
  habitTitle: { fontSize: 13, fontWeight: '800', color: Theme.colors.textPrimary, marginLeft: 6 },
  habitValue: { fontSize: 22, fontWeight: '900', color: Theme.colors.textPrimary, marginVertical: 8 },
  habitGoal: { fontSize: 12, fontWeight: '600', color: Theme.colors.textTertiary },
  recentRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  recentBorder: { borderTopWidth: 1, borderTopColor: Theme.colors.cardBorder },
  recentTitle: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  feel: { fontSize: 12, fontWeight: '700', color: Theme.colors.textSecondary },
});
