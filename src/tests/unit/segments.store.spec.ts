import { beforeEach, describe, expect, it } from 'vitest';
import { SAMPLE_SEGMENTS } from '../../features/segments/segments.data';
import { useSegmentsStore } from '../../features/segments/segments.store';

const cloneSegments = () => SAMPLE_SEGMENTS.map((segment) => ({ ...segment }));

describe('segments.store', () => {
  beforeEach(() => {
    useSegmentsStore.setState({ segments: cloneSegments() });
  });

  it('adds segments with sequential order indexes', () => {
    const teamId = 'A';
    const leg = 1;
    const initial = useSegmentsStore
      .getState()
      .segments.filter((segment) => segment.teamId === teamId && segment.leg === leg);

    const created = useSegmentsStore.getState().addSegment({
      teamId,
      leg,
      type: 'bus',
      fromCity: 'Santarém',
      toCity: 'Lisbon',
      depTime: '2025-10-27T16:00:00Z',
      arrTime: '2025-10-27T18:15:00Z',
      notes: 'Express connection to checkpoint.',
    });

    expect(created.orderIdx).toBe(initial.length);

    const updated = useSegmentsStore
      .getState()
      .segments.filter((segment) => segment.teamId === teamId && segment.leg === leg)
      .sort((a, b) => a.orderIdx - b.orderIdx);

    expect(updated.at(-1)?.id).toBe(created.id);
  });

  it('reindexes segments when one is removed', () => {
    const state = useSegmentsStore.getState();
    const target = state.segments.find(
      (segment) => segment.teamId === 'A' && segment.leg === 1 && segment.orderIdx === 1,
    );

    expect(target).toBeDefined();

    if (!target) {
      return;
    }

    state.deleteSegment(target.id);

    const orders = useSegmentsStore
      .getState()
      .segments.filter((segment) => segment.teamId === 'A' && segment.leg === 1)
      .map((segment) => segment.orderIdx);

    expect(orders).toEqual([0, 1]);
  });
});
