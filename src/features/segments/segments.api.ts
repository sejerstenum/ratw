import type { Segment } from './segments.types';

const envBaseUrl = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_BFF_URL : undefined;
const shouldUseMemoryFallback = typeof window === 'undefined' && !envBaseUrl;

const resolveBaseUrl = (): string => {
  if (envBaseUrl) {
    return envBaseUrl.replace(/\/$/, '');
  }
  return '/api';
};

const API_BASE_URL = resolveBaseUrl();

const buildUrl = (path: string): string => `${API_BASE_URL}${path}`;

const readErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  try {
    const text = await response.text();
    if (!text) {
      return fallback;
    }
    try {
      const data = JSON.parse(text) as { message?: string } | undefined;
      if (data && typeof data.message === 'string') {
        return data.message;
      }
    } catch (error) {
      console.warn('[segments.api] Failed to parse error payload', error);
    }
    return text;
  } catch (error) {
    console.warn('[segments.api] Failed to read error response', error);
    return fallback;
  }
};

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

export async function fetchCloudSegmentsSnapshot(): Promise<CloudSegmentsSnapshot | null> {
  if (shouldUseMemoryFallback) {
    return memorySnapshot;
  }

  try {
    const response = await fetch(buildUrl('/segments'), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const message = await readErrorMessage(response, 'Failed to fetch the latest segments snapshot.');
      throw new Error(message);
    }

    const payload = (await response.json()) as CloudSegmentsSnapshot;
    return payload;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Unable to reach the segments service.', { cause: error });
    }
    throw error;
  }
}

export async function saveCloudSegmentsSnapshot(
  snapshot: CloudSegmentsSnapshot,
  options: SaveSegmentsOptions = {},
): Promise<SaveSegmentsResult> {
  if (shouldUseMemoryFallback) {
    const base = options.baseUpdatedAt ?? null;
    if (!options.force && memorySnapshot && base && memorySnapshot.updatedAt !== base) {
      return { ok: false, conflict: memorySnapshot };
    }
    memorySnapshot = snapshot;
    return { ok: true, snapshot };
  }

  try {
    const response = await fetch(buildUrl('/segments'), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        ...snapshot,
        baseUpdatedAt: options.baseUpdatedAt ?? null,
        force: options.force ?? false,
      }),
    });

    if (response.status === 409) {
      const payload = (await response.json()) as SaveSegmentsConflict;
      return payload;
    }

    if (!response.ok) {
      const message = await readErrorMessage(response, 'Failed to save the segments snapshot.');
      throw new Error(message);
    }

    const payload = (await response.json()) as SaveSegmentsSuccess;
    return payload;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error('Unable to reach the segments service.', { cause: error });
    }
    throw error;
  }
}
