import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '').trim();

/**
 * True only when both Supabase env vars are present.
 *
 * Without them the app runs in on-device mode: accounts and health data stay
 * in local storage and nothing is sent to a server. Previously an empty URL
 * made `createClient` throw at import time, so a fresh clone without `.env`
 * crashed on launch.
 */
export const isSupabaseConfigured = supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY missing — running in on-device mode.'
  );
}

// A syntactically valid placeholder keeps the client constructible; every
// service call checks `isSupabaseConfigured` before touching the network.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://offline.invalid',
  isSupabaseConfigured ? supabaseAnonKey : 'offline-anon-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: isSupabaseConfigured,
      persistSession: isSupabaseConfigured,
      detectSessionInUrl: false,
    },
  }
);

// Refresh session in foreground for native platforms
if (isSupabaseConfigured && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
