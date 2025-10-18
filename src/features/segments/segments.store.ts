import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { SAMPLE_SEGMENTS } from './sampleSegments';
import type { LegNumber, Segment, SegmentInput, TeamId } from './segments.types';

export type PersistenceStatus = 'idle' | 'queued' | 'saving' | 'saved' | 'offline' | 'error';

export interface SegmentsConflict {
  remoteUpdatedAt: string;
  localUpdatedAt: string | null;
  remoteSegments: Segment[];
  localSegments: Segment[];
}

type PersistenceStatePatch = Partial<
  Pick<SegmentsState, 'persistenceStatus' | 'lastSavedAt' | 'syncError' | 'outboxSize'>
>;

export interface SegmentsState {
  segments: Segment[];
  persistenceStatus: PersistenceStatus;
  lastSavedAt: string | null;
  syncError: string | null;
  conflict: SegmentsConflict | null;
  outboxSize: number;
  addSegment: (input: SegmentInput) => Segment;
  updateSegment: (id: Segment['id'], changes: Partial<Omit<Segment, 'id'>>) => void;
  deleteSegment: (id: Segment['id']) => void;
  insertSegment: (segment: Segment, index?: number) => void;
  reorderSegments: (teamId: TeamId, legNo: LegNumber, orderedIds: Segment['id'][]) => void;
  replaceSegments: (segments: Segment[]) => void;
  setPersistenceState: (patch: PersistenceStatePatch) => void;
  setConflict: (conflict: SegmentsConflict | null) => void;
  reset: () => void;
}

const createId = () => `seg-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;

const groupKey = (segment: Pick<Segment, 'teamId' | 'legNo'>) => `${segment.teamId}-${segment.legNo}`;

const normaliseOrder = (segments: Segment[]): Segment[] => {
  const groups = segments.reduce<Record<string, Segment[]>>((acc, segment) => {
    const key = groupKey(segment);
    acc[key] ??= [];
    acc[key].push(segment);
    return acc;
  }, {});

  const reassigned = new Map<string, Segment>();

  Object.values(groups).forEach((group) => {
    const ordered = group
      .slice()
      .sort((a, b) => {
        if (a.orderIdx !== b.orderIdx) {
          return a.orderIdx - b.orderIdx;
        }
        const depDiff = new Date(a.depTime).getTime() - new Date(b.depTime).getTime();
        if (depDiff !== 0) {
          return depDiff;
        }
        const arrDiff = new Date(a.arrTime).getTime() - new Date(b.arrTime).getTime();
        if (arrDiff !== 0) {
          return arrDiff;
        }
        return a.id.localeCompare(b.id);
      });

    ordered.forEach((segment, index) => {
      reassigned.set(segment.id, { ...segment, orderIdx: index });
    });
  });

  return segments.map((segment) => reassigned.get(segment.id) ?? segment);
};

const initialState: Pick<
  SegmentsState,
  'segments' | 'persistenceStatus' | 'lastSavedAt' | 'syncError' | 'conflict' | 'outboxSize'
> = {
  segments: normaliseOrder(SAMPLE_SEGMENTS),
  persistenceStatus: 'idle',
  lastSavedAt: null,
  syncError: null,
  conflict: null,
  outboxSize: 0,
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
        const segments = (() => {
          const next = [...state.segments];
          const targetGroup = next.filter(
            (item) => item.teamId === segment.teamId && item.legNo === segment.legNo,
          );
          const insertIndex = targetGroup.length;
          next.push({ ...segment, orderIdx: insertIndex });
          return normaliseOrder(next);
        })();
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
        return { segments: normaliseOrder(segments) };
      }, false, 'segments/updateSegment');
    },
    deleteSegment: (id) => {
      set((state) => {
        const segments = state.segments.filter((segment) => segment.id !== id);
        return { segments: normaliseOrder(segments) };
      }, false, 'segments/deleteSegment');
    },
    insertSegment: (segment, index) => {
      set((state) => {
        const without = state.segments.filter((item) => item.id !== segment.id);
        const group = without.filter(
          (item) => item.teamId === segment.teamId && item.legNo === segment.legNo,
        );
        const others = without.filter(
          (item) => !(item.teamId === segment.teamId && item.legNo === segment.legNo),
        );

        const targetIndex = Math.min(Math.max(index ?? group.length, 0), group.length);
        const sortedGroup = group.slice().sort((a, b) => a.orderIdx - b.orderIdx);
        const reorderedGroup = [
          ...sortedGroup.slice(0, targetIndex),
          { ...segment },
          ...sortedGroup.slice(targetIndex),
        ].map((item, orderIdx) => ({ ...item, orderIdx }));

        return {
          segments: normaliseOrder([...others, ...reorderedGroup]),
        };
      }, false, 'segments/insertSegment');
    },
    reorderSegments: (teamId, legNo, orderedIds) => {
      set((state) => {
        const segments = state.segments.map((segment) => {
          if (segment.teamId !== teamId || segment.legNo !== legNo) {
            return segment;
          }

          const position = orderedIds.indexOf(segment.id);
          if (position === -1) {
            return segment;
          }

          return { ...segment, orderIdx: position };
        });

        return { segments: normaliseOrder(segments) };
      }, false, 'segments/reorderSegments');
    },
    replaceSegments: (segments) => {
      set({ segments: normaliseOrder(segments) }, false, 'segments/replaceSegments');
    },
    setPersistenceState: (patch) => {
      set(patch, false, 'segments/setPersistenceState');
    },
    setConflict: (conflict) => {
      set({ conflict }, false, 'segments/setConflict');
    },
    reset: () => {
      set({ ...initialState }, false, 'segments/reset');
    },
  })),
);

export const selectSegments = (state: SegmentsState) => state.segments;

export const selectPersistenceMeta = (state: SegmentsState) => ({
  status: state.persistenceStatus,
  lastSavedAt: state.lastSavedAt,
  outboxSize: state.outboxSize,
  syncError: state.syncError,
  conflict: state.conflict,
});
