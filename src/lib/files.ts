import { Platform } from 'react-native';
import { pauseAppLock } from '@/lib/appLock';

/**
 * Saving and picking text files.
 * Phone: writes to the app's cache and opens the share sheet (Files, Drive,
 * WhatsApp, email…). Web: a normal browser download / file chooser.
 */
export async function saveTextFile(name: string, text: string, mimeType: string): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return;
  }
  const { File, Directory, Paths } = await import('expo-file-system');
  const Sharing = await import('expo-sharing');
  // Exports hold her health data: keep only the newest one, in its own folder,
  // which is emptied again at the next launch and at sign-out.
  await clearExportCache();
  const dir = new Directory(Paths.cache, EXPORT_DIR);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  pauseAppLock(); // the share sheet is not "leaving" SheSync
  const file = new File(dir, safeFileName(name));
  file.create();
  await file.write(text);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
}

const EXPORT_DIR = 'exports';
const LEGACY_EXPORT = /^shesync-.*\.(json|csv|txt)$/i;

/** A plain file name: no folders, no hidden files. */
export function safeFileName(name: string): string {
  const clean = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/^\.+/, '').slice(0, 100);
  return clean || 'shesync-export.txt';
}

/** Deletes exported files left in the app's cache (no-op on the web). */
export async function clearExportCache(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const { Directory, File, Paths } = await import('expo-file-system');
    const dir = new Directory(Paths.cache, EXPORT_DIR);
    if (dir.exists) dir.delete();
    // Versions before 25 Nov 2026 saved exports straight into the cache folder.
    const cache = new Directory(Paths.cache);
    for (const item of cache.exists ? cache.list() : []) {
      if (item instanceof File && LEGACY_EXPORT.test(item.name)) item.delete();
    }
  } catch {
    // Nothing to remove.
  }
}

export interface PickedFile {
  name: string;
  text: string;
}

const MAX_BYTES = 25 * 1024 * 1024;

/** Lets her choose one file and returns its text, or null if she cancelled. */
export async function pickTextFile(): Promise<PickedFile | null> {
  if (Platform.OS === 'web') {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,.csv,.txt,.cluedata,application/json,text/csv,text/plain';
      input.style.display = 'none';
      input.onchange = () => {
        const f = input.files?.[0];
        input.remove();
        if (!f) return resolve(null);
        if (f.size > MAX_BYTES) return reject(new Error('That file is too large (over 25 MB).'));
        f.text().then((text) => resolve({ name: f.name, text }), reject);
      };
      input.addEventListener('cancel', () => {
        input.remove();
        resolve(null);
      });
      document.body.appendChild(input);
      input.click();
    });
  }
  const { File } = await import('expo-file-system');
  pauseAppLock(); // the file picker is not "leaving" SheSync
  const picked = await File.pickFileAsync({ mimeTypes: ['application/json', 'text/*', 'application/octet-stream'] });
  if (picked.canceled || !picked.result) return null;
  const file = picked.result;
  if ((file.size ?? 0) > MAX_BYTES) throw new Error('That file is too large (over 25 MB).');
  return { name: file.name, text: await file.text() };
}
