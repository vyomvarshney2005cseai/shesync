import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { StepSlider } from '@/components/common/StepSlider';
import { AuthGate } from '@/components/common/AuthGate';
import { DIGESTIVE_SYMPTOMS, cleanDigestive } from '@/lib/digestive';
import { todayKey } from '@/lib/dates';
import type { DigestiveSymptom, FlowIntensity, MoodLevel, PainLevel, SymptomLog } from '@/types';

const MOODS: { label: string; emoji: string }[] = [
  { label: 'Depleted', emoji: '😞' },
  { label: 'Sensitive', emoji: '😕' },
  { label: 'Balanced', emoji: '🙂' },
  { label: 'Energized', emoji: '😊' },
  { label: 'Radiant', emoji: '🤩' },
];

const FLOWS: { id: FlowIntensity; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'spotting', label: 'Spotting' },
  { id: 'light', label: 'Light' },
  { id: 'moderate', label: 'Moderate' },
  { id: 'heavy', label: 'Heavy' },
  { id: 'severe', label: 'Very heavy / clots' },
];

const painWord = (p: number) => (p === 0 ? 'No pain' : p <= 3 ? 'Mild' : p <= 6 ? 'Moderate' : 'Severe');
const sleepText = (h: number) => `${Number.isInteger(h) ? h : h.toFixed(1)} h`;

/**
 * The 10-second daily check-in: mood, pain, flow and last night's sleep as
 * sliders, plus tummy symptoms, saved together with one tap. Only what she
 * touches is saved — an untouched slider never becomes a made-up value.
 */
export default function CheckInScreen() {
  return (
    <AuthGate>
      <CheckInSheet />
    </AuthGate>
  );
}

