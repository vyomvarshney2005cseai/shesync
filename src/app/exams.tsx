import React, { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { CalendarPlus, ChevronDown, ChevronUp, FileText, Trash2 } from 'lucide-react-native';
import { AuthGate } from '@/components/common/AuthGate';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Card, SectionHeader, uiStyles } from '@/components/common/ui';
import { Button } from '@/components/ds';
import { MonthPicker } from '@/components/common/MonthPicker';
import { Theme, createStyles, themed } from '@/constants/theme';
import { buildOutlook, dayMarks, forecastExam, prepPlan, type ExamRisk } from '@/lib/examPlanner';
import { daysBetweenKeys, shortDateLabel, todayKey, weekdayLabel } from '@/lib/dates';
import { ROUTES } from '@/lib/routes';
import { useAppStore } from '@/store/useAppStore';
import { useStudyStore } from '@/store/useStudyStore';

const RISK_STYLE: Record<ExamRisk, { ink: string; bg: string }> = {
  heavy: { ink: '#BE123C', bg: '#FFE4E6' },
  period: { ink: '#BE185D', bg: '#FCE7F3' },
  pms: { ink: '#B45309', bg: '#FEF3C7' },
  near: { ink: '#6D28D9', bg: '#EDE9FE' },
  clear: { ink: '#047857', bg: '#D1FAE5' },
  unknown: { ink: '#6B7280', bg: '#F3F4F6' },
};

export default function ExamsScreen() {
  return (
    <AuthGate>
      <ExamPlanner />
    </AuthGate>
  );
}

