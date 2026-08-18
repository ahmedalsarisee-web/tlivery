import {createMemoryKV, storage} from './mmkv';

export enum StorageType {
  DEFAULT = 'default',
  SECURE = 'secure',
}

const storageInstances: Record<StorageType, ReturnType<typeof createMemoryKV>> = {
  [StorageType.DEFAULT]: storage,
  [StorageType.SECURE]: createMemoryKV('secure'),
};

class GenericStorageService {
  private storage: ReturnType<typeof createMemoryKV>;

  constructor(type: StorageType = StorageType.DEFAULT) {
    this.storage = storageInstances[type];
  }

  setItem = <T>(key: string, value: T): void => {
    try {
      const storedValue =
        typeof value === 'string' ? value : JSON.stringify(value);
      this.storage.set(key, storedValue);
    } catch (error) {
      console.error(`Storage setItem error [${key}]:`, error);
    }
  };

  getItem = <T>(key: string): T | null => {
    try {
      const value = this.storage.getString(key);
      if (value === undefined || value === null) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      console.error(`Storage getItem error [${key}]:`, error);
      return null;
    }
  };

  removeItem = (key: string): void => {
    try {
      this.storage.remove(key);
    } catch (error) {
      console.error(`Storage removeItem error [${key}]:`, error);
    }
  };

  clearAll = (): void => {
    try {
      this.storage.clearAll();
    } catch (error) {
      console.error('Storage clearAll error:', error);
    }
  };

  contains = (key: string): boolean => {
    try {
      return this.storage.contains(key);
    } catch (error) {
      console.error(`Storage contains error [${key}]:`, error);
      return false;
    }
  };

  getAllKeys = (): string[] => {
    try {
      return this.storage.getAllKeys();
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  };
}

export const MMKVStorage = new GenericStorageService(StorageType.DEFAULT);
export const SecureStorage = new GenericStorageService(StorageType.SECURE);
