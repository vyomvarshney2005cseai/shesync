import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Info, Phone, ShieldCheck } from 'lucide-react-native';
import { SkipStepLink } from '@/components/common/SkipStepLink';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { AuthGate } from '@/components/common/AuthGate';
import { Button } from '@/components/ds';
import { Theme, createStyles, themed } from '@/constants/theme';
import { HEALTH_CHECK_QUESTIONS } from '@/constants/healthCheck';
import { useAppStore } from '@/store/useAppStore';
import { nextSyncHref, syncStepBadge } from '@/lib/syncDetails';
import { callNumber, CRISIS_LINES } from '@/lib/openExternal';

/** Step 6 of "Details for Sync": quick yes/no red-flag questions. */
export default function HealthCheckScreen() {
  const { onboarding } = useLocalSearchParams<{ onboarding?: string }>();
  const isOnboarding = onboarding === 'true';
  const saved = useAppStore((s) => s.healthCheck);
  const wasCompleted = useAppStore((s) => s.healthCheckCompleted);
  const saveHealthCheck = useAppStore((s) => s.saveHealthCheck);

  // Previously saved answers pre-fill the form when she comes back to edit.
  const [answers, setAnswers] = useState<Record<string, boolean | undefined>>(() =>
    wasCompleted ? { ...saved } : {}
  );
  const [showMissing, setShowMissing] = useState(false);
  // "Why we ask" explanations that are open (question ids).
  const [whyOpen, setWhyOpen] = useState<string[]>([]);
  const toggleWhy = (id: string) => setWhyOpen((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

  const unanswered = useMemo(
    () => HEALTH_CHECK_QUESTIONS.filter((q) => answers[q.id] === undefined).length,
    [answers]
  );

  const setAnswer = (id: string, value: boolean) => setAnswers((prev) => ({ ...prev, [id]: value }));

  const handleSave = () => {
    if (unanswered > 0) {
      setShowMissing(true);
      return;
    }
    const clean: Record<string, boolean> = {};
    for (const q of HEALTH_CHECK_QUESTIONS) clean[q.id] = !!answers[q.id];
    saveHealthCheck(clean);
    if (isOnboarding) {
      router.push(nextSyncHref(useAppStore.getState()));
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <AuthGate>
      <Screen>
        <ScreenHeader
          title="Health safety check"
          subtitle="Answer yes or no for each question."
          badge={isOnboarding ? syncStepBadge('safety') : undefined}
        />

        <View style={styles.privacy}>
          <ShieldCheck size={16} color={Theme.colors.strainOptimal} />
          <Text style={styles.privacyText}>
            Private to you — used only for your result, and backed up only if you have an account. Tap ⓘ to see why we ask.
          </Text>
        </View>
        {isOnboarding && !wasCompleted ? (
          <View style={styles.skipRow}>
            <Text style={styles.skipNote}>Not now? SheSync works without it and reminds you later.</Text>
            <SkipStepLink step="safety" />
          </View>
        ) : null}

        {HEALTH_CHECK_QUESTIONS.map((q, i) => {
          const showGroup = i === 0 || HEALTH_CHECK_QUESTIONS[i - 1].group !== q.group;
          const value = answers[q.id];
          const missing = showMissing && value === undefined;
          return (
            <View key={q.id}>
              {showGroup ? <Text style={styles.group}>{q.group}</Text> : null}
              <View style={[styles.card, missing && styles.cardMissing]}>
                <View style={styles.questionRow}>
                  <Text style={[styles.question, { flex: 1 }]}>
                    {i + 1}. {q.question}
                  </Text>
                  <Button
                    variant="secondary"
                    size="sm"
                    iconOnly
                    onPress={() => toggleWhy(q.id)}
                    testID={`why-${q.id}`}
                    accessibilityState={{ expanded: whyOpen.includes(q.id) }}
                    accessibilityLabel={`Why we ask question ${i + 1}`}
                    icon={<Info size={20} color={whyOpen.includes(q.id) ? themed('#FFFFFF') : Theme.colors.secondaryDark} />}
                  />
                </View>
                {whyOpen.includes(q.id) ? (
                  <View style={styles.why}>
                    <Text style={styles.whyLabel}>WHY WE ASK</Text>
                    <Text style={styles.whyText}>{q.why}</Text>
                  </View>
                ) : null}
                {q.hint ? <Text style={styles.hint}>{q.hint}</Text> : null}
                <View style={styles.choiceRow} accessibilityRole="radiogroup">
                  {([
                    ['No', false],
                    ['Yes', true],
                  ] as const).map(([label, v]) => {
                    const selected = value === v;
                    return (
                      <Pressable
                        key={label}
                        onPress={() => setAnswer(q.id, v)}
                        style={({ pressed }) => [
                          styles.choice,
                          selected && (v ? styles.choiceYes : styles.choiceNo),
                          pressed && { opacity: 0.85 },
                        ]}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        accessibilityLabel={`${label}: ${q.question}`}
                      >
                        <Text style={[styles.choiceText, selected && styles.choiceTextSelected]}>{label}</Text>
                      </Pressable>
                    );
                  })}
                </View>

                {q.id === 'hc_self_harm' && value === true ? (
                  <View style={styles.crisis}>
                    <Text style={styles.crisisTitle}>Thank you for telling us. You don’t have to handle this alone. 💜</Text>
                    <Text style={styles.crisisBody}>
                      Tele-MANAS is free, confidential and open 24×7 in your language. If you are in danger right now, call 112.
                    </Text>
                    <View style={styles.crisisRow}>
                      <Button
                        title="Call Tele-MANAS 14416"
                        icon={<Phone size={16} color={themed('#FFFFFF')} />}
                        onPress={() => callNumber(CRISIS_LINES.teleManas.number, CRISIS_LINES.teleManas.label)}
                        style={{ flex: 1 }}
                      />
                      <Button
                        title="112"
                        variant="primary"
                        onPress={() => callNumber(CRISIS_LINES.emergency.number, CRISIS_LINES.emergency.label)}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          );
        })}

        {showMissing && unanswered > 0 ? (
          <Text style={styles.missingText}>
            Please answer the {unanswered} highlighted question{unanswered > 1 ? 's' : ''}.
          </Text>
        ) : null}

        <Button
          title={isOnboarding ? 'Save & see my result' : 'Save answers'}
          onPress={handleSave}
          fullWidth
          style={{ marginTop: 20 }}
        />
        <Text style={styles.footnote}>
          SheSync gives a screening guide based on common “see a doctor if…” signs. It is not a diagnosis.
        </Text>
      </Screen>
    </AuthGate>
  );
}

const styles = createStyles(() => ({
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF8F4',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D5ECE3',
  },
  privacyText: { flex: 1, fontSize: 14, color: '#276C5C', lineHeight: 20, fontWeight: '600' },
  group: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    marginTop: 20,
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    marginBottom: 12,
  },
  cardMissing: { borderColor: Theme.colors.strainAmber, borderWidth: 1.5 },
  question: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary, lineHeight: 20 },
  questionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  whyBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.secondaryLight,
  },
  whyBtnOn: { backgroundColor: Theme.colors.secondary },
  why: { marginTop: 12, backgroundColor: Theme.colors.secondaryLight, borderRadius: 16, padding: 12 },
  whyLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, color: Theme.colors.secondaryDark },
  whyText: { fontSize: 14, lineHeight: 20, color: Theme.colors.textPrimary, marginTop: 4 },
  skipRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12 },
  skipNote: { flex: 1, fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary },
  hint: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 4, lineHeight: 20 },
  choiceRow: { flexDirection: 'row', gap: 12, marginTop: 12 },
  choice: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Theme.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  choiceNo: { backgroundColor: '#E7F5F0', borderColor: '#9FD3C1' },
  choiceYes: { backgroundColor: Theme.colors.primaryLight, borderColor: Theme.colors.primary },
  choiceText: { fontSize: 14, fontWeight: '700', color: Theme.colors.textSecondary },
  choiceTextSelected: { color: Theme.colors.textPrimary },
  crisis: {
    marginTop: 12,
    backgroundColor: Theme.colors.secondaryLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.secondaryBorder,
    gap: 8,
  },
  crisisTitle: { fontSize: 14, fontWeight: '800', color: Theme.colors.secondaryDark },
  crisisBody: { fontSize: 14, color: Theme.colors.textPrimary, lineHeight: 20 },
  crisisRow: { flexDirection: 'row', gap: 8 },
  missingText: { marginTop: 12, fontSize: 14, color: '#9A5A2E', fontWeight: '700', textAlign: 'center' },
  footnote: { fontSize: 12, color: Theme.colors.textTertiary, textAlign: 'center', marginTop: 12, lineHeight: 16 },
}));
