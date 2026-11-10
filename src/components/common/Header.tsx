import React from 'react';
import { View, Text, Pressable, Image, Platform, Alert } from 'react-native';
import { Bell } from 'lucide-react-native';
import { Theme, createStyles } from '@/constants/theme';
import { router } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';

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
        <Pressable
          onPress={handleBellPress}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <Bell size={20} color={Theme.colors.textPrimary} />
          {hasCycleData && nextPrecaution ? <View style={styles.notificationDot} /> : null}
        </Pressable>
        <Pressable
          onPress={handleAvatarPress}
          style={({ pressed }) => [styles.avatarHalo, pressed && styles.pressed]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  leftCol: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: -0.5,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.cardBorder,
    ...Theme.shadows.soft,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Theme.colors.primary,
  },
  avatarHalo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2.5,
    backgroundColor: 'rgba(201, 87, 140, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  pressed: {
    opacity: 0.7,
  },
}));
