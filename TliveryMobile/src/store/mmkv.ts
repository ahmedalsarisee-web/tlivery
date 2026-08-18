import AsyncStorage from '@react-native-async-storage/async-storage';

type MemoryKV = {
  getString: (key: string) => string | undefined;
  getBoolean: (key: string) => boolean | undefined;
  set: (key: string, value: string | boolean | number) => void;
  remove: (key: string) => void;
  contains: (key: string) => boolean;
  clearAll: () => void;
  getAllKeys: () => string[];
};

const stores = new Map<string, Map<string, string>>();

const persistKey = (id: string) => `@tlivery/kv/${id}`;

const persist = (id: string, memory: Map<string, string>) => {
  const payload = JSON.stringify(Object.fromEntries(memory));
  void AsyncStorage.setItem(persistKey(id), payload);
};

export function createMemoryKV(id: string): MemoryKV {
  const memory = stores.get(id) ?? new Map<string, string>();
  stores.set(id, memory);

  return {
    getString: key => memory.get(key),
    getBoolean: key => {
      const value = memory.get(key);
      if (value === undefined) {
        return undefined;
      }
      return value === 'true' || value === '1';
    },
    set: (key, value) => {
      memory.set(key, String(value));
      persist(id, memory);
    },
    remove: key => {
      memory.delete(key);
      persist(id, memory);
    },
    contains: key => memory.has(key),
    clearAll: () => {
      memory.clear();
      persist(id, memory);
    },
    getAllKeys: () => [...memory.keys()],
  };
}

export async function hydrateStorage(): Promise<void> {
  await Promise.all(
    [...stores.entries()].map(async ([id, memory]) => {
      const raw = await AsyncStorage.getItem(persistKey(id));
      if (!raw) {
        return;
      }
      try {
        const parsed = JSON.parse(raw) as Record<string, string>;
        Object.entries(parsed).forEach(([key, value]) => {
          if (typeof value === 'string') {
            memory.set(key, value);
          }
        });
      } catch {
        // Ignore corrupted local cache.
      }
    }),
  );
}

export const storage = createMemoryKV('app-storage');
