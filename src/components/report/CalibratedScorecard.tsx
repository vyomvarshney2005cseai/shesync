import React from 'react';
import { View, Text } from 'react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

const STRAIN_COLOR: Record<string, string> = {
  severe: '#A33B55',
  high: Theme.colors.strainHigh,
  moderate: Theme.colors.strainAmber,
  low: Theme.colors.strainOptimal,
};

/** Report tab summary: latest logs, cycle outlook and points to raise with a doctor. */
export const CalibratedScorecard: React.FC = () => {
  const biometrics = useAppStore((s) => s.biometrics);
  const cycle = useAppStore((s) => s.cycle);
  const logs = useAppStore((s) => s.symptomLogs);
  const prediction = useAppStore((s) => s.cyclePrediction);

  const latestPain = logs.find((l) => l.pain !== undefined);
  const latestFlow = logs.find((l) => l.flow !== undefined);
  const latestMood = logs.find((l) => l.mood !== undefined);
  const painVal = latestPain?.pain;
  const flowVal = latestFlow?.flow;
  const moodVal = latestMood?.mood;

  const days = prediction?.daysUntilNextPeriod ?? 0;
  const countdown = days === 0 ? 'due today' : days < 0 ? `${Math.abs(days)} days late` : `in about ${days} days`;

  const tiles = [
    {
      label: 'Strain',
      value: `${biometrics.strainScore}/100`,
      hint: biometrics.strainLevel,
      color: STRAIN_COLOR[biometrics.strainLevel] ?? Theme.colors.textPrimary,
    },
    {
      label: 'Pain',
      value: painVal != null ? `${painVal}/10` : '—',
      hint: latestPain?.painLocation?.[0] ?? (painVal != null ? 'Logged' : 'Not logged'),
      color: (painVal ?? 0) >= 6 ? Theme.colors.strainHigh : Theme.colors.strainAmber,
    },
    {
      label: 'Flow',
      value: flowVal ?? '—',
      hint: flowVal && flowVal !== 'none' ? latestFlow?.flowColor ?? 'Logged' : flowVal ? 'No bleeding' : 'Not logged',
      color: Theme.colors.primary,
    },
    {
      label: 'Mood',
      value: moodVal != null ? `${moodVal}/5` : '—',
      hint: latestMood?.energy ? `${latestMood.energy} energy` : 'Not logged',
      color: Theme.colors.secondary,
    },
  ];

  const points: { label: string; text: string }[] = [];
  if (prediction) {
    points.push({
      label: 'Next period',
      text: `predicted ${prediction.nextPeriodDate} (${countdown}). Cycles look ${
        prediction.regularityStatus === 'regular' ? 'regular' : 'irregular'
      }, averaging ${prediction.predictedCycleLength} days.`,
    });
  }
  if ((painVal ?? 0) >= 6) {
    points.push({
      label: 'Strong period pain',
      text: `logged at ${painVal}/10. Ask whether tests such as an ultrasound are needed to look for causes like endometriosis or fibroids.`,
    });
  }
  if (flowVal === 'heavy' || flowVal === 'severe') {
    points.push({ label: 'Heavy flow', text: 'ask whether a blood count and ferritin (iron) test make sense.' });
  }
  if (moodVal != null && moodVal <= 2) {
    points.push({
      label: 'Low mood',
      text: `logged at ${moodVal}/5. If dips return before most periods, ask about PMS/PMDD support.`,
    });
  }
  points.push({
    label: 'Strain',
    text: `${biometrics.strainScore}/100 — a SheSync score from logged pain, flow, mood and sleep, not a lab reading.`,
  });

  return (
    <View style={styles.container}>
      <Text style={styles.cardTitle}>Latest logs</Text>
      <View style={styles.grid}>
        {tiles.map((t) => (
          <View key={t.label} style={styles.tile}>
            <Text style={styles.tileLabel}>{t.label}</Text>
            <Text style={[styles.tileValue, { color: themed(t.color) }]} numberOfLines={1}>
              {t.value}
            </Text>
            <Text style={styles.tileHint} numberOfLines={1}>
              {t.hint}
            </Text>
          </View>
        ))}
      </View>

      {prediction && cycle.hasCycleData ? (
        <View style={styles.section}>
          <Text style={styles.cardTitle}>Your cycle</Text>
          {prediction.cyclePhaseBreakdown ? (
            <Text style={styles.body}>
              <Text style={styles.bold}>{prediction.cyclePhaseBreakdown.phaseName}. </Text>
              {prediction.cyclePhaseBreakdown.phaseDescription}
            </Text>
          ) : null}
          <Text style={[styles.body, { marginTop: 6 }]}>
            Next period <Text style={styles.bold}>{prediction.nextPeriodDate}</Text> — {countdown}.
          </Text>
          {prediction.precautionMeasures?.slice(0, 3).map((p) => (
            <View key={p.id} style={styles.precaution}>
              <View style={[styles.dot, p.urgency === 'high' && styles.dotHigh]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.precautionTitle}>{p.title}</Text>
                <Text style={styles.precautionText}>{p.advice}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.cardTitle}>Points for your doctor</Text>
        {points.map((p) => (
          <View key={p.label} style={styles.point}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.pointText}>
              <Text style={styles.bold}>{p.label}:</Text> {p.text}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = createStyles(() => ({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.xl,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.card,
  },
  cardTitle: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: {
    width: '48.5%',
    flexGrow: 1,
    backgroundColor: Theme.colors.backgroundAlt,
    borderRadius: Theme.radius.md,
    padding: 12,
  },
  tileLabel: { fontSize: 12, fontWeight: '700', color: Theme.colors.textSecondary },
  tileValue: { fontSize: 20, fontWeight: '800', marginTop: 2, textTransform: 'capitalize' },
  tileHint: { fontSize: 11.5, color: Theme.colors.textTertiary, marginTop: 1, textTransform: 'capitalize' },
  section: { marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: Theme.colors.backgroundMuted },
  body: { fontSize: 13.5, lineHeight: 20, color: Theme.colors.textSecondary },
  bold: { fontWeight: '800', color: Theme.colors.textPrimary },
  precaution: { flexDirection: 'row', gap: 10, marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Theme.colors.secondary, marginTop: 6 },
  dotHigh: { backgroundColor: Theme.colors.primary },
  precautionTitle: { fontSize: 13.5, fontWeight: '700', color: Theme.colors.textPrimary },
  precautionText: { fontSize: 12.5, lineHeight: 18, color: Theme.colors.textSecondary, marginTop: 1 },
  point: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  bullet: { fontSize: 14, color: Theme.colors.primary, lineHeight: 19 },
  pointText: { flex: 1, fontSize: 13, lineHeight: 19, color: Theme.colors.textSecondary },
}));
