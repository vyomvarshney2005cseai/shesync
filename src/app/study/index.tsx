import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Check, Plus, Trash2, Sparkles, Phone, Wind, Lightbulb } from 'lucide-react-native';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Card, Chip, MiniBars, SectionHeader, StatTile, Stepper, uiStyles } from '@/components/common/ui';
import { VideoShelf } from '@/components/common/VideoShelf';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { FocusTimer } from '@/components/study/FocusTimer';
import { Theme, createStyles, themed } from '@/constants/theme';
import {
  AFFIRMATIONS,
  CONFIDENCE_LEVELS,
  FOG_RESETS,
  PERIOD_KIT,
  getFocusForecast,
} from '@/constants/studyContent';
import { STUDY_VIDEOS, STUDY_VIDEO_CATEGORIES } from '@/constants/wellnessVideos';
import { useAppStore } from '@/store/useAppStore';
import { useStudyStore } from '@/store/useStudyStore';
import { recentSignals } from '@/lib/recent';
import { dayStreak } from '@/lib/streaks';
import { lastNDaysKeys, shortDateLabel, todayKey, weekdayLabel } from '@/lib/dates';
import { callNumber, CRISIS_LINES } from '@/lib/openExternal';

export default function StudyDashboard() {
  const phase = useAppStore((s) => s.cycle.phase);
  const cycleLabel = useAppStore((s) => s.cycle.label);
  const strainLevel = useAppStore((s) => s.biometrics.strainLevel);
  const daysUntilNext = useAppStore((s) => (s.cycle.hasCycleData ? s.cyclePrediction.daysUntilNextPeriod : undefined));
  const logs = useAppStore((s) => s.symptomLogs);

  const sessions = useStudyStore((s) => s.sessions);
  const tasks = useStudyStore((s) => s.tasks);
  const confidence = useStudyStore((s) => s.confidence);
  const wins = useStudyStore((s) => s.wins);
  const kitChecks = useStudyStore((s) => s.kitChecks);
  const setPreset = useStudyStore((s) => s.setPreset);
  const timerMode = useStudyStore((s) => s.timer.mode);
  const addTask = useStudyStore((s) => s.addTask);
  const toggleTask = useStudyStore((s) => s.toggleTask);
  const removeTask = useStudyStore((s) => s.removeTask);
  const clearDoneTasks = useStudyStore((s) => s.clearDoneTasks);
  const setSubject = useStudyStore((s) => s.setSubject);
  const setConfidence = useStudyStore((s) => s.setConfidence);
  const addWin = useStudyStore((s) => s.addWin);
  const removeWin = useStudyStore((s) => s.removeWin);
  const toggleKitItem = useStudyStore((s) => s.toggleKitItem);

  const [taskTitle, setTaskTitle] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [taskPomos, setTaskPomos] = useState(2);
  const [winText, setWinText] = useState('');
  const [affIndex, setAffIndex] = useState(() => new Date().getDate() % AFFIRMATIONS.length);

  const today = todayKey();
  const { forecast, reasons } = useMemo(() => {
    const sig = recentSignals(logs);
    return getFocusForecast({
      phase,
      daysUntilNextPeriod: daysUntilNext,
      pain: sig.pain,
      flow: sig.flow,
      mood: sig.mood,
      energy: sig.energy,
      tags: sig.tags,
      strainLevel,
    });
  }, [logs, phase, daysUntilNext, strainLevel]);

  const stats = useMemo(() => {
    const days = lastNDaysKeys(7);
    const todays = sessions.filter((s) => s.date === today);
    return {
      todayMin: todays.reduce((a, s) => a + s.minutes, 0),
      todayCount: todays.length,
      streak: dayStreak(sessions.map((s) => s.date)),
      bars: days.map((d) => sessions.filter((s) => s.date === d).reduce((a, s) => a + s.minutes, 0)),
      labels: days.map((d) => weekdayLabel(d).slice(0, 2)),
      confidence: days.map((d) => confidence[d] ?? 0),
    };
  }, [sessions, confidence, today]);

  const subjects = useMemo(
    () => Array.from(new Set(tasks.filter((t) => !t.done).map((t) => t.subject).concat(sessions.slice(0, 20).map((s) => s.subject)))).filter((s) => s && s !== 'General'),
    [tasks, sessions]
  );
  const openTasks = tasks.filter((t) => !t.done);
  const doneTasks = tasks.filter((t) => t.done);
  const todayConfidence = confidence[today];
  const todayKit = kitChecks[today] ?? [];
  const periodWeek = phase === 'menstrual' || forecast.id === 'pms';
  const presetActive = forecast.preset.focus;

  return (
    <Screen>
      <ScreenHeader
        title="Study Focus"
        subtitle="Focus timer, study plan and confidence"
      />

      {/* ── Forecast ─────────────────────────────────── */}
      <Card tone="lilac">
        <Text style={styles.forecastLabel}>TODAY’S FOCUS MODE · {cycleLabel.toUpperCase()}</Text>
        <Text style={styles.forecastTitle}>
          {forecast.emoji} {forecast.mode}
        </Text>
        <Text style={styles.forecastHeadline}>{forecast.headline}</Text>
        {reasons.length ? (
          <View style={styles.reasonPill}>
            <Text style={styles.reasonText}>You logged {reasons.join(', ')} — so today is set to go easy.</Text>
          </View>
        ) : null}
        <Text style={[uiStyles.body, { marginTop: 8 }]}>{forecast.why}</Text>
        <View style={styles.listBlock}>
          {forecast.doList.map((d) => (
            <View key={d} style={styles.listRow}>
              <Check size={14} color={themed('#047857')} />
              <Text style={styles.listText}>{d}</Text>
            </View>
          ))}
          {forecast.avoid.map((d) => (
            <View key={d} style={styles.listRow}>
              <Text style={styles.avoidMark}>✕</Text>
              <Text style={[styles.listText, { color: Theme.colors.textSecondary }]}>{d}</Text>
            </View>
          ))}
        </View>
        <PrimaryButton
          title={`Use the ${forecast.preset.focus}/${forecast.preset.rest} timer`}
          variant="lilac"
          onPress={() => setPreset(forecast.preset)}
          fullWidth
          style={{ marginTop: 14 }}
        />
        {timerMode !== 'idle' && presetActive ? (
          <Text style={[uiStyles.muted, { marginTop: 6, textAlign: 'center' }]}>New timing starts with your next block.</Text>
        ) : null}
      </Card>
      <Text style={styles.evidence}>
        Research finds thinking skills stay broadly similar across the cycle for most people — it is pain, poor
        sleep, fatigue and mood that get in the way. This plan adapts to those.
      </Text>

      {/* ── Timer ────────────────────────────────────── */}
      <SectionHeader title="Focus timer" subtitle="Pomodoro blocks with automatic breaks" />
      <FocusTimer subjects={subjects} />

      <View style={[styles.tiles, { marginTop: 12 }]}>
        <StatTile label="Today" value={`${stats.todayMin} min`} hint={`${stats.todayCount} block${stats.todayCount === 1 ? '' : 's'}`} color={Theme.colors.secondary} />
        <StatTile label="Streak" value={`${stats.streak} day${stats.streak === 1 ? '' : 's'}`} hint="study days in a row" color={Theme.colors.primary} />
      </View>
      <Card style={{ marginTop: 10 }}>
        <Text style={uiStyles.label}>Focus minutes · last 7 days</Text>
        <View style={{ marginTop: 8 }}>
          <MiniBars values={stats.bars} labels={stats.labels} color={Theme.colors.secondary} unit=" min" />
        </View>
      </Card>

      {/* ── Study plan ───────────────────────────────── */}
      <SectionHeader
        title="Today’s study plan"
        subtitle={periodWeek ? 'Period-week tip: split big tasks into 1–2 blocks each' : 'Break work into timer-sized blocks'}
        right={doneTasks.length ? <Chip label={`Clear ${doneTasks.length} done`} small onPress={clearDoneTasks} /> : null}
      />
      <Card>
        <TextInput
          value={taskTitle}
          onChangeText={setTaskTitle}
          placeholder="Task, e.g. Revise thermodynamics notes"
          placeholderTextColor={Theme.colors.textTertiary}
          style={uiStyles.input}
          accessibilityLabel="Task"
        />
        <View style={[uiStyles.row, { gap: 8, marginTop: 8 }]}>
          <TextInput
            value={taskSubject}
            onChangeText={setTaskSubject}
            placeholder="Subject"
            placeholderTextColor={Theme.colors.textTertiary}
            style={[uiStyles.input, { flex: 1 }]}
            accessibilityLabel="Subject"
          />
          <Stepper label="Blocks" value={taskPomos} onChange={setTaskPomos} min={1} max={8} format={(v) => `🍅 ${v}`} />
        </View>
        <PrimaryButton
          title="Add task"
          variant="outline"
          icon={<Plus size={16} color={Theme.colors.textPrimary} />}
          onPress={() => {
            addTask(taskTitle, taskSubject, taskPomos);
            setTaskTitle('');
          }}
          fullWidth
          style={{ marginTop: 10 }}
        />
        {tasks.length === 0 ? (
          <Text style={[uiStyles.muted, { marginTop: 12, textAlign: 'center' }]}>No tasks yet — add one small thing to start.</Text>
        ) : null}
        {[...openTasks, ...doneTasks].slice(0, 12).map((t) => (
          <View key={t.id} style={styles.taskRow}>
            <Pressable
              onPress={() => toggleTask(t.id)}
              style={[styles.checkbox, t.done && styles.checkboxOn]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: t.done }}
              accessibilityLabel={t.title}
            >
              {t.done ? <Check size={14} color={themed('#FFFFFF')} /> : null}
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[styles.taskTitle, t.done && styles.taskDone]}>{t.title}</Text>
              <Text style={uiStyles.muted}>
                {t.subject} · 🍅 {t.pomodoros}
              </Text>
            </View>
            {!t.done ? (
              <Chip label="Focus" small onPress={() => setSubject(t.subject)} color={Theme.colors.secondary} accessibilityLabel={`Set timer subject to ${t.subject}`} />
            ) : null}
            <Pressable onPress={() => removeTask(t.id)} hitSlop={8} accessibilityLabel={`Delete ${t.title}`} style={{ padding: 4 }}>
              <Trash2 size={16} color={Theme.colors.textTertiary} />
            </Pressable>
          </View>
        ))}
      </Card>

      {/* ── Confidence ───────────────────────────────── */}
      <SectionHeader title="Confidence check-in" subtitle="How confident do you feel about your studies today?" />
      <Card>
        <View style={styles.confRow}>
          {CONFIDENCE_LEVELS.map((c) => (
            <Pressable
              key={c.value}
              onPress={() => setConfidence(c.value)}
              style={[styles.confBtn, todayConfidence === c.value && styles.confBtnOn]}
              accessibilityRole="radio"
              accessibilityState={{ selected: todayConfidence === c.value }}
              accessibilityLabel={c.label}
            >
              <Text style={styles.confEmoji}>{c.emoji}</Text>
              <Text style={[styles.confLabel, todayConfidence === c.value && { color: Theme.colors.secondaryDark }]}>{c.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={{ marginTop: 14 }}>
          <MiniBars values={stats.confidence} labels={stats.labels} color={Theme.colors.primary} />
        </View>
        {todayConfidence && todayConfidence <= 2 ? (
          <Text style={[uiStyles.body, { marginTop: 10 }]}>
            Low-confidence days happen to everyone. Write one thing you did well below — even “I opened my notes” counts.
          </Text>
        ) : null}
      </Card>

      {/* ── Wins journal ─────────────────────────────── */}
      <SectionHeader title="Wins journal" subtitle="Small wins build real confidence" />
      <Card>
        <View style={[uiStyles.row, { gap: 8 }]}>
          <TextInput
            value={winText}
            onChangeText={setWinText}
            placeholder="Today I… (e.g. finished 2 PYQs)"
            placeholderTextColor={Theme.colors.textTertiary}
            style={[uiStyles.input, { flex: 1 }]}
            accessibilityLabel="Add a win"
            onSubmitEditing={() => {
              addWin(winText);
              setWinText('');
            }}
          />
          <PrimaryButton
            title="Add"
            onPress={() => {
              addWin(winText);
              setWinText('');
            }}
            style={{ paddingVertical: 11 }}
          />
        </View>
        {wins.slice(0, 6).map((w) => (
          <View key={w.id} style={styles.winRow}>
            <Sparkles size={14} color={Theme.colors.primary} />
            <Text style={styles.winText}>{w.text}</Text>
            <Text style={uiStyles.muted}>{shortDateLabel(w.date)}</Text>
            <Pressable onPress={() => removeWin(w.id)} hitSlop={8} accessibilityLabel="Delete win">
              <Trash2 size={14} color={Theme.colors.textTertiary} />
            </Pressable>
          </View>
        ))}
      </Card>

      {/* ── Affirmation ──────────────────────────────── */}
      <Pressable
        onPress={() => setAffIndex((i) => (i + 1) % AFFIRMATIONS.length)}
        accessibilityRole="button"
        accessibilityHint="Shows the next affirmation"
      >
        <Card tone="dark" style={{ marginTop: 18 }}>
          <Text style={styles.affLabel}>REMINDER FOR TODAY · TAP FOR ANOTHER</Text>
          <Text style={styles.affText}>“{AFFIRMATIONS[affIndex]}”</Text>
        </Card>
      </Pressable>

      {/* ── Period-day kit ───────────────────────────── */}
      <SectionHeader
        title="Period-day study kit"
        subtitle={periodWeek ? 'Your period is here or close — tick these off' : 'Keep it ready for your next period'}
      />
      <Card tone={periodWeek ? 'rose' : 'default'}>
        {PERIOD_KIT.map((item) => {
          const on = todayKit.includes(item.id);
          return (
            <Pressable
              key={item.id}
              onPress={() => toggleKitItem(item.id)}
              style={styles.kitRow}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
            >
              <View style={[styles.checkbox, on && styles.checkboxOn]}>{on ? <Check size={14} color={themed('#FFFFFF')} /> : null}</View>
              <Text style={[styles.kitText, on && styles.taskDone]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </Card>

      {/* ── Brain-fog resets ─────────────────────────── */}
      <SectionHeader title="Brain-fog quick resets" subtitle="Two minutes to get your focus back" />
      <Card>
        {FOG_RESETS.map((r) => (
          <View key={r.text} style={styles.listRow}>
            <Text style={{ fontSize: 16 }}>{r.emoji}</Text>
            <Text style={styles.listText}>{r.text}</Text>
          </View>
        ))}
        <View style={[uiStyles.row, { gap: 10, marginTop: 12 }]}>
          <PrimaryButton
            title="1-min breathing"
            variant="lilac"
            icon={<Wind size={15} color={themed('#FFFFFF')} />}
            onPress={() => router.push('/games/breathe')}
            style={{ flex: 1 }}
          />
          <PrimaryButton
            title="Brain games"
            variant="outline"
            icon={<Lightbulb size={15} color={Theme.colors.textPrimary} />}
            onPress={() => router.push('/games')}
            style={{ flex: 1 }}
          />
        </View>
      </Card>

      {/* ── Videos ───────────────────────────────────── */}
      <SectionHeader title="Videos for focus & confidence" subtitle="Periods and focus, study-with-me, mindset and exam stress" />
      <VideoShelf videos={STUDY_VIDEOS} categories={STUDY_VIDEO_CATEGORIES} />

      <Pressable
        onPress={() => callNumber(CRISIS_LINES.teleManas.number, CRISIS_LINES.teleManas.label)}
        accessibilityRole="button"
      >
        <Card tone="amber" style={{ marginTop: 18 }}>
          <View style={[uiStyles.row, { gap: 8 }]}>
            <Phone size={15} color={themed('#92400E')} />
            <Text style={[uiStyles.strong, { color: themed('#92400E'), fontSize: 14 }]}>Feeling low for two weeks or more?</Text>
          </View>
          <Text style={[uiStyles.body, { color: themed('#92400E'), marginTop: 4 }]}>
            Exam stress and period-related low mood are common and treatable. Talk to someone — Tele-MANAS on{' '}
            {CRISIS_LINES.teleManas.number} is free and open 24×7. Tap to call.
          </Text>
        </Card>
      </Pressable>
    </Screen>
  );
}

const styles = createStyles(() => ({
  forecastLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: Theme.colors.secondaryDark },
  forecastTitle: { fontSize: 22, fontWeight: '800', color: Theme.colors.textPrimary, marginTop: 6, letterSpacing: -0.4 },
  forecastHeadline: { fontSize: 14, fontWeight: '700', color: Theme.colors.secondaryDark, marginTop: 2 },
  reasonPill: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 8, marginTop: 10, borderWidth: 1, borderColor: Theme.colors.secondaryBorder },
  reasonText: { fontSize: 12, fontWeight: '700', color: Theme.colors.secondaryDark },
  listBlock: { marginTop: 10, gap: 6 },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, paddingVertical: 2 },
  listText: { fontSize: 13, color: Theme.colors.textPrimary, flex: 1, lineHeight: 18 },
  avoidMark: { fontSize: 12, fontWeight: '800', color: Theme.colors.strainHigh, width: 14, textAlign: 'center' },
  evidence: { fontSize: 11, color: Theme.colors.textTertiary, marginTop: 8, lineHeight: 16, paddingHorizontal: 4 },
  tiles: { flexDirection: 'row', gap: 10 },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: Theme.colors.cardBorder, marginTop: 6 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: Theme.colors.secondaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxOn: { backgroundColor: Theme.colors.secondary, borderColor: Theme.colors.secondary },
  taskTitle: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary },
  taskDone: { textDecorationLine: 'line-through', color: Theme.colors.textTertiary },
  confRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 6 },
  confBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: '#FFFFFF',
  },
  confBtnOn: { borderColor: Theme.colors.secondary, backgroundColor: Theme.colors.secondaryLight },
  confEmoji: { fontSize: 22 },
  confLabel: { fontSize: 10, fontWeight: '700', color: Theme.colors.textSecondary, marginTop: 2 },
  winRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 1, borderTopColor: Theme.colors.cardBorder, marginTop: 6 },
  winText: { flex: 1, fontSize: 13, fontWeight: '600', color: Theme.colors.textPrimary },
  affLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: '#FDA4AF' },
  affText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF', marginTop: 8, lineHeight: 26 },
  kitRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  kitText: { fontSize: 13, fontWeight: '600', color: Theme.colors.textPrimary, flex: 1 },
}));
