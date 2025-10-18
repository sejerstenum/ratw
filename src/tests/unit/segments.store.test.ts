import { describe, expect, it, beforeEach } from 'vitest';

import { SAMPLE_SEGMENTS } from '../../features/segments/sampleSegments';
import { selectSegments, useSegmentsStore } from '../../features/segments/segments.store';
import type { SegmentInput } from '../../features/segments/segments.types';

const readSegments = () => selectSegments(useSegmentsStore.getState());

describe('segments store', () => {
  beforeEach(() => {
    useSegmentsStore.getState().reset();
  });

  it('adds a new segment and assigns an order index at the end of the group', () => {
    const before = readSegments().filter((segment) => segment.teamId === 'A');
    const payload: SegmentInput = {
      teamId: 'A',
      legNo: 1,
      type: 'bus',
      fromCity: 'Lisbon',
      toCity: 'Santarém',
      depTime: '2025-10-28T07:00:00Z',
      arrTime: '2025-10-28T09:00:00Z',
      notes: 'Sprint to checkpoint',
    };

    const created = useSegmentsStore.getState().addSegment(payload);

    const after = readSegments().filter((segment) => segment.teamId === 'A');
    expect(after).toHaveLength(before.length + 1);
    expect(created.orderIdx).toBe(after.length - 1);
    expect(after[after.length - 1]?.id).toBe(created.id);
  });

  it('updates segment times and reorders affected group', () => {
    const [firstB, secondB] = readSegments()
      .filter((segment) => segment.teamId === 'B')
      .sort((a, b) => a.orderIdx - b.orderIdx);
    expect(firstB.orderIdx).toBe(0);
    expect(secondB.orderIdx).toBe(1);

    useSegmentsStore
      .getState()
      .updateSegment(secondB.id, { depTime: '2025-10-27T06:00:00Z', arrTime: '2025-10-27T07:00:00Z' });

    const [updatedFirst, updatedSecond] = readSegments()
      .filter((segment) => segment.teamId === 'B')
      .sort((a, b) => a.orderIdx - b.orderIdx);
    expect(updatedFirst.id).toBe(secondB.id);
    expect(updatedFirst.orderIdx).toBe(0);
    expect(updatedSecond.orderIdx).toBe(1);
  });

  it('deletes a segment and compacts the order index', () => {
    const [firstC] = readSegments().filter((segment) => segment.teamId === 'C');

    useSegmentsStore.getState().deleteSegment(firstC.id);

    const remaining = readSegments().filter((segment) => segment.teamId === 'C');
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.orderIdx).toBe(0);
  });

  it('resets to the sample seed set', () => {
    useSegmentsStore.getState().deleteSegment(SAMPLE_SEGMENTS[0]?.id ?? '');
    expect(readSegments().length).toBeLessThan(SAMPLE_SEGMENTS.length);

    useSegmentsStore.getState().reset();
    expect(readSegments()).toHaveLength(SAMPLE_SEGMENTS.length);
  });
});
