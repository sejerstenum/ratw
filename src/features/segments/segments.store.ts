import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { SAMPLE_SEGMENTS } from './sampleSegments';
import type { Segment, SegmentInput } from './segments.types';

export interface SegmentsState {
  segments: Segment[];
  addSegment: (input: SegmentInput) => Segment;
  updateSegment: (id: Segment['id'], changes: Partial<Omit<Segment, 'id'>>) => void;
  deleteSegment: (id: Segment['id']) => void;
  reset: () => void;
}

const createId = () => `seg-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

const sortValue = (segment: Segment): number => new Date(segment.depTime).getTime();

const applyOrderIdx = (segments: Segment[]): Segment[] => {
  const idToOrder = new Map<string, number>();

  const groups = segments.reduce<Record<string, Segment[]>>((acc, segment) => {
    const key = `${segment.teamId}-${segment.legNo}`;
    acc[key] ??= [];
    acc[key].push(segment);
    return acc;
  }, {});

  Object.values(groups).forEach((group) => {
    group
      .slice()
      .sort((a, b) => {
        const depDiff = sortValue(a) - sortValue(b);
        if (depDiff !== 0) {
          return depDiff;
        }
        const arrDiff = new Date(a.arrTime).getTime() - new Date(b.arrTime).getTime();
        if (arrDiff !== 0) {
          return arrDiff;
        }
        return a.orderIdx - b.orderIdx;
      })
      .forEach((segment, index) => {
        idToOrder.set(segment.id, index);
      });
  });

  return segments.map((segment) => ({
    ...segment,
    orderIdx: idToOrder.get(segment.id) ?? segment.orderIdx,
  }));
};

const initialState: Pick<SegmentsState, 'segments'> = {
  segments: applyOrderIdx(SAMPLE_SEGMENTS),
};

export const useSegmentsStore = create<SegmentsState>()(
  devtools((set) => ({
    ...initialState,
    addSegment: (input) => {
      const segment: Segment = {
        id: createId(),
        orderIdx: 0,
        ...input,
      };

      let created: Segment = segment;

      set((state) => {
        const segments = applyOrderIdx([...state.segments, segment]);
        created = segments.find((item) => item.id === segment.id) ?? segment;
        return { segments };
      }, false, 'segments/addSegment');

      return created;
    },
    updateSegment: (id, changes) => {
      set((state) => {
        const segments = state.segments.map((segment) =>
          segment.id === id ? { ...segment, ...changes } : segment,
        );
        return { segments: applyOrderIdx(segments) };
      }, false, 'segments/updateSegment');
    },
    deleteSegment: (id) => {
      set((state) => {
        const segments = state.segments.filter((segment) => segment.id !== id);
        return { segments: applyOrderIdx(segments) };
      }, false, 'segments/deleteSegment');
    },
    reset: () => {
      set({ ...initialState }, false, 'segments/reset');
    },
  })),
);

export const selectSegments = (state: SegmentsState) => state.segments;
