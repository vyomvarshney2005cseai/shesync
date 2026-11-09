import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { Check, ChevronRight, Sparkles } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
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

  const input = { isAssessmentCompleted, pastCycles, symptomLogs, healthCheckCompleted, syncCompletedAt };
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
    <View style={styles.card} accessibilityLabel="Details for Sync">
      <View style={styles.headRow}>
        <View style={styles.headIcon}>
          <Sparkles size={18} color={Theme.colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title} accessibilityRole="header">
            Details for Sync
          </Text>
          <Text style={styles.subtitle}>
            Fill these once to personalise SheSync.
          </Text>
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

      <View style={styles.list}>
        {progress.steps.map((step) => (
          <Pressable
            key={step.id}
            onPress={() => openStep(step.route, step.done)}
            style={({ pressed }) => [styles.row, step.done && styles.rowDone, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`${step.title}${step.done ? ', done' : ''}`}
          >
            <View style={[styles.emojiWrap, step.done && styles.emojiWrapDone]}>
              <Text style={styles.emoji}>{step.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, step.done && styles.rowTitleDone]}>
                {step.number}. {step.title}
              </Text>
              <Text style={styles.rowSub}>{step.done ? 'Done · tap to update' : step.subtitle}</Text>
            </View>
            {step.done ? (
              <View style={styles.tick}>
                <Check size={13} color="#FFFFFF" strokeWidth={3} />
              </View>
            ) : (
              <ChevronRight size={18} color={Theme.colors.textTertiary} />
            )}
          </Pressable>
        ))}
      </View>

      <Pressable
        onPress={() => router.push(nextSyncHref(input))}
        style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <Text style={styles.ctaText} numberOfLines={1}>
          {ctaLabel}
        </Text>
        <ChevronRight size={18} color="#FFFFFF" />
      </Pressable>
      <Text style={styles.footnote}>
        At the end you’ll see if a gynaecologist visit is suggested.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.soft,
  },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  headIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 19, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -0.3 },
  subtitle: { fontSize: 12.5, lineHeight: 18, color: Theme.colors.textSecondary, marginTop: 3 },
  countPill: {
    backgroundColor: Theme.colors.secondaryLight,
    borderRadius: Theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Theme.colors.secondaryBorder,
  },
  countText: { fontSize: 12, fontWeight: '800', color: Theme.colors.secondaryDark },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.backgroundMuted,
    marginTop: 14,
    overflow: 'hidden',
  },
  fill: { height: 8, borderRadius: 4, backgroundColor: Theme.colors.primary },
  list: { marginTop: 14, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: Theme.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  rowDone: { backgroundColor: '#F1F8F5', borderColor: '#D5ECE3' },
  emojiWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiWrapDone: { backgroundColor: '#FFFFFF' },
  emoji: { fontSize: 17 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  rowTitleDone: { color: '#2F7D69' },
  rowSub: { fontSize: 11.5, color: Theme.colors.textSecondary, marginTop: 1 },
  tick: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.strainOptimal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cta: {
    marginTop: 16,
    backgroundColor: Theme.colors.primary,
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Theme.shadows.glowing,
  },
  ctaText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', flexShrink: 1 },
  footnote: { fontSize: 11, color: Theme.colors.textTertiary, textAlign: 'center', marginTop: 10, lineHeight: 15 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
