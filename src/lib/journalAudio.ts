import { Platform } from 'react-native';

/**
 * Voice-journal recordings live in the app's private documents folder
 * (`journal/`), never in the cloud backup: only the file name is saved with
 * the entry. Sign-out deletes the folder. On the web nothing is kept.
 */
const DIR = 'journal';

async function journalDir() {
  const { Directory, Paths } = await import('expo-file-system');
  const dir = new Directory(Paths.document, DIR);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

/** Moves a finished recording into the journal folder and returns its new file name. */
export async function keepRecording(tempUri: string): Promise<string | null> {
  if (Platform.OS === 'web' || !tempUri) return null;
  const { File } = await import('expo-file-system');
  const dir = await journalDir();
  const ext = (tempUri.split('?')[0].match(/\.(wav|caf|m4a|aac|mp4|3gp|webm)$/i)?.[1] ?? 'm4a').toLowerCase();
  const name = `journal-${Date.now()}.${ext}`;
  const source = new File(tempUri);
  if (!source.exists) return null;
  await source.move(new File(dir, name));
  return name;
}

/** The playable URI for a saved recording, or null if it is not on this phone. */
export async function journalAudioUri(name?: string): Promise<string | null> {
  if (Platform.OS === 'web' || !name || /[\\/]/.test(name)) return null;
  const { File, Directory, Paths } = await import('expo-file-system');
  const file = new File(new Directory(Paths.document, DIR), name);
  return file.exists ? file.uri : null;
}

export async function deleteJournalAudio(name?: string): Promise<void> {
  if (Platform.OS === 'web' || !name || /[\\/]/.test(name)) return;
  const { File, Directory, Paths } = await import('expo-file-system');
  const file = new File(new Directory(Paths.document, DIR), name);
  if (file.exists) file.delete();
}

/** Removes a temporary recording she decided not to keep. */
export async function discardTempRecording(uri?: string | null): Promise<void> {
  if (Platform.OS === 'web' || !uri) return;
  try {
    const { File } = await import('expo-file-system');
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Already gone.
  }
}

export async function deleteAllJournalAudio(): Promise<void> {
  if (Platform.OS === 'web') return;
  const { Directory, Paths } = await import('expo-file-system');
  const dir = new Directory(Paths.document, DIR);
  if (dir.exists) dir.delete();
}
