import React, { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { passwordStrength } from '@/lib/passwordStrength';
import { Button } from '@/components/ds';

/** A password input with its own show/hide button. */
export function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
  labelRight,
  ...rest
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  /** Shown at the end of the label row, e.g. a "Forgot?" link. */
  labelRight?: React.ReactNode;
} & Omit<TextInputProps, 'value' | 'onChangeText'>) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.group}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {labelRight}
      </View>
      <View style={styles.wrapper}>
        <Lock size={18} color={Theme.colors.textTertiary} style={styles.icon} />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={Theme.colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!show}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
          {...rest}
        />
        <Button
          variant="tertiary"
          size="sm"
          iconOnly
          onPress={() => setShow((s) => !s)}
          accessibilityLabel={show ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          icon={show ? <EyeOff size={20} color={Theme.colors.textSecondary} /> : <Eye size={20} color={Theme.colors.textSecondary} />}
          style={styles.eye}
        />
      </View>
    </View>
  );
}

const METER = ['#DC2626', '#F97316', '#EAB308', '#22C55E', '#15803D'];

/** Four-segment strength bar with a one-line tip. */
export function StrengthMeter({ password, personal }: { password: string; personal: string[] }) {
  if (!password) return null;
  const s = passwordStrength(password, personal);
  const color = themed(METER[s.score]);
  return (
    <View style={styles.meter} accessibilityLabel={`Password strength: ${s.label}. ${s.hint}`} accessibilityLiveRegion="polite">
      <View style={styles.bars}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.bar, { backgroundColor: i <= Math.max(1, s.score) && s.score > 0 ? color : themed('#E5E7EB') }]} />
        ))}
      </View>
      <Text style={styles.meterText}>
        <Text style={[styles.meterLabel, { color }]}>{s.label}</Text> · {s.hint}
      </Text>
    </View>
  );
}

const styles = createStyles(() => ({
  group: { gap: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, color: Theme.colors.textSecondary },
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8FA',
    borderRadius: Theme.radius.md,
    borderWidth: 1,
    borderColor: '#FFD7E3',
    paddingHorizontal: 12,
  },
  icon: { marginRight: 12 },
  input: { minHeight: 48, flex: 1, paddingVertical: 16, fontSize: 16, color: Theme.colors.textPrimary },
  eye: { padding: 8 },
  meter: { marginTop: -4 },
  bars: { flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 5, borderRadius: 3 },
  meterText: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary, marginTop: 8 },
  meterLabel: { fontWeight: '800' },
}));