function ExamPlanner() {
  const hasCycleData = useAppStore((s) => !!s.cycle.hasCycleData);
  const pastCycles = useAppStore((s) => s.pastCycles);
  const prediction = useAppStore((s) => s.cyclePrediction);
  const logs = useAppStore((s) => s.symptomLogs);
  const exams = useStudyStore((s) => s.exams);
  const addExam = useStudyStore((s) => s.addExam);
  const removeExam = useStudyStore((s) => s.removeExam);

  const today = todayKey();
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const outlook = useMemo(
    () => buildOutlook({ today, hasCycleData, pastCycles, prediction, logs }),
    [today, hasCycleData, pastCycles, prediction, logs]
  );
  const marks = useMemo(() => dayMarks(outlook, today), [outlook, today]);
  const upcoming = exams.filter((e) => e.date >= today);
  const past = exams.filter((e) => e.date < today);
  const forecasts = useMemo(
    () => upcoming.map((e) => ({ exam: e, f: forecastExam(e.date, outlook, today) })),
    [upcoming, outlook, today]
  );
  const clashes = forecasts.filter(({ f }) => f.risk === 'heavy' || f.risk === 'period' || f.risk === 'pms').length;
  const preview = date ? forecastExam(date, outlook, today) : null;

  const save = () => {
    if (!subject.trim()) return setError('Add the subject or paper name.');
    if (!date) return setError('Pick the exam date on the calendar.');
    addExam(subject, date);
    setSubject('');
    setDate(null);
    setError('');
  };

  return (
    <Screen>
      <ScreenHeader
        title="Exam-cycle planner"
        subtitle="See which exams fall on heavy or PMS days, with a prep plan for each"
        badge="Study"
        fallbackHref="/study"
      />

      {!outlook ? (
        <Card tone="amber" style={{ marginBottom: 12 }}>
          <Text style={[uiStyles.strong, { color: themed('#92400E'), fontSize: 14 }]}>Add your period dates first</Text>
          <Text style={[uiStyles.body, { color: themed('#92400E'), marginTop: 4 }]}>
            Unnmegh predicts heavy and PMS days from your saved periods. You can still add exams now — they get checked as soon as you save
            your last period.
          </Text>
          <Button title="Log my last period" variant="secondary" onPress={() => router.push('/log-cycle')} style={{ marginTop: 12 }} />
        </Card>
      ) : upcoming.length ? (
        <Card tone={clashes ? 'rose' : 'mint'} style={{ marginBottom: 12 }}>
          <Text style={uiStyles.strong}>
            {clashes
              ? `${clashes} of ${upcoming.length} exam${upcoming.length === 1 ? '' : 's'} may fall on period or PMS days`
              : `None of your ${upcoming.length} exam${upcoming.length === 1 ? '' : 's'} clash with your predicted period`}
          </Text>
          <Text style={[uiStyles.muted, { marginTop: 4 }]}>
            {clashes ? 'Each one has a prep plan below — open it to see what to do and when.' : 'Keep logging your period so this stays accurate.'}
          </Text>
        </Card>
      ) : null}

      <SectionHeader title="Add an exam" subtitle={outlook ? 'Dots show your predicted period and PMS days' : undefined} />
      <Card>
        <TextInput
          value={subject}
          onChangeText={(t) => {
            setSubject(t);
            if (error) setError('');
          }}
          placeholder="Subject or paper, e.g. Maths final"
          placeholderTextColor={Theme.colors.textTertiary}
          style={uiStyles.input}
          accessibilityLabel="Exam subject"
          maxLength={60}
        />
        <View style={{ marginTop: 12 }}>
          <MonthPicker value={date} onChange={(d) => { setDate(d); if (error) setError(''); }} minDate={today} marks={outlook ? marks : undefined} />
        </View>
        {date && preview ? (
          <View style={[styles.preview, { backgroundColor: themed(RISK_STYLE[preview.risk].bg) }]}>
            <Text style={[styles.previewText, { color: themed(RISK_STYLE[preview.risk].ink) }]}>
              {weekdayLabel(date)}, {shortDateLabel(date)} · {preview.label}
            </Text>
          </View>
        ) : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          title="Add exam"
          variant="primary"
          icon={<CalendarPlus size={16} color={themed('#FFFFFF')} />}
          onPress={save}
          fullWidth
          style={{ marginTop: 12 }}
        />
      </Card>

      {forecasts.length ? <SectionHeader title="Your exams" subtitle="Tap one for its prep plan" /> : null}
      {forecasts.map(({ exam, f }) => {
        const rs = RISK_STYLE[f.risk];
        const isOpen = open === exam.id;
        const left = daysBetweenKeys(today, exam.date);
        const steps = isOpen ? prepPlan(exam.date, f, today) : [];
        return (
          <Card key={exam.id} style={{ marginBottom: 12 }}>
            <Pressable
              onPress={() => setOpen(isOpen ? null : exam.id)}
              style={styles.examHit}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen }}
              accessibilityLabel={`${exam.subject}, ${shortDateLabel(exam.date)}, ${f.label}`}
            >
              <View style={[uiStyles.row, { justifyContent: 'space-between', gap: 8 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.examTitle}>{exam.subject}</Text>
                  <Text style={uiStyles.muted}>
                    {weekdayLabel(exam.date)}, {shortDateLabel(exam.date)} · {left === 0 ? 'today' : left === 1 ? 'tomorrow' : `in ${left} days`}
                  </Text>
                </View>
                {isOpen ? <ChevronUp size={18} color={Theme.colors.textTertiary} /> : <ChevronDown size={18} color={Theme.colors.textTertiary} />}
              </View>
              <View style={[styles.badge, { backgroundColor: themed(rs.bg) }]}>
                <Text style={[styles.badgeText, { color: themed(rs.ink) }]}>{f.label}</Text>
              </View>
              <Text style={[uiStyles.body, { marginTop: 8 }]}>{f.detail}</Text>
            </Pressable>
            {isOpen ? (
              <View style={styles.plan}>
                <Text style={styles.planTitle}>PREP PLAN</Text>
                {steps.map((st, i) => (
                  <View key={i} style={styles.step}>
                    <Text style={styles.stepDate}>{st.date ? (st.date === today ? 'Today' : shortDateLabel(st.date)) : 'Tip'}</Text>
                    <Text style={styles.stepText}>{st.text}</Text>
                  </View>
                ))}
                <View style={[uiStyles.row, { gap: 12, marginTop: 12 }]}>
                  {f.risk === 'heavy' || f.risk === 'period' || f.risk === 'near' ? (
                    <Button title="Pad Care" variant="secondary" onPress={() => router.push(ROUTES.padCare)} style={{ flex: 1 }} />
                  ) : null}
                  <Button
                    variant="link"
                    title="Remove"
                    onPress={() => removeExam(exam.id)}
                    accessibilityLabel={`Delete ${exam.subject}`}
                    icon={<Trash2 size={20} color={Theme.colors.primaryDark} />}
                  />
                </View>
              </View>
            ) : null}
          </Card>
        );
      })}

      {past.length ? (
        <Button variant="link" title={`Clear ${past.length} past exam${past.length === 1 ? '' : 's'}`} onPress={() => past.forEach((e) => removeExam(e.id))} style={styles.clearPast} />
      ) : null}

      <Button variant="secondary" title="Need a leave note for class on a heavy day? Make one in a minute" onPress={() => router.push(ROUTES.leaveNote)} icon={<FileText size={20} color={Theme.colors.textPrimary} />} style={styles.leaveRow} />

      {outlook ? (
        <Text style={styles.footnote}>
          Estimates from your saved periods (cycle about {outlook.cycleLength} days, period about {outlook.periodLength} days
          {outlook.heavyFromLogs ? `, heavy on day ${outlook.heavyDays.join(' & ')} going by your flow logs` : '; heaviest days taken as day 1–2'}).
          {outlook.irregular ? ' Your cycles vary a lot, so treat these as rough. ' : ' '}
          Log your period when it starts to keep them accurate.
        </Text>
      ) : null}
    </Screen>
  );
}

const styles = createStyles(() => ({
  examHit: { minHeight: 44 },
  preview: { marginTop: 12, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  previewText: { fontSize: 14, fontWeight: '700' },
  error: { fontSize: 14, fontWeight: '700', color: Theme.colors.primaryDark, marginTop: 8 },
  examTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary },
  badge: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 4, marginTop: 8 },
  badgeText: { fontSize: 12, fontWeight: '800' },
  plan: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: Theme.colors.cardBorder },
  planTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1, color: Theme.colors.secondaryDark, marginBottom: 8 },
  step: { flexDirection: 'row', gap: 12, paddingVertical: 4 },
  stepDate: { width: 62, fontSize: 12, fontWeight: '800', color: Theme.colors.textPrimary },
  stepText: { flex: 1, fontSize: 12, lineHeight: 16, color: Theme.colors.textSecondary },
  deleteText: { fontSize: 14, fontWeight: '700', color: Theme.colors.textTertiary },
  clearPast: { alignSelf: 'center', paddingVertical: 8 },
  clearPastText: { fontSize: 14, fontWeight: '700', color: Theme.colors.textSecondary, textDecorationLine: 'underline' },
  leaveRow: { marginTop: 16 },
  leaveText: { flex: 1, fontSize: 14, fontWeight: '700', color: Theme.colors.secondaryDark },
  footnote: { fontSize: 12, lineHeight: 16, color: Theme.colors.textTertiary, marginTop: 16 },
}));
