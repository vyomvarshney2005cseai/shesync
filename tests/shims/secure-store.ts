const mem = new Map<string, string>();
export const WHEN_UNLOCKED_THIS_DEVICE_ONLY = 1;
export const getItemAsync = async (k: string) => mem.get(k) ?? null;
export const setItemAsync = async (k: string, v: string) => void mem.set(k, v);
export const deleteItemAsync = async (k: string) => void mem.delete(k);
export const __mem = mem;
