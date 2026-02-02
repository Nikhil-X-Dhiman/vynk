import { get, set, del } from 'idb-keyval';

// Custom storage object to bridge Zustand and IndexedDB
// With SSR safety checks
const idbStorage = {
  getItem: async (name: string) => {
    if (typeof window === 'undefined') return null;
    const value = await get(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    if (typeof window === 'undefined') return;
    await set(name, value);
  },
  removeItem: async (name: string) => {
    if (typeof window === 'undefined') return;
    await del(name);
  },
};

export { idbStorage };
