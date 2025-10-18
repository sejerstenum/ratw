import { beforeEach, describe, expect, it } from 'vitest';

import {
  fetchCloudSegmentsSnapshot,
  saveCloudSegmentsSnapshot,
  type CloudSegmentsSnapshot,
} from '../../features/segments/segments.api';

const createSnapshot = (updatedAt: string, suffix: string): CloudSegmentsSnapshot => ({
  updatedAt,
  segments: [
    {
      id: `seg-${suffix}`,
      teamId: 'A',
      legNo: 1,
      type: 'bus',
      fromCity: 'Lisbon',
      toCity: 'Porto',
      depTime: '2025-10-27T08:00:00Z',
      arrTime: '2025-10-27T11:00:00Z',
      orderIdx: 0,
    },
  ],
});

describe('cloud segments api', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
    }
  });

  it('saves and returns snapshots', async () => {
    const initial = createSnapshot('2025-10-27T00:00:00Z', 'a');
    const result = await saveCloudSegmentsSnapshot(initial);
    expect(result.ok).toBe(true);

    const fetched = await fetchCloudSegmentsSnapshot();
    expect(fetched).toEqual(initial);
  });

  it('detects conflicts when baseUpdatedAt is stale', async () => {
    const base = createSnapshot('2025-10-27T00:00:00Z', 'a');
    await saveCloudSegmentsSnapshot(base);

    const newer = createSnapshot('2025-10-27T01:00:00Z', 'b');
    await saveCloudSegmentsSnapshot(newer, { baseUpdatedAt: base.updatedAt });

    const stale = createSnapshot('2025-10-27T00:30:00Z', 'c');
    const result = await saveCloudSegmentsSnapshot(stale, { baseUpdatedAt: base.updatedAt });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.conflict.updatedAt).toBe(newer.updatedAt);
    }
  });
});
