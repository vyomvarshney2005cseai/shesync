import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import { createSecureSessionStorage } from './secureSessionStorage';
import { withTimeout } from './fetchWithTimeout';

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

/**
 * Sign-in tokens live in the Keychain / Keystore on phones (older sessions
 * in AsyncStorage are moved there on first read). The web has no secure
 * store, so the browser's storage is used.
 */
const authStorage =
  Platform.OS === 'web'
    ? AsyncStorage
    : createSecureSessionStorage(SecureStore, AsyncStorage, {
        // Readable after the first unlock so a background backup can still
        // refresh; never copied to another device or into a backup.
        keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      });

// A syntactically valid placeholder keeps the client constructible; every
// service call checks `isSupabaseConfigured` before touching the network.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://offline.invalid',
  isSupabaseConfigured ? supabaseAnonKey : 'offline-anon-key',
  {
    // A request that never answers would hold up every later backup.
    global: { fetch: withTimeout((input, init) => fetch(input, init)) },
    auth: {
      storage: authStorage,
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
