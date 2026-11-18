import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';
import type { ExpoSpeechRecognitionModule as SpeechModuleType } from 'expo-speech-recognition';

/**
 * On-device speech-to-text for the voice journal (expo-speech-recognition:
 * Apple's Speech framework on iOS, Android's on-device SpeechRecognizer on
 * Android 13+). We always ask for on-device recognition, so the voice never
 * leaves the phone; if the phone can't do that, the journal records audio
 * only and she types.
 *
 * The module is loaded lazily: Expo Go does not include it, and the app must
 * still open there (the journal then records audio only).
 */
export type SpeechModule = typeof SpeechModuleType;

let cached: SpeechModule | null | undefined;

export async function loadSpeechModule(): Promise<SpeechModule | null> {
  if (cached !== undefined) return cached;
  if (Platform.OS === 'web' || !requireOptionalNativeModule('ExpoSpeechRecognition')) {
    cached = null;
    return cached;
  }
  try {
    cached = (await import('expo-speech-recognition')).ExpoSpeechRecognitionModule;
  } catch {
    cached = null;
  }
  return cached;
}

export type SpeechSupport =
  | { mode: 'speech'; needsModel: boolean }
  | { mode: 'audio'; reason: 'web' | 'not-in-build' | 'no-recognizer' | 'old-phone' | 'no-on-device' };

const ON_DEVICE_SERVICE = 'com.google.android.as';

/** Can this phone turn speech into text on the device while saving the audio? */
export async function getSpeechSupport(lang: string): Promise<SpeechSupport> {
  if (Platform.OS === 'web') return { mode: 'audio', reason: 'web' };
  const mod = await loadSpeechModule();
  if (!mod) return { mode: 'audio', reason: 'not-in-build' };
  try {
    if (!mod.isRecognitionAvailable()) return { mode: 'audio', reason: 'no-recognizer' };
    // Saving the recording while recognising needs Android 13+ (always fine on iOS 17+).
    if (!mod.supportsRecording()) return { mode: 'audio', reason: 'old-phone' };
    if (!mod.supportsOnDeviceRecognition()) return { mode: 'audio', reason: 'no-on-device' };
  } catch {
    return { mode: 'audio', reason: 'no-recognizer' };
  }
  if (Platform.OS !== 'android') return { mode: 'speech', needsModel: false };
  // Android needs the offline language pack for on-device recognition.
  try {
    const { installedLocales } = await mod.getSupportedLocales({ androidRecognitionServicePackage: ON_DEVICE_SERVICE });
    const base = lang.split('-')[0].toLowerCase();
    const has = installedLocales.some((l) => {
      const x = l.replace('_', '-').toLowerCase();
      return x === lang.toLowerCase() || x.split('-')[0] === base;
    });
    return { mode: 'speech', needsModel: !has };
  } catch {
    // Unknown: try it; a "language-not-supported" error will ask for the download.
    return { mode: 'speech', needsModel: false };
  }
}

/** Opens Android's download for the offline speech pack. */
export async function downloadSpeechPack(lang: string): Promise<'downloaded' | 'started' | 'failed'> {
  const mod = await loadSpeechModule();
  if (!mod || Platform.OS !== 'android') return 'failed';
  try {
    const r = await mod.androidTriggerOfflineModelDownload({ locale: lang });
    return r.status === 'download_success' ? 'downloaded' : 'started';
  } catch {
    return 'failed';
  }
}

/**
 * Joins recognised speech. In continuous mode each final result is a new
 * stretch of speech; some engines instead repeat everything so far, so a
 * final that starts with the text we already have replaces it.
 */
export function mergeFinal(committed: string, final: string): string {
  const a = committed.trim();
  const b = final.trim();
  if (!b) return a;
  if (!a) return b;
  if (b.toLowerCase().startsWith(a.toLowerCase())) return b;
  if (a.toLowerCase().endsWith(b.toLowerCase())) return a;
  return `${a} ${b}`;
}

/** What she sees while speaking: saved text plus the words still being recognised. */
export function liveText(committed: string, interim: string): string {
  const a = committed.trim();
  const b = interim.trim();
  if (!b) return a;
  if (!a) return b;
  return b.toLowerCase().startsWith(a.toLowerCase()) ? b : `${a} ${b}`;
}
