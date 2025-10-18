import { describe, expect, it } from 'vitest';

import { describeConflictDifferences } from '../../features/segments/segments.persistence';
import type { SegmentsConflict } from '../../features/segments/segments.store';

const makeSegment = (id: string, overrides: Partial<SegmentsConflict['remoteSegments'][number]> = {}) => ({
  id,
  teamId: 'A',
  legNo: 1,
  type: 'bus' as const,
  fromCity: 'Lisbon',
  toCity: 'Porto',
  depTime: '2025-10-27T08:00:00Z',
  arrTime: '2025-10-27T10:00:00Z',
  orderIdx: 0,
  ...overrides,
});

describe('segments persistence conflict summary', () => {
  it('summarises additions, removals, and updates', () => {
    const conflict: SegmentsConflict = {
      remoteUpdatedAt: '2025-10-27T12:00:00Z',
      localUpdatedAt: '2025-10-27T11:00:00Z',
      remoteSegments: [
        makeSegment('seg-1', {
          depTime: '2025-10-27T09:00:00Z',
          arrTime: '2025-10-27T11:00:00Z',
        }),
        makeSegment('seg-2'),
      ],
      localSegments: [
        makeSegment('seg-1'),
        makeSegment('seg-3'),
      ],
    };

    const summary = describeConflictDifferences(conflict);
    expect(summary).toEqual([
      'Cloud updated bus Lisbon → Porto (time 27-10 @ 08:00→27-10 @ 09:00 / 27-10 @ 10:00→27-10 @ 11:00)',
      'Cloud added bus Lisbon → Porto (27-10 @ 08:00 → 27-10 @ 10:00)',
      'Cloud removed bus Lisbon → Porto (27-10 @ 08:00 → 27-10 @ 10:00)',
    ]);
  });
});
