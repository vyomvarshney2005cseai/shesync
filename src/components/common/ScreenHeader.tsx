import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { Theme, createStyles } from '@/constants/theme';
import { Button } from '@/components/ds/Button';

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
      <Button
        variant="secondary"
        size="sm"
        iconOnly
        onPress={goBack}
        accessibilityLabel="Go back"
        icon={<ChevronLeft size={22} color={Theme.colors.textPrimary} />}
        style={styles.backBtn}
      />
      <View style={styles.textCol}>
        {badge ? (
          <Text style={styles.badgeText}>{badge}</Text>
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

const styles = createStyles(() => ({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingTop: 12,
    paddingBottom: 16,
  },
  backBtn: { borderRadius: Theme.radius.full, marginTop: 4, borderColor: Theme.colors.cardBorder },
  textCol: { flex: 1 },
  badgeText: { ...Theme.type.caption, fontWeight: '800', color: Theme.colors.primaryDark, letterSpacing: 0.6, marginBottom: 4 },
  title: { ...Theme.type.h2, color: Theme.colors.textPrimary, letterSpacing: -0.4 },
  subtitle: { ...Theme.type.bodySm, color: Theme.colors.textSecondary, marginTop: 4 },
}));
