import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Smile, Flame, Droplets, Mic, Calendar } from 'lucide-react-native';
import { Theme } from '@/constants/theme';

export type QuickActionId = 'mood' | 'pain' | 'flow' | 'cycle' | 'voice';

interface QuickActionGridProps {
  onAction?: (id: QuickActionId) => void;
}

const ACTIONS: { id: QuickActionId; label: string; Icon: typeof Smile; color: string; bg: string }[] = [
  { id: 'mood', label: 'Mood', Icon: Smile, color: Theme.colors.primary, bg: '#FDF0F6' },
  { id: 'pain', label: 'Pain', Icon: Flame, color: Theme.colors.strainHigh, bg: '#FCEFF2' },
  { id: 'flow', label: 'Flow', Icon: Droplets, color: Theme.colors.secondary, bg: Theme.colors.secondaryLight },
  { id: 'cycle', label: 'Period', Icon: Calendar, color: '#4F8DBA', bg: '#E9F2FA' },
  { id: 'voice', label: 'Journal', Icon: Mic, color: Theme.colors.strainAmber, bg: '#FFF4E3' },
];

/** One row of quick log buttons on Home. */
export const QuickActionGrid: React.FC<QuickActionGridProps> = ({ onAction }) => (
  <View style={styles.container}>
    <Text style={styles.sectionTitle}>Quick log</Text>
    <View style={styles.row}>
      {ACTIONS.map(({ id, label, Icon, color, bg }) => (
        <Pressable
          key={id}
          onPress={() => onAction?.(id)}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Log ${label}`}
        >
          <View style={[styles.iconWrap, { backgroundColor: bg }]}>
            <Icon size={22} color={color} />
          </View>
          <Text style={styles.label}>{label}</Text>
        </Pressable>
      ))}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, marginTop: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: Theme.colors.textPrimary, marginBottom: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: Theme.radius.xl,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
  },
  item: { flex: 1, alignItems: 'center', gap: 6 },
  iconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '700', color: Theme.colors.textPrimary },
  pressed: { opacity: 0.8, transform: [{ scale: 0.97 }] },
});
