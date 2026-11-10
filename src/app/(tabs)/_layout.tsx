import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform } from 'react-native';
import { Home, Activity, Brain, FileText, User, Sparkles } from 'lucide-react-native';
import { Theme, createStyles, themed } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthGate } from '@/components/common/AuthGate';

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
          backgroundColor: themed('rgba(255, 255, 255, 0.92)'),
          borderTopWidth: 1,
          borderTopColor: themed('rgba(255, 226, 235, 0.7)'),
          height: Platform.OS === 'ios' ? 64 + insets.bottom : 68,
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
          ...(Platform.OS === 'web'
            ? ({
                width: '100%',
                maxWidth: 500,
                alignSelf: 'center',
                marginHorizontal: 'auto',
                left: 0,
                right: 0,
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
              } as any)
            : {}),
          ...Theme.shadows.soft,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 1,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconBg]}>
              <Home size={20} color={themed(color)} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="your-go-girl"
        options={{
          title: 'GoGirl',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconBg]}>
              <Sparkles size={20} color={themed(color)} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="move"
        options={{
          title: 'Move',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconBg]}>
              <Activity size={20} color={themed(color)} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="mind"
        options={{
          title: 'Mind',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconBg]}>
              <Brain size={20} color={themed(color)} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: 'Report',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconBg]}>
              <FileText size={20} color={themed(color)} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconBg]}>
              <User size={20} color={themed(color)} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />
    </Tabs>
    </AuthGate>
  );
}

const styles = createStyles(() => ({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 14,
  },
  activeIconBg: {
    backgroundColor: Theme.colors.primaryLight,
  },
}));
