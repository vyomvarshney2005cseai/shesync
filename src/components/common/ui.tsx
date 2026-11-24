// Small shared building blocks for the wellness dashboards, on the design-system tokens.
import React from 'react';
import { Pressable, Text, View, ViewStyle } from 'react-native';
import { Theme, createStyles, themed, withAlpha } from '@/constants/theme';

export function SectionHeader({
  title,
  subtitle,
  right,
  style,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.sectionRow, style]}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

// One Card and one Chip for the whole app (see src/components/ds).
export { Card, Chip } from '@/components/ds';

export function ProgressBar({
  value,
  color = Theme.colors.primary,
  track = themed('rgba(201, 87, 140, 0.12)'),
  height = 8,
}: {
  value: number; // 0..1
  color?: string;
  track?: string;
  height?: number;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <View style={[styles.track, { backgroundColor: track, height, borderRadius: height / 2 }]}>
      <View style={{ width: `${pct}%`, height, borderRadius: height / 2, backgroundColor: color }} />
    </View>
  );
}

export function StatTile({
  label,
  value,
  hint,
  color = Theme.colors.textPrimary,
  icon,
  style,
}: {
  label: string;
  value: string;
  hint?: string;
  color?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.statTile, style]}>
      {icon ? <View style={styles.statIcon}>{icon}</View> : null}
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      {hint ? (
        <Text style={styles.statHint} numberOfLines={2}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

/** Seven small bars, e.g. minutes per day this week. */
export function MiniBars({
  values,
  labels,
  color = Theme.colors.primary,
  highlightLast = true,
  unit = '',
}: {
  values: number[];
  labels: string[];
  color?: string;
  highlightLast?: boolean;
  unit?: string;
}) {
  const max = Math.max(1, ...values);
  return (
    <View style={styles.barsRow} accessible accessibilityLabel={values.map((v, i) => `${labels[i]} ${v}${unit}`).join(', ')}>
      {values.map((v, i) => {
        const isLast = highlightLast && i === values.length - 1;
        return (
          <View key={`${labels[i]}-${i}`} style={styles.barCol}>
            <Text style={styles.barValue}>{v > 0 ? `${v}` : ''}</Text>
            <View style={styles.barTrack}>
              <View
                style={{
                  height: `${Math.max(v > 0 ? 8 : 0, (v / max) * 100)}%`,
                  width: '100%',
                  borderRadius: 8,
                  backgroundColor: isLast ? color : withAlpha(color, 0.53),
                }}
              />
            </View>
            <Text style={[styles.barLabel, isLast && { color, fontWeight: '800' }]}>{labels[i]}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function Stepper({
  value,
  onChange,
  min,
  max,
  step = 1,
  format = (v: number) => String(v),
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
  label: string;
}) {
  const dec = () => onChange(Math.max(min, Math.round((value - step) * 100) / 100));
  const inc = () => onChange(Math.min(max, Math.round((value + step) * 100) / 100));
  return (
    <View style={styles.stepper}>
      <Pressable onPress={dec} style={styles.stepBtn} accessibilityRole="button" accessibilityLabel={`Decrease ${label}`}>
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>
      <Text style={styles.stepValue} accessibilityLabel={`${label} ${format(value)}`}>
        {format(value)}
      </Text>
      <Pressable onPress={inc} style={styles.stepBtn} accessibilityRole="button" accessibilityLabel={`Increase ${label}`}>
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>
    </View>
  );
}

export const uiStyles = createStyles(() => ({
  row: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muted: { ...Theme.type.bodySm, color: Theme.colors.textSecondary },
  body: { ...Theme.type.bodySm, color: Theme.colors.textSecondary },
  strong: { fontSize: 16, lineHeight: 22, fontWeight: '800', color: Theme.colors.textPrimary },
  label: { ...Theme.type.caption, fontWeight: '800', letterSpacing: 0.8, color: Theme.colors.primaryDark, textTransform: 'uppercase' },
  input: {
    minHeight: 48,
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.borderStrong,
    borderRadius: Theme.radius.md,
    paddingHorizontal: Theme.space.md,
    paddingVertical: Theme.space.sm,
    fontSize: 16,
    color: Theme.colors.textPrimary,
  },
}));

const styles = createStyles(() => ({
  sectionRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: Theme.space.lg, marginBottom: Theme.space.sm, gap: Theme.space.xs },
  sectionTitle: { ...Theme.type.title, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -0.2 },
  sectionSubtitle: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, marginTop: Theme.space.xxs },
  track: { width: '100%', overflow: 'hidden' },
  statTile: {
    flex: 1,
    minWidth: 96,
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  statIcon: { marginBottom: 8 },
  statLabel: { fontSize: 12, fontWeight: '700', color: Theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6 },
  statValue: { fontSize: 20, fontWeight: '800', marginTop: 4, letterSpacing: -0.4 },
  statHint: { fontSize: 14, color: Theme.colors.textSecondary, marginTop: 4, lineHeight: 20 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 110, paddingTop: 4 },
  barCol: { flex: 1, alignItems: 'center', height: '100%' },
  barValue: { fontSize: 12, fontWeight: '700', color: Theme.colors.textTertiary, height: 13 },
  barTrack: {
    flex: 1,
    width: '70%',
    maxWidth: 26,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(201, 87, 140, 0.06)',
    borderRadius: 8,
  },
  barLabel: { fontSize: 12, fontWeight: '600', color: Theme.colors.textTertiary, marginTop: 4 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    overflow: 'hidden',
  },
  stepBtn: { width: Theme.touch, height: Theme.touch, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.colors.primaryLight },
  stepBtnText: { fontSize: 20, fontWeight: '800', color: Theme.colors.primaryDark },
  stepValue: { minWidth: 72, textAlign: 'center', fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary },
}));
