import { useEffect, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { Segment } from '../../features/segments/segments.types';
import type { SegmentFormState } from './RouteTable';

interface SegmentRowProps {
  segment: Segment;
  formState: SegmentFormState;
  index: number;
  availableTypes: Segment['type'][];
  onSave: (form: SegmentFormState) => string[];
  onDelete: () => void;
}

export function SegmentRow({
  segment,
  formState,
  index,
  availableTypes,
  onSave,
  onDelete,
}: SegmentRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: segment.id,
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<SegmentFormState>(formState);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!editing) {
      setDraft(formState);
    }
  }, [formState, editing]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    const issues = onSave(draft);
    if (issues.length > 0) {
      setErrors(issues);
      return;
    }
    setErrors([]);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(formState);
    setErrors([]);
    setEditing(false);
  };

  return (
    <>
      <tr
        ref={setNodeRef}
        style={style}
        className={`bg-slate-900/40 ${isDragging ? 'ring-2 ring-emerald-500' : ''}`}
      >
        <td className="px-4 py-3 align-top text-xs text-slate-400">
          <button
            className="flex h-8 w-8 items-center justify-center rounded border border-slate-700 bg-slate-900/60 text-xs text-slate-200 hover:border-slate-500"
            type="button"
            {...attributes}
            {...listeners}
          >
            {index + 1}
          </button>
        </td>
        <td className="px-4 py-3 align-top">
          {editing ? (
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              value={draft.type}
              onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value as SegmentFormState['type'] }))}
            >
              {availableTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          ) : (
            <span className="font-medium text-white">{segment.type}</span>
          )}
        </td>
        <td className="px-4 py-3 align-top">
          {editing ? (
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              value={draft.fromCity}
              onChange={(event) => setDraft((prev) => ({ ...prev, fromCity: event.target.value }))}
            />
          ) : (
            <span className="font-medium text-white">{segment.fromCity}</span>
          )}
        </td>
        <td className="px-4 py-3 align-top">
          {editing ? (
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              value={draft.toCity}
              onChange={(event) => setDraft((prev) => ({ ...prev, toCity: event.target.value }))}
            />
          ) : (
            <span className="font-medium text-white">{segment.toCity}</span>
          )}
        </td>
        <td className="px-4 py-3 align-top">
          {editing ? (
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              value={draft.depTime}
              onChange={(event) => setDraft((prev) => ({ ...prev, depTime: event.target.value }))}
            />
          ) : (
            <span className="font-medium text-white">{segment.depTime}</span>
          )}
        </td>
        <td className="px-4 py-3 align-top">
          {editing ? (
            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              value={draft.arrTime}
              onChange={(event) => setDraft((prev) => ({ ...prev, arrTime: event.target.value }))}
            />
          ) : (
            <span className="font-medium text-white">{segment.arrTime}</span>
          )}
        </td>
        <td className="px-4 py-3 align-top">
          {editing ? (
            <div className="flex gap-2">
              <input
                className="w-24 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
                value={draft.cost}
                onChange={(event) => setDraft((prev) => ({ ...prev, cost: event.target.value }))}
              />
              <input
                className="w-16 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
                value={draft.currency}
                onChange={(event) => setDraft((prev) => ({ ...prev, currency: event.target.value }))}
              />
            </div>
          ) : (
            <span className="font-medium text-white">
              {segment.cost ? `${segment.cost} ${segment.currency ?? ''}` : '—'}
            </span>
          )}
        </td>
        <td className="px-4 py-3 align-top">
          {editing ? (
            <textarea
              className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              rows={2}
              value={draft.notes}
              onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
            />
          ) : (
            <span className="text-slate-300">{segment.notes ?? '—'}</span>
          )}
        </td>
        <td className="px-4 py-3 align-top text-right">
          {editing ? (
            <div className="flex justify-end gap-2">
              <button
                className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 transition hover:bg-emerald-400"
                type="button"
                onClick={handleSave}
              >
                Save
              </button>
              <button
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
                type="button"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <button
                className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-slate-500"
                type="button"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
              <button
                className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-rose-50 transition hover:bg-rose-400"
                type="button"
                onClick={onDelete}
              >
                Delete
              </button>
            </div>
          )}
        </td>
      </tr>
      {errors.length > 0 ? (
        <tr className="bg-rose-500/10">
          <td className="px-4 py-3 text-xs text-rose-300" colSpan={9}>
            <ul className="list-disc space-y-1 pl-5">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </td>
        </tr>
      ) : null}
    </>
  );
}
