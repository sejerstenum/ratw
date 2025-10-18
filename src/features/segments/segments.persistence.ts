import { useEffect } from 'react';

import { createAutosaveQueue } from '../../lib/autosave';
import {
  readSegmentsOutbox,
  readSegmentsSnapshot,
  writeSegmentsOutbox,
  writeSegmentsSnapshot,
  type PersistedOutboxEntry,
  type PersistedSegmentsSnapshot,
} from '../../lib/storage';
import { formatUtcDateTime } from '../../lib/time';
import {
  fetchCloudSegmentsSnapshot,
  saveCloudSegmentsSnapshot,
} from './segments.api';
import { type SegmentsConflict, useSegmentsStore } from './segments.store';
import type { Segment } from './segments.types';

interface AutosavePayload {
  segments: Segment[];
  updatedAt: string;
}

const AUTOSAVE_DELAY = 300;

const isOnline = () => (typeof navigator === 'undefined' ? true : navigator.onLine);

let suppressNextPersist = false;
let remoteCursor: string | null = null;

const autosaveQueue = createAutosaveQueue<AutosavePayload>({
  delay: AUTOSAVE_DELAY,
  onStatusChange: (status) => {
    switch (status) {
      case 'scheduled':
        useSegmentsStore.getState().setPersistenceState({ persistenceStatus: 'queued' });
        break;
      case 'saving':
        useSegmentsStore
          .getState()
          .setPersistenceState({ persistenceStatus: 'saving', syncError: null });
        break;
      case 'idle':
        useSegmentsStore.setState((state) => ({
          persistenceStatus: state.outboxSize > 0 ? state.persistenceStatus : 'saved',
        }));
        break;
      case 'error':
        useSegmentsStore
          .getState()
          .setPersistenceState({
            persistenceStatus: 'error',
            syncError: 'Failed to persist the latest changes.',
          });
        break;
      default:
        break;
    }
  },
  onFlush: async (payload) => {
    try {
      await writeSegmentsSnapshot(payload);
      const entry: PersistedOutboxEntry = {
        ...payload,
        queuedAt: payload.updatedAt,
      };
      await writeSegmentsOutbox([entry]);
      useSegmentsStore
        .getState()
        .setPersistenceState({ lastSavedAt: payload.updatedAt, outboxSize: 1, syncError: null });
      await syncOutbox();
    } catch (error) {
      useSegmentsStore
        .getState()
        .setPersistenceState({
          persistenceStatus: 'error',
          syncError: 'Unable to write to local storage.',
        });
      throw error;
    }
  },
});

async function syncOutbox(force = false): Promise<void> {
  const outbox = await readSegmentsOutbox();
  useSegmentsStore.getState().setPersistenceState({ outboxSize: outbox.length });

  if (outbox.length === 0) {
    useSegmentsStore.getState().setPersistenceState({ persistenceStatus: 'saved' });
    return;
  }

  if (!isOnline()) {
    useSegmentsStore
      .getState()
      .setPersistenceState({ persistenceStatus: 'offline' });
    return;
  }

  let latestSnapshot: PersistedSegmentsSnapshot | null = null;

  for (const entry of outbox) {
    const snapshot: PersistedSegmentsSnapshot = {
      segments: entry.segments,
      updatedAt: force ? new Date().toISOString() : entry.updatedAt,
    };

    const result = await saveCloudSegmentsSnapshot(snapshot, {
      baseUpdatedAt: remoteCursor,
      force,
    });

    if (!result.ok) {
      useSegmentsStore
        .getState()
        .setPersistenceState({
          persistenceStatus: 'error',
          syncError: 'Cloud changes detected while you were offline.',
        });
      useSegmentsStore
        .getState()
        .setConflict({
          remoteSegments: result.conflict.segments,
          remoteUpdatedAt: result.conflict.updatedAt,
          localUpdatedAt: entry.updatedAt,
          localSegments: useSegmentsStore.getState().segments,
        });
      return;
    }

    latestSnapshot = result.snapshot;
    remoteCursor = result.snapshot.updatedAt;
  }

  await writeSegmentsOutbox([]);
  if (latestSnapshot) {
    useSegmentsStore
      .getState()
      .setPersistenceState({
        lastSavedAt: latestSnapshot.updatedAt,
        persistenceStatus: 'saved',
        outboxSize: 0,
        syncError: null,
      });
  }
}

async function hydrateFromLocal(): Promise<PersistedSegmentsSnapshot | null> {
  const snapshot = await readSegmentsSnapshot();
  if (!snapshot) {
    return null;
  }

  suppressNextPersist = true;
  try {
    useSegmentsStore.getState().replaceSegments(snapshot.segments);
  } finally {
    suppressNextPersist = false;
  }

  useSegmentsStore
    .getState()
    .setPersistenceState({ lastSavedAt: snapshot.updatedAt, persistenceStatus: 'saved' });
  return snapshot;
}

async function hydrateFromCloud(
  localSnapshot: PersistedSegmentsSnapshot | null,
): Promise<void> {
  const remote = await fetchCloudSegmentsSnapshot();
  if (!remote) {
    return;
  }

  remoteCursor = remote.updatedAt;

  if (localSnapshot && localSnapshot.updatedAt >= remote.updatedAt) {
    return;
  }

  useSegmentsStore.getState().setConflict({
    remoteSegments: remote.segments,
    remoteUpdatedAt: remote.updatedAt,
    localUpdatedAt: localSnapshot?.updatedAt ?? null,
    localSegments: useSegmentsStore.getState().segments,
  });
  useSegmentsStore
    .getState()
    .setPersistenceState({
      persistenceStatus: 'error',
      syncError: 'Newer data is available from the cloud.',
    });
}

