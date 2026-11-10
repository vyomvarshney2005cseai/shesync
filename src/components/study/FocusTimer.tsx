import React, { useEffect, useState } from 'react';
import { Platform, Text, TextInput, Vibration, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Pause, Play, Square, SkipForward } from 'lucide-react-native';
import { Theme, createStyles, themed, withAlpha } from '@/constants/theme';
import { Card, Chip, uiStyles } from '@/components/common/ui';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { FOCUS_PRESETS, useStudyStore } from '@/store/useStudyStore';
import { formatClock } from '@/lib/dates';

const SIZE = 210;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;

/**
 * Pomodoro timer. The end time is stored, not a countdown, so it stays
 * correct when you leave the screen or lock the phone.
 */
export function FocusTimer({ subjects }: { subjects: string[] }) {
  const timer = useStudyStore((s) => s.timer);
  const preset = useStudyStore((s) => s.preset);
  const setPreset = useStudyStore((s) => s.setPreset);
  const setSubject = useStudyStore((s) => s.setSubject);
  const startFocus = useStudyStore((s) => s.startFocus);
  const pause = useStudyStore((s) => s.pause);
  const resume = useStudyStore((s) => s.resume);
  const stop = useStudyStore((s) => s.stop);
  const completePhase = useStudyStore((s) => s.completePhase);
  const skipBreak = useStudyStore((s) => s.skipBreak);
  const [now, setNow] = useState(0);
  const [subjectDraft, setSubjectDraft] = useState(timer.subject === 'General' ? '' : timer.subject);

  const endsAt = timer.endsAt;
  useEffect(() => {
    if (endsAt == null) return;
    const tick = () => {
      const t = Date.now();
      if (t >= endsAt) {
        completePhase(t);
        if (Platform.OS !== 'web') Vibration.vibrate([0, 250, 150, 250]);
      } else {
        setNow(t);
      }
    };
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 500);
    return () => {
      clearTimeout(first);
      clearInterval(id);
    };
  }, [endsAt, completePhase]);

  const running = timer.endsAt != null;
  const paused = timer.pausedRemaining != null;
  const total = timer.mode === 'idle' ? preset.focus * 60 : timer.phaseSeconds;
  const left =
    timer.mode === 'idle'
      ? preset.focus * 60
      : running
      ? Math.max(0, Math.ceil(((timer.endsAt as number) - (now || (timer.endsAt as number) - total * 1000)) / 1000))
      : timer.pausedRemaining ?? total;
  const fraction = total > 0 ? left / total : 1;
  const isBreak = timer.mode === 'break';
  const color = isBreak ? themed('#10B981') : Theme.colors.secondary;

  const commitSubject = () => setSubject(subjectDraft);

  return (
    <Card>
      <View style={styles.presetRow}>
        {FOCUS_PRESETS.map((p) => (
          <Chip
            key={p.label}
            label={p.label}
            small
            selected={preset.focus === p.focus && preset.rest === p.rest}
            onPress={() => setPreset({ focus: p.focus, rest: p.rest })}
            color={Theme.colors.secondary}
            accessibilityLabel={`${p.focus} minutes focus, ${p.rest} minutes break. ${p.hint}`}
          />
        ))}
      </View>
      <Text style={[uiStyles.muted, { marginTop: 6 }]}>
        {FOCUS_PRESETS.find((p) => p.focus === preset.focus && p.rest === preset.rest)?.hint ?? 'Custom'}
        {timer.mode !== 'idle' ? ' · applies to your next block' : ''}
      </Text>

      <View style={styles.ringWrap}>
        <Svg width={SIZE} height={SIZE}>
          <Circle cx={SIZE / 2} cy={SIZE / 2} r={R} stroke={withAlpha(color, 0.13)} strokeWidth={STROKE} fill="none" />
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={themed(color)}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={`${C} ${C}`}
            strokeDashoffset={C * (1 - fraction)}
            strokeLinecap="round"
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          />
        </Svg>
        <View style={styles.ringCenter} pointerEvents="none">
          <Text style={[styles.mode, { color }]}>
            {timer.mode === 'idle' ? 'READY' : isBreak ? 'BREAK' : 'FOCUS'}
            {paused ? ' · PAUSED' : ''}
          </Text>
          <Text style={styles.clock} accessibilityLiveRegion="polite" accessibilityLabel={`${Math.ceil(left / 60)} minutes left`}>
            {formatClock(left)}
          </Text>
          <Text style={styles.subjectLabel} numberOfLines={1}>
            {isBreak ? 'Stretch · water · look away' : timer.subject}
          </Text>
          <Text style={styles.rounds}>Round {timer.rounds + (timer.mode === 'focus' ? 1 : 0) || 1} · long break after 4</Text>
        </View>
      </View>

      {timer.mode === 'idle' ? (
        <>
          <TextInput
            value={subjectDraft}
            onChangeText={setSubjectDraft}
            onBlur={commitSubject}
            onSubmitEditing={commitSubject}
            placeholder="What are you studying? e.g. Physics"
            placeholderTextColor={Theme.colors.textTertiary}
            style={uiStyles.input}
            accessibilityLabel="Subject"
          />
          {subjects.length ? (
            <View style={[uiStyles.wrap, { marginTop: 8 }]}>
              {subjects.slice(0, 6).map((s) => (
                <Chip
                  key={s}
                  label={s}
                  small
                  selected={timer.subject === s}
                  onPress={() => {
                    setSubjectDraft(s);
                    setSubject(s);
                  }}
                  color={Theme.colors.secondary}
                />
              ))}
            </View>
          ) : null}
          <PrimaryButton
            title={`Start ${preset.focus}-min focus`}
            variant="lilac"
            icon={<Play size={16} color={themed('#FFFFFF')} fill={themed('#FFFFFF')} />}
            onPress={() => {
              commitSubject();
              startFocus(Date.now());
            }}
            fullWidth
            style={{ marginTop: 12 }}
          />
        </>
      ) : (
        <View style={styles.btnRow}>
          {paused ? (
            <PrimaryButton
              title="Resume"
              variant="lilac"
              icon={<Play size={16} color={themed('#FFFFFF')} />}
              onPress={() => resume(Date.now())}
              style={{ flex: 1 }}
            />
          ) : (
            <PrimaryButton
              title="Pause"
              variant="outline"
              icon={<Pause size={16} color={Theme.colors.textPrimary} />}
              onPress={() => pause(Date.now())}
              style={{ flex: 1 }}
            />
          )}
          {isBreak ? (
            <PrimaryButton
              title="Skip break"
              variant="outline"
              icon={<SkipForward size={16} color={Theme.colors.textPrimary} />}
              onPress={skipBreak}
              style={{ flex: 1 }}
            />
          ) : (
            <PrimaryButton
              title="Stop"
              variant="dark"
              icon={<Square size={14} color={themed('#FFFFFF')} />}
              onPress={() => stop(Date.now())}
              style={{ flex: 1 }}
            />
          )}
        </View>
      )}
      <Text style={[uiStyles.muted, { textAlign: 'center', marginTop: 10 }]}>
        Finished blocks are saved automatically. Stopping after 5+ minutes still counts.
      </Text>
    </Card>
  );
}

const styles = createStyles(() => ({
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ringWrap: { alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
  ringCenter: { position: 'absolute', alignItems: 'center', width: SIZE - 40 },
  mode: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  clock: { fontSize: 48, fontWeight: '800', color: Theme.colors.textPrimary, fontVariant: ['tabular-nums'], letterSpacing: -1 },
  subjectLabel: { fontSize: 13, fontWeight: '700', color: Theme.colors.textSecondary, maxWidth: SIZE - 50 },
  rounds: { fontSize: 10, color: Theme.colors.textTertiary, marginTop: 4, fontWeight: '600' },
  btnRow: { flexDirection: 'row', gap: 10 },
}));
