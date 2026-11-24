import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';
import { Theme, createStyles, themed } from '@/constants/theme';
import { ROUTES } from '@/lib/routes';
import { MoodLogger } from './MoodLogger';
import { PainLogger } from './PainLogger';
import { FlowLogger } from './FlowLogger';
import { Button } from '@/components/ds';

export type LogTab = 'mood' | 'pain' | 'flow';

const TABS: { id: LogTab; label: string; emoji: string }[] = [
  { id: 'mood', label: 'Mood', emoji: '🌙' },
  { id: 'pain', label: 'Pain', emoji: '🫶' },
  { id: 'flow', label: 'Flow', emoji: '💧' },
];

/**
 * One check-in sheet: Mood, Pain and Flow as tabs. Each tab keeps what she
 * picked while she switches; saving one moves on to the next unsaved tab.
 * /log-mood, /log-pain and /log-flow open this sheet on their own tab.
 */
export function LogSheet({ initial }: { initial: LogTab }) {
  const [tab, setTab] = useState<LogTab>(initial);
  const [saved, setSaved] = useState<Record<LogTab, boolean>>({ mood: false, pain: false, flow: false });
  const [note, setNote] = useState<{ text: string; padTimer?: boolean } | null>(null);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/(tabs)'));

  const onSaved = (t: LogTab) => (info?: { bleeding?: boolean }) => {
    const next = { ...saved, [t]: true };
    setSaved(next);
    const label = TABS.find((x) => x.id === t)?.label ?? '';
    const remaining = TABS.filter((x) => !next[x.id]);
    setNote({
      text: remaining.length ? `${label} saved ✓  Next: ${remaining[0].label}` : 'All three saved ✓',
      padTimer: t === 'flow' && !!info?.bleeding,
    });
    if (remaining.length) setTab(remaining[0].id);
  };

  const allSaved = saved.mood && saved.pain && saved.flow;

  return (
    <AdaptiveBackground>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Button
            variant="secondary"
            size="sm"
            iconOnly
            onPress={close}
            accessibilityLabel="Close check-in"
            icon={<X size={20} color={Theme.colors.textPrimary} />}
            style={styles.close}
            testID="logsheet-close"
          />
          <Text style={styles.title}>Check-in</Text>
          <Button variant={allSaved ? 'primary' : 'tertiary'} size="sm" title="Done" onPress={close} testID="logsheet-done" />
        </View>

        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map((t) => {
            const on = tab === t.id;
            return (
              <Pressable
                key={t.id}
                onPress={() => setTab(t.id)}
                testID={`logsheet-tab-${t.id}`}
                style={[styles.tab, on && styles.tabOn]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${t.label}${saved[t.id] ? ', saved' : ''}`}
              >
                <Text style={styles.tabEmoji}>{t.emoji}</Text>
                <Text style={[styles.tabText, on && styles.tabTextOn]}>{t.label}</Text>
                {saved[t.id] ? (
                  <View style={styles.tick}>
                    <Check size={10} color={themed('#FFFFFF')} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {note ? (
          <View style={styles.note} accessibilityLiveRegion="polite">
            <Text style={styles.noteText}>{note.text}</Text>
            {note.padTimer ? (
              <Button variant="link" title="Start pad timer" onPress={() => router.replace(ROUTES.padCare)} />
            ) : allSaved ? (
              <Button variant="link" title="Close" onPress={close} />
            ) : null}
          </View>
        ) : null}

        {/* All three stay mounted so nothing she picked is lost when switching tabs. */}
        <View style={[styles.pane, tab !== 'mood' && styles.hidden]}>
          <MoodLogger mode="tab" onSaved={onSaved('mood')} />
        </View>
        <View style={[styles.pane, tab !== 'pain' && styles.hidden]}>
          <PainLogger mode="tab" onSaved={onSaved('pain')} />
        </View>
        <View style={[styles.pane, tab !== 'flow' && styles.hidden]}>
          <FlowLogger mode="tab" onSaved={onSaved('flow')} />
        </View>
      </SafeAreaView>
    </AdaptiveBackground>
  );
}

const styles = createStyles(() => ({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  close: { borderRadius: Theme.radius.full, borderColor: Theme.colors.cardBorder },
  title: { fontSize: 18, fontWeight: '800', color: Theme.colors.textPrimary },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 16,
    padding: 4,
    borderRadius: 16,
    backgroundColor: Theme.colors.backgroundMuted,
    maxWidth: 520,
    alignSelf: 'stretch',
  },
  tab: {
    flex: 1,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
  },
  tabOn: { backgroundColor: Theme.colors.card,
  borderWidth: 1,
  borderColor: Theme.colors.cardBorder, },
  tabEmoji: { fontSize: 16 },
  tabText: { fontSize: 14, fontWeight: '700', color: Theme.colors.textSecondary },
  tabTextOn: { color: Theme.colors.textPrimary, fontWeight: '800' },
  tick: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Theme.colors.strainOptimal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: Theme.colors.successLight,
  },
  noteText: { flex: 1, fontSize: 14, fontWeight: '700', color: Theme.colors.strainOptimal },
  pane: { flex: 1 },
  hidden: { display: 'none' },
}));
