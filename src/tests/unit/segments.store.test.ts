import { describe, expect, it, beforeEach } from 'vitest';

import { SAMPLE_SEGMENTS } from '../../features/segments/sampleSegments';
import { selectSegments, useSegmentsStore } from '../../features/segments/segments.store';
import type { Segment, SegmentInput } from '../../features/segments/segments.types';

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

  it('updates a segment in place without altering the manual order', () => {
    const [firstB, secondB] = readSegments()
      .filter((segment) => segment.teamId === 'B')
      .sort((a, b) => a.orderIdx - b.orderIdx);

    useSegmentsStore
      .getState()
      .updateSegment(secondB.id, { depTime: '2025-10-27T06:00:00Z', arrTime: '2025-10-27T07:00:00Z' });

    const [afterFirst, afterSecond] = readSegments()
      .filter((segment) => segment.teamId === 'B')
      .sort((a, b) => a.orderIdx - b.orderIdx);

    expect(afterFirst.id).toBe(firstB.id);
    expect(afterSecond.id).toBe(secondB.id);
    expect(afterSecond.depTime).toBe('2025-10-27T06:00:00Z');
  });

  it('deletes a segment and compacts the order index', () => {
    const [firstC] = readSegments().filter((segment) => segment.teamId === 'C');

    useSegmentsStore.getState().deleteSegment(firstC.id);

    const remaining = readSegments().filter((segment) => segment.teamId === 'C');
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.orderIdx).toBe(0);
  });

  it('reorders a leg using the provided order of identifiers', () => {
    const ids = readSegments()
      .filter((segment) => segment.teamId === 'D')
      .sort((a, b) => a.orderIdx - b.orderIdx)
      .map((segment) => segment.id);

    const reversed = [...ids].reverse();
    useSegmentsStore.getState().reorderSegments('D', 1, reversed);

    const reordered = readSegments()
      .filter((segment) => segment.teamId === 'D')
      .sort((a, b) => a.orderIdx - b.orderIdx);

    expect(reordered.map((segment) => segment.id)).toEqual(reversed);
  });

  it('reinserts a segment at the requested index', () => {
    const target = readSegments().find((segment) => segment.teamId === 'E');
    expect(target).toBeDefined();
    const targetIndex = readSegments()
      .filter((segment) => segment.teamId === 'E')
      .findIndex((segment) => segment.id === target?.id);

    useSegmentsStore.getState().deleteSegment(target?.id ?? '');
    const remaining: Segment[] = readSegments().filter((segment) => segment.teamId === 'E');
    expect(remaining).toHaveLength(1);

    if (target) {
      useSegmentsStore.getState().insertSegment(target, targetIndex);
    }

    const restored = readSegments()
      .filter((segment) => segment.teamId === 'E')
      .sort((a, b) => a.orderIdx - b.orderIdx);
    expect(restored[0]?.id).toBe(target?.id);
  });

  it('resets to the sample seed set', () => {
    useSegmentsStore.getState().deleteSegment(SAMPLE_SEGMENTS[0]?.id ?? '');
    expect(readSegments().length).toBeLessThan(SAMPLE_SEGMENTS.length);

    useSegmentsStore.getState().reset();
    expect(readSegments()).toHaveLength(SAMPLE_SEGMENTS.length);
  });
});
