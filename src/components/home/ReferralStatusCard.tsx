import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Theme, createStyles } from '@/constants/theme';
import { Card, IconBadge, badgeColors, type BadgeTone, type CardTone } from '@/components/ds';
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
  const healthCheckCompleted = useAppStore((s) => s.healthCheckCompleted);

  const result = useMemo(
    () => assessReferral({ assessmentAnswers, healthCheck, symptomLogs, pastCycles, cyclePrediction }),
    [assessmentAnswers, healthCheck, symptomLogs, pastCycles, cyclePrediction]
  );

  const referable = result.referable;
  // Skipped the safety check and nothing in her logs is worrying: say so, don't claim "all clear".
  const unchecked = !healthCheckCompleted && !referable;
  const tone: { card: CardTone; badge: BadgeTone } = referable
    ? result.level === 'urgent'
      ? { card: 'danger', badge: 'danger' }
      : { card: 'amber', badge: 'amber' }
    : unchecked
    ? { card: 'lilac', badge: 'lilac' }
    : { card: 'mint', badge: 'mint' };
  const ink = badgeColors(tone.badge).fg;

  return (
    <View style={styles.wrap}>
      <Card
        tone={tone.card}
        onPress={() => router.push(unchecked ? ROUTES.healthCheck : ROUTES.syncResult)}
        accessibilityLabel={unchecked ? 'Health safety check, not done yet. Do the 1-minute safety check' : `Sync result: ${REFERRAL_LEVEL_TEXT[result.level].title}`}
      >
        <View style={styles.row}>
          <IconBadge name={referable ? 'care' : 'healthCheck'} tone={tone.badge} size={44} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: ink }]}>
              {unchecked ? 'HEALTH SAFETY CHECK · NOT DONE YET' : `SYNC RESULT · ${referable ? 'REFERABLE' : 'NOT REFERABLE'}`}
            </Text>
            <Text style={styles.title}>{unchecked ? 'Do the 1-minute safety check' : REFERRAL_LEVEL_TEXT[result.level].title}</Text>
            <Text style={styles.sub} numberOfLines={2}>
              {unchecked
                ? '11 yes/no questions show whether a gynaecologist visit is suggested.'
                : referable
                ? result.reasons.slice(0, 2).map((r) => r.title).join(' · ')
                : 'Nothing in your answers needs a doctor right now.'}
            </Text>
          </View>
          <ChevronRight size={20} color={ink} />
        </View>
      </Card>

      <Card
        onPress={() => router.push(ROUTES.care)}
        padding="sm"
        accessibilityLabel={`Care Connect — talk to a gynaecologist or a women’s counsellor${result.counsellorSuggested ? ' (counsellor suggested)' : ''}`}
      >
        <View style={styles.row}>
          <IconBadge name="care" tone="lilac" size={40} />
          <Text style={styles.careText}>
            Care Connect — talk to a gynaecologist or a women’s counsellor
            {result.counsellorSuggested ? ' (counsellor suggested)' : ''}
          </Text>
          <ChevronRight size={20} color={Theme.colors.textTertiary} />
        </View>
      </Card>
    </View>
  );
}

const styles = createStyles(() => ({
  wrap: { paddingHorizontal: Theme.space.md, marginTop: Theme.space.md, gap: Theme.space.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: Theme.space.sm },
  label: { ...Theme.type.caption, fontWeight: '800', letterSpacing: 0.6 },
  title: { ...Theme.type.title, fontSize: 16, lineHeight: 22, color: Theme.colors.textPrimary, marginTop: 4 },
  sub: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, marginTop: 4 },
  careText: { flex: 1, ...Theme.type.label, color: Theme.colors.textPrimary },
}));
