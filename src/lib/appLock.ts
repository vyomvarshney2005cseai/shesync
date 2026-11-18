import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLockStore } from '@/store/useLockStore';

/**
 * App lock: PIN plus optional fingerprint / Face ID (expo-local-authentication).
 *
 * The PIN is stored only as a salted SHA-256 hash in the phone's secure
 * storage (Keychain / Android Keystore via expo-secure-store; plain storage on
 * the web, where there is no secure store). Wrong guesses are rate-limited in
 * useLockStore.
 */
const PIN_KEY = 'shesync.applock.pin';
const ROUNDS = 400;

interface StoredPin {
  v: 1;
  salt: string;
  hash: string;
}

// ─── Storage ────────────────────────────────────────────────
async function readSecret(): Promise<string | null> {
  if (Platform.OS === 'web') return AsyncStorage.getItem(PIN_KEY);
  const SecureStore = await import('expo-secure-store');
  return SecureStore.getItemAsync(PIN_KEY);
}

async function writeSecret(value: string): Promise<void> {
  if (Platform.OS === 'web') return AsyncStorage.setItem(PIN_KEY, value);
  const SecureStore = await import('expo-secure-store');
  await SecureStore.setItemAsync(PIN_KEY, value, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
}

async function deleteSecret(): Promise<void> {
  if (Platform.OS === 'web') return AsyncStorage.removeItem(PIN_KEY);
  const SecureStore = await import('expo-secure-store');
  await SecureStore.deleteItemAsync(PIN_KEY);
}

// ─── Hashing ────────────────────────────────────────────────
async function hashPin(pin: string, salt: string): Promise<string> {
  const Crypto = await import('expo-crypto');
  let h = `${salt}:${pin}`;
  for (let i = 0; i < ROUNDS; i++) {
    h = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${h}:${salt}`);
  }
  return h;
}

async function newSalt(): Promise<string> {
  const Crypto = await import('expo-crypto');
  return Array.from(Crypto.getRandomBytes(16), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Compares without stopping at the first different character. */
function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const isValidPin = (pin: string) => /^\d{4}$|^\d{6}$/.test(pin);

/** Saves a new PIN and turns the lock on. */
export async function enableAppLock(pin: string, biometrics: boolean): Promise<void> {
  if (!isValidPin(pin)) throw new Error('PIN must be 4 or 6 digits.');
  const salt = await newSalt();
  const stored: StoredPin = { v: 1, salt, hash: await hashPin(pin, salt) };
  await writeSecret(JSON.stringify(stored));
  useLockStore.getState().turnOn(pin.length === 6 ? 6 : 4, biometrics);
}

export async function verifyPin(pin: string): Promise<boolean> {
  try {
    const raw = await readSecret();
    if (!raw) return false;
    const stored = JSON.parse(raw) as StoredPin;
    return sameText(await hashPin(pin, stored.salt), stored.hash);
  } catch {
    return false;
  }
}

/** Turns the lock off and forgets the PIN (also used at sign-out). */
export async function disableAppLock(): Promise<void> {
  useLockStore.getState().turnOff();
  await deleteSecret().catch(() => {});
}

// ─── Fingerprint / Face ID ──────────────────────────────────
export interface BiometricInfo {
  /** Hardware present and at least one fingerprint/face enrolled. */
  ready: boolean;
  /** Hardware present but nothing enrolled in phone settings. */
  notEnrolled: boolean;
  label: string;
}

export async function getBiometricInfo(): Promise<BiometricInfo> {
  const none = { ready: false, notEnrolled: false, label: 'Fingerprint' };
  if (Platform.OS === 'web') return none;
  try {
    const LA = await import('expo-local-authentication');
    const [hardware, enrolled, types] = await Promise.all([
      LA.hasHardwareAsync(),
      LA.isEnrolledAsync(),
      LA.supportedAuthenticationTypesAsync(),
    ]);
    const face = types.includes(LA.AuthenticationType.FACIAL_RECOGNITION);
    const finger = types.includes(LA.AuthenticationType.FINGERPRINT);
    const label =
      Platform.OS === 'ios' ? (face ? 'Face ID' : 'Touch ID') : finger ? 'Fingerprint' : face ? 'Face unlock' : 'Fingerprint';
    return { ready: hardware && enrolled, notEnrolled: hardware && !enrolled, label };
  } catch {
    return none;
  }
}

/** Shows the system fingerprint / Face ID prompt. Never falls back to the phone passcode. */
export async function authenticateWithBiometrics(promptMessage = 'Unlock SheSync'): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const LA = await import('expo-local-authentication');
    pauseAppLock(30_000); // the system prompt can briefly send the app to the background
    const result = await LA.authenticateAsync({
      promptMessage,
      cancelLabel: 'Use PIN',
      disableDeviceFallback: true,
      fallbackLabel: '',
    });
    return result.success;
  } catch {
    return false;
  }
}

// ─── Leaving the app on purpose ─────────────────────────────
let pausedUntil = 0;

/**
 * Pickers, the share sheet and permission prompts briefly put SheSync in the
 * background. Call this just before opening one so it does not count as
 * leaving the app.
 */
export function pauseAppLock(ms = 120_000): void {
  pausedUntil = Date.now() + ms;
}

export function resumeAppLock(): void {
  pausedUntil = 0;
}

export function isAppLockPaused(): boolean {
  return Date.now() < pausedUntil;
}
