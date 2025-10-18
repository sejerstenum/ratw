import { describe, expect, it } from 'vitest';

import { SAMPLE_SEGMENTS } from '../../features/segments/sampleSegments';
import { validateSegmentTiming } from '../../features/segments/segments.validators';

const clone = () => SAMPLE_SEGMENTS.map((segment) => ({ ...segment }));

describe('segment validators', () => {
  it('flags invalid ISO strings', () => {
    const issues = validateSegmentTiming(
      {
        depTime: 'not-a-date',
        arrTime: 'also-not-a-date',
        teamId: 'A',
        legNo: 1,
      },
      clone(),
    );

    expect(issues.map((issue) => issue.code)).toContain('invalid-departure');
    expect(issues.map((issue) => issue.code)).toContain('invalid-arrival');
  });

  it('flags arrival times that are not after departure', () => {
    const issues = validateSegmentTiming(
      {
        depTime: '2025-10-27T10:00:00Z',
        arrTime: '2025-10-27T09:00:00Z',
        teamId: 'A',
        legNo: 1,
      },
      clone(),
    );

    expect(issues.some((issue) => issue.code === 'time-order')).toBe(true);
  });

  it('flags overlaps within the same team and leg', () => {
    const overlapping = [
      {
        ...clone()[0],
        id: 'existing',
        teamId: 'A' as const,
        legNo: 1 as const,
        depTime: '2025-10-27T08:00:00Z',
        arrTime: '2025-10-27T10:00:00Z',
      },
    ];

    const issues = validateSegmentTiming(
      {
        depTime: '2025-10-27T09:00:00Z',
        arrTime: '2025-10-27T11:00:00Z',
        teamId: 'A',
        legNo: 1,
      },
      overlapping,
    );

    expect(issues.some((issue) => issue.code === 'overlap')).toBe(true);
  });

  it('ignores overlaps for different legs and teams', () => {
    const issues = validateSegmentTiming(
      {
        depTime: '2025-10-27T12:00:00Z',
        arrTime: '2025-10-27T14:00:00Z',
        teamId: 'A',
        legNo: 1,
      },
      clone().filter((segment) => segment.teamId === 'B'),
    );

    expect(issues.every((issue) => issue.code !== 'overlap')).toBe(true);
  });
});
