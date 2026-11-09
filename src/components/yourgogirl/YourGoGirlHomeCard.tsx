import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MessageCircleHeart, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { Theme } from '@/constants/theme';
import { ROUTES } from '@/lib/routes';

/** Compact entry to the YourGoGirl chat on Home. */
export const YourGoGirlHomeCard: React.FC = () => (
  <View style={styles.wrapper}>
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={() => router.push(ROUTES.yourGoGirl)}
      accessibilityRole="button"
    >
      <View style={styles.iconCircle}>
        <MessageCircleHeart size={22} color={Theme.colors.primary} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>Talk to YourGoGirl</Text>
        <Text style={styles.subtitle}>Ask about periods, mood or focus — privately.</Text>
      </View>
      <ChevronRight size={18} color={Theme.colors.primary} />
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 20, marginTop: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FDF0F6',
    borderRadius: Theme.radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3C9DA',
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
  subtitle: { fontSize: 12.5, lineHeight: 17, color: Theme.colors.textSecondary, marginTop: 2 },
});
