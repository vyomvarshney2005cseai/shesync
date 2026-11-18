import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { router, type Href } from 'expo-router';
import { Soup } from 'lucide-react-native';
import { Theme, createStyles } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';
import { DIGESTIVE_SYMPTOMS, summariseDigestive } from '@/lib/digestive';

/** Tummy symptoms in the last 30 days, and how many fell around her period. */
export function DigestiveCard() {
  const symptomLogs = useAppStore((s) => s.symptomLogs);
  const pastCycles = useAppStore((s) => s.pastCycles);
  const summary = useMemo(() => summariseDigestive(symptomLogs, pastCycles, 30), [symptomLogs, pastCycles]);
  const max = Math.max(1, ...Object.values(summary.bySymptom));

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Soup size={16} color={Theme.colors.peachDark} />
        <Text style={styles.title}>Tummy · last 30 days</Text>
      </View>
      {summary.days === 0 ? (
        <>
          <Text style={styles.empty}>
            Bloating, constipation, loose motions and nausea often come with periods. Tick them in the daily check-in to
            see your pattern here.
          </Text>
          <TouchableOpacity onPress={() => router.push('/check-in' as Href)} activeOpacity={0.8} style={styles.link}>
            <Text style={styles.linkText}>Open the 10-second check-in</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {DIGESTIVE_SYMPTOMS.map((d) => {
            const n = summary.bySymptom[d.id];
            return (
              <View key={d.id} style={styles.row}>
                <Text style={styles.label}>
                  {d.emoji} {d.label}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.bar, { width: `${(n / max) * 100}%` }]} />
                </View>
                <Text style={styles.count}>{n} d</Text>
              </View>
            );
          })}
          <Text style={styles.note}>
            {summary.nearPeriodDays} of {summary.days} logged day{summary.days === 1 ? '' : 's'}{' '}
            {summary.days === 1 ? 'was' : 'were'} during a period or in the 5 days before one.
          </Text>
        </>
      )}
    </View>
  );
}

const styles = createStyles(() => ({
  card: {
    marginTop: 16,
    padding: 16,
    borderRadius: Theme.radius.xl,
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    gap: 8,
    ...Theme.shadows.card,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary },
  empty: { fontSize: 13, lineHeight: 19, color: Theme.colors.textSecondary },
  link: { alignSelf: 'flex-start' },
  linkText: { fontSize: 13, fontWeight: '800', color: Theme.colors.primaryDark },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { width: 120, fontSize: 12.5, fontWeight: '700', color: Theme.colors.textPrimary },
  barTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: Theme.colors.backgroundMuted, overflow: 'hidden' },
  bar: { height: 8, borderRadius: 4, backgroundColor: Theme.colors.roseGold },
  count: { width: 34, textAlign: 'right', fontSize: 12, fontWeight: '700', color: Theme.colors.textSecondary },
  note: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 2 },
}));
