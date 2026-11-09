// Small shared building blocks for the wellness dashboards, styled to
// match SheSync's existing cards (rounded white glass, rose accents).
import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Theme } from '@/constants/theme';

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

export function Card({
  children,
  style,
  tone = 'default',
}: {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  tone?: 'default' | 'rose' | 'lilac' | 'dark' | 'mint' | 'amber';
}) {
  return <View style={[styles.card, toneStyles[tone], style as ViewStyle]}>{children}</View>;
}

const toneStyles = StyleSheet.create({
  default: { backgroundColor: Theme.colors.card, borderColor: Theme.colors.cardBorder },
  rose: { backgroundColor: '#FFF1F5', borderColor: 'rgba(255, 77, 141, 0.25)' },
  lilac: { backgroundColor: Theme.colors.secondaryLight, borderColor: Theme.colors.secondaryBorder },
  dark: { backgroundColor: Theme.colors.obsidian, borderColor: 'rgba(255,255,255,0.08)' },
  mint: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  amber: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
});

export function Chip({
  label,
  selected,
  onPress,
  color = Theme.colors.primary,
  small,
  accessibilityLabel,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
  small?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.chip,
        small && styles.chipSmall,
        selected && { backgroundColor: color, borderColor: color },
        pressed && { opacity: 0.8 },
      ]}
    >
      <Text style={[styles.chipText, small && styles.chipTextSmall, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function ProgressBar({
  value,
  color = Theme.colors.primary,
  track = 'rgba(255, 77, 141, 0.12)',
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
                  borderRadius: 6,
                  backgroundColor: isLast ? color : `${color}88`,
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

export const uiStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muted: { fontSize: 12, color: Theme.colors.textSecondary, lineHeight: 17 },
  body: { fontSize: 13, color: Theme.colors.textSecondary, lineHeight: 19 },
  strong: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary },
  label: { fontSize: 10, fontWeight: '800', letterSpacing: 1, color: Theme.colors.primary, textTransform: 'uppercase' },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    borderRadius: Theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: Theme.colors.textPrimary,
  },
});

const styles = StyleSheet.create({
  sectionRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 22, marginBottom: 10, gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 12, color: Theme.colors.textSecondary, marginTop: 2, lineHeight: 17 },
  card: {
    borderRadius: Theme.radius.xl,
    padding: 16,
    borderWidth: 1,
    ...Theme.shadows.card,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 12, fontWeight: '700', color: Theme.colors.textSecondary },
  chipTextSmall: { fontSize: 11 },
  chipTextSelected: { color: '#FFFFFF' },
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
  statIcon: { marginBottom: 6 },
  statLabel: { fontSize: 10, fontWeight: '700', color: Theme.colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.6 },
  statValue: { fontSize: 20, fontWeight: '900', marginTop: 2, letterSpacing: -0.4 },
  statHint: { fontSize: 11, color: Theme.colors.textSecondary, marginTop: 2, lineHeight: 15 },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 110, paddingTop: 4 },
  barCol: { flex: 1, alignItems: 'center', height: '100%' },
  barValue: { fontSize: 9, fontWeight: '700', color: Theme.colors.textTertiary, height: 13 },
  barTrack: {
    flex: 1,
    width: '70%',
    maxWidth: 26,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(255, 77, 141, 0.06)',
    borderRadius: 6,
  },
  barLabel: { fontSize: 10, fontWeight: '600', color: Theme.colors.textTertiary, marginTop: 4 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    overflow: 'hidden',
  },
  stepBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.colors.primaryLight },
  stepBtnText: { fontSize: 20, fontWeight: '800', color: Theme.colors.primary },
  stepValue: { minWidth: 70, textAlign: 'center', fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary },
});
