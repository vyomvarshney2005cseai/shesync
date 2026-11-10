import React, { useEffect, useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  AlertTriangle,
  HeartHandshake,
  Phone,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  X,
} from 'lucide-react-native';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { AuthGate } from '@/components/common/AuthGate';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Theme, createStyles, themed } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { assessReferral, REFERRAL_LEVEL_TEXT } from '@/lib/referral';
import { syncProgress } from '@/lib/syncDetails';
import { callNumber, CRISIS_LINES } from '@/lib/openExternal';
import type { ReferralReason } from '@/types';
import { ROUTES } from '@/lib/routes';

const LEVEL_CHIP: Record<ReferralReason['level'], { label: string; bg: string; ink: string }> = {
  urgent: { label: 'Today', bg: '#FDE3E8', ink: '#A33B55' },
  soon: { label: 'Within 1–2 weeks', bg: '#FFEBD6', ink: '#9A5A2E' },
  routine: { label: 'Next check-up', bg: '#F2EDFB', ink: '#6E55B5' },
};

/** The window shown after "Details for Sync": referable / not referable. */
export default function SyncResultScreen() {
  const isAssessmentCompleted = useAppStore((s) => s.isAssessmentCompleted);
  const pastCycles = useAppStore((s) => s.pastCycles);
  const symptomLogs = useAppStore((s) => s.symptomLogs);
  const healthCheckCompleted = useAppStore((s) => s.healthCheckCompleted);
  const healthCheck = useAppStore((s) => s.healthCheck);
  const syncCompletedAt = useAppStore((s) => s.syncCompletedAt);
  const assessmentAnswers = useAppStore((s) => s.assessmentAnswers);
  const cyclePrediction = useAppStore((s) => s.cyclePrediction);
  const archetypeName = useAppStore((s) => s.fineTuningSettings.archetypeName);
  const userName = useAppStore((s) => s.userName);
  const markSyncComplete = useAppStore((s) => s.markSyncComplete);

  const progress = syncProgress({ isAssessmentCompleted, pastCycles, symptomLogs, healthCheckCompleted, syncCompletedAt });
  const result = useMemo(
    () => assessReferral({ assessmentAnswers, healthCheck, symptomLogs, pastCycles, cyclePrediction }),
    [assessmentAnswers, healthCheck, symptomLogs, pastCycles, cyclePrediction]
  );

  // Seeing the result finishes the setup: Home switches to the full dashboard.
  useEffect(() => {
    if (progress.allStepsDone) markSyncComplete();
  }, [progress.allStepsDone, markSyncComplete]);

  const goHome = () => {
    if (router.canDismiss()) router.dismissTo('/(tabs)');
    else router.replace('/(tabs)');
  };

  const firstName = (userName || '').trim().split(' ')[0];
  const referable = result.referable;
  const text = REFERRAL_LEVEL_TEXT[result.level];
  const tone = !referable
    ? { bg: themed('#E9F6F0'), border: themed('#BFE3D4'), ink: themed('#2F7D69'), icon: <ShieldCheck size={30} color={themed('#2F7D69')} /> }
    : result.level === 'urgent'
    ? { bg: themed('#FDECEF'), border: themed('#F3BFCB'), ink: themed('#A33B55'), icon: <AlertTriangle size={30} color={themed('#A33B55')} /> }
    : { bg: themed('#FFF3E6'), border: themed('#F4D6B5'), ink: themed('#9A5A2E'), icon: <Stethoscope size={30} color={themed('#9A5A2E')} /> };

  return (
    <AuthGate>
      <AdaptiveBackground>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.topBar}>
            <View style={styles.topBadge}>
              <Sparkles size={13} color={Theme.colors.primary} />
              <Text style={styles.topBadgeText}>YOUR SYNC RESULT</Text>
            </View>
            <Pressable onPress={goHome} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Close">
              <X size={20} color={Theme.colors.textPrimary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {!progress.allStepsDone && !syncCompletedAt ? (
              <View style={styles.pending}>
                <Text style={styles.pendingText}>
                  {progress.total - progress.doneCount} step{progress.total - progress.doneCount > 1 ? 's' : ''} of Details for Sync
                  {' '}are still empty, so this result may change once you finish them.
                </Text>
              </View>
            ) : null}

            {result.crisis ? (
              <View style={styles.crisis}>
                <Text style={styles.crisisTitle}>First — please talk to someone today 💜</Text>
                <Text style={styles.crisisBody}>
                  You said you have had thoughts of hurting yourself. You deserve support right now. Tele-MANAS is free,
                  confidential and open 24×7. If you are in danger, call 112.
                </Text>
                <View style={styles.row}>
                  <PrimaryButton
                    title="Call Tele-MANAS 14416"
                    icon={<Phone size={16} color={themed('#FFFFFF')} />}
                    onPress={() => callNumber(CRISIS_LINES.teleManas.number, CRISIS_LINES.teleManas.label)}
                    style={{ flex: 1 }}
                  />
                  <PrimaryButton
                    title="112"
                    variant="dark"
                    onPress={() => callNumber(CRISIS_LINES.emergency.number, CRISIS_LINES.emergency.label)}
                  />
                </View>
              </View>
            ) : null}

            {/* ── The verdict ── */}
            <View style={[styles.verdict, { backgroundColor: tone.bg, borderColor: tone.border }]}>
              <View style={styles.verdictIcon}>{tone.icon}</View>
              <Text style={[styles.verdictLabel, { color: tone.ink }]}>{referable ? 'REFERABLE' : 'NOT REFERABLE'}</Text>
              <Text style={styles.verdictTitle}>{text.title}</Text>
              <Text style={styles.verdictWhen}>
                {referable
                  ? text.when
                  : `${firstName ? `${firstName}, n` : 'N'}othing you told SheSync matches the usual “see a doctor” signs. ${text.when}`}
              </Text>
            </View>

            {result.pregnancyTestFirst ? (
              <View style={styles.info}>
                <Text style={styles.infoTitle}>Take a home pregnancy test first</Text>
                <Text style={styles.infoBody}>
                  You said you could be pregnant. A urine test from any chemist is most reliable from the day your period is due
                  (or 3 weeks after sex). If it is positive — or you have one-sided tummy pain or bleeding — see a doctor.
                </Text>
              </View>
            ) : null}

            {referable ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Why we suggest a visit</Text>
                {result.reasons.map((r) => (
                  <ReasonRow key={r.id} reason={r} />
                ))}
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>See a gynaecologist if any of these start</Text>
                {result.watchFor.map((w) => (
                  <View key={w} style={styles.bulletRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>{w}</Text>
                  </View>
                ))}
              </View>
            )}

            {result.counsellorSuggested ? (
              <View style={[styles.section, styles.counsellor]}>
                <View style={styles.counsellorHead}>
                  <HeartHandshake size={18} color={Theme.colors.secondaryDark} />
                  <Text style={[styles.sectionTitle, { color: Theme.colors.secondaryDark, marginBottom: 0 }]}>
                    Talking to a counsellor could help
                  </Text>
                </View>
                {result.counsellorReasons
                  .filter((r) => r.id !== 'crisis')
                  .map((r) => (
                    <View key={r.id} style={{ marginTop: 8 }}>
                      <Text style={styles.reasonTitle}>{r.title}</Text>
                      <Text style={styles.reasonDetail}>{r.detail}</Text>
                    </View>
                  ))}
              </View>
            ) : null}

            {archetypeName ? (
              <Text style={styles.profileLine}>
                Your SheSync profile: <Text style={{ fontWeight: '800' }}>{archetypeName}</Text>
              </Text>
            ) : null}

            <View style={{ gap: 10, marginTop: 18 }}>
              {(referable || result.counsellorSuggested) && (
                <PrimaryButton
                  title={referable ? 'Find a gynaecologist · Care Connect' : 'Talk to a counsellor · Care Connect'}
                  icon={<HeartHandshake size={17} color={themed('#FFFFFF')} />}
                  variant="lilac"
                  onPress={() => router.push(ROUTES.care)}
                  fullWidth
                />
              )}
              <PrimaryButton title="Go to my dashboard" onPress={goHome} fullWidth />
            </View>

            <Text style={styles.disclaimer}>
              This is a screening guide built from what you entered, using common “see a doctor if…” signs (NHS) and the
              normal cycle limits doctors use (FIGO). It is not a diagnosis. If something feels wrong, see a doctor anyway.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </AdaptiveBackground>
    </AuthGate>
  );
}

