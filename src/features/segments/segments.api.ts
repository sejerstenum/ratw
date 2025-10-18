import type { Segment } from './segments.types';

const CLOUD_STORAGE_KEY = 'ratw-cloud:segments';

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface CloudSegmentsSnapshot {
  segments: Segment[];
  updatedAt: string;
}

export interface SaveSegmentsOptions {
  baseUpdatedAt?: string | null;
  force?: boolean;
}

export interface SaveSegmentsSuccess {
  ok: true;
  snapshot: CloudSegmentsSnapshot;
}

export interface SaveSegmentsConflict {
  ok: false;
  conflict: CloudSegmentsSnapshot;
}

export type SaveSegmentsResult = SaveSegmentsSuccess | SaveSegmentsConflict;

let memorySnapshot: CloudSegmentsSnapshot | null = null;

const resolveStorage = (): StorageLike | null => {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    return window.localStorage;
  }
  return null;
};

const readFromStorage = (): CloudSegmentsSnapshot | null => {
  const storage = resolveStorage();
  if (!storage) {
    return memorySnapshot;
  }
  const raw = storage.getItem(CLOUD_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as CloudSegmentsSnapshot;
  } catch (error) {
    console.warn('[segments.api] Failed to parse cloud snapshot', error);
    return null;
  }
};

const writeToStorage = (snapshot: CloudSegmentsSnapshot) => {
  const storage = resolveStorage();
  const serialised = JSON.stringify(snapshot);
  if (!storage) {
    memorySnapshot = snapshot;
    return;
  }
  storage.setItem(CLOUD_STORAGE_KEY, serialised);
};

export async function fetchCloudSegmentsSnapshot(): Promise<CloudSegmentsSnapshot | null> {
  return readFromStorage();
}

export async function saveCloudSegmentsSnapshot(
  snapshot: CloudSegmentsSnapshot,
  options: SaveSegmentsOptions = {},
): Promise<SaveSegmentsResult> {
  const existing = readFromStorage();
  const base = options.baseUpdatedAt ?? null;

  if (!options.force && existing && base && existing.updatedAt !== base) {
    return { ok: false, conflict: existing };
  }

  writeToStorage(snapshot);
  return { ok: true, snapshot };
}
