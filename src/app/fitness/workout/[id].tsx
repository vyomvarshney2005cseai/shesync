import React, { useEffect, useMemo, useReducer, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, Vibration, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { Check, ChevronLeft, ChevronRight, Pause, Play, SkipForward, Square, Timer } from 'lucide-react-native';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Card, Chip, ProgressBar, SectionHeader, uiStyles } from '@/components/common/ui';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Theme } from '@/constants/theme';
import { getLibraryWorkout, INTENSITY_LABELS, type LibraryWorkout } from '@/constants/fitnessLibrary';
import { useFitnessStore, type WorkoutSession } from '@/store/useFitnessStore';
import { kcalFromMet } from '@/lib/fitness';
import { formatClock } from '@/lib/dates';
import {
  activeMinutes,
  createPlayerReducer,
  initialPlayerState,
  secondsLeft,
} from '@/lib/workoutPlayer';

export default function WorkoutPlayerScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = getLibraryWorkout(id);
  if (!workout) {
    return (
      <Screen>
        <ScreenHeader title="Workout not found" fallbackHref="/fitness" />
        <PrimaryButton title="Back to Fitness" onPress={() => router.replace('/fitness')} fullWidth />
      </Screen>
    );
  }
  return <Player workout={workout} />;
}

function KeepAwake() {
  useKeepAwake('shesync-workout');
  return null;
}

