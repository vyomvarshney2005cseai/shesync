import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, Alert, Platform } from 'react-native';
import { Bell, LogOut } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { router } from 'expo-router';
import { useAppStore } from '@/store/useAppStore';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  onNotificationPress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title = "Good morning, Maya",
  subtitle = "Cycle Day 45 • Luteal Strain Phase",
  badge = "PCOS Adaptive Mode",
  onNotificationPress,
}) => {
  const userName = useAppStore((s) => s.userName);
  const userPhoto = useAppStore((s) => s.userPhoto);
  const initial = (userName || 'Maya').charAt(0).toUpperCase();

  const handleAvatarPress = () => {
    router.push('/profile');
  };

  const handleBellPress = () => {
    if (onNotificationPress) {
      onNotificationPress();
    } else {
      const msg = 'You have 1 new update: Your personalized PMDD Shield recommendations are ready.';
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
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Image
              source={require('@/../assets/images/shesync-logo.png')}
              style={styles.badgeLogo}
              resizeMode="contain"
            />
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <View style={styles.rightCol}>
        <Pressable
          onPress={handleBellPress}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
        >
          <Bell size={20} color={Theme.colors.textPrimary} />
          <View style={styles.notificationDot} />
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

const styles = StyleSheet.create({
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
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.radius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 141, 0.2)',
  },
  badgeLogo: {
    width: 14,
    height: 14,
    borderRadius: 3,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    backgroundColor: 'rgba(255, 77, 141, 0.15)',
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
});
