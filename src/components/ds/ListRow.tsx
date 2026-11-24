import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { Theme, createStyles } from '@/constants/theme';
import { IconBadge, type BadgeTone } from './IconBadge';
import type { BrandIconName } from '@/components/icons/BrandIcon';
import { PressFeedbackContext, usePressFeedback } from './PressFeedback';
import { useNativeFocus, type PressState } from './interaction';
import { Card } from './Card';
import { ToggleTrack } from './ToggleTrack';

type IconProp = BrandIconName | React.ReactNode;

function Leading({ icon, tone }: { icon?: IconProp; tone?: BadgeTone }) {
  if (!icon) return null;
  if (typeof icon === 'string') return <IconBadge name={icon as BrandIconName} tone={tone} size={40} />;
  return <View style={styles.leading}>{icon}</View>;
}

/**
 * A settings-style row: icon, title, optional subtitle and value, chevron.
 * At least 56pt tall; pressable rows get hover, pressed and focus states.
 */
export function ListRow({
  icon,
  tone,
  title,
  subtitle,
  value,
  onPress,
  right,
  danger,
  chevron,
  testID,
  accessibilityLabel,
  accessibilityHint,
  style,
}: {
  icon?: IconProp;
  tone?: BadgeTone;
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  chevron?: boolean;
  testID?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const [signal, bump] = usePressFeedback();
  const [focused, focusHandlers] = useNativeFocus();
  const body = (
    <>
      <Leading icon={icon} tone={danger ? 'danger' : tone} />
      <View style={styles.text}>
        <Text style={[styles.title, danger && styles.danger]}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={styles.value}>{value}</Text> : null}
      {right}
      {(chevron ?? (!!onPress && !right)) ? <ChevronRight size={20} color={Theme.colors.textTertiary} /> : null}
    </>
  );
  if (!onPress) {
    return (
      <View style={[styles.row, style]} testID={testID} accessible accessibilityLabel={accessibilityLabel}>
        {body}
      </View>
    );
  }
  return (
    <PressFeedbackContext.Provider value={signal}>
      <Pressable
        onPress={onPress}
        onPressIn={bump}
        onHoverIn={bump}
        {...focusHandlers}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? (subtitle ? `${title}. ${subtitle}` : title)}
        accessibilityHint={accessibilityHint}
        testID={testID}
        style={(state: PressState) => [
          styles.row,
          state.hovered && styles.hovered,
          state.pressed && styles.pressed,
          focused && styles.focused,
          style,
        ]}
      >
        {body}
      </Pressable>
    </PressFeedbackContext.Provider>
  );
}

/** A row with a switch; the whole row toggles it. */
export function SwitchRow({
  icon,
  tone,
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
  testID,
  bare,
  accent,
  style,
}: {
  icon?: IconProp;
  tone?: BadgeTone;
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  testID?: string;
  /** Inside a card that already has padding: no background or side padding. */
  bare?: boolean;
  accent?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
}) {
  const [focused, focusHandlers] = useNativeFocus();
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      {...focusHandlers}
      accessibilityRole="switch"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      testID={testID}
      style={(state: PressState) => [
        styles.row,
        bare && styles.bare,
        state.hovered && styles.hovered,
        state.pressed && styles.pressed,
        focused && styles.focused,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Leading icon={icon} tone={tone} />
      <View style={styles.text}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <ToggleTrack value={value} accent={accent} />
    </Pressable>
  );
}

/** Rows grouped in one card, with hairline dividers between them. */
export function ListGroup({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <Card padding="none" style={style}>
      {items.map((child, i) => (
        <React.Fragment key={i}>
          {i > 0 ? <View style={styles.divider} /> : null}
          {child}
        </React.Fragment>
      ))}
    </Card>
  );
}

/** Small heading above a group of rows. */
export function GroupLabel({ children, icon, tone }: { children: string; icon?: BrandIconName; tone?: BadgeTone }) {
  return (
    <View style={styles.groupLabelRow}>
      {icon ? <IconBadge name={icon} tone={tone} size={32} /> : null}
      <Text style={styles.groupLabel} accessibilityRole="header">
        {children}
      </Text>
    </View>
  );
}

const styles = createStyles(() => ({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.space.sm,
    paddingHorizontal: Theme.space.md,
    paddingVertical: Theme.space.sm,
    backgroundColor: Theme.colors.card,
  },
  bare: { backgroundColor: 'transparent', paddingHorizontal: 0, borderRadius: Theme.radius.md },
  leading: { width: 40, alignItems: 'center' },
  text: { flex: 1, gap: 2 },
  title: { fontSize: 16, lineHeight: 22, fontWeight: '600', color: Theme.colors.textPrimary },
  subtitle: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary },
  value: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary, maxWidth: '40%', textAlign: 'right' },
  danger: { color: Theme.colors.danger },
  hovered: { backgroundColor: Theme.colors.backgroundAlt },
  pressed: { backgroundColor: Theme.colors.backgroundMuted },
  focused: { borderColor: Theme.colors.focusRing, borderWidth: 2, borderRadius: Theme.radius.md },
  disabled: { opacity: 0.55 },
  divider: { height: 1, backgroundColor: Theme.colors.cardBorderLight, marginLeft: 68 },
  groupLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.space.xs,
    marginTop: Theme.space.lg,
    marginBottom: Theme.space.xs,
    paddingHorizontal: Theme.space.xxs,
  },
  groupLabel: { fontSize: 18, lineHeight: 24, fontWeight: '800', color: Theme.colors.textPrimary },
}));
