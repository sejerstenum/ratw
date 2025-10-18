import { useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { selectSegments, useSegmentsStore } from '../../features/segments/segments.store';
import {
  type LegNumber,
  SEGMENT_TYPES,
  type Segment,
  type SegmentInput,
  type SegmentType,
  type TeamId,
} from '../../features/segments/segments.types';
import { validateSegmentTiming } from '../../features/segments/segments.validators';
import { NewSegmentRow } from './NewSegmentRow';
import { SegmentRow } from './SegmentRow';

export interface RouteTableProps {
  teamId: TeamId;
  legNo: LegNumber;
}

export interface SegmentFormState {
  type: SegmentType;
  fromCity: string;
  toCity: string;
  depTime: string;
  arrTime: string;
  cost: string;
  currency: string;
  notes: string;
}

interface PendingDeletion {
  segment: Segment;
  index: number;
  timeoutId: number;
}

const createFormState = (segment: Segment): SegmentFormState => ({
  type: segment.type,
  fromCity: segment.fromCity,
  toCity: segment.toCity,
  depTime: segment.depTime,
  arrTime: segment.arrTime,
  cost: segment.cost?.toString() ?? '',
  currency: segment.currency ?? 'EUR',
  notes: segment.notes ?? '',
});

const createEmptyForm = (): SegmentFormState => ({
  type: 'bus',
  fromCity: '',
  toCity: '',
  depTime: '',
  arrTime: '',
  cost: '',
  currency: 'EUR',
  notes: '',
});

const parseCost = (value: string) => {
  if (!value.trim()) {
    return { value: undefined, error: null } as const;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return { value: undefined, error: 'Cost must be a positive number.' } as const;
  }

  return { value: parsed, error: null } as const;
};

const toPayload = (
  form: SegmentFormState,
  teamId: TeamId,
  legNo: LegNumber,
): { payload?: SegmentInput; errors: string[] } => {
  const errors: string[] = [];

  if (!form.fromCity.trim()) {
    errors.push('From city is required.');
  }
  if (!form.toCity.trim()) {
    errors.push('To city is required.');
  }
  if (!form.depTime.trim()) {
    errors.push('Departure time is required.');
  }
  if (!form.arrTime.trim()) {
    errors.push('Arrival time is required.');
  }

  const { value: cost, error } = parseCost(form.cost);
  if (error) {
    errors.push(error);
  }

  if (errors.length > 0) {
    return { errors };
  }

  const payload: SegmentInput = {
    teamId,
    legNo,
    type: form.type,
    fromCity: form.fromCity.trim(),
    toCity: form.toCity.trim(),
    depTime: form.depTime.trim(),
    arrTime: form.arrTime.trim(),
    cost,
    currency: form.currency.trim() || undefined,
    notes: form.notes.trim() || undefined,
  };

  return { payload, errors: [] };
};

export function RouteTable({ teamId, legNo }: RouteTableProps) {
  const segments = useSegmentsStore(selectSegments);
  const addSegment = useSegmentsStore((state) => state.addSegment);
  const updateSegment = useSegmentsStore((state) => state.updateSegment);
  const deleteSegment = useSegmentsStore((state) => state.deleteSegment);
  const insertSegment = useSegmentsStore((state) => state.insertSegment);
  const reorderSegments = useSegmentsStore((state) => state.reorderSegments);

  const filteredSegments = useMemo(
    () =>
      segments
        .filter((segment) => segment.teamId === teamId && segment.legNo === legNo)
        .sort((a, b) => a.orderIdx - b.orderIdx),
    [segments, teamId, legNo],
  );

  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);

  useEffect(() => {
    return () => {
      if (pendingDeletion) {
        clearTimeout(pendingDeletion.timeoutId);
      }
    };
  }, [pendingDeletion]);

  const siblings = filteredSegments;

  const handleCreate = (form: SegmentFormState): string[] => {
    const { payload, errors } = toPayload(form, teamId, legNo);
    if (!payload) {
      return errors;
    }

    const issues = validateSegmentTiming(payload, siblings);
    if (issues.length > 0) {
      return issues.map((issue) => issue.message);
    }

    addSegment(payload);
    return [];
  };

  const handleUpdate = (segmentId: string, form: SegmentFormState): string[] => {
    const { payload, errors } = toPayload(form, teamId, legNo);
    if (!payload) {
      return errors;
    }

    const issues = validateSegmentTiming(payload, siblings, { ignoreId: segmentId });
    if (issues.length > 0) {
      return issues.map((issue) => issue.message);
    }

    updateSegment(segmentId, payload);
    return [];
  };

  const handleDelete = (segmentId: string) => {
    const index = filteredSegments.findIndex((segment) => segment.id === segmentId);
    const segment = filteredSegments[index];
    if (!segment) {
      return;
    }

    deleteSegment(segmentId);

    const timeoutId = window.setTimeout(() => {
      setPendingDeletion(null);
    }, 10_000);

    setPendingDeletion({ segment, index, timeoutId });
  };

  const undoDelete = () => {
    if (!pendingDeletion) {
      return;
    }
    clearTimeout(pendingDeletion.timeoutId);
    insertSegment(pendingDeletion.segment, pendingDeletion.index);
    setPendingDeletion(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = filteredSegments.findIndex((segment) => segment.id === active.id);
    const newIndex = filteredSegments.findIndex((segment) => segment.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    const orderedIds = arrayMove(
      filteredSegments.map((segment) => segment.id),
      oldIndex,
      newIndex,
    );

    reorderSegments(teamId, legNo, orderedIds);
  };

  return (
    <section className="mt-8 space-y-4">
      <header>
        <h2 className="text-lg font-semibold text-white">Route table</h2>
        <p className="mt-1 text-sm text-slate-300">
          Manage the current leg for Team {teamId}. Edit inline, drag to reorder, and the tracker will block overlapping times.
        </p>
      </header>

      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-900/60">
          <table className="min-w-full table-fixed divide-y divide-slate-800 text-left text-sm text-slate-200">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="w-12 px-4 py-3">Order</th>
                <th className="w-36 px-4 py-3">Type</th>
                <th className="w-60 px-4 py-3">From</th>
                <th className="w-60 px-4 py-3">To</th>
                <th className="px-4 py-3">Departure (UTC)</th>
                <th className="px-4 py-3">Arrival (UTC)</th>
                <th className="w-32 px-4 py-3">Cost</th>
                <th className="px-4 py-3">Notes</th>
                <th className="w-32 px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <SortableContext
                items={filteredSegments.map((segment) => segment.id)}
                strategy={verticalListSortingStrategy}
              >
                {filteredSegments.map((segment, index) => (
                  <SegmentRow
                    key={segment.id}
                    availableTypes={SEGMENT_TYPES}
                    formState={createFormState(segment)}
                    index={index}
                    onDelete={() => handleDelete(segment.id)}
                    onSave={(form) => handleUpdate(segment.id, form)}
                    segment={segment}
                  />
                ))}
              </SortableContext>
              <NewSegmentRow
                availableTypes={SEGMENT_TYPES}
                formState={createEmptyForm()}
                onCreate={handleCreate}
              />
            </tbody>
          </table>
        </div>
      </DndContext>

      {pendingDeletion ? (
        <div className="fixed bottom-6 right-6 flex max-w-sm items-center gap-3 rounded-lg border border-slate-800 bg-slate-900/90 px-4 py-3 text-sm text-slate-100 shadow-lg shadow-slate-950/50">
          <div>
            <p className="font-semibold text-white">Segment deleted</p>
            <p className="text-xs text-slate-300">Undo within 10 seconds to restore it to the table.</p>
          </div>
          <button
            className="rounded-lg bg-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-950 transition hover:bg-emerald-400"
            type="button"
            onClick={undoDelete}
          >
            Undo
          </button>
        </div>
      ) : null}
    </section>
  );
}
