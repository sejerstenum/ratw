import { create } from 'zustand';
import type { LegNumber } from '../legs/legs.types';
import type { TeamId } from '../teams/teams.types';
import { SAMPLE_SEGMENTS } from './segments.data';
import type { Segment, SegmentDraft } from './segments.types';

const createSegmentId = (teamId: TeamId, leg: LegNumber) => {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${teamId}-LEG${leg}-${random}`;
};

const resequence = (segments: Segment[], teamId: TeamId, leg: LegNumber) => {
  const orderMap = new Map<string, number>();
  const sorted = segments
    .filter((segment) => segment.teamId === teamId && segment.leg === leg)
    .sort((a, b) => {
      if (a.orderIdx !== b.orderIdx) {
        return a.orderIdx - b.orderIdx;
      }

      return a.depTime.localeCompare(b.depTime);
    });

  sorted.forEach((segment, index) => {
    orderMap.set(segment.id, index);
  });

  return segments.map((segment) =>
    orderMap.has(segment.id)
      ? {
          ...segment,
          orderIdx: orderMap.get(segment.id) ?? segment.orderIdx,
        }
      : segment,
  );
};

const getNextOrderIndex = (
  segments: Segment[],
  teamId: TeamId,
  leg: LegNumber,
) => {
  const lastIndex = segments
    .filter((segment) => segment.teamId === teamId && segment.leg === leg)
    .reduce((max, segment) => Math.max(max, segment.orderIdx), -1);

  return lastIndex + 1;
};

type SegmentState = {
  segments: Segment[];
  addSegment: (draft: SegmentDraft) => Segment;
  updateSegment: (id: string, changes: Partial<Segment>) => void;
  deleteSegment: (id: string) => void;
  clear: () => void;
};

export const useSegmentsStore = create<SegmentState>((set) => ({
  segments: SAMPLE_SEGMENTS,
  addSegment: (draft) => {
    const id = draft.id ?? createSegmentId(draft.teamId, draft.leg);
    let insertedSegment: Segment | null = null;

    set((state) => {
      const orderIdx =
        draft.orderIdx ?? getNextOrderIndex(state.segments, draft.teamId, draft.leg);

      insertedSegment = {
        id,
        teamId: draft.teamId,
        leg: draft.leg,
        type: draft.type,
        fromCity: draft.fromCity,
        toCity: draft.toCity,
        depTime: draft.depTime,
        arrTime: draft.arrTime,
        cost: draft.cost,
        currency: draft.currency,
        notes: draft.notes,
        orderIdx,
      };

      const updated = [...state.segments, insertedSegment];

      return {
        segments: resequence(updated, insertedSegment.teamId, insertedSegment.leg),
      };
    });

    if (!insertedSegment) {
      throw new Error('Segment insertion failed');
    }

    return insertedSegment;
  },
  updateSegment: (id, changes) => {
    set((state) => {
      const updated = state.segments.map((segment) =>
        segment.id === id
          ? {
              ...segment,
              ...changes,
            }
          : segment,
      );

      const target = updated.find((segment) => segment.id === id);
      if (!target) {
        return { segments: state.segments };
      }

      return {
        segments: resequence(updated, target.teamId, target.leg),
      };
    });
  },
  deleteSegment: (id) => {
    set((state) => {
      const target = state.segments.find((segment) => segment.id === id);
      if (!target) {
        return { segments: state.segments };
      }

      const filtered = state.segments.filter((segment) => segment.id !== id);

      return {
        segments: resequence(filtered, target.teamId, target.leg),
      };
    });
  },
  clear: () => set({ segments: [] }),
}));

export const selectSegmentsByTeamAndLeg = (teamId: TeamId, leg: LegNumber) =>
  useSegmentsStore.getState().segments.filter(
    (segment) => segment.teamId === teamId && segment.leg === leg,
  );