function Player({ workout }: { workout: LibraryWorkout }) {
  const reducer = useMemo(() => createPlayerReducer(workout), [workout]);
  const [state, dispatch] = useReducer(reducer, initialPlayerState);
  const weightKg = useFitnessStore((s) => s.profile?.weightKg ?? 60);
  const logSession = useFitnessStore((s) => s.logSession);
  const rateSession = useFitnessStore((s) => s.rateSession);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [feel, setFeel] = useState<WorkoutSession['feel']>();

  const running = (state.phase === 'work' || state.phase === 'rest') && !state.paused;

  // Clock: dispatch ticks only while a countdown is live.
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => dispatch({ type: 'tick', now: Date.now() }), 250);
    return () => clearInterval(timer);
  }, [running]);

  // A short buzz on every new exercise, set or rest (phones only).
  useEffect(() => {
    if (Platform.OS !== 'web' && (state.phase === 'work' || state.phase === 'rest' || state.phase === 'done')) {
      Vibration.vibrate(state.phase === 'done' ? [0, 200, 120, 200] : 120);
    }
  }, [state.phase, state.step, state.set]);

  const step = workout.steps[Math.min(state.step, workout.steps.length - 1)];
  const sets = step.sets ?? 1;
  const left = secondsLeft(state);
  const progress = state.phase === 'done' ? 1 : state.step / workout.steps.length;
  const minutes = activeMinutes(state);
  const kcal = kcalFromMet(workout.met, weightKg, minutes);

  const save = () => {
    const sid = logSession({
      workoutId: workout.id,
      title: workout.title,
      category: workout.category,
      minutes,
      kcal,
      intensity: workout.intensity,
      feel,
    });
    setSavedId(sid);
  };

  const now = () => Date.now();

  return (
    <Screen>
      {(running || state.paused) && Platform.OS !== 'web' ? <KeepAwake /> : null}
      <ScreenHeader
        title={workout.title}
        subtitle={`${workout.minutes} min · ${INTENSITY_LABELS[workout.intensity]} · ${workout.equipment}`}
        fallbackHref="/fitness"
      />

      {state.phase === 'ready' ? (
        <>
          <Card tone="rose">
            <Text style={uiStyles.body}>{workout.summary}</Text>
            <Text style={[uiStyles.muted, { marginTop: 8 }]}>Focus: {workout.focus}</Text>
          </Card>
          <SectionHeader title={`${workout.steps.length} steps`} subtitle="The player times each set and rest for you" />
          <Card>
            {workout.steps.map((st, i) => (
              <View key={st.id} style={[styles.stepRow, i > 0 && styles.stepBorder]}>
                <Text style={styles.stepNum}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepName}>{st.name}</Text>
                  <Text style={uiStyles.muted}>{describeStep(st)}</Text>
                  {st.easier ? <Text style={styles.easier}>Easier: {st.easier}</Text> : null}
                </View>
              </View>
            ))}
          </Card>
          <PrimaryButton
            title="Start workout"
            icon={<Play size={16} color="#FFFFFF" fill="#FFFFFF" />}
            onPress={() => dispatch({ type: 'start', now: now() })}
            fullWidth
            style={{ marginTop: 18 }}
          />
          <Text style={[uiStyles.muted, { textAlign: 'center', marginTop: 10 }]}>
            Listen to your body — skip anything that hurts. Rest is part of training.
          </Text>
        </>
      ) : null}

      {state.phase === 'work' || state.phase === 'rest' ? (
        <>
          <View style={{ marginBottom: 12 }}>
            <ProgressBar value={progress} />
            <Text style={[uiStyles.muted, { marginTop: 6 }]}>
              Step {state.step + 1} of {workout.steps.length} · {formatClock(Math.max(0, (state.now - (state.startedAt ?? state.now) - state.pausedMs) / 1000))} elapsed
            </Text>
          </View>

          <Card tone={state.phase === 'rest' ? 'mint' : 'dark'} style={styles.liveCard}>
            <Text style={[styles.liveLabel, state.phase === 'rest' && { color: '#047857' }]}>
              {state.phase === 'rest' ? 'REST' : sets > 1 ? `SET ${state.set} OF ${sets}` : 'NOW'}
              {state.paused ? ' · PAUSED' : ''}
            </Text>
            <Text style={[styles.liveName, state.phase === 'rest' && { color: Theme.colors.textPrimary }]}>
              {state.phase === 'rest' ? `Next: ${step.name} (set ${state.set + 1})` : step.name}
            </Text>
            {left != null ? (
              <Text
                style={[styles.bigTimer, state.phase === 'rest' && { color: '#047857' }]}
                accessibilityLabel={`${left} seconds left`}
                accessibilityLiveRegion="polite"
              >
                {formatClock(left)}
              </Text>
            ) : (
              <Text style={styles.bigReps}>{step.reps ?? 'Go'}</Text>
            )}
            {state.phase === 'work' ? (
              <>
                <Text style={styles.liveHow}>{step.how}</Text>
                {step.tip ? <Text style={styles.liveTip}>Tip: {step.tip}</Text> : null}
                {step.easier ? <Text style={styles.liveTip}>Easier: {step.easier}</Text> : null}
              </>
            ) : (
              <Text style={[styles.liveHow, { color: Theme.colors.textSecondary }]}>Breathe slowly. Sip some water.</Text>
            )}
          </Card>

          <View style={styles.controls}>
            <ControlButton
              label="Back"
              icon={<ChevronLeft size={18} color={Theme.colors.textPrimary} />}
              onPress={() => dispatch({ type: 'prev', now: now() })}
              disabled={state.step === 0}
            />
            <ControlButton
              label={state.paused ? 'Resume' : 'Pause'}
              icon={state.paused ? <Play size={18} color={Theme.colors.textPrimary} /> : <Pause size={18} color={Theme.colors.textPrimary} />}
              onPress={() => dispatch({ type: state.paused ? 'resume' : 'pause', now: now() })}
            />
            <ControlButton
              label="Next"
              icon={<ChevronRight size={18} color={Theme.colors.textPrimary} />}
              onPress={() => dispatch({ type: 'next', now: now() })}
            />
          </View>

          {state.phase === 'work' && left == null ? (
            <PrimaryButton
              title={state.set < sets ? `Done — set ${state.set} of ${sets}` : 'Done — next exercise'}
              icon={<Check size={16} color="#FFFFFF" />}
              onPress={() => dispatch({ type: 'doneSet', now: now() })}
              fullWidth
              style={{ marginTop: 12 }}
            />
          ) : (
            <PrimaryButton
              title={state.phase === 'rest' ? 'Skip rest' : 'Skip this set'}
              variant="outline"
              icon={<SkipForward size={16} color={Theme.colors.textPrimary} />}
              onPress={() => dispatch({ type: 'skip', now: now() })}
              fullWidth
              style={{ marginTop: 12 }}
            />
          )}
          <PrimaryButton
            title="End workout"
            variant="dark"
            icon={<Square size={14} color="#FFFFFF" />}
            onPress={() => dispatch({ type: 'finish', now: now() })}
            fullWidth
            style={{ marginTop: 10 }}
          />
        </>
      ) : null}

      {state.phase === 'done' ? (
        <>
          <Card tone="mint" style={{ alignItems: 'center' }}>
            <Text style={styles.doneEmoji}>🎉</Text>
            <Text style={styles.doneTitle}>
              {state.completedSteps >= workout.steps.length ? 'Workout complete!' : 'Nice effort!'}
            </Text>
            <Text style={[uiStyles.body, { textAlign: 'center', marginTop: 4 }]}>
              {minutes} active min · ~{kcal} kcal · {state.completedSteps}/{workout.steps.length} steps
            </Text>
            <Text style={[uiStyles.muted, { textAlign: 'center', marginTop: 6 }]}>
              Calories are a rough estimate from activity type and your weight.
            </Text>
          </Card>
          <SectionHeader title="How did it feel?" />
          <View style={uiStyles.wrap}>
            {(
              [
                ['easy', '😌 Easy'],
                ['right', '💪 Just right'],
                ['hard', '🥵 Too hard'],
              ] as const
            ).map(([k, label]) => (
              <Chip
                key={k}
                label={label}
                selected={feel === k}
                onPress={() => {
                  setFeel(k);
                  if (savedId) rateSession(savedId, k);
                }}
              />
            ))}
          </View>
          {feel === 'hard' ? (
            <Text style={[uiStyles.muted, { marginTop: 8 }]}>
              Next time try the easier options, or a gentle yoga session on high-strain days.
            </Text>
          ) : null}
          {savedId ? (
            <>
              <Card tone="rose" style={{ marginTop: 16 }}>
                <Text style={uiStyles.strong}>Saved to your week ✓</Text>
                <Text style={uiStyles.muted}>It counts towards your weekly 150 active minutes.</Text>
              </Card>
              <PrimaryButton title="Back to Fitness" onPress={() => router.replace('/fitness')} fullWidth style={{ marginTop: 14 }} />
            </>
          ) : (
            <>
              <PrimaryButton
                title="Save to my log"
                icon={<Timer size={16} color="#FFFFFF" />}
                onPress={save}
                fullWidth
                style={{ marginTop: 18 }}
              />
              <PrimaryButton title="Discard" variant="outline" onPress={() => router.back()} fullWidth style={{ marginTop: 10 }} />
            </>
          )}
        </>
      ) : null}
    </Screen>
  );
}

