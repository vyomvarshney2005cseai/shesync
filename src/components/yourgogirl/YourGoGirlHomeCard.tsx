import React from 'react';
import { View, Text } from 'react-native';
import { MessageCircleHeart, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { Theme, createStyles } from '@/constants/theme';
import { ROUTES } from '@/lib/routes';
import { Card } from '@/components/ds';

/** Compact entry to the YourGoGirl chat on Home. */
export const YourGoGirlHomeCard: React.FC = () => (
  <View style={styles.wrapper}>
    <Card
      tone="rose"
      onPress={() => router.push(ROUTES.yourGoGirl)}
      style={styles.card}
    >
      <View style={styles.iconCircle}>
        <MessageCircleHeart size={22} color={Theme.colors.primary} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>Talk to YourGoGirl</Text>
        <Text style={styles.subtitle}>Ask about periods, mood or focus — privately.</Text>
      </View>
      <ChevronRight size={18} color={Theme.colors.primary} />
    </Card>
  </View>
);

const styles = createStyles(() => ({
  wrapper: { paddingHorizontal: 20, marginTop: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pressed: { opacity: 0.88 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  title: { fontSize: 16, fontWeight: '800', color: Theme.colors.textPrimary },
  subtitle: { fontSize: 14, lineHeight: 20, color: Theme.colors.textSecondary, marginTop: 4 },
}));
