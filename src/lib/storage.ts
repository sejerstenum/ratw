import type { Segment } from '../features/segments/segments.types';

const DB_NAME = 'ratw-tracker';
const DB_VERSION = 1;
const STORE_NAME = 'kv';
const SEGMENTS_SNAPSHOT_KEY = 'segments:snapshot';
const SEGMENTS_OUTBOX_KEY = 'segments:outbox';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

let dbPromise: Promise<IDBDatabase> | null = null;
const memoryStore = new Map<string, string>();

const hasIndexedDb = () => typeof indexedDB !== 'undefined';

const resolveStorage = (): StorageLike | null => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage;
  }
  return null;
};

async function openDatabase(): Promise<IDBDatabase> {
  if (!hasIndexedDb()) {
    throw new Error('IndexedDB not available');
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onerror = () => {
        reject(request.error ?? new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        resolve(request.result);
      };
    });
  }

  return dbPromise;
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = () => reject(request.error ?? new Error('IndexedDB get failed'));
      request.onsuccess = () => {
        resolve((request.result as T | undefined) ?? null);
      };
    });
  } catch (error) {
    console.warn('[storage] Falling back from IndexedDB read', error);
    return null;
  }
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(value, key);

      request.onerror = () => reject(request.error ?? new Error('IndexedDB set failed'));
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.warn('[storage] Falling back from IndexedDB write', error);
    throw error;
  }
}

async function idbRemove(key: string): Promise<void> {
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.delete(key);

      request.onerror = () => reject(request.error ?? new Error('IndexedDB delete failed'));
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.warn('[storage] Falling back from IndexedDB delete', error);
    throw error;
  }
}

const memoryGet = <T,>(key: string): T | null => {
  const value = memoryStore.get(key);
  return value ? (JSON.parse(value) as T) : null;
};

const memorySet = <T,>(key: string, value: T): void => {
  memoryStore.set(key, JSON.stringify(value));
};

const memoryRemove = (key: string): void => {
  memoryStore.delete(key);
};

const storageGet = <T,>(key: string): T | null => {
  const storage = resolveStorage();
  if (!storage) {
    return memoryGet<T>(key);
  }
  const raw = storage.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn('[storage] Failed to parse stored value', error);
    return null;
  }
};

const storageSet = <T,>(key: string, value: T): void => {
  const storage = resolveStorage();
  const serialised = JSON.stringify(value);
  if (!storage) {
    memorySet(key, value);
    return;
  }
  storage.setItem(key, serialised);
};

const storageRemove = (key: string): void => {
  const storage = resolveStorage();
  if (!storage) {
    memoryRemove(key);
    return;
  }
  storage.removeItem(key);
};

export interface PersistedSegmentsSnapshot {
  segments: Segment[];
  updatedAt: string;
}

export interface PersistedOutboxEntry extends PersistedSegmentsSnapshot {
  queuedAt: string;
}

export async function readSegmentsSnapshot(): Promise<PersistedSegmentsSnapshot | null> {
  if (hasIndexedDb()) {
    const value = await idbGet<PersistedSegmentsSnapshot>(SEGMENTS_SNAPSHOT_KEY);
    if (value) {
      return value;
    }
  }
  return storageGet<PersistedSegmentsSnapshot>(SEGMENTS_SNAPSHOT_KEY);
}

export async function writeSegmentsSnapshot(snapshot: PersistedSegmentsSnapshot): Promise<void> {
  if (hasIndexedDb()) {
    try {
      await idbSet(SEGMENTS_SNAPSHOT_KEY, snapshot);
      return;
    } catch {
      // fall through to storage
    }
  }
  storageSet(SEGMENTS_SNAPSHOT_KEY, snapshot);
}

export async function readSegmentsOutbox(): Promise<PersistedOutboxEntry[]> {
  if (hasIndexedDb()) {
    const value = await idbGet<PersistedOutboxEntry[]>(SEGMENTS_OUTBOX_KEY);
    if (value) {
      return value;
    }
  }
  return storageGet<PersistedOutboxEntry[]>(SEGMENTS_OUTBOX_KEY) ?? [];
}

export async function writeSegmentsOutbox(entries: PersistedOutboxEntry[]): Promise<void> {
  if (entries.length === 0) {
    if (hasIndexedDb()) {
      try {
        await idbRemove(SEGMENTS_OUTBOX_KEY);
      } catch {
        // ignore and fall through
      }
    }
    storageRemove(SEGMENTS_OUTBOX_KEY);
    return;
  }

  if (hasIndexedDb()) {
    try {
      await idbSet(SEGMENTS_OUTBOX_KEY, entries);
      return;
    } catch {
      // fall back
    }
  }
  storageSet(SEGMENTS_OUTBOX_KEY, entries);
}