function ReasonRow({ reason }: { reason: ReferralReason }) {
  const chip = LEVEL_CHIP[reason.level];
  return (
    <View style={styles.reason}>
      <View style={styles.reasonHead}>
        <Text style={[styles.reasonTitle, { flex: 1 }]}>{reason.title}</Text>
        <View style={[styles.chip, { backgroundColor: themed(chip.bg) }]}>
          <Text style={[styles.chipText, { color: themed(chip.ink) }]}>{chip.label}</Text>
        </View>
      </View>
      <Text style={styles.reasonDetail}>{reason.detail}</Text>
    </View>
  );
}

const styles = createStyles(() => ({
  safe: { flex: 1, backgroundColor: 'transparent' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.radius.full,
  },
  topBadgeText: { fontSize: 11, fontWeight: '800', color: Theme.colors.primary, letterSpacing: 0.8 },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  scroll: { padding: 20, paddingBottom: 48, width: '100%', maxWidth: 520, alignSelf: 'center' },
  pending: {
    backgroundColor: '#FFF7E8',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F4E0B8',
    marginBottom: 12,
  },
  pendingText: { fontSize: 12.5, color: '#8A5A1F', lineHeight: 18, fontWeight: '600' },
  crisis: {
    backgroundColor: Theme.colors.secondaryLight,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.secondaryBorder,
    gap: 10,
    marginBottom: 14,
  },
  crisisTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.secondaryDark },
  crisisBody: { fontSize: 13, color: Theme.colors.textPrimary, lineHeight: 19 },
  row: { flexDirection: 'row', gap: 8 },
  verdict: {
    borderRadius: 28,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1.5,
  },
  verdictIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  verdictLabel: { fontSize: 13, fontWeight: '800', letterSpacing: 2 },
  verdictTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: -0.4,
  },
  verdictWhen: { fontSize: 13.5, color: Theme.colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  info: {
    marginTop: 14,
    backgroundColor: '#EEF5FB',
    borderRadius: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D3E4F2',
  },
  infoTitle: { fontSize: 14, fontWeight: '800', color: '#3A6E94' },
  infoBody: { fontSize: 12.5, color: Theme.colors.textPrimary, lineHeight: 18, marginTop: 4 },
  section: {
    marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 6 },
  reason: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: Theme.colors.backgroundMuted },
  reasonHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reasonTitle: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  reasonDetail: { fontSize: 12.5, color: Theme.colors.textSecondary, lineHeight: 18, marginTop: 3 },
  chip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Theme.radius.full },
  chipText: { fontSize: 10.5, fontWeight: '800' },
  bulletRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 8 },
  bullet: { width: 7, height: 7, borderRadius: 4, backgroundColor: Theme.colors.primary, marginTop: 6 },
  bulletText: { flex: 1, fontSize: 13, color: Theme.colors.textPrimary, lineHeight: 19 },
  counsellor: { backgroundColor: Theme.colors.secondaryLight, borderColor: Theme.colors.secondaryBorder },
  counsellorHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileLine: { marginTop: 16, fontSize: 12.5, color: Theme.colors.textSecondary, textAlign: 'center' },
  disclaimer: { fontSize: 11, color: Theme.colors.textTertiary, textAlign: 'center', marginTop: 16, lineHeight: 16 },
}));
