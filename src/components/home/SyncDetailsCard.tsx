import React from 'react';
import { Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Check, ChevronRight } from 'lucide-react-native';
import { Theme, createStyles } from '@/constants/theme';
import { Button, Card, IconBadge, ListGroup, ListRow } from '@/components/ds';
import { STEP_ICON } from './stepIcons';
import { useAppStore } from '@/store/useAppStore';
import { nextSyncHref, syncProgress } from '@/lib/syncDetails';

/**
 * The main rectangle on Home until setup is finished: every form and log
 * SheSync needs, with live ticks, and one button that walks through the rest.
 */
export function SyncDetailsCard() {
  const isAssessmentCompleted = useAppStore((s) => s.isAssessmentCompleted);
  const pastCycles = useAppStore((s) => s.pastCycles);
  const symptomLogs = useAppStore((s) => s.symptomLogs);
  const healthCheckCompleted = useAppStore((s) => s.healthCheckCompleted);
  const syncCompletedAt = useAppStore((s) => s.syncCompletedAt);
  const skippedSyncSteps = useAppStore((s) => s.skippedSyncSteps);
  const skipSetup = useAppStore((s) => s.skipSetup);

  const input = { isAssessmentCompleted, pastCycles, symptomLogs, healthCheckCompleted, syncCompletedAt, skippedSyncSteps };
  const progress = syncProgress(input);
  const pct = Math.round((progress.doneCount / progress.total) * 100);

  const ctaLabel = progress.allStepsDone
    ? 'See my sync result'
    : progress.doneCount === 0
    ? 'Start syncing · about 4 min'
    : `Continue · next: ${progress.next?.title}`;

  const openStep = (route: string, done: boolean) => {
    // Unfinished steps run in setup mode (they hand over to the next step);
    // finished ones open normally so she can review or update them.
    router.push((done ? route : `${route}?onboarding=true`) as Href);
  };

  return (
    <Card style={styles.card} padding="lg">
      <View style={styles.headRow}>
        <IconBadge name="sparkle" tone="rose" size={44} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title} accessibilityRole="header">
            Details for Sync
          </Text>
          <Text style={styles.subtitle}>Fill these once to personalise SheSync.</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>
            {progress.doneCount}/{progress.total}
          </Text>
        </View>
      </View>

      <View style={styles.track} accessibilityLabel={`${pct}% done`}>
        <View style={[styles.fill, { width: `${Math.max(4, pct)}%` }]} />
      </View>

      <ListGroup>
        {progress.steps.map((step) => (
          <ListRow
            key={step.id}
            icon={STEP_ICON[step.id].icon}
            tone={step.done ? 'mint' : STEP_ICON[step.id].tone}
            title={`${step.number}. ${step.title}`}
            subtitle={step.done ? 'Done · tap to update' : step.skipped ? 'Skipped for now · tap to answer' : step.subtitle}
            onPress={() => openStep(step.route, step.done)}
            accessibilityLabel={`${step.title}${step.done ? ', done' : step.skipped ? ', skipped for now' : ''}`}
            right={
              step.done ? (
                <View style={styles.tick}>
                  <Check size={14} color={Theme.colors.onPrimary} />
                </View>
              ) : (
                <ChevronRight size={20} color={Theme.colors.textTertiary} />
              )
            }
          />
        ))}
      </ListGroup>

      <Button
        title={ctaLabel}
        onPress={() => router.push(nextSyncHref(input))}
        iconRight={<ChevronRight size={20} color={Theme.colors.onPrimary} />}
        fullWidth
        size="lg"
        style={styles.cta}
      />
      <Button
        variant="link"
        title="Skip for now — use sensible defaults"
        onPress={skipSetup}
        testID="skip-setup"
        accessibilityHint="Uses sensible defaults now. You can personalise SheSync later from Home or Profile."
        style={styles.skip}
      />
      <Text style={styles.footnote}>
        At the end you’ll see if a gynaecologist visit is suggested. Skipped steps can be done any time.
      </Text>
    </Card>
  );
}

const styles = createStyles(() => ({
  card: { marginHorizontal: Theme.space.md, marginTop: Theme.space.xs },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Theme.space.sm },
  title: { ...Theme.type.h3, color: Theme.colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, marginTop: 4 },
  countPill: {
    minWidth: 44,
    paddingHorizontal: Theme.space.xs,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
  },
  countText: { ...Theme.type.label, color: Theme.colors.primaryDark },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.backgroundMuted,
    marginTop: Theme.space.md,
    marginBottom: Theme.space.md,
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 4, backgroundColor: Theme.colors.primary },
  tick: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Theme.colors.strainOptimal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: { marginTop: Theme.space.lg },
  skip: { alignSelf: 'center', marginTop: Theme.space.xs },
  footnote: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, textAlign: 'center', marginTop: Theme.space.xxs },
}));
