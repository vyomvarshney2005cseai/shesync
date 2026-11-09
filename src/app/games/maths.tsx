import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { GameResult, LevelPicker, StatStrip, clock } from '@/components/games/GameKit';
import { Card, uiStyles } from '@/components/common/ui';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Theme } from '@/constants/theme';
import { makeMathsQuestion, type MathsQuestion } from '@/lib/games';
import { useGamesStore } from '@/store/useGamesStore';

type Level = 'easy' | 'medium' | 'hard';
type Mode = 'sprint' | 'zen';
const LEVEL_NUM: Record<Level, 1 | 2 | 3> = { easy: 1, medium: 2, hard: 3 };
const SPRINT_SECONDS = 60;
const ZEN_QUESTIONS = 15;

export default function MathsGame() {
  const recordGame = useGamesStore((s) => s.recordGame);
  const [level, setLevel] = useState<Level>('easy');
  const [mode, setMode] = useState<Mode>('sprint');
  const [q, setQ] = useState<MathsQuestion>(() => makeMathsQuestion(1));
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [streak, setStreak] = useState(0);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{ id: string; newBest: boolean } | null>(null);
  // Latest score for the sprint timer callback (written only in handlers).
  const scoreRef = useRef(0);

  const finish = (finalScore: number, start: number) => {
    setDone(true);
    setEndsAt(null);
    const secs = Math.max(1, Math.round((Date.now() - start) / 1000));
    setResult(recordGame({ game: 'maths', seconds: secs, won: true, score: finalScore, level: `${mode}-${level}` }));
  };

  // Sprint countdown — ends the round when time is up.
  useEffect(() => {
    if (endsAt == null || startedAt == null) return;
    const start = startedAt;
    const id = setInterval(() => {
      const t = Date.now();
      if (t >= endsAt) {
        clearInterval(id);
        finish(scoreRef.current, start);
      } else setNow(t);
    }, 200);
    return () => clearInterval(id);
    // finish only reads stable setters and the current mode/level
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, startedAt]);

  const start = () => {
    const t = Date.now();
    setQ(makeMathsQuestion(LEVEL_NUM[level]));
    setScore(0);
    scoreRef.current = 0;
    setAnswered(0);
    setStreak(0);
    setFeedback(null);
    setDone(false);
    setResult(null);
    setStartedAt(t);
    setNow(t);
    setEndsAt(mode === 'sprint' ? t + SPRINT_SECONDS * 1000 : null);
  };

  const answer = (value: number) => {
    if (!startedAt || done) return;
    const ok = value === q.answer;
    const nextScore = ok ? score + 1 : score;
    setScore(nextScore);
    scoreRef.current = nextScore;
    setStreak(ok ? streak + 1 : 0);
    setAnswered(answered + 1);
    setFeedback({ ok, text: ok ? (streak + 1 >= 3 ? `🔥 ${streak + 1} in a row!` : 'Correct!') : `${q.text} = ${q.answer}` });
    if (mode === 'zen' && answered + 1 >= ZEN_QUESTIONS) {
      finish(nextScore, startedAt);
      return;
    }
    setQ(makeMathsQuestion(LEVEL_NUM[level]));
  };

  const running = startedAt != null && !done;
  const timeLeft = endsAt ? Math.max(0, Math.ceil((endsAt - (now || endsAt)) / 1000)) : null;

  return (
    <Screen>
      <ScreenHeader title="Quick Maths" subtitle="Mental maths to clear brain fog. Mistakes are part of it." fallbackHref="/games" />
      {!running ? (
        <>
          <LevelPicker
            levels={[
              { id: 'sprint', label: '⏱ 60-sec sprint' },
              { id: 'zen', label: '🌿 Zen · 15 questions' },
            ]}
            value={mode}
            onChange={setMode}
          />
          <LevelPicker
            levels={[
              { id: 'easy', label: 'Easy' },
              { id: 'medium', label: 'Medium' },
              { id: 'hard', label: 'Hard' },
            ]}
            value={level}
            onChange={setLevel}
          />
        </>
      ) : null}
      <StatStrip
        items={[
          { label: 'Correct', value: `${score}` },
          { label: mode === 'sprint' ? 'Time left' : 'Question', value: mode === 'sprint' ? clock(timeLeft ?? SPRINT_SECONDS) : `${Math.min(answered + 1, ZEN_QUESTIONS)}/${ZEN_QUESTIONS}` },
          { label: 'Streak', value: `${streak}` },
        ]}
      />

      {running ? (
        <>
          <Card style={styles.qCard}>
            <Text style={styles.question} accessibilityLiveRegion="polite">
              {q.text} = ?
            </Text>
            <Text style={[styles.feedback, { color: feedback?.ok ? '#047857' : Theme.colors.strainHigh }]}>
              {feedback?.text ?? ' '}
            </Text>
          </Card>
          <View style={styles.options}>
            {q.options.map((o) => (
              <Pressable
                key={`${q.text}-${o}`}
                onPress={() => answer(o)}
                style={({ pressed }) => [styles.option, pressed && { backgroundColor: Theme.colors.primaryLight }]}
                accessibilityRole="button"
                accessibilityLabel={`Answer ${o}`}
              >
                <Text style={styles.optionText}>{o}</Text>
              </Pressable>
            ))}
          </View>
        </>
      ) : !done ? (
        <Card>
          <Text style={uiStyles.body}>
            {mode === 'sprint'
              ? 'Answer as many as you can in 60 seconds.'
              : 'No timer. Fifteen questions at your own pace — a calm way to wake up your brain.'}
          </Text>
          <PrimaryButton title="Start" onPress={start} fullWidth style={{ marginTop: 12 }} />
        </Card>
      ) : null}

      {done ? (
        <GameResult
          title={mode === 'sprint' ? 'Time!' : 'Set complete'}
          lines={[`${score} correct${mode === 'zen' ? ` out of ${ZEN_QUESTIONS}` : ` from ${answered} tried`}`, `Level: ${level}`]}
          newBest={result?.newBest}
          recordId={result?.id ?? null}
          onReplay={start}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  qCard: { alignItems: 'center', paddingVertical: 28 },
  question: { fontSize: 40, fontWeight: '900', color: Theme.colors.textPrimary, fontVariant: ['tabular-nums'] },
  feedback: { fontSize: 14, fontWeight: '800', marginTop: 8, minHeight: 20 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 },
  option: {
    width: '47.5%',
    flexGrow: 1,
    paddingVertical: 20,
    borderRadius: Theme.radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Theme.colors.cardBorder,
    alignItems: 'center',
    ...Theme.shadows.card,
  },
  optionText: { fontSize: 24, fontWeight: '900', color: Theme.colors.textPrimary, fontVariant: ['tabular-nums'] },
});