export function useSegmentsPersistence(): void {
  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;
    let ready = false;

    const initialise = async () => {
      try {
        const localSnapshot = await hydrateFromLocal();
        if (cancelled) {
          return;
        }

        const outbox = await readSegmentsOutbox();
        useSegmentsStore.getState().setPersistenceState({ outboxSize: outbox.length });

        await hydrateFromCloud(localSnapshot);
        if (cancelled) {
          return;
        }

        ready = true;

        unsub = useSegmentsStore.subscribe(
          (state) => state.segments,
          (segments) => {
            if (!ready || suppressNextPersist) {
              suppressNextPersist = false;
              return;
            }
            const payload: AutosavePayload = {
              segments,
              updatedAt: new Date().toISOString(),
            };
            autosaveQueue.schedule(payload);
          },
        );

        if (outbox.length > 0) {
          await syncOutbox();
        }
      } catch (error) {
        console.error('[segments.persistence] initialise failed', error);
        useSegmentsStore
          .getState()
          .setPersistenceState({
            persistenceStatus: 'error',
            syncError: 'Failed to initialise autosave.',
          });
      }
    };

    void initialise();

    const handleOnline = () => {
      void syncOutbox();
    };
    const handleOffline = () => {
      if (useSegmentsStore.getState().outboxSize > 0) {
        useSegmentsStore.getState().setPersistenceState({ persistenceStatus: 'offline' });
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    return () => {
      cancelled = true;
      unsub?.();
      autosaveQueue.cancel();
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);
}

export async function acceptRemoteSnapshot(): Promise<void> {
  const conflict = useSegmentsStore.getState().conflict;
  if (!conflict) {
    return;
  }

  const snapshot: PersistedSegmentsSnapshot = {
    segments: conflict.remoteSegments,
    updatedAt: conflict.remoteUpdatedAt,
  };

  suppressNextPersist = true;
  try {
    useSegmentsStore.getState().replaceSegments(snapshot.segments);
  } finally {
    suppressNextPersist = false;
  }

  await writeSegmentsSnapshot(snapshot);
  await writeSegmentsOutbox([]);
  remoteCursor = snapshot.updatedAt;

  useSegmentsStore.getState().setConflict(null);
  useSegmentsStore
    .getState()
    .setPersistenceState({
      lastSavedAt: snapshot.updatedAt,
      persistenceStatus: 'saved',
      outboxSize: 0,
      syncError: null,
    });
}

export async function keepLocalSnapshot(): Promise<void> {
  const conflict = useSegmentsStore.getState().conflict;
  if (!conflict) {
    return;
  }

  useSegmentsStore.getState().setConflict(null);
  useSegmentsStore.getState().setPersistenceState({ persistenceStatus: 'saving', syncError: null });

  const snapshot: PersistedSegmentsSnapshot = {
    segments: useSegmentsStore.getState().segments,
    updatedAt: new Date().toISOString(),
  };

  await writeSegmentsSnapshot(snapshot);
  await writeSegmentsOutbox([{ ...snapshot, queuedAt: snapshot.updatedAt }]);

  const result = await saveCloudSegmentsSnapshot(snapshot, { force: true });
  remoteCursor = result.snapshot.updatedAt;
  await writeSegmentsOutbox([]);

  useSegmentsStore
    .getState()
    .setPersistenceState({
      lastSavedAt: result.snapshot.updatedAt,
      persistenceStatus: 'saved',
      outboxSize: 0,
      syncError: null,
    });
}

export function describeConflictDifferences(
  conflict: SegmentsConflict,
  limit = 5,
): string[] {
  const remoteMap = new Map(conflict.remoteSegments.map((segment) => [segment.id, segment]));
  const localMap = new Map(conflict.localSegments.map((segment) => [segment.id, segment]));
  const summaries: string[] = [];

  for (const [id, remote] of remoteMap) {
    const local = localMap.get(id);
    if (!local) {
      summaries.push(
        `Cloud added ${remote.type} ${remote.fromCity} → ${remote.toCity} (${formatUtcDateTime(remote.depTime)} → ${formatUtcDateTime(remote.arrTime)})`,
      );
      continue;
    }

    const changes: string[] = [];
    if (remote.depTime !== local.depTime || remote.arrTime !== local.arrTime) {
      changes.push(
        `time ${formatUtcDateTime(local.depTime)}→${formatUtcDateTime(remote.depTime)} / ${formatUtcDateTime(local.arrTime)}→${formatUtcDateTime(remote.arrTime)}`,
      );
    }
    if (remote.orderIdx !== local.orderIdx) {
      changes.push(`position ${local.orderIdx + 1}→${remote.orderIdx + 1}`);
    }
    if (remote.type !== local.type) {
      changes.push(`type ${local.type}→${remote.type}`);
    }
    if (changes.length > 0) {
      summaries.push(
        `Cloud updated ${remote.type} ${remote.fromCity} → ${remote.toCity} (${changes.join('; ')})`,
      );
    }
  }

  for (const [id, local] of localMap) {
    if (!remoteMap.has(id)) {
      summaries.push(
        `Cloud removed ${local.type} ${local.fromCity} → ${local.toCity} (${formatUtcDateTime(local.depTime)} → ${formatUtcDateTime(local.arrTime)})`,
      );
    }
  }

  return summaries.slice(0, limit);
}
