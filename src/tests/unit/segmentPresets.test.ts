import { describe, expect, it } from 'vitest';

import type { Segment } from '../../features/segments/segments.types';
import { buildPresetSegment } from '../../features/segments/segmentPresets';

describe('segment presets', () => {
  const baseSegment: Segment = {
    id: 'base',
    teamId: 'A',
    legNo: 1,
    type: 'bus',
    fromCity: 'Porto',
    toCity: 'Lisbon',
    depTime: '2025-10-27T08:00:00Z',
    arrTime: '2025-10-27T18:00:00Z',
    orderIdx: 0,
  };

  it('builds a one hour break preset anchored to the latest city', () => {
    const result = buildPresetSegment('break', {
      teamId: 'A',
      legNo: 1,
      lastSegment: baseSegment,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.segment.type).toBe('break');
    expect(result.segment.fromCity).toBe('Lisbon');
    expect(result.segment.toCity).toBe('Lisbon');
    expect(result.segment.depTime).toBe('2025-10-27T18:00:00Z');
    expect(result.segment.arrTime).toBe('2025-10-27T19:00:00Z');
  });

  it('schedules an overnight stop starting at 20:00 UTC on the same day when possible', () => {
    const anchor: Segment = { ...baseSegment, arrTime: '2025-10-27T17:45:00Z' };
    const result = buildPresetSegment('overnight', {
      teamId: 'A',
      legNo: 1,
      lastSegment: anchor,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.segment.depTime).toBe('2025-10-27T20:00:00Z');
    expect(result.segment.arrTime).toBe('2025-10-28T06:00:00Z');
  });

  it('pushes the overnight start to the following day when the team arrives after 20:00 UTC', () => {
    const lateArrival: Segment = { ...baseSegment, arrTime: '2025-10-27T21:15:00Z' };
    const result = buildPresetSegment('overnight', {
      teamId: 'A',
      legNo: 1,
      lastSegment: lateArrival,
    });

    expect(result.success).toBe(true);
    if (!result.success) {
      return;
    }

    expect(result.segment.depTime).toBe('2025-10-28T20:00:00Z');
    expect(result.segment.arrTime).toBe('2025-10-29T06:00:00Z');
  });

  it('returns an error when no anchor segment is available', () => {
    const result = buildPresetSegment('break', {
      teamId: 'A',
      legNo: 1,
      lastSegment: null,
    });

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.reason).toMatch(/add at least one segment/i);
  });
});
