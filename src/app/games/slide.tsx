import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { GameResult, LevelPicker, StatStrip, clock, nowMs, useElapsed } from '@/components/games/GameKit';
import { uiStyles } from '@/components/common/ui';
import { Theme } from '@/constants/theme';
import { createSlidePuzzle, isSlideSolved, trySlide } from '@/lib/games';
import { useGamesStore } from '@/store/useGamesStore';

type Level = 'easy' | 'hard';
const SIZE: Record<Level, number> = { easy: 3, hard: 4 };

export default function SlidePuzzle() {
  const recordGame = useGamesStore((s) => s.recordGame);
  const [level, setLevel] = useState<Level>('easy');
  const [tiles, setTiles] = useState<number[]>(() => createSlidePuzzle(3, 60));
  const [moves, setMoves] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [doneAt, setDoneAt] = useState<number | null>(null);
  const [result, setResult] = useState<{ id: string; newBest: boolean } | null>(null);
  const seconds = useElapsed(startedAt, doneAt);
  const size = SIZE[level];

  const reset = (lvl: Level = level) => {
    setLevel(lvl);
    setTiles(createSlidePuzzle(SIZE[lvl], SIZE[lvl] === 3 ? 60 : 120));
    setMoves(0);
    setStartedAt(null);
    setDoneAt(null);
    setResult(null);
  };

  const tap = (i: number) => {
    if (doneAt) return;
    const next = trySlide(tiles, i, size);
    if (!next) return;
    const t = nowMs();
    const start = startedAt ?? t;
    if (!startedAt) setStartedAt(t);
    setTiles(next);
    setMoves(moves + 1);
    if (isSlideSolved(next)) {
      setDoneAt(t);
      setResult(recordGame({ game: 'slide', seconds: Math.max(1, Math.round((t - start) / 1000)), won: true, moves: moves + 1, level }));
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Sliding Puzzle" subtitle="Slide the tiles into order 1, 2, 3… with the gap last." fallbackHref="/games" />
      <LevelPicker
        levels={[
          { id: 'easy', label: 'Easy · 3×3' },
          { id: 'hard', label: 'Hard · 4×4' },
        ]}
        value={level}
        onChange={(l) => reset(l)}
      />
      <StatStrip
        items={[
          { label: 'Moves', value: `${moves}` },
          { label: 'Time', value: clock(seconds) },
        ]}
      />
      <View style={styles.board} accessibilityLabel="Puzzle board">
        {tiles.map((t, i) => (
          <Pressable
            key={t === 0 ? 'gap' : t}
            onPress={() => tap(i)}
            disabled={t === 0}
            style={[styles.cell, { width: `${100 / size}%` as `${number}%` }]}
            accessibilityRole="button"
            accessibilityLabel={t === 0 ? 'Empty space' : `Tile ${t}`}
          >
            {t !== 0 ? (
              <View style={[styles.tile, isSlideSolved(tiles) && styles.tileDone]}>
                <Text style={[styles.tileText, size === 4 && { fontSize: 22 }]}>{t}</Text>
              </View>
            ) : null}
          </Pressable>
        ))}
      </View>
      <Text style={[uiStyles.muted, { textAlign: 'center', marginTop: 10 }]}>Tap a tile next to the empty space to slide it.</Text>
      {doneAt ? (
        <GameResult
          title="Solved!"
          lines={[`${moves} moves · ${clock(seconds)}`]}
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
    aspectRatio: 1,
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    backgroundColor: Theme.colors.secondaryLight,
    borderRadius: Theme.radius.xl,
    padding: 6,
  },
  cell: { aspectRatio: 1, padding: 4 },
  tile: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: Theme.colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadows.soft,
  },
  tileDone: { backgroundColor: '#10B981' },
  tileText: { fontSize: 28, fontWeight: '800', color: '#FFFFFF' },
});
