import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { toDateKey } from '@/lib/dates';
import { Button } from '@/components/ds';

export type DayMark = 'heavy' | 'period' | 'pms';

const MARK_COLOR: Record<DayMark, string> = { heavy: '#E11D48', period: '#F472B6', pms: '#F59E0B' };
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * A small month calendar for picking one date. Optional coloured dots show
 * predicted period, heavy and PMS days so she can see clashes while picking.
 */
export function MonthPicker({
  value,
  onChange,
  minDate,
  marks,
}: {
  value: string | null;
  onChange: (key: string) => void;
  minDate?: string;
  marks?: Record<string, DayMark>;
}) {
  const initial = value ? new Date(`${value}T00:00:00`) : new Date();
  const [month, setMonth] = useState(() => new Date(initial.getFullYear(), initial.getMonth(), 1));

  const year = month.getFullYear();
  const m = month.getMonth();
  const first = new Date(year, m, 1);
  const lead = (first.getDay() + 6) % 7; // Monday first
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const cells: (string | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toDateKey(new Date(year, m, d)));
  while (cells.length % 7) cells.push(null);

  const title = month.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const canGoBack = !minDate || toDateKey(new Date(year, m, 0)) >= minDate;

  return (
    <View>
      <View style={styles.header}>
        <Button
          variant="secondary"
          size="sm"
          iconOnly
          onPress={() => canGoBack && setMonth(new Date(year, m - 1, 1))}
          disabled={!canGoBack}
          accessibilityLabel="Previous month"
          icon={<ChevronLeft size={20} color={Theme.colors.textPrimary} />}
        />
        <Text style={styles.title}>{title}</Text>
        <Button variant="secondary" size="sm" iconOnly onPress={() => setMonth(new Date(year, m + 1, 1))} accessibilityLabel="Next month" icon={<ChevronRight size={20} color={Theme.colors.textPrimary} />} style={styles.nav} />
      </View>
      <View style={styles.row}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={styles.weekday}>
            {w}
          </Text>
        ))}
      </View>
      {Array.from({ length: cells.length / 7 }, (_, r) => (
        <View key={r} style={styles.row}>
          {cells.slice(r * 7, r * 7 + 7).map((key, i) => {
            if (!key) return <View key={i} style={styles.cell} />;
            const disabled = !!minDate && key < minDate;
            const selected = key === value;
            const mark = marks?.[key];
            return (
              <Pressable
                key={key}
                onPress={() => !disabled && onChange(key)}
                disabled={disabled}
                style={[styles.cell, selected && styles.cellSelected]}
                accessibilityRole="button"
                accessibilityState={{ selected, disabled }}
                accessibilityLabel={`${new Date(`${key}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })}${mark ? `, predicted ${mark === 'pms' ? 'PMS day' : mark === 'heavy' ? 'heavy period day' : 'period day'}` : ''}`}
              >
                <Text style={[styles.day, disabled && styles.dayDisabled, selected && styles.daySelected]}>{Number(key.slice(8))}</Text>
                {mark ? <View style={[styles.dot, { backgroundColor: themed(MARK_COLOR[mark]) }]} /> : <View style={styles.dotSpace} />}
              </Pressable>
            );
          })}
        </View>
      ))}
      {marks ? (
        <View style={styles.legend}>
          {(['heavy', 'period', 'pms'] as DayMark[]).map((k) => (
            <View key={k} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: themed(MARK_COLOR[k]) }]} />
              <Text style={styles.legendText}>{k === 'heavy' ? 'Heavy day' : k === 'period' ? 'Period' : 'PMS'}</Text>
            </View>
          ))}
          <Text style={styles.legendText}>· predicted</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = createStyles(() => ({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  nav: { width: 34 },
  title: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary },
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '700', color: Theme.colors.textTertiary, paddingVertical: 4 },
  cell: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingVertical: 4, borderRadius: 12 },
  cellSelected: { backgroundColor: Theme.colors.secondary },
  day: { fontSize: 14, fontWeight: '600', color: Theme.colors.textPrimary },
  dayDisabled: { color: Theme.colors.textTertiary, opacity: 0.5 },
  daySelected: { color: '#FFFFFF', fontWeight: '800' },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 4 },
  dotSpace: { width: 6, height: 6, marginTop: 4 },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { fontSize: 12, color: Theme.colors.textSecondary },
}));
