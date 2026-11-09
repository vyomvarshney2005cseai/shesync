import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { GameResult, LevelPicker, StatStrip, clock, nowMs, useElapsed } from '@/components/games/GameKit';
import { uiStyles } from '@/components/common/ui';
import { Theme } from '@/constants/theme';
import { createSchulte } from '@/lib/games';
import { useGamesStore } from '@/store/useGamesStore';

type Level = 'easy' | 'normal';
const N: Record<Level, number> = { easy: 4, normal: 5 };

export default function FocusGrid() {
  const recordGame = useGamesStore((s) => s.recordGame);
  const [level, setLevel] = useState<Level>('easy');
  const [cells, setCells] = useState<number[]>(() => createSchulte(4));
  const [nextNum, setNextNum] = useState(1);
  const [wrong, setWrong] = useState<number | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [doneAt, setDoneAt] = useState<number | null>(null);
  const [result, setResult] = useState<{ id: string; newBest: boolean } | null>(null);
  const seconds = useElapsed(startedAt, doneAt);
  const n = N[level];
  const total = n * n;

  const reset = (lvl: Level = level) => {
    setLevel(lvl);
    setCells(createSchulte(N[lvl]));
    setNextNum(1);
    setWrong(null);
    setMistakes(0);
    setStartedAt(null);
    setDoneAt(null);
    setResult(null);
  };

  const tap = (value: number) => {
    if (doneAt) return;
    const t = nowMs();
    if (value !== nextNum) {
      setWrong(value);
      setMistakes(mistakes + 1);
      setTimeout(() => setWrong(null), 350);
      return;
    }
    const start = startedAt ?? t;
    if (!startedAt) setStartedAt(t);
    if (value === total) {
      setNextNum(value + 1);
      setDoneAt(t);
      setResult(recordGame({ game: 'schulte', seconds: Math.max(1, Math.round((t - start) / 1000)), won: true, level, moves: mistakes }));
    } else {
      setNextNum(value + 1);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Focus Grid" subtitle={`Tap the numbers from 1 to ${total} in order, as calmly as you can.`} fallbackHref="/games" />
      <LevelPicker
        levels={[
          { id: 'easy', label: 'Easy · 4×4' },
          { id: 'normal', label: 'Classic · 5×5' },
        ]}
        value={level}
        onChange={(l) => reset(l)}
      />
      <StatStrip
        items={[
          { label: 'Find', value: doneAt ? '✓' : `${nextNum}` },
          { label: 'Time', value: clock(seconds) },
          { label: 'Slips', value: `${mistakes}` },
        ]}
      />
      <View style={styles.board}>
        {cells.map((v) => {
          const found = v < nextNum;
          return (
            <Pressable
              key={v}
              onPress={() => tap(v)}
              style={[styles.cell, { width: `${100 / n}%` as `${number}%` }]}
              accessibilityRole="button"
              accessibilityLabel={`${v}${found ? ', found' : ''}`}
            >
              <View style={[styles.inner, found && styles.found, wrong === v && styles.wrong]}>
                <Text style={[styles.num, found && { color: '#047857' }, n === 5 && { fontSize: 20 }]}>{v}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text style={[uiStyles.muted, { textAlign: 'center', marginTop: 10 }]}>
        Tip: keep your eyes on the centre and let your side vision find the next number.
      </Text>
      {doneAt ? (
        <GameResult
          title="Grid complete!"
          lines={[`${clock(seconds)} · ${mistakes} slip${mistakes === 1 ? '' : 's'}`]}
          newBest={result?.newBest}
          recordId={result?.id ?? null}
          onReplay={() => reset()}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    aspectRatio: 1,
  },
  cell: { aspectRatio: 1, padding: 3 },
  inner: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  found: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  wrong: { backgroundColor: '#FFE4E6', borderColor: Theme.colors.strainHigh },
  num: { fontSize: 24, fontWeight: '900', color: Theme.colors.textPrimary },
});
