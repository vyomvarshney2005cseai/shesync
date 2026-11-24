import React from 'react';
import { Tabs, type ErrorBoundaryProps } from 'expo-router';
import { Platform } from 'react-native';
import { TabIcon } from '@/components/icons/TabIcon';
import { Theme } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthGate } from '@/components/common/AuthGate';
import { FriendlyError } from '@/components/errors/FriendlyError';

/** A tab that throws shows a friendly screen with “Try again”. */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return <FriendlyError error={error} retry={retry} />;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <AuthGate>
    <Tabs
      detachInactiveScreens={true}
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: Theme.colors.card,
          borderTopWidth: 1,
          borderTopColor: Theme.colors.cardBorder,
          height: Platform.OS === 'ios' ? 64 + insets.bottom : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          ...(Platform.OS === 'web'
            ? ({
                width: '100%',
                maxWidth: 500,
                alignSelf: 'center',
                marginHorizontal: 'auto',
                left: 0,
                right: 0,
              } as any)
            : {}),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          lineHeight: 16,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <TabIcon name="home" color={String(color)} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="your-go-girl"
        options={{
          title: 'GoGirl',
          tabBarIcon: ({ color, focused }) => <TabIcon name="chat" color={String(color)} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="move"
        options={{
          title: 'Move',
          tabBarIcon: ({ color, focused }) => <TabIcon name="move" color={String(color)} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="mind"
        options={{
          title: 'Mind',
          tabBarIcon: ({ color, focused }) => <TabIcon name="lotus" color={String(color)} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ color, focused }) => <TabIcon name="report" color={String(color)} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon name="profile" color={String(color)} focused={focused} />,
        }}
      />
    </Tabs>
    </AuthGate>
  );
}

