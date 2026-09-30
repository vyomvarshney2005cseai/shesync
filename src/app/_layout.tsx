import "../global.css";
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet, Platform } from 'react-native';
import { Theme } from '@/constants/theme';
import { AdaptiveBackground } from '@/components/common/AdaptiveBackground';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AdaptiveBackground>
        <View style={styles.container}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: Theme.colors.background },
              animation: 'slide_from_right',
            }}
          >
          <Stack.Screen
            name="index"
            options={{
              headerShown: false,
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="login"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="signup"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="assessment"
            options={{
              headerShown: false,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen
            name="(tabs)"
            options={{
              headerShown: false,
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="log-cycle"
            options={{
              headerShown: false,
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="log-mood"
            options={{
              headerShown: false,
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="log-pain"
            options={{
              headerShown: false,
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="log-flow"
            options={{
              headerShown: false,
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="voice-journal"
            options={{
              headerShown: false,
              animation: 'slide_from_bottom',
            }}
          />
        </Stack>
      </View>
    </AdaptiveBackground>
  </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    width: '100%',
    ...(Platform.OS === 'web'
      ? ({
          maxWidth: 500,
          marginHorizontal: 'auto',
          alignSelf: 'center',
          boxShadow: '0 0 50px rgba(0, 0, 0, 0.08)',
          minHeight: '100vh',
          overflow: 'hidden',
        } as any)
      : {}),
  },
});
