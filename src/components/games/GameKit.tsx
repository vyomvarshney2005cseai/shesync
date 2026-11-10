import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Theme, createStyles } from '@/constants/theme';
import { Card, Chip, uiStyles } from '@/components/common/ui';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useGamesStore, type Feel } from '@/store/useGamesStore';
import { formatClock } from '@/lib/dates';

/** Seconds elapsed since `startedAt` while the game is running (null = not started). */
export function useElapsed(startedAt: number | null, stoppedAt: number | null): number {
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (startedAt == null || stoppedAt != null) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [startedAt, stoppedAt]);
  if (startedAt == null) return 0;
  const end = stoppedAt ?? (now || startedAt);
  return Math.max(0, Math.floor((end - startedAt) / 1000));
}

export function StatStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <View style={styles.strip}>
      {items.map((it) => (
        <View key={it.label} style={styles.stripItem}>
          <Text style={styles.stripValue}>{it.value}</Text>
          <Text style={styles.stripLabel}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

export function LevelPicker<T extends string>({
  levels,
  value,
  onChange,
}: {
  levels: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={[uiStyles.wrap, { marginBottom: 12 }]}>
      {levels.map((l) => (
        <Chip key={l.id} label={l.label} selected={value === l.id} onPress={() => onChange(l.id)} />
      ))}
    </View>
  );
}

const FEELS: { id: Feel; label: string }[] = [
  { id: 'tense', label: '😣 Still tense' },
  { id: 'okay', label: '🙂 Okay' },
  { id: 'calmer', label: '😌 Calmer' },
];

/** End-of-game card: result, personal best, and a one-tap "how do you feel now?". */
export function GameResult({
  title,
  lines,
  newBest,
  recordId,
  onReplay,
}: {
  title: string;
  lines: string[];
  newBest?: boolean;
  recordId: string | null;
  onReplay: () => void;
}) {
  const setFeel = useGamesStore((s) => s.setFeel);
  const [feel, setLocalFeel] = useState<Feel | null>(null);
  return (
    <Card tone="mint" style={{ marginTop: 16 }}>
      <Text style={styles.resultTitle}>{title}</Text>
      {newBest ? <Text style={styles.best}>🏆 New personal best!</Text> : null}
      {lines.map((l) => (
        <Text key={l} style={[uiStyles.body, { color: '#065F46' }]}>
          {l}
        </Text>
      ))}
      <Text style={[uiStyles.label, { marginTop: 12, color: '#047857' }]}>How do you feel now?</Text>
      <View style={[uiStyles.wrap, { marginTop: 8 }]}>
        {FEELS.map((f) => (
          <Chip
            key={f.id}
            label={f.label}
            small
            selected={feel === f.id}
            color="#059669"
            onPress={() => {
              setLocalFeel(f.id);
              if (recordId) setFeel(recordId, f.id);
            }}
          />
        ))}
      </View>
      {feel === 'tense' ? (
        <Text style={[uiStyles.muted, { marginTop: 8 }]}>Try two minutes of Calm Breathing — slow exhales settle the body fastest.</Text>
      ) : null}
      <View style={[uiStyles.row, { gap: 10, marginTop: 14 }]}>
        <PrimaryButton title="Play again" onPress={onReplay} style={{ flex: 1 }} />
        <PrimaryButton title="All games" variant="outline" onPress={() => router.replace('/games')} style={{ flex: 1 }} />
      </View>
    </Card>
  );
}

export const clock = formatClock;

const styles = createStyles(() => ({
  strip: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.lg,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    paddingVertical: 10,
    marginBottom: 14,
  },
  stripItem: { flex: 1, alignItems: 'center' },
  stripValue: { fontSize: 18, fontWeight: '800', color: Theme.colors.textPrimary, fontVariant: ['tabular-nums'] },
  stripLabel: { fontSize: 10, fontWeight: '700', color: Theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6 },
  resultTitle: { fontSize: 20, fontWeight: '800', color: '#065F46' },
  best: { fontSize: 13, fontWeight: '800', color: '#B45309', marginVertical: 4 },
}));

/** Current time for event handlers (kept out of render on purpose). */
export const nowMs = () => Date.now();
