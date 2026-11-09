import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, HeartHandshake, ShieldCheck, Stethoscope } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { assessReferral, REFERRAL_LEVEL_TEXT } from '@/lib/referral';
import { ROUTES } from '@/lib/routes';

/** Compact referable / not referable status on the synced Home, with Care Connect. */
export function ReferralStatusCard() {
  const assessmentAnswers = useAppStore((s) => s.assessmentAnswers);
  const healthCheck = useAppStore((s) => s.healthCheck);
  const symptomLogs = useAppStore((s) => s.symptomLogs);
  const pastCycles = useAppStore((s) => s.pastCycles);
  const cyclePrediction = useAppStore((s) => s.cyclePrediction);

  const result = useMemo(
    () => assessReferral({ assessmentAnswers, healthCheck, symptomLogs, pastCycles, cyclePrediction }),
    [assessmentAnswers, healthCheck, symptomLogs, pastCycles, cyclePrediction]
  );

  const referable = result.referable;
  const tone = referable
    ? result.level === 'urgent'
      ? { bg: '#FDECEF', border: '#F5C6D0', ink: '#A33B55' }
      : { bg: '#FFF4E8', border: '#F6DDBF', ink: '#9A5A2E' }
    : { bg: '#ECF7F2', border: '#CDEADF', ink: '#2F7D69' };

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => router.push(ROUTES.syncResult)}
        style={({ pressed }) => [styles.card, { backgroundColor: tone.bg, borderColor: tone.border }, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <View style={styles.iconCircle}>
          {referable ? <Stethoscope size={20} color={tone.ink} /> : <ShieldCheck size={20} color={tone.ink} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.label, { color: tone.ink }]}>
            SYNC RESULT · {referable ? 'REFERABLE' : 'NOT REFERABLE'}
          </Text>
          <Text style={styles.title}>{REFERRAL_LEVEL_TEXT[result.level].title}</Text>
          <Text style={styles.sub} numberOfLines={2}>
            {referable
              ? result.reasons.slice(0, 2).map((r) => r.title).join(' · ')
              : 'Nothing in your answers needs a doctor right now.'}
          </Text>
        </View>
        <ChevronRight size={18} color={tone.ink} />
      </Pressable>

      <Pressable
        onPress={() => router.push(ROUTES.care)}
        style={({ pressed }) => [styles.careRow, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <HeartHandshake size={18} color={Theme.colors.secondaryDark} />
        <Text style={styles.careText}>
          Care Connect — talk to a gynaecologist or a women’s counsellor
          {result.counsellorSuggested ? ' (counsellor suggested)' : ''}
        </Text>
        <ChevronRight size={16} color={Theme.colors.secondaryDark} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 20, marginTop: 16, gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 24,
    borderWidth: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  title: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary, marginTop: 2 },
  sub: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 2, lineHeight: 16 },
  careRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Theme.colors.secondaryLight,
    borderWidth: 1,
    borderColor: Theme.colors.secondaryBorder,
  },
  careText: { flex: 1, fontSize: 12.5, fontWeight: '700', color: Theme.colors.secondaryDark },
  pressed: { opacity: 0.86 },
});