function CheckInSheet() {
  const insets = useSafeAreaInsets();
  const saveCheckIn = useAppStore((s) => s.saveCheckIn);
  const sleepTarget = useAppStore((s) => s.fineTuningSettings.dailySleepTargetHours || 8);

  // Opening it again today shows what she already saved.
  const [initial] = useState(() => {
    const st = useAppStore.getState();
    const today = todayKey();
    const log = st.symptomLogs.find((l) => l.checkIn && l.date === today);
    const sleep = st.sleepLogs.find((s) => s.date === today);
    return {
      mood: log?.mood ?? null,
      pain: log?.pain ?? null,
      flow: log?.flow ? Math.max(0, FLOWS.findIndex((f) => f.id === log.flow)) : null,
      sleep: sleep ? sleep.hours : null,
      tummy: cleanDigestive(log?.digestive),
      tummyTouched: !!log?.digestive,
      editing: !!log || !!sleep,
    };
  });

  const [mood, setMood] = useState<number | null>(initial.mood);
  const [pain, setPain] = useState<number | null>(initial.pain);
  const [flow, setFlow] = useState<number | null>(initial.flow);
  const [sleep, setSleep] = useState<number | null>(initial.sleep);
  const [tummy, setTummy] = useState<DigestiveSymptom[]>(initial.tummy);
  const [tummyTouched, setTummyTouched] = useState(initial.tummyTouched);
  const [saved, setSaved] = useState<null | { pain: number | null; flow: FlowIntensity | null }>(null);

  const count = [mood, pain, flow, sleep].filter((v) => v !== null).length + (tummyTouched ? 1 : 0);

  const toggleTummy = (id: DigestiveSymptom) => {
    setTummyTouched(true);
    setTummy((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const handleSave = () => {
    if (!count) return;
    const fields: Partial<SymptomLog> = {};
    if (mood !== null) fields.mood = mood as MoodLevel;
    if (pain !== null) fields.pain = pain as PainLevel;
    if (flow !== null) fields.flow = FLOWS[flow].id;
    if (tummyTouched) fields.digestive = tummy;
    saveCheckIn(fields, sleep ?? undefined);
    const flowId = flow !== null ? FLOWS[flow].id : null;
    const needsNote = (pain ?? 0) >= 7 || flowId === 'heavy' || flowId === 'severe';
    if (needsNote) setSaved({ pain, flow: flowId });
    else close();
  };

  return (
    <View style={styles.root}>
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close check-in" />
      <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 14) + 6 }]}>
        <View style={styles.handle} />
        <View style={styles.headRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>10-second check-in</Text>
            <Text style={styles.subtitle}>
              {initial.editing ? 'Update today’s check-in' : 'Slide what applies today. Skip the rest.'}
            </Text>
          </View>
          <TouchableOpacity onPress={close} style={styles.closeBtn} accessibilityLabel="Close">
            <X size={18} color={Theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {saved ? (
          <SavedNote pain={saved.pain} flow={saved.flow} onDone={close} />
        ) : (
          <>
            <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
              <Row
                label="Mood"
                value={mood !== null ? `${MOODS[mood - 1].emoji} ${MOODS[mood - 1].label}` : null}
              >
                <StepSlider
                  min={1}
                  max={5}
                  step={1}
                  value={mood}
                  restAt={3}
                  onChange={setMood}
                  color={Theme.colors.primary}
                  accessibilityLabel="Mood"
                  valueText={(v) => MOODS[v - 1].label}
                />
              </Row>

              <Row label="Pain" value={pain !== null ? `${pain}/10 · ${painWord(pain)}` : null}>
                <StepSlider
                  min={0}
                  max={10}
                  step={1}
                  value={pain}
                  restAt={0}
                  onChange={setPain}
                  color={Theme.colors.strainHigh}
                  accessibilityLabel="Pain"
                  valueText={(v) => `${v} out of 10, ${painWord(v)}`}
                />
              </Row>

              <Row label="Flow" value={flow !== null ? FLOWS[flow].label : null}>
                <StepSlider
                  min={0}
                  max={FLOWS.length - 1}
                  step={1}
                  value={flow}
                  restAt={0}
                  onChange={setFlow}
                  color={Theme.colors.secondary}
                  accessibilityLabel="Flow"
                  valueText={(v) => FLOWS[v].label}
                />
              </Row>

              <Row label="Last night’s sleep" value={sleep !== null ? sleepText(sleep) : null}>
                <StepSlider
                  min={0}
                  max={12}
                  step={0.5}
                  value={sleep}
                  restAt={sleepTarget}
                  onChange={setSleep}
                  color="#4F8DBA"
                  accessibilityLabel="Hours slept last night"
                  valueText={(v) => `${v} hours`}
                />
              </Row>

              <View style={styles.row}>
                <View style={styles.rowHead}>
                  <Text style={styles.rowLabel}>Tummy</Text>
                  <Text style={[styles.rowValue, !tummyTouched && styles.rowValueEmpty]}>
                    {tummyTouched ? (tummy.length ? `${tummy.length} picked` : 'All fine') : 'Optional'}
                  </Text>
                </View>
                <View style={styles.chips}>
                  {DIGESTIVE_SYMPTOMS.map((d) => {
                    const on = tummy.includes(d.id);
                    return (
                      <TouchableOpacity
                        key={d.id}
                        onPress={() => toggleTummy(d.id)}
                        style={[styles.chip, on && styles.chipOn]}
                        activeOpacity={0.8}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: on }}
                      >
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>
                          {d.emoji} {d.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    onPress={() => {
                      setTummyTouched(true);
                      setTummy([]);
                    }}
                    style={[styles.chip, tummyTouched && !tummy.length && styles.chipOn]}
                    activeOpacity={0.8}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: tummyTouched && !tummy.length }}
                  >
                    <Text style={[styles.chipText, tummyTouched && !tummy.length && styles.chipTextOn]}>All fine</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveBtn, !count && styles.saveBtnOff]}
              onPress={handleSave}
              disabled={!count}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Check size={18} color={themed('#FFFFFF')} />
              <Text style={styles.saveText}>
                {count ? `Save check-in (${count})` : 'Move a slider to start'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

function Row({ label, value, children }: { label: string; value: string | null; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowHead}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, value === null && styles.rowValueEmpty]}>{value ?? 'Not set'}</Text>
      </View>
      {children}
    </View>
  );
}

/** Shown after saving strong pain or heavy flow: what helps, and when to get help. */
function SavedNote({ pain, flow, onDone }: { pain: number | null; flow: FlowIntensity | null; onDone: () => void }) {
  const heavy = flow === 'heavy' || flow === 'severe';
  return (
    <View style={styles.note}>
      <Text style={styles.noteTitle}>Saved ✓</Text>
      {(pain ?? 0) >= 7 && (
        <Text style={styles.noteText}>
          Pain of {pain}/10 is a lot. A heat pad and an anti-inflammatory painkiller taken with food (if it is safe for
          you) help most. If pain like this often stops your day, show your doctor — your report has the dates.
        </Text>
      )}
      {heavy && (
        <Text style={styles.noteText}>
          With heavy flow, change your pad every 3–4 hours or sooner. Get help today if you soak a pad every hour for
          2 hours or more, or feel dizzy or faint.
        </Text>
      )}
      <View style={styles.noteRow}>
        <TouchableOpacity
          style={styles.noteGhost}
          onPress={() => router.replace('/your-go-girl')}
          activeOpacity={0.8}
        >
          <Text style={styles.noteGhostText}>Ask YourGoGirl</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.noteBtn} onPress={onDone} activeOpacity={0.85}>
          <Text style={styles.noteBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = createStyles(() => ({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    ...({ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 } as const),
    backgroundColor: 'rgba(43, 34, 54, 0.45)',
  },
  sheet: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    maxHeight: '92%',
    backgroundColor: Theme.colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 -8px 30px rgba(0,0,0,0.12)' } as object) : {}),
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: Theme.colors.cardBorder,
    marginBottom: 10,
  },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  title: { fontSize: 20, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -0.4 },
  subtitle: { fontSize: 12.5, color: Theme.colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.backgroundMuted,
  },
  body: { flexGrow: 0 },
  bodyContent: { paddingVertical: 8, gap: 6 },
  row: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  rowHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLabel: { fontSize: 14, fontWeight: '800', color: Theme.colors.textPrimary },
  rowValue: { fontSize: 13, fontWeight: '700', color: Theme.colors.primaryDark },
  rowValueEmpty: { color: Theme.colors.textTertiary, fontWeight: '600' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingVertical: 8 },
  chip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.backgroundAlt,
  },
  chipOn: { backgroundColor: Theme.colors.primaryLight, borderColor: Theme.colors.primary },
  chipText: { fontSize: 12.5, fontWeight: '700', color: Theme.colors.textSecondary },
  chipTextOn: { color: Theme.colors.primaryDark },
  saveBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.radius.lg,
    paddingVertical: 15,
    ...Theme.shadows.glowing,
  },
  saveBtnOff: { opacity: 0.5 },
  saveText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF' },
  note: { paddingVertical: 12, gap: 10 },
  noteTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.strainOptimal },
  noteText: { fontSize: 13.5, lineHeight: 20, color: Theme.colors.textPrimary },
  noteRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  noteGhost: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    alignItems: 'center',
  },
  noteGhostText: { fontSize: 14, fontWeight: '800', color: Theme.colors.primaryDark },
  noteBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
  },
  noteBtnText: { fontSize: 14, fontWeight: '800', color: '#FFFFFF' },
}));
