import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Theme } from '@/constants/theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  /** Where the back arrow goes when there is no history (deep link / refresh). */
  fallbackHref?: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, badge, fallbackHref = '/(tabs)', right }: ScreenHeaderProps) {
  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(fallbackHref as any);
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={goBack}
        style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
      >
        <ChevronLeft size={22} color={Theme.colors.textPrimary} />
      </Pressable>
      <View style={styles.textCol}>
        {badge ? (
          <View style={styles.badge}>
            <Image source={require('@/../assets/images/shesync-logo.png')} style={styles.badgeLogo} resizeMode="contain" />
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
        <Text style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 12,
    paddingBottom: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.card,
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    ...Theme.shadows.soft,
  },
  pressed: { opacity: 0.7 },
  textCol: { flex: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 141, 0.2)',
    marginBottom: 6,
  },
  badgeLogo: { width: 14, height: 14, borderRadius: 3, marginRight: 6 },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: { fontSize: 24, fontWeight: '800', color: Theme.colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, fontWeight: '500', color: Theme.colors.textSecondary, marginTop: 2, lineHeight: 18 },
});
