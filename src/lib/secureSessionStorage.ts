/**
 * Where the Supabase sign-in session (access + refresh token) is kept.
 *
 * Phones: the Keychain / Android Keystore via expo-secure-store, never plain
 * AsyncStorage. Secure Store is meant for small values (about 2 KB), and a
 * session is larger, so it is split into numbered chunks:
 *   <key>.n  = number of chunks
 *   <key>.0, <key>.1 … = the pieces
 * A session saved by an older version in AsyncStorage is moved over the first
 * time it is read, then removed from AsyncStorage.
 *
 * Web has no secure store, so the browser's storage is used there.
 */

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface SecureStoreLike {
  getItemAsync(key: string, options?: object): Promise<string | null>;
  setItemAsync(key: string, value: string, options?: object): Promise<void>;
  deleteItemAsync(key: string, options?: object): Promise<void>;
}

/** Characters per chunk: stays well under Secure Store's ~2 KB guidance even for multi-byte text. */
export const CHUNK_SIZE = 1800;
/** A session never needs this many chunks; anything above is treated as corrupt. */
const MAX_CHUNKS = 64;

/** Secure Store keys may only use letters, digits, ".", "-" and "_". */
export const secureKey = (key: string) => key.replace(/[^A-Za-z0-9._-]/g, '_');

export function createSecureSessionStorage(
  secure: SecureStoreLike,
  legacy: KeyValueStore,
  options: object = {}
): KeyValueStore {
  const countKey = (k: string) => `${secureKey(k)}.n`;
  const partKey = (k: string, i: number) => `${secureKey(k)}.${i}`;

  async function readCount(key: string): Promise<number> {
    const raw = await secure.getItemAsync(countKey(key), options);
    const n = raw == null ? 0 : parseInt(raw, 10);
    return Number.isInteger(n) && n > 0 && n <= MAX_CHUNKS ? n : 0;
  }

  async function removeChunks(key: string, from: number, to: number): Promise<void> {
    for (let i = from; i < to; i++) await secure.deleteItemAsync(partKey(key, i), options);
  }

  async function write(key: string, value: string): Promise<void> {
    const parts: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) parts.push(value.slice(i, i + CHUNK_SIZE));
    if (!parts.length) parts.push('');
    if (parts.length > MAX_CHUNKS) throw new Error('Session is too large to store securely.');
    const before = await readCount(key);
    for (let i = 0; i < parts.length; i++) await secure.setItemAsync(partKey(key, i), parts[i], options);
    await secure.setItemAsync(countKey(key), String(parts.length), options);
    // A shorter session than last time: drop the leftover pieces.
    if (before > parts.length) await removeChunks(key, parts.length, before);
  }

  async function read(key: string): Promise<string | null> {
    const n = await readCount(key);
    if (!n) return null;
    let out = '';
    for (let i = 0; i < n; i++) {
      const part = await secure.getItemAsync(partKey(key, i), options);
      if (part == null) return null; // incomplete: treat as signed out
      out += part;
    }
    return out;
  }

  return {
    async getItem(key) {
      const stored = await read(key);
      if (stored != null) return stored;
      // Older versions kept the session in plain AsyncStorage: move it.
      const old = await legacy.getItem(key);
      if (old == null) return null;
      await write(key, old);
      await legacy.removeItem(key);
      return old;
    },
    async setItem(key, value) {
      await write(key, value);
      await legacy.removeItem(key).catch(() => {});
    },
    async removeItem(key) {
      const n = await readCount(key);
      await removeChunks(key, 0, n);
      await secure.deleteItemAsync(countKey(key), options);
      await legacy.removeItem(key).catch(() => {});
    },
  };
}
