import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { GameResult, LevelPicker, StatStrip, clock, nowMs, useElapsed } from '@/components/games/GameKit';
import { Chip, uiStyles } from '@/components/common/ui';
import { Theme, createStyles } from '@/constants/theme';
import { createSudoku, isSudokuSolved, sudokuConflicts, SUDOKU_SPECS, type SudokuPuzzle } from '@/lib/games';
import { useGamesStore } from '@/store/useGamesStore';

type Level = 'easy' | 'hard';

export default function MiniSudoku() {
  const recordGame = useGamesStore((s) => s.recordGame);
  const [level, setLevel] = useState<Level>('easy');
  const [game, setGame] = useState<SudokuPuzzle>(() => createSudoku(SUDOKU_SPECS.easy));
  const [grid, setGrid] = useState<number[]>(() => [...game.puzzle]);
  const [selected, setSelected] = useState<number | null>(null);
  const [hints, setHints] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [doneAt, setDoneAt] = useState<number | null>(null);
  const [result, setResult] = useState<{ id: string; newBest: boolean } | null>(null);
  const seconds = useElapsed(startedAt, doneAt);
  const spec = SUDOKU_SPECS[level];
  const conflicts = useMemo(() => sudokuConflicts(grid, spec), [grid, spec]);

  const reset = (lvl: Level = level) => {
    const g = createSudoku(SUDOKU_SPECS[lvl]);
    setLevel(lvl);
    setGame(g);
    setGrid([...g.puzzle]);
    setSelected(null);
    setHints(0);
    setStartedAt(null);
    setDoneAt(null);
    setResult(null);
  };

  const place = (value: number) => {
    if (selected == null || doneAt || game.puzzle[selected] !== 0) return;
    const t = nowMs();
    const start = startedAt ?? t;
    if (!startedAt) setStartedAt(t);
    const next = [...grid];
    next[selected] = value;
    setGrid(next);
    if (isSudokuSolved(next, spec)) {
      setDoneAt(t);
      setResult(
        recordGame({
          game: 'sudoku',
          seconds: Math.max(1, Math.round((t - start) / 1000)),
          won: true,
          moves: hints,
          level,
        })
      );
    }
  };

  const hint = () => {
    if (doneAt) return;
    const empty = grid.map((v, i) => (v === 0 || conflicts.has(i) ? i : -1)).filter((i) => i >= 0 && game.puzzle[i] === 0);
    if (!empty.length) return;
    const target = selected != null && empty.includes(selected) ? selected : empty[0];
    setHints(hints + 1);
    setSelected(target);
    const next = [...grid];
    next[target] = game.solution[target];
    if (!startedAt) setStartedAt(nowMs());
    setGrid(next);
    if (isSudokuSolved(next, spec)) {
      const t = nowMs();
      setDoneAt(t);
      setResult(recordGame({ game: 'sudoku', seconds: Math.max(1, Math.round((t - (startedAt ?? t)) / 1000)), won: true, moves: hints + 1, level }));
    }
  };

  const n = spec.size;
  return (
    <Screen>
      <ScreenHeader
        title="Mini Sudoku"
        subtitle={`Each row, column and box holds 1–${n} once.`}
        fallbackHref="/games"
      />
      <LevelPicker
        levels={[
          { id: 'easy', label: 'Easy · 4×4' },
          { id: 'hard', label: 'Harder · 6×6' },
        ]}
        value={level}
        onChange={(l) => reset(l)}
      />
      <StatStrip
        items={[
          { label: 'Time', value: clock(seconds) },
          { label: 'Hints', value: `${hints}` },
          { label: 'Left', value: `${grid.filter((v) => v === 0).length}` },
        ]}
      />
      <View style={styles.board}>
        {grid.map((v, i) => {
          const r = Math.floor(i / n);
          const c = i % n;
          const given = game.puzzle[i] !== 0;
          const isSel = selected === i;
          const bad = conflicts.has(i);
          return (
            <Pressable
              key={i}
              onPress={() => setSelected(i)}
              style={[
                styles.cell,
                { width: `${100 / n}%` as `${number}%` },
                (c + 1) % spec.boxCols === 0 && c !== n - 1 && styles.boxRight,
                (r + 1) % spec.boxRows === 0 && r !== n - 1 && styles.boxBottom,
                given && styles.given,
                isSel && styles.selected,
                bad && styles.bad,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Row ${r + 1} column ${c + 1}, ${v ? v : 'empty'}${given ? ', given' : ''}`}
            >
              <Text style={[styles.cellText, given && styles.givenText, bad && { color: Theme.colors.strainHigh }, n === 6 && { fontSize: 20 }]}>
                {v || ''}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.pad}>
        {Array.from({ length: n }, (_, k) => k + 1).map((num) => (
          <Pressable
            key={num}
            onPress={() => place(num)}
            style={({ pressed }) => [styles.padBtn, pressed && { backgroundColor: Theme.colors.primaryLight }]}
            accessibilityRole="button"
            accessibilityLabel={`Place ${num}`}
          >
            <Text style={styles.padText}>{num}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => place(0)} style={styles.padBtn} accessibilityRole="button" accessibilityLabel="Erase">
          <Text style={[styles.padText, { fontSize: 16 }]}>⌫</Text>
        </Pressable>
      </View>
      <View style={[uiStyles.row, { justifyContent: 'center', gap: 10, marginTop: 12 }]}>
        <Chip label="💡 Hint" onPress={hint} />
        <Chip label="New puzzle" onPress={() => reset()} />
      </View>
      {doneAt ? (
        <GameResult
          title="Solved — well done!"
          lines={[`${clock(seconds)} · ${hints} hint${hints === 1 ? '' : 's'}`]}
          newBest={result?.newBest}
          recordId={result?.id ?? null}
          onReplay={() => reset()}
        />
      ) : null}
    </Screen>
  );
}

const styles = createStyles(() => ({
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: Theme.colors.textPrimary,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  cell: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#D1D5DB',
  },
  boxRight: { borderRightWidth: 2, borderRightColor: Theme.colors.textPrimary },
  boxBottom: { borderBottomWidth: 2, borderBottomColor: Theme.colors.textPrimary },
  given: { backgroundColor: '#F9FAFB' },
  selected: { backgroundColor: Theme.colors.primaryLight },
  bad: { backgroundColor: '#FFF1F2' },
  cellText: { fontSize: 26, fontWeight: '700', color: Theme.colors.secondary },
  givenText: { color: Theme.colors.textPrimary, fontWeight: '800' },
  pad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginTop: 16 },
  padBtn: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  padText: { fontSize: 20, fontWeight: '800', color: Theme.colors.textPrimary },
}));
