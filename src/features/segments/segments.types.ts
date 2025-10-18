import type { LegNumber } from '../legs/legs.types';
import type { TeamId } from '../teams/teams.types';

export const SEGMENT_TYPES = [
  'bus',
  'taxi',
  'privateLift',
  'train',
  'boat',
  'walk',
  'break',
  'overnight',
  'waiting',
  'job',
] as const;

export type SegmentType = (typeof SEGMENT_TYPES)[number];

export interface Segment {
  id: string;
  teamId: TeamId;
  leg: LegNumber;
  type: SegmentType;
  fromCity: string;
  toCity: string;
  depTime: string;
  arrTime: string;
  cost?: number;
  currency?: string;
  notes?: string;
  orderIdx: number;
}

export type SegmentDraft = Omit<Segment, 'id' | 'orderIdx'> & {
  id?: string;
  orderIdx?: number;
};
