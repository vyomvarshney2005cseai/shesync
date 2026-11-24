import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Copy, Share2 } from 'lucide-react-native';
import { AuthGate } from '@/components/common/AuthGate';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { Card, Chip, SectionHeader, Stepper, uiStyles } from '@/components/common/ui';
import { Button } from '@/components/ds';
import { MonthPicker } from '@/components/common/MonthPicker';
import { Theme, createStyles, themed } from '@/constants/theme';
import {
  RECIPIENTS,
  RECIPIENT_LABEL,
  REASON_LABEL,
  buildLeaveNote,
  type NoteLang,
  type NoteReason,
  type NoteRecipient,
} from '@/lib/leaveNote';
import { addDaysToKey, shortDateLabel, todayKey } from '@/lib/dates';
import { copyText, shareText } from '@/lib/shareText';
import { useAppStore } from '@/store/useAppStore';
import { useStudyStore } from '@/store/useStudyStore';

export default function LeaveNoteScreen() {
  return (
    <AuthGate>
      <LeaveNote />
    </AuthGate>
  );
}

function LeaveNote() {
  const userName = useAppStore((s) => s.userName);
  const daysUntilNext = useAppStore((s) => (s.cycle.hasCycleData ? s.cyclePrediction.daysUntilNextPeriod : undefined));
  const profile = useStudyStore((s) => s.noteProfile);
  const setProfile = useStudyStore((s) => s.setNoteProfile);

  const today = todayKey();
  const predicted = daysUntilNext != null && daysUntilNext > 1 && daysUntilNext <= 14 ? addDaysToKey(today, daysUntilNext) : null;
  const [to, setTo] = useState<NoteRecipient>(profile.level === 'school' ? 'class_teacher' : 'hod');
  const [reason, setReason] = useState<NoteReason>('unwell');
  const [lang, setLang] = useState<NoteLang>('en');
  const [name, setName] = useState(userName);
  const [from, setFrom] = useState(today);
  const [days, setDays] = useState(1);
  const [picking, setPicking] = useState(false);
  const [status, setStatus] = useState('');

  // The React Compiler memoises this; no manual useMemo needed.
  const note = buildLeaveNote({
    level: profile.level,
    to,
    reason,
    lang,
    name,
    classOrCourse: profile.classOrCourse,
    rollNo: profile.rollNo,
    institution: profile.institution,
    city: profile.city,
    from,
    to_: addDaysToKey(from, days - 1),
    today,
  });

  const fromChips: { key: string; label: string }[] = [
    { key: addDaysToKey(today, -1), label: 'Yesterday' },
    { key: today, label: 'Today' },
    { key: addDaysToKey(today, 1), label: 'Tomorrow' },
    ...(predicted ? [{ key: predicted, label: `Next period · ${shortDateLabel(predicted)}` }] : []),
  ];
  const customFrom = !fromChips.some((c) => c.key === from);

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(''), 2500);
  };

  return (
    <Screen>
      <ScreenHeader title="Leave note" subtitle="A polite application for school or college, ready to send" badge="Period care" />

      <Card>
        <Text style={uiStyles.label}>For</Text>
        <View style={[uiStyles.wrap, { marginTop: 8 }]}>
          {(['school', 'college'] as const).map((l) => (
            <Chip
              key={l}
              label={l === 'school' ? 'School' : 'College'}
              small
              selected={profile.level === l}
              onPress={() => {
                setProfile({ level: l });
                setTo(l === 'school' ? 'class_teacher' : 'hod');
              }}
            />
          ))}
        </View>
        <Text style={[uiStyles.label, { marginTop: 16 }]}>Addressed to</Text>
        <View style={[uiStyles.wrap, { marginTop: 8 }]}>
          {RECIPIENTS[profile.level].map((r) => (
            <Chip key={r} label={RECIPIENT_LABEL[profile.level][r]} small selected={to === r} onPress={() => setTo(r)} color={Theme.colors.secondary} />
          ))}
        </View>
        <Text style={[uiStyles.label, { marginTop: 16 }]}>Reason</Text>
        <View style={[uiStyles.wrap, { marginTop: 8 }]}>
          {(Object.keys(REASON_LABEL) as NoteReason[]).map((r) => (
            <Chip key={r} label={REASON_LABEL[r]} small selected={reason === r} onPress={() => setReason(r)} color={Theme.colors.secondary} />
          ))}
        </View>
        <Text style={[uiStyles.muted, { marginTop: 8 }]}>
          {reason === 'unwell' ? '“Unwell” is enough — you never owe anyone the details.' : 'Use this only if you are comfortable sharing it.'}
        </Text>
        <Text style={[uiStyles.label, { marginTop: 16 }]}>Language</Text>
        <View style={[uiStyles.wrap, { marginTop: 8 }]}>
          <Chip label="English" small selected={lang === 'en'} onPress={() => setLang('en')} />
          <Chip label="हिन्दी" small selected={lang === 'hi'} onPress={() => setLang('hi')} />
        </View>
      </Card>

      <SectionHeader title="Your details" subtitle="Saved on this phone for next time" />
      <Card>
        <Field label="Name" value={name} onChange={setName} placeholder="Your full name" />
        <Field
          label={profile.level === 'school' ? 'Class & section' : 'Course, year & section'}
          value={profile.classOrCourse}
          onChange={(v) => setProfile({ classOrCourse: v })}
          placeholder={profile.level === 'school' ? 'e.g. Class 10-B' : 'e.g. B.Tech CSE, 3rd year, Section E'}
        />
        <Field label="Roll no. (optional)" value={profile.rollNo} onChange={(v) => setProfile({ rollNo: v })} placeholder="e.g. 2301234" />
        <Field
          label={profile.level === 'school' ? 'School' : 'College'}
          value={profile.institution}
          onChange={(v) => setProfile({ institution: v })}
          placeholder={profile.level === 'school' ? 'School name' : 'College name'}
        />
        <Field label="City (optional)" value={profile.city} onChange={(v) => setProfile({ city: v })} placeholder="e.g. Ghaziabad" last />
      </Card>

      <SectionHeader title="Dates" />
      <Card>
        <Text style={uiStyles.label}>From</Text>
        <View style={[uiStyles.wrap, { marginTop: 8 }]}>
          {fromChips.map((c) => (
            <Chip
              key={c.key}
              label={c.label}
              small
              selected={from === c.key && !picking}
              onPress={() => {
                setFrom(c.key);
                setPicking(false);
              }}
            />
          ))}
          <Chip label={customFrom ? shortDateLabel(from) : 'Other date'} small selected={customFrom || picking} onPress={() => setPicking(!picking)} />
        </View>
        {picking ? (
          <View style={{ marginTop: 12 }}>
            <MonthPicker
              value={from}
              minDate={addDaysToKey(today, -30)}
              onChange={(d) => {
                setFrom(d);
                setPicking(false);
              }}
            />
          </View>
        ) : null}
        <View style={[uiStyles.row, { justifyContent: 'space-between', marginTop: 16 }]}>
          <Text style={uiStyles.strong}>Number of days</Text>
          <Stepper label="Number of days" value={days} onChange={setDays} min={1} max={7} format={(v) => `${v}`} />
        </View>
      </Card>

      <SectionHeader title="Your note" subtitle="Edit anything after you copy it" />
      <Card>
        <Text selectable style={styles.note} accessibilityLabel="Leave note text">
          {note.body}
        </Text>
        <View style={[uiStyles.row, { gap: 12, marginTop: 16 }]}>
          <Button
            title="Copy"
            variant="secondary"
            icon={<Copy size={15} color={Theme.colors.textPrimary} />}
            onPress={async () => flash((await copyText(note.body)) ? 'Copied — paste it into WhatsApp, email or a document.' : 'Could not copy on this device.')}
            style={{ flex: 1 }}
          />
          <Button
            title="Share"
            variant="primary"
            icon={<Share2 size={15} color={themed('#FFFFFF')} />}
            onPress={async () => {
              const r = await shareText(note.body, note.subject);
              if (r === 'copied') flash('Copied — paste it where you need it.');
              if (r === 'failed') flash('Could not share — try Copy instead.');
            }}
            style={{ flex: 1 }}
          />
        </View>
        {status ? <Text style={styles.status}>{status}</Text> : null}
      </Card>
    </Screen>
  );
}

function Field(props: { label: string; value: string; onChange: (v: string) => void; placeholder: string; last?: boolean }) {
  return (
    <View style={{ marginBottom: props.last ? 0 : 10 }}>
      <Text style={styles.fieldLabel}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChange}
        placeholder={props.placeholder}
        placeholderTextColor={Theme.colors.textTertiary}
        style={uiStyles.input}
        accessibilityLabel={props.label}
        maxLength={80}
      />
    </View>
  );
}

const styles = createStyles(() => ({
  fieldLabel: { fontSize: 14, fontWeight: '700', color: Theme.colors.textSecondary, marginBottom: 4 },
  note: {
    fontSize: 14,
    lineHeight: 20,
    color: Theme.colors.textPrimary,
    backgroundColor: Theme.colors.backgroundMuted,
    borderRadius: 12,
    padding: 16,
  },
  status: { fontSize: 14, fontWeight: '700', color: Theme.colors.secondaryDark, marginTop: 12, textAlign: 'center' },
}));
