import React, { useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { Download, FileJson, FileSpreadsheet, FileText, Upload } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { Screen } from '@/components/common/Screen';
import { ScreenHeader } from '@/components/common/ScreenHeader';
import { AuthGate } from '@/components/common/AuthGate';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Card, SectionHeader } from '@/components/common/ui';
import { useAppStore } from '@/store/useAppStore';
import { applyLocal, getLocal } from '@/lib/sync';
import { pickTextFile, saveTextFile } from '@/lib/files';
import { shortDateLabel, todayKey } from '@/lib/dates';
import {
  buildBackup,
  describeImport,
  logsToCsv,
  parseImport,
  periodsToCsv,
  type ImportResult,
} from '@/lib/dataPortability';

type Pending = { name: string; result: ImportResult; summary: ReturnType<typeof describeImport> };

const SOURCE_NAME: Record<ImportResult['source'], string> = {
  shesync: 'SheSync backup',
  flo: 'Flo export',
  clue: 'Clue export',
  other: 'Tracker export',
};

/** Export everything she has logged, or bring data in from a backup, Flo or Clue. */
export default function DataScreen() {
  const generateClinicalPDF = useAppStore((s) => s.generateClinicalPDF);
  const isGenerating = useAppStore((s) => s.clinicalReport.isGenerating);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  const stamp = todayKey();

  const run = async (id: string, task: () => Promise<void>, done?: string) => {
    setBusy(id);
    setMessage(null);
    try {
      await task();
      if (done) setMessage({ text: done, ok: true });
    } catch (e) {
      setMessage({ text: e instanceof Error ? e.message : 'Something went wrong. Please try again.', ok: false });
    } finally {
      setBusy(null);
    }
  };

  const exportJson = () =>
    run('json', () => saveTextFile(`shesync-backup-${stamp}.json`, JSON.stringify(buildBackup(getLocal()), null, 2), 'application/json'),
      Platform.OS === 'web' ? 'Backup downloaded. Keep it somewhere private.' : undefined);

  const exportLogs = () =>
    run('logs', () => saveTextFile(`shesync-logs-${stamp}.csv`, logsToCsv(getLocal().logs), 'text/csv'),
      Platform.OS === 'web' ? 'Daily logs downloaded.' : undefined);

  const exportPeriods = () =>
    run('periods', () => saveTextFile(`shesync-periods-${stamp}.csv`, periodsToCsv(getLocal().cycles), 'text/csv'),
      Platform.OS === 'web' ? 'Periods downloaded.' : undefined);

  const choose = () =>
    run('pick', async () => {
      const file = await pickTextFile();
      if (!file) return;
      const result = parseImport(file.text, file.name);
      const summary = describeImport(getLocal(), result);
      if (!result.backup && result.periods.length === 0) {
        setPending(null);
        setMessage({ text: result.notes[0] ?? 'Nothing to import was found in this file.', ok: false });
        return;
      }
      setPending({ name: file.name, result, summary });
    });

  const confirmImport = () => {
    if (!pending) return;
    applyLocal(pending.summary.merged);
    const { newPeriods, newLogs } = pending.summary;
    setPending(null);
    setMessage({
      text:
        newPeriods || newLogs
          ? `Imported ${newPeriods} period${newPeriods === 1 ? '' : 's'}${newLogs ? ` and ${newLogs} log${newLogs === 1 ? '' : 's'}` : ''}. Your predictions are updated.`
          : 'Everything in this file was already in SheSync. Nothing changed.',
      ok: true,
    });
  };

  return (
    <AuthGate>
      <Screen>
        <ScreenHeader title="Your data" subtitle="Download a copy or bring data from another app" fallbackHref="/(tabs)/profile" />

        <SectionHeader title="Export" subtitle="Your files stay with you — SheSync doesn’t keep a copy." />
        <Card style={styles.gap}>
          <ExportRow
            icon={<FileJson size={18} color={Theme.colors.primaryDark} />}
            title="Full backup (JSON)"
            text="Everything: periods, logs, sleep, care team, PCOS, Confidence, Fitness, Study and Games. Restore it here on any phone."
            action="Save backup"
            loading={busy === 'json'}
            onPress={exportJson}
          />
          <View style={styles.divider} />
          <ExportRow
            icon={<FileSpreadsheet size={18} color={themed('#2F7D69')} />}
            title="Daily logs (CSV)"
            text="Mood, pain, flow and notes — opens in Excel or Google Sheets."
            action="Save logs"
            loading={busy === 'logs'}
            onPress={exportLogs}
          />
          <View style={styles.divider} />
          <ExportRow
            icon={<FileSpreadsheet size={18} color={themed('#4F8DBA')} />}
            title="Periods (CSV)"
            text="Start and end dates, period days and cycle length."
            action="Save periods"
            loading={busy === 'periods'}
            onPress={exportPeriods}
          />
          <View style={styles.divider} />
          <ExportRow
            icon={<FileText size={18} color={Theme.colors.secondaryDark} />}
            title="Doctor report (PDF)"
            text="Your last 90 days, ready for your gynaecologist."
            action="Create PDF"
            loading={isGenerating}
            onPress={() => generateClinicalPDF()}
          />
        </Card>

        <SectionHeader title="Import" subtitle="Adds to what you have. Nothing already in SheSync is replaced." />
        <Card style={styles.gap}>
          <Text style={styles.body}>Choose a SheSync backup, or the file you got from another tracker:</Text>
          <View style={styles.steps}>
            <Text style={styles.step}>
              <Text style={styles.stepBold}>Flo: </Text>Menu → Help → Contact us → ask for a data export. Choose the JSON file they send.
            </Text>
            <Text style={styles.step}>
              <Text style={styles.stepBold}>Clue: </Text>More → Settings → Download my data. Unzip the file, then choose the .json inside.
            </Text>
            <Text style={styles.step}>
              <Text style={styles.stepBold}>Other apps: </Text>any JSON or CSV export with period dates usually works.
            </Text>
          </View>
          <PrimaryButton
            title="Choose a file"
            variant="outline"
            icon={<Upload size={16} color={Theme.colors.textPrimary} />}
            loading={busy === 'pick'}
            onPress={choose}
            fullWidth
            style={{ marginTop: 12 }}
          />
        </Card>

        {pending ? (
          <Card tone="lilac" style={styles.gap}>
            <Text style={styles.kicker}>{SOURCE_NAME[pending.result.source]}</Text>
            <Text style={styles.cardTitle}>{pending.name}</Text>
            <Text style={styles.body}>
              Found {pending.summary.foundPeriods} period{pending.summary.foundPeriods === 1 ? '' : 's'}
              {pending.summary.from ? ` from ${shortDateLabel(pending.summary.from)} to ${shortDateLabel(pending.summary.to)}` : ''}.
            </Text>
            <Text style={[styles.body, { marginTop: 6 }]}>
              {pending.summary.newPeriods || pending.summary.newLogs
                ? `${pending.summary.newPeriods} new period${pending.summary.newPeriods === 1 ? '' : 's'}${pending.summary.newLogs ? ` and ${pending.summary.newLogs} new log${pending.summary.newLogs === 1 ? '' : 's'}` : ''} will be added.`
                : 'You already have all of these in SheSync.'}
            </Text>
            {pending.result.notes.map((n) => (
              <Text key={n} style={[styles.help, { marginTop: 6 }]}>
                {n}
              </Text>
            ))}
            <View style={styles.confirmRow}>
              <PrimaryButton title="Cancel" variant="outline" onPress={() => setPending(null)} style={{ flex: 1 }} />
              <PrimaryButton
                title={pending.summary.newPeriods || pending.summary.newLogs ? 'Import' : 'Done'}
                icon={<Download size={16} color={themed('#FFFFFF')} />}
                onPress={pending.summary.newPeriods || pending.summary.newLogs ? confirmImport : () => setPending(null)}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        ) : null}

        {message ? (
          <Card tone={message.ok ? 'mint' : 'amber'} style={styles.gap}>
            <Text style={styles.body}>{message.text}</Text>
          </Card>
        ) : null}

        <Text style={styles.note}>
          A backup contains private health information. Store it somewhere only you can open, and delete old copies you don’t need.
        </Text>
      </Screen>
    </AuthGate>
  );
}

