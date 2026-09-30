import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Smile, Flame, Droplets, Mic } from 'lucide-react-native';
import { Theme } from '@/constants/theme';

interface QuickAction {
  id: string;
  label: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface QuickActionGridProps {
  onAction?: (id: string) => void;
}

const actions: QuickAction[] = [
  {
    id: 'mood',
    label: 'Log Mood',
    sub: 'Emotional State',
    icon: <Smile size={22} color={Theme.colors.primary} />,
    color: Theme.colors.primary,
    bgColor: '#FFF0F5',
  },
  {
    id: 'pain',
    label: 'Log Pain',
    sub: 'Pelvic & Cramps',
    icon: <Flame size={22} color={Theme.colors.strainHigh} />,
    color: Theme.colors.strainHigh,
    bgColor: '#FFF1F2',
  },
  {
    id: 'flow',
    label: 'Log Flow',
    sub: 'Menstrual Density',
    icon: <Droplets size={22} color={Theme.colors.secondary} />,
    color: Theme.colors.secondary,
    bgColor: Theme.colors.secondaryLight,
  },
  {
    id: 'voice',
    label: 'Voice Journal',
    sub: 'Audio Reflection',
    icon: <Mic size={22} color={Theme.colors.strainAmber} />,
    color: Theme.colors.strainAmber,
    bgColor: '#FEF3C7',
  },
];

export const QuickActionGrid: React.FC<QuickActionGridProps> = ({ onAction }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Quick Check-in</Text>
      <View style={styles.grid}>
        {actions.map((action) => (
          <Pressable
            key={action.id}
            onPress={() => onAction?.(action.id)}
            style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
          >
            <View style={[styles.iconWrap, { backgroundColor: action.bgColor }]}>
              {action.icon}
            </View>
            <Text style={styles.tileLabel}>{action.label}</Text>
            <Text style={styles.tileSub}>{action.sub}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: Theme.radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.soft,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  tileLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
  },
  tileSub: {
    fontSize: 11,
    fontWeight: '500',
    color: Theme.colors.textSecondary,
    marginTop: 1,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});
