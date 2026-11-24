import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Card, IconBadge } from '@/components/ds';
import { Theme, createStyles } from '@/constants/theme';
import { useAppStore } from '@/store/useAppStore';

/** For "try without an account": a quiet reminder that nothing is backed up yet. */
export function GuestBackupCard() {
  const isGuest = useAppStore((s) => s.isGuest);
  const logged = useAppStore((s) => s.symptomLogs.length + s.pastCycles.length);
  if (!isGuest) return null;
  return (
    <Card tone="lilac" onPress={() => router.push('/signup')} style={styles.card} accessibilityLabel="Create a free account to back up what you’ve logged">
      <View style={styles.row}>
        <IconBadge name="cloud" tone="lilac" size={44} />
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{logged ? 'Keep what you’ve logged' : 'Using SheSync without an account'}</Text>
          <Text style={styles.sub}>
            Everything is on this phone only. Create a free account to back it up — nothing you logged is lost.
          </Text>
        </View>
        <ChevronRight size={20} color={Theme.colors.textTertiary} />
      </View>
    </Card>
  );
}

const styles = createStyles(() => ({
  card: { marginHorizontal: Theme.space.md, marginTop: Theme.space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: Theme.space.sm },
  title: { ...Theme.type.label, fontSize: 16, lineHeight: 22, color: Theme.colors.textPrimary },
  sub: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, marginTop: 4 },
}));