function ExportRow(props: { icon: React.ReactNode; title: string; text: string; action: string; loading: boolean; onPress: () => void }) {
  return (
    <View style={styles.exportRow}>
      <View style={styles.exportIcon}>{props.icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>{props.title}</Text>
        <Text style={styles.help}>{props.text}</Text>
        <PrimaryButton title={props.action} variant="outline" loading={props.loading} onPress={props.onPress} style={styles.exportBtn} />
      </View>
    </View>
  );
}

const styles = createStyles(() => ({
  gap: { marginBottom: 14 },
  divider: { height: 1, backgroundColor: Theme.colors.cardBorder, marginVertical: 12 },
  exportRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  exportIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportBtn: { alignSelf: 'flex-start', paddingVertical: 9, marginTop: 10 },
  cardTitle: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 2 },
  kicker: { fontSize: 11, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', color: Theme.colors.secondaryDark, marginBottom: 4 },
  body: { fontSize: 13, lineHeight: 19, color: Theme.colors.textSecondary },
  help: { fontSize: 12, lineHeight: 17, color: Theme.colors.textSecondary },
  steps: { marginTop: 10, gap: 8 },
  step: { fontSize: 12.5, lineHeight: 18, color: Theme.colors.textSecondary },
  stepBold: { fontWeight: '800', color: Theme.colors.textPrimary },
  confirmRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  note: { fontSize: 12, lineHeight: 17, color: Theme.colors.textSecondary, marginBottom: 16, paddingHorizontal: 4 },
}));
