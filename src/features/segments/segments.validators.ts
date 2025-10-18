import type { LegNumber, Segment, SegmentInput, TeamId } from './segments.types';

export type SegmentValidationCode = 'invalid-departure' | 'invalid-arrival' | 'time-order' | 'overlap';

export interface SegmentValidationIssue {
  code: SegmentValidationCode;
  message: string;
  relatedSegmentId?: Segment['id'];
}

export interface ValidateSegmentOptions {
  ignoreId?: Segment['id'];
}

const parseIso = (value: string) => {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
};

export const validateSegmentTiming = (
  candidate: Pick<SegmentInput, 'depTime' | 'arrTime'> & { teamId: TeamId; legNo: LegNumber },
  siblings: Segment[],
  options: ValidateSegmentOptions = {},
): SegmentValidationIssue[] => {
  const issues: SegmentValidationIssue[] = [];

  const depTime = parseIso(candidate.depTime);
  const arrTime = parseIso(candidate.arrTime);

  if (depTime === null) {
    issues.push({ code: 'invalid-departure', message: 'Departure time must be a valid ISO 8601 string.' });
  }

  if (arrTime === null) {
    issues.push({ code: 'invalid-arrival', message: 'Arrival time must be a valid ISO 8601 string.' });
  }

  if (depTime !== null && arrTime !== null && arrTime <= depTime) {
    issues.push({
      code: 'time-order',
      message: 'Arrival must be later than departure.',
    });
  }

  if (depTime === null || arrTime === null) {
    return issues;
  }

  const overlap = siblings.find((segment) => {
    if (options.ignoreId && segment.id === options.ignoreId) {
      return false;
    }
    const otherDep = parseIso(segment.depTime);
    const otherArr = parseIso(segment.arrTime);
    if (otherDep === null || otherArr === null) {
      return false;
    }

    const intersects = depTime < otherArr && arrTime > otherDep;
    return intersects;
  });

  if (overlap) {
    issues.push({
      code: 'overlap',
      message: `Overlaps with ${overlap.fromCity} → ${overlap.toCity}.`,
      relatedSegmentId: overlap.id,
    });
  }

  return issues;
};