function describeStep(st: LibraryWorkout['steps'][number]): string {
  const sets = st.sets ?? 1;
  if (st.seconds) {
    const per = st.seconds >= 60 ? `${Math.round(st.seconds / 60)} min` : `${st.seconds} s`;
    return sets > 1 ? `${sets} × ${per}${st.restSeconds ? `, ${st.restSeconds}s rest` : ''}` : per;
  }
  return `${sets} × ${st.reps ?? ''}${st.restSeconds ? `, ${st.restSeconds}s rest` : ''}`;
}

function ControlButton({
  label,
  icon,
  onPress,
  disabled,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.ctrl, disabled && { opacity: 0.4 }, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {icon}
      <Text style={styles.ctrlText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stepRow: { flexDirection: 'row', gap: 12, paddingVertical: 10 },
  stepBorder: { borderTopWidth: 1, borderTopColor: Theme.colors.cardBorder },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.primaryLight,
    color: Theme.colors.primary,
    fontWeight: '800',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 24,
    overflow: 'hidden',
  },
  stepName: { fontSize: 14, fontWeight: '800', color: Theme.colors.textPrimary },
  easier: { fontSize: 11, color: '#047857', marginTop: 2, fontWeight: '600' },
  liveCard: { alignItems: 'center', paddingVertical: 24 },
  liveLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.2, color: '#FDA4AF' },
  liveName: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginTop: 6 },
  bigTimer: { fontSize: 64, fontWeight: '900', color: '#FFFFFF', marginVertical: 8, fontVariant: ['tabular-nums'] },
  bigReps: { fontSize: 44, fontWeight: '900', color: '#FFFFFF', marginVertical: 12 },
  liveHow: { fontSize: 14, color: 'rgba(255,255,255,0.88)', textAlign: 'center', lineHeight: 20 },
  liveTip: { fontSize: 12, color: '#FDE68A', textAlign: 'center', marginTop: 8, lineHeight: 17 },
  controls: { flexDirection: 'row', gap: 10, marginTop: 14 },
  ctrl: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: Theme.radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  ctrlText: { fontSize: 12, fontWeight: '700', color: Theme.colors.textPrimary },
  doneEmoji: { fontSize: 44 },
  doneTitle: { fontSize: 22, fontWeight: '900', color: Theme.colors.textPrimary, marginTop: 6 },
});
