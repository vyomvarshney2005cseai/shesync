import React from 'react';
import { Tabs } from 'expo-router';
import { View, Platform, StyleSheet } from 'react-native';
import { Home, Activity, Brain, FileText, User } from 'lucide-react-native';
import { Theme } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      detachInactiveScreens={true}
      screenOptions={{
        headerShown: false,
        freezeOnBlur: true,
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: Theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: 'rgba(255, 255, 255, 0.88)',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 226, 235, 0.7)',
          height: Platform.OS === 'ios' ? 64 + insets.bottom : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
          ...(Platform.OS === 'web'
            ? ({
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
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.iconContainer, focused && styles.activeIconBg]}>
              <Home size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
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
              <Activity size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
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
              <Brain size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
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
              <FileText size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
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
              <User size={22} color={color} strokeWidth={focused ? 2.4 : 1.8} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 16,
  },
  activeIconBg: {
    backgroundColor: Theme.colors.primaryLight,
  },
});
