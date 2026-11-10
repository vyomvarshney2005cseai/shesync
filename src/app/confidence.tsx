import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Bookmark, BookmarkCheck, Check, Flame, MessageCircleHeart, Plus, Sparkles, Trash2, Trophy } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { AuthGate } from '@/components/common/AuthGate';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Card, MiniBars, ProgressBar, SectionHeader } from '@/components/common/ui';
import { useConfidenceStore } from '@/store/useConfidenceStore';
import { addDaysToKey, lastNDaysKeys, shortDateLabel, todayKey, weekdayLabel } from '@/lib/dates';
import { AFFIRMATIONS, CHALLENGES, GLOW_HABITS, LEVEL_LABELS, pickForDay, streak } from '@/constants/confidence';
import { ROUTES } from '@/lib/routes';

/** Confidence Booster: a daily affirmation, a small brave step, glow habits and a jar of proud moments. */
export default function ConfidenceScreen() {
  const { levels, glow, challenges, proud, saved } = useConfidenceStore();
  const setLevel = useConfidenceStore((s) => s.setLevel);
  const toggleGlow = useConfidenceStore((s) => s.toggleGlow);
  const completeChallenge = useConfidenceStore((s) => s.completeChallenge);
  const undoChallenge = useConfidenceStore((s) => s.undoChallenge);
  const addProud = useConfidenceStore((s) => s.addProud);
  const removeProud = useConfidenceStore((s) => s.removeProud);
  const toggleSaved = useConfidenceStore((s) => s.toggleSaved);

  const today = todayKey();
  const [shift, setShift] = useState(0); // "another one" for the affirmation
  const affirmation = pickForDay(AFFIRMATIONS, today, shift);
  const challenge = pickForDay(CHALLENGES, today);
  const doneToday = challenges[today] === challenge.id;
  const glowToday = glow[today] ?? [];
  const level = levels[today];
  const [draft, setDraft] = useState('');

  const week = lastNDaysKeys(7);
  const trend = week.map((d) => levels[d] ?? 0);
  const trendLabels = week.map((d) => weekdayLabel(d).slice(0, 2));

  const days = useMemo(() => {
    const s = new Set<string>([...Object.keys(levels), ...Object.keys(challenges), ...proud.map((p) => p.date)]);
    for (const [d, list] of Object.entries(glow)) if (list.length) s.add(d);
    return s;
  }, [levels, challenges, proud, glow]);
  const run = streak(days, today, addDaysToKey);
  const braveCount = Object.keys(challenges).length;

  // A memory from the jar to lift a low day.
  const lowToday = level !== undefined && level <= 2;
  const reminder = lowToday && proud.length ? pickForDay(proud, today) : undefined;

  const isSaved = saved.includes(affirmation.id);
  const savedList = AFFIRMATIONS.filter((a) => saved.includes(a.id));

  const submitProud = () => {
    if (!draft.trim()) return;
    addProud(draft);
    setDraft('');
  };

  return (
    <AuthGate>
      <Screen>
        <ScreenHeader title="Confidence Booster" subtitle="Small daily steps to feel strong and glow" />

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Flame size={18} color={themed('#E3A048')} />
            <Text style={styles.statValue}>{run}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </View>
          <View style={styles.stat}>
            <Trophy size={18} color={Theme.colors.secondary} />
            <Text style={styles.statValue}>{braveCount}</Text>
            <Text style={styles.statLabel}>brave steps</Text>
          </View>
          <View style={styles.stat}>
            <Sparkles size={18} color={Theme.colors.primary} />
            <Text style={styles.statValue}>{proud.length}</Text>
            <Text style={styles.statLabel}>proud moments</Text>
          </View>
        </View>

        <Card tone="rose" style={styles.gap}>
          <Text style={styles.kicker}>Today’s affirmation</Text>
          <Text style={styles.affirmation}>{affirmation.text}</Text>
          <Text style={styles.help}>Say it out loud, slowly, three times.</Text>
          <View style={styles.affirmActions}>
            <Pressable onPress={() => setShift((n) => n + 1)} style={styles.linkBtn} accessibilityRole="button">
              <Text style={styles.linkText}>Another one</Text>
            </Pressable>
            <Pressable
              onPress={() => toggleSaved(affirmation.id)}
              style={styles.linkBtn}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? 'Remove from saved' : 'Save affirmation'}
            >
              {isSaved ? <BookmarkCheck size={16} color={Theme.colors.primaryDark} /> : <Bookmark size={16} color={Theme.colors.primaryDark} />}
              <Text style={styles.linkText}>{isSaved ? 'Saved' : 'Save'}</Text>
            </Pressable>
          </View>
        </Card>

        <SectionHeader title="How confident do you feel today?" />
        <Card style={styles.gap}>
          <View style={styles.levels}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                onPress={() => setLevel(n)}
                style={[styles.level, level === n && styles.levelOn]}
                accessibilityRole="radio"
                accessibilityState={{ selected: level === n }}
                accessibilityLabel={LEVEL_LABELS[n]}
              >
                <Text style={[styles.levelNum, level === n && styles.levelTextOn]}>{n}</Text>
                <Text style={[styles.levelLabel, level === n && styles.levelTextOn]}>{LEVEL_LABELS[n]}</Text>
              </Pressable>
            ))}
          </View>
          {trend.some((v) => v > 0) ? (
            <View style={{ marginTop: 16 }}>
              <Text style={styles.help}>Last 7 days</Text>
              <MiniBars values={trend} labels={trendLabels} color={Theme.colors.primary} />
            </View>
          ) : null}
          {lowToday ? (
            <View style={styles.lowBox}>
              <Text style={styles.signLabel}>Low days happen to everyone.</Text>
              {reminder ? (
                <Text style={styles.body}>
                  Remember {shortDateLabel(reminder.date)}: “{reminder.text}”
                </Text>
              ) : (
                <Text style={styles.body}>Try the small step below, or talk it through.</Text>
              )}
              <Pressable onPress={() => router.push(ROUTES.yourGoGirl)} style={[styles.linkBtn, { marginTop: 6 }]} accessibilityRole="button">
                <MessageCircleHeart size={16} color={Theme.colors.primaryDark} />
                <Text style={styles.linkText}>Talk to YourGoGirl</Text>
              </Pressable>
            </View>
          ) : null}
        </Card>

        <SectionHeader title="Today’s brave step" subtitle="One small stretch outside your comfort zone" />
        <Card tone={doneToday ? 'mint' : 'lilac'} style={styles.gap}>
          <Text style={styles.challenge}>{challenge.title}</Text>
          <Text style={styles.body}>{challenge.why}</Text>
          {doneToday ? (
            <View style={styles.doneRow}>
              <Check size={16} color={themed('#2F7D69')} />
              <Text style={styles.doneText}>Done — that took courage.</Text>
              <Pressable onPress={undoChallenge} hitSlop={8} accessibilityRole="button">
                <Text style={styles.undo}>Undo</Text>
              </Pressable>
            </View>
          ) : (
            <PrimaryButton title="I did it" variant="lilac" onPress={() => completeChallenge(challenge.id)} style={{ marginTop: 12 }} fullWidth />
          )}
        </Card>

        <SectionHeader title="Glow habits" subtitle={`${glowToday.length} of ${GLOW_HABITS.length} today · feel good, not look perfect`} />
        <Card style={styles.gap}>
          <ProgressBar value={glowToday.length / GLOW_HABITS.length} />
          <View style={{ marginTop: 8 }}>
            {GLOW_HABITS.map((h) => {
              const on = glowToday.includes(h.id);
              return (
                <Pressable
                  key={h.id}
                  onPress={() => toggleGlow(h.id)}
                  style={styles.checkRow}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                >
                  <View style={[styles.box, on && styles.boxOn]}>{on ? <Check size={13} color={themed('#FFFFFF')} /> : null}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.checkLabel}>{h.label}</Text>
                    <Text style={styles.help}>{h.hint}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <SectionHeader title="Proud moments jar" subtitle="Big or small. Read them on hard days." />
        <Card style={styles.gap}>
          <View style={styles.addRow}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="e.g. I presented in front of the class"
              placeholderTextColor={Theme.colors.textTertiary}
              style={styles.input}
              maxLength={280}
              onSubmitEditing={submitProud}
              returnKeyType="done"
              accessibilityLabel="New proud moment"
            />
            <Pressable onPress={submitProud} style={styles.addBtn} accessibilityRole="button" accessibilityLabel="Add proud moment">
              <Plus size={20} color={themed('#FFFFFF')} />
            </Pressable>
          </View>
          {proud.length === 0 ? <Text style={[styles.help, { marginTop: 10 }]}>Your first one can be tiny.</Text> : null}
          {proud.slice(0, 20).map((p) => (
            <View key={p.id} style={styles.proudRow}>
              <Sparkles size={14} color={Theme.colors.primary} style={{ marginTop: 3 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.proudText}>{p.text}</Text>
                <Text style={styles.help}>{shortDateLabel(p.date)}</Text>
              </View>
              <Pressable onPress={() => removeProud(p.id)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Delete proud moment">
                <Trash2 size={15} color={Theme.colors.textTertiary} />
              </Pressable>
            </View>
          ))}
        </Card>

        {savedList.length ? (
          <>
            <SectionHeader title="Saved affirmations" />
            <Card style={styles.gap}>
              {savedList.map((a) => (
                <View key={a.id} style={styles.proudRow}>
                  <BookmarkCheck size={14} color={Theme.colors.primaryDark} style={{ marginTop: 3 }} />
                  <Text style={[styles.proudText, { flex: 1 }]}>{a.text}</Text>
                  <Pressable onPress={() => toggleSaved(a.id)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Remove saved affirmation">
                    <Trash2 size={15} color={Theme.colors.textTertiary} />
                  </Pressable>
                </View>
              ))}
            </Card>
          </>
        ) : null}
      </Screen>
    </AuthGate>
  );
}

const styles = createStyles(() => ({
  gap: { marginBottom: 14 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: Theme.radius.lg,
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: Theme.colors.textPrimary, marginTop: 4 },
  statLabel: { fontSize: 11, color: Theme.colors.textSecondary, fontWeight: '600' },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', color: Theme.colors.primaryDark },
  affirmation: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: Theme.colors.textPrimary, marginTop: 8, marginBottom: 6 },
  affirmActions: { flexDirection: 'row', gap: 18, marginTop: 10 },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  linkText: { fontSize: 13, fontWeight: '700', color: Theme.colors.primaryDark },
  body: { fontSize: 13, lineHeight: 19, color: Theme.colors.textSecondary },
  help: { fontSize: 12, lineHeight: 17, color: Theme.colors.textSecondary },
  signLabel: { fontSize: 14, fontWeight: '700', color: Theme.colors.textPrimary, marginBottom: 2 },
  levels: { flexDirection: 'row', gap: 6 },
  level: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.background,
  },
  levelOn: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  levelNum: { fontSize: 17, fontWeight: '800', color: Theme.colors.textPrimary },
  levelLabel: { fontSize: 10, fontWeight: '600', color: Theme.colors.textSecondary, marginTop: 2 },
  levelTextOn: { color: '#FFFFFF' },
  lowBox: { marginTop: 14, padding: 12, borderRadius: Theme.radius.md, backgroundColor: Theme.colors.secondaryLight },
  challenge: { fontSize: 17, lineHeight: 23, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 4 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  doneText: { flex: 1, fontSize: 14, fontWeight: '700', color: '#2F7D69' },
  undo: { fontSize: 13, fontWeight: '700', color: Theme.colors.textSecondary },
  checkRow: { flexDirection: 'row', gap: 12, paddingVertical: 9, alignItems: 'flex-start' },
  box: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Theme.colors.secondaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  boxOn: { backgroundColor: Theme.colors.primary, borderColor: Theme.colors.primary },
  checkLabel: { fontSize: 14, lineHeight: 20, color: Theme.colors.textPrimary, fontWeight: '600' },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
  addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Theme.colors.primary, alignItems: 'center', justifyContent: 'center' },
  proudRow: { flexDirection: 'row', gap: 10, paddingTop: 12, alignItems: 'flex-start' },
  proudText: { fontSize: 14, lineHeight: 20, color: Theme.colors.textPrimary },
}));
