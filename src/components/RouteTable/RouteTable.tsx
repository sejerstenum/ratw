import { useEffect, useMemo, useState } from 'react';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';

import {
  selectPersistenceMeta,
  selectSegments,
  type PersistenceStatus,
  useSegmentsStore,
} from '../../features/segments/segments.store';
import { CHECKPOINT_CITIES } from '../../features/segments/checkpoints';
import {
  type LegNumber,
  SEGMENT_TYPES,
  type Segment,
  type SegmentInput,
  type SegmentType,
  type TeamId,
} from '../../features/segments/segments.types';
import { validateSegmentTiming } from '../../features/segments/segments.validators';
import {
  SEGMENT_PRESETS,
  buildPresetSegment,
  type SegmentPresetId,
} from '../../features/segments/segmentPresets';
import {
  calculateLegMetrics,
  formatDuration,
  formatEta,
  formatLastCity,
  formatUtcDateTime,
} from '../../lib/time';
import {
  acceptRemoteSnapshot,
  describeConflictDifferences,
  keepLocalSnapshot,
} from '../../features/segments/segments.persistence';
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

const STATUS_BADGE: Record<PersistenceStatus, string> = {
  idle: 'border-slate-700 bg-slate-800/60 text-slate-200',
  queued: 'border-amber-500/60 bg-amber-500/10 text-amber-100',
  saving: 'border-sky-500/60 bg-sky-500/10 text-sky-100',
  saved: 'border-emerald-500/60 bg-emerald-500/10 text-emerald-100',
  offline: 'border-amber-500/60 bg-amber-500/10 text-amber-100',
  error: 'border-rose-500/60 bg-rose-500/10 text-rose-100',
};

const STATUS_LABEL: Record<PersistenceStatus, string> = {
  idle: 'Autosave ready',
  queued: 'Autosave queued',
  saving: 'Saving…',
  saved: 'Saved',
  offline: 'Offline',
  error: 'Sync issue',
};

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
  const { status, lastSavedAt, outboxSize, syncError, conflict } = useSegmentsStore(
    selectPersistenceMeta,
  );
  const conflictSummary = useMemo(
    () => (conflict ? describeConflictDifferences(conflict) : []),
    [conflict],
  );

  const filteredSegments = useMemo(
    () =>
      segments
        .filter((segment) => segment.teamId === teamId && segment.legNo === legNo)
        .sort((a, b) => a.orderIdx - b.orderIdx),
    [segments, teamId, legNo],
  );

  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);
  const [presetFeedback, setPresetFeedback] = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null);

  useEffect(() => {
    return () => {
      if (pendingDeletion) {
        clearTimeout(pendingDeletion.timeoutId);
      }
    };
  }, [pendingDeletion]);

  useEffect(() => {
    if (!presetFeedback) {
      return;
    }
    const timeoutId = window.setTimeout(() => {
      setPresetFeedback(null);
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [presetFeedback]);

  const siblings = filteredSegments;
  const lastSegment = filteredSegments[filteredSegments.length - 1] ?? null;
  const checkpointCity = CHECKPOINT_CITIES[legNo];
  const metrics = useMemo(
    () => calculateLegMetrics(filteredSegments, { checkpointCity }),
    [filteredSegments, checkpointCity],
  );

  const handlePresetInsert = (presetId: SegmentPresetId) => {
    const result = buildPresetSegment(presetId, { teamId, legNo, lastSegment });
    if (!result.success) {
      setPresetFeedback({ type: 'error', message: result.reason });
      return;
    }

    const issues = validateSegmentTiming(result.segment, siblings);
    if (issues.length > 0) {
      setPresetFeedback({
        type: 'error',
        message: issues.map((issue) => issue.message).join(' '),
      });
      return;
    }

    addSegment(result.segment);
    setPresetFeedback({
      type: 'success',
      message: `${
        result.preset.label
      } inserted (${formatUtcDateTime(result.segment.depTime)} → ${formatUtcDateTime(result.segment.arrTime)}).`,
    });
  };

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
    setPresetFeedback(null);
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
    setPresetFeedback(null);
    return [];
  };

  const handleDelete = (segmentId: string) => {
    const index = filteredSegments.findIndex((segment) => segment.id === segmentId);
    const segment = filteredSegments[index];
    if (!segment) {
      return;
    }

    deleteSegment(segmentId);
    setPresetFeedback(null);

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
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full border px-3 py-1 font-semibold ${STATUS_BADGE[status] ?? STATUS_BADGE.idle}`}
          >
            {STATUS_LABEL[status] ?? STATUS_LABEL.idle}
          </span>
          {status === 'saved' && lastSavedAt ? (
            <span className="text-slate-400">Last saved {formatUtcDateTime(lastSavedAt)}</span>
          ) : null}
          {status === 'offline' && outboxSize > 0 ? (
            <span className="text-amber-200">{outboxSize} change(s) waiting to sync</span>
          ) : null}
          {syncError && !conflict ? <span className="text-rose-300">{syncError}</span> : null}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Last city</p>
            <p className="mt-2 text-lg font-semibold text-white">{formatLastCity(metrics.lastCity)}</p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Next checkpoint ETA</p>
            <p className="mt-2 text-lg font-semibold text-white">{formatEta(metrics.etaIso)}</p>
            {checkpointCity ? (
              <p className="mt-1 text-xs text-slate-400">Checkpoint: {checkpointCity}</p>
            ) : null}
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Moving time</p>
            <p className="mt-2 text-lg font-semibold text-white">{formatDuration(metrics.elapsedMovementMs)}</p>
          </div>
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-400">Total elapsed</p>
            <p className="mt-2 text-lg font-semibold text-white">{formatDuration(metrics.elapsedTotalMs)}</p>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase tracking-wide text-slate-400">Quick inserts</p>
            {SEGMENT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500 disabled:opacity-60"
                disabled={!lastSegment}
                title={preset.description}
                type="button"
                onClick={() => handlePresetInsert(preset.id)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {lastSegment
              ? 'Preset blocks anchor to the latest segment and automatically adjust ETA calculations.'
              : 'Add a segment with a destination to enable break and overnight presets.'}
          </p>
          {presetFeedback ? (
            <div
              className={`mt-3 rounded-lg border px-3 py-2 text-sm ${
                presetFeedback.type === 'success'
                  ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-100'
                  : 'border-rose-500/60 bg-rose-500/10 text-rose-100'
              }`}
            >
              {presetFeedback.message}
            </div>
          ) : null}
        </div>
      </header>

      {conflict ? (
        <div className="rounded-xl border border-amber-500/60 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-semibold text-amber-50">Cloud update available</p>
              <p className="mt-1 text-xs text-amber-200">
                A newer snapshot was saved at {formatUtcDateTime(conflict.remoteUpdatedAt)}. Review the changes below or
                decide which version to keep.
              </p>
              {conflictSummary.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  {conflictSummary.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 text-xs font-semibold md:text-sm">
              <button
                className="rounded-lg border border-amber-400/80 bg-amber-400/20 px-3 py-2 text-amber-50 transition hover:border-amber-200 hover:bg-amber-300/30"
                type="button"
                onClick={() => {
                  void acceptRemoteSnapshot();
                }}
              >
                Apply cloud update
              </button>
              <button
                className="rounded-lg border border-slate-200/40 px-3 py-2 text-amber-100 transition hover:border-slate-200/80 hover:bg-slate-200/10"
                type="button"
                onClick={() => {
                  void keepLocalSnapshot();
                }}
              >
                Keep my changes
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
