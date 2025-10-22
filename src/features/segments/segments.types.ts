export type TeamId = 'A' | 'B' | 'C' | 'D' | 'E';

export type LegNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type SegmentType =
  | 'bus'
  | 'taxi'
  | 'privateLift'
  | 'train'
  | 'boat'
  | 'walk'
  | 'break'
  | 'overnight'
  | 'waiting'
  | 'job';

export interface Segment {
  id: string;
  teamId: TeamId;
  legNo: LegNumber;
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

export interface SegmentInput {
  teamId: TeamId;
  legNo: LegNumber;
  type: SegmentType;
  fromCity: string;
  toCity: string;
  depTime: string;
  arrTime: string;
  cost?: number;
  currency?: string;
  notes?: string;
}

export const TEAM_IDS: TeamId[] = ['A', 'B', 'C', 'D', 'E'];

export const LEG_NUMBERS: LegNumber[] = [1, 2, 3, 4, 5, 6];

export const SEGMENT_TYPES: SegmentType[] = [
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
];

export const NON_MOVEMENT_SEGMENT_TYPES: SegmentType[] = ['break', 'overnight', 'waiting', 'job'];

export const MOVEMENT_SEGMENT_TYPES: SegmentType[] = SEGMENT_TYPES.filter(
  (type) => !NON_MOVEMENT_SEGMENT_TYPES.includes(type),
);

export const isNonMovementSegmentType = (type: SegmentType): boolean =>
  NON_MOVEMENT_SEGMENT_TYPES.includes(type);
