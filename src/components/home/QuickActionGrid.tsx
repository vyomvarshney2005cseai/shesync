import React from 'react';
import { View, Text } from 'react-native';
import { Theme, createStyles } from '@/constants/theme';
import { Card, IconBadge, type BadgeTone } from '@/components/ds';
import type { BrandIconName } from '@/components/icons/BrandIcon';

export type QuickActionId = 'mood' | 'pain' | 'flow' | 'cycle' | 'voice';

interface QuickActionGridProps {
  onAction?: (id: QuickActionId) => void;
}

const ACTIONS: { id: QuickActionId; label: string; icon: BrandIconName; tone: BadgeTone }[] = [
  { id: 'mood', label: 'Mood', icon: 'mood', tone: 'amber' },
  { id: 'pain', label: 'Pain', icon: 'pain', tone: 'peach' },
  { id: 'flow', label: 'Flow', icon: 'flow', tone: 'rose' },
  { id: 'cycle', label: 'Period', icon: 'calendar', tone: 'lilac' },
  { id: 'voice', label: 'Journal', icon: 'voice', tone: 'sky' },
];

/** One row of quick log buttons on Home. */
export const QuickActionGrid: React.FC<QuickActionGridProps> = ({ onAction }) => (
  <View style={styles.container}>
    <Text style={styles.sectionTitle} accessibilityRole="header">
      Quick log
    </Text>
    <View style={styles.row}>
      {ACTIONS.map(({ id, label, icon, tone }) => (
        <Card key={id} onPress={() => onAction?.(id)} accessibilityLabel={`Log ${label}`} padding="sm" style={styles.item}>
          <IconBadge name={icon} tone={tone} size={44} />
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
        </Card>
      ))}
    </View>
  </View>
);

const styles = createStyles(() => ({
  container: { paddingHorizontal: Theme.space.md, marginTop: Theme.space.lg },
  sectionTitle: { ...Theme.type.title, color: Theme.colors.textPrimary, marginBottom: Theme.space.sm },
  row: { flexDirection: 'row', gap: Theme.space.xs },
  item: { flex: 1, alignItems: 'center', gap: Theme.space.xs, paddingHorizontal: 0 },
  label: { ...Theme.type.label, color: Theme.colors.textPrimary },
}));
