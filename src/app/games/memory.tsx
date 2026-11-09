import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { GameResult, LevelPicker, StatStrip, clock, nowMs, useElapsed } from '@/components/games/GameKit';
import { Theme } from '@/constants/theme';
import { createMemoryDeck, type MemoryCard } from '@/lib/games';
import { useGamesStore } from '@/store/useGamesStore';

type Level = 'easy' | 'normal';
const PAIRS: Record<Level, number> = { easy: 6, normal: 8 };
const COLS: Record<Level, number> = { easy: 3, normal: 4 };

export default function MemoryGame() {
  const recordGame = useGamesStore((s) => s.recordGame);
  const [level, setLevel] = useState<Level>('easy');
  const [deck, setDeck] = useState<MemoryCard[]>(() => createMemoryDeck(PAIRS.easy));
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [doneAt, setDoneAt] = useState<number | null>(null);
  const [result, setResult] = useState<{ id: string; newBest: boolean } | null>(null);
  const seconds = useElapsed(startedAt, doneAt);

  const reset = (lvl: Level = level) => {
    setLevel(lvl);
    setDeck(createMemoryDeck(PAIRS[lvl]));
    setOpen([]);
    setMoves(0);
    setStartedAt(null);
    setDoneAt(null);
    setResult(null);
  };

  const flip = (i: number) => {
    if (doneAt || open.length === 2 || open.includes(i) || deck[i].matched) return;
    const t = nowMs();
    if (!startedAt) setStartedAt(t);
    const next = [...open, i];
    setOpen(next);
    if (next.length < 2) return;
    setMoves((m) => m + 1);
    const [a, b] = next;
    if (deck[a].symbol === deck[b].symbol) {
      const updated = deck.map((c, k) => (k === a || k === b ? { ...c, matched: true } : c));
      setDeck(updated);
      setOpen([]);
      if (updated.every((c) => c.matched)) {
        const end = nowMs();
        setDoneAt(end);
        const secs = Math.max(1, Math.round((end - (startedAt ?? t)) / 1000));
        setResult(recordGame({ game: 'memory', seconds: secs, won: true, moves: moves + 1, level }));
      }
    } else {
      setTimeout(() => setOpen([]), 750);
    }
  };

  const cols = COLS[level];
  return (
    <Screen>
      <ScreenHeader title="Memory Match" subtitle="Find all the pairs. Breathe — there is no rush." fallbackHref="/games" />
      <LevelPicker
        levels={[
          { id: 'easy', label: 'Easy · 6 pairs' },
          { id: 'normal', label: 'Normal · 8 pairs' },
        ]}
        value={level}
        onChange={(l) => reset(l)}
      />
      <StatStrip
        items={[
          { label: 'Moves', value: `${moves}` },
          { label: 'Pairs', value: `${deck.filter((c) => c.matched).length / 2}/${PAIRS[level]}` },
          { label: 'Time', value: clock(seconds) },
        ]}
      />
      <View style={styles.grid}>
        {deck.map((card, i) => {
          const faceUp = card.matched || open.includes(i);
          return (
            <Pressable
              key={card.id}
              onPress={() => flip(i)}
              style={[
                styles.card,
                { width: `${100 / cols - 3}%` },
                faceUp && styles.cardUp,
                card.matched && styles.cardMatched,
              ]}
              accessibilityRole="button"
              accessibilityLabel={faceUp ? `Card ${card.symbol}` : `Hidden card ${i + 1}`}
            >
              <Text style={styles.symbol}>{faceUp ? card.symbol : '✿'}</Text>
            </Pressable>
          );
        })}
      </View>
      {doneAt ? (
        <GameResult
          title="All pairs found!"
          lines={[`${moves} moves · ${clock(seconds)}`, 'Fewer moves means a sharper memory today.']}
          newBest={result?.newBest}
          recordId={result?.id ?? null}
          onReplay={() => reset()}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  card: {
    aspectRatio: 0.85,
    borderRadius: 16,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.soft,
  },
  cardUp: { backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: Theme.colors.primaryLight },
  cardMatched: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', opacity: 0.8 },
  symbol: { fontSize: 30, color: '#FFFFFF' },
});
