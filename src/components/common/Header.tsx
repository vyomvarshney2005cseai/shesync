import React from 'react';
import { View, Text, Pressable, Image, Platform, Alert } from 'react-native';
import { Theme, createStyles } from '@/constants/theme';
import { router } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ds/Button';
import { BrandIcon } from '@/components/icons/BrandIcon';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onNotificationPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = "SheSync",
  subtitle = "",
  onNotificationPress,
}) => {
  const userName = useAppStore((s) => s.userName);
  const userPhoto = useAppStore((s) => s.userPhoto);
  const nextPrecaution = useAppStore((s) => s.cyclePrediction?.precautionMeasures?.[0]);
  const hasCycleData = useAppStore((s) => !!s.cycle.hasCycleData);
  const initial = (userName || 'S').charAt(0).toUpperCase();

  const handleAvatarPress = () => {
    router.push('/profile');
  };

  const handleBellPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      // Real, derived update: the next precaution from her own cycle prediction.
      const msg =
        hasCycleData && nextPrecaution
          ? `${nextPrecaution.title}\n\n${nextPrecaution.advice}`
          : 'No new updates. Add your period dates to get cycle precautions here.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Notifications', msg);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>

      <View style={styles.rightCol}>
        <View>
          <Button
            variant="secondary"
            size="sm"
            iconOnly
            onPress={handleBellPress}
            accessibilityLabel={hasCycleData && nextPrecaution ? 'Updates: 1 new' : 'Updates'}
            icon={<BrandIcon name="bell" size={22} color={Theme.colors.textPrimary} accent={Theme.colors.primary} />}
            style={styles.iconBtn}
          />
          {hasCycleData && nextPrecaution ? <View style={styles.notificationDot} pointerEvents="none" /> : null}
        </View>
        <Pressable
          onPress={handleAvatarPress}
          style={({ pressed }) => [styles.avatarHalo, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Profile and settings"
        >
          <View style={styles.avatarInner}>
            {userPhoto ? (
              <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{initial}</Text>
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = createStyles(() => ({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.space.md,
    paddingTop: Theme.space.sm,
    paddingBottom: Theme.space.md,
  },
  leftCol: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    ...Theme.type.h2,
    color: Theme.colors.textPrimary,
    letterSpacing: -0.4,
    flexShrink: 1,
  },
  subtitle: {
    ...Theme.type.bodySm,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: { borderRadius: Theme.radius.full, borderColor: Theme.colors.cardBorder },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Theme.colors.card,
    backgroundColor: Theme.colors.primary,
  },
  avatarHalo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 4,
    backgroundColor: Theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Theme.colors.onPrimary,
    fontWeight: '700',
    fontSize: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
  },
  pressed: {
    opacity: 0.7,
  },
}));
