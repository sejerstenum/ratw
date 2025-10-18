import { describe, expect, it } from 'vitest';

import type { Segment } from '../../features/segments/segments.types';
import {
  calculateElapsedDurations,
  calculateEta,
  calculateLegMetrics,
  formatDuration,
} from '../../lib/time';

const buildSegment = (overrides: Partial<Segment>): Segment => ({
  id: 'segment',
  teamId: 'A',
  legNo: 1,
  type: 'bus',
  fromCity: 'Porto',
  toCity: 'Coimbra',
  depTime: '2025-10-27T08:00:00Z',
  arrTime: '2025-10-27T09:00:00Z',
  orderIdx: 0,
  ...overrides,
});

describe('time helpers', () => {
  const segments: Segment[] = [
    buildSegment({
      id: 'bus-1',
      type: 'bus',
      fromCity: 'Porto',
      toCity: 'Coimbra',
      depTime: '2025-10-27T08:00:00Z',
      arrTime: '2025-10-27T10:00:00Z',
      orderIdx: 0,
    }),
    buildSegment({
      id: 'break',
      type: 'break',
      fromCity: 'Coimbra',
      toCity: 'Coimbra',
      depTime: '2025-10-27T10:00:00Z',
      arrTime: '2025-10-27T10:30:00Z',
      orderIdx: 1,
    }),
    buildSegment({
      id: 'train',
      type: 'train',
      fromCity: 'Coimbra',
      toCity: 'Lisbon',
      depTime: '2025-10-27T10:30:00Z',
      arrTime: '2025-10-27T12:30:00Z',
      orderIdx: 2,
    }),
    buildSegment({
      id: 'overnight',
      type: 'overnight',
      fromCity: 'Lisbon',
      toCity: 'Lisbon',
      depTime: '2025-10-27T20:00:00Z',
      arrTime: '2025-10-28T06:00:00Z',
      orderIdx: 3,
    }),
    buildSegment({
      id: 'bus-2',
      type: 'bus',
      fromCity: 'Lisbon',
      toCity: 'Santarém',
      depTime: '2025-10-28T07:00:00Z',
      arrTime: '2025-10-28T08:30:00Z',
      orderIdx: 4,
    }),
  ];

  it('calculates movement and total elapsed durations', () => {
    const { movementMs, totalMs } = calculateElapsedDurations(segments);

    expect(formatDuration(movementMs)).toBe('5h 30m');
    expect(formatDuration(totalMs)).toBe('16h');
  });

  it('returns checkpoint ETA when the city matches', () => {
    expect(calculateEta(segments, { checkpointCity: 'Santarém' })).toBe('2025-10-28T08:30:00Z');
  });

  it('returns leg metrics including last city and total duration', () => {
    const metrics = calculateLegMetrics(segments, { checkpointCity: 'Santarém' });

    expect(metrics.etaIso).toBe('2025-10-28T08:30:00Z');
    expect(metrics.lastCity).toBe('Santarém');
    expect(formatDuration(metrics.elapsedMovementMs)).toBe('5h 30m');
    expect(formatDuration(metrics.elapsedTotalMs)).toBe('16h');
  });

  it('handles an empty set of segments gracefully', () => {
    const metrics = calculateLegMetrics([], { checkpointCity: 'Santarém' });
    expect(metrics).toEqual({
      etaIso: null,
      lastCity: null,
      elapsedMovementMs: 0,
      elapsedTotalMs: 0,
    });
  });
});
