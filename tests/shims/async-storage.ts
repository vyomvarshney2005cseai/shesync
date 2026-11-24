const mem = new Map<string, string>();
const AsyncStorage = {
  getItem: async (k: string) => mem.get(k) ?? null,
  setItem: async (k: string, v: string) => void mem.set(k, v),
  removeItem: async (k: string) => void mem.delete(k),
  multiSet: async (e: [string, string][]) => e.forEach(([k, v]) => mem.set(k, v)),
};
export default AsyncStorage;
