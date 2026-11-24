import React from 'react';
import { Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Button, Card, IconBadge, ListGroup, ListRow } from '@/components/ds';
import { STEP_ICON } from './stepIcons';
import { Theme, createStyles } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { syncProgress } from '@/lib/syncDetails';
import { todayKey } from '@/lib/dates';

/** Why each skipped step is worth doing, in one line. */
const BENEFIT: Record<string, string> = {
  questions: 'Tips and workouts that fit you',
  period: 'Your own period and PMS predictions',
  pain: 'Pain patterns for your doctor report',
  flow: 'Heavy-flow warnings and Pad Care tips',
  mood: 'Mood patterns across your cycle',
  safety: 'Whether a doctor visit is suggested',
};

/**
 * After "Skip for now": the full Home runs on sensible defaults, and this card
 * offers the steps that would personalise it. Hidden once they are done, or
 * for two weeks after "Not now".
 */
export function PersonaliseCard() {
  const isAssessmentCompleted = useAppStore((s) => s.isAssessmentCompleted);
  const pastCycles = useAppStore((s) => s.pastCycles);
  const symptomLogs = useAppStore((s) => s.symptomLogs);
  const healthCheckCompleted = useAppStore((s) => s.healthCheckCompleted);
  const syncCompletedAt = useAppStore((s) => s.syncCompletedAt);
  const skippedSyncSteps = useAppStore((s) => s.skippedSyncSteps);
  const snoozedUntil = useAppStore((s) => s.personalisePromptSnoozedUntil);
  const snooze = useAppStore((s) => s.snoozePersonalise);

  // Only for people who skipped part of setup; everyone else finished it.
  if (!skippedSyncSteps.length || (snoozedUntil && snoozedUntil > todayKey())) return null;
  const { toPersonalise } = syncProgress({
    isAssessmentCompleted,
    pastCycles,
    symptomLogs,
    healthCheckCompleted,
    syncCompletedAt,
    skippedSyncSteps,
  });
  if (!toPersonalise.length) return null;

  return (
    <Card tone="lilac" style={styles.card}>
      <View style={styles.head}>
        <IconBadge name="sparkle" tone="lilac" size={44} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Personalise SheSync</Text>
          <Text style={styles.sub}>
            You’re on sensible defaults (a typical 28-day cycle, no symptoms yet). A minute each makes it yours.
          </Text>
        </View>
      </View>
      <ListGroup>
        {toPersonalise.slice(0, 4).map((step) => (
          <ListRow
            key={step.id}
            icon={STEP_ICON[step.id].icon}
            tone={STEP_ICON[step.id].tone}
            title={step.title}
            subtitle={BENEFIT[step.id]}
            onPress={() => router.push(step.route as Href)}
          />
        ))}
      </ListGroup>
      <Button variant="link" title="Not now" onPress={() => snooze(14)} testID="personalise-not-now" style={styles.later} />
    </Card>
  );
}

const styles = createStyles(() => ({
  card: { marginHorizontal: Theme.space.md, marginTop: Theme.space.md },
  head: { flexDirection: 'row', gap: Theme.space.sm, marginBottom: Theme.space.md },
  title: { ...Theme.type.title, color: Theme.colors.textPrimary },
  sub: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, marginTop: 4 },
  later: { alignSelf: 'center', marginTop: Theme.space.xs },
}));
