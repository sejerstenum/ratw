import { useEffect, useState } from 'react';

import type { SegmentType } from '../../features/segments/segments.types';
import type { SegmentFormState } from './RouteTable';

interface NewSegmentRowProps {
  formState: SegmentFormState;
  availableTypes: SegmentType[];
  onCreate: (form: SegmentFormState) => string[];
}

export function NewSegmentRow({ formState, availableTypes, onCreate }: NewSegmentRowProps) {
  const [draft, setDraft] = useState<SegmentFormState>(formState);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setDraft(formState);
  }, [formState]);

  const handleCreate = () => {
    const issues = onCreate(draft);
    if (issues.length > 0) {
      setErrors(issues);
      return;
    }

    setErrors([]);
    setDraft(formState);
  };

  return (
    <>
      <tr className="bg-slate-900/30">
        <td className="px-4 py-3 align-top text-xs text-slate-500">New</td>
        <td className="px-4 py-3 align-top">
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
            value={draft.type}
            onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value as SegmentType }))}
          >
            {availableTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </td>
        <td className="px-4 py-3 align-top">
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
            placeholder="From city"
            value={draft.fromCity}
            onChange={(event) => setDraft((prev) => ({ ...prev, fromCity: event.target.value }))}
          />
        </td>
        <td className="px-4 py-3 align-top">
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
            placeholder="To city"
            value={draft.toCity}
            onChange={(event) => setDraft((prev) => ({ ...prev, toCity: event.target.value }))}
          />
        </td>
        <td className="px-4 py-3 align-top">
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
            placeholder="2025-10-27T08:00:00Z"
            value={draft.depTime}
            onChange={(event) => setDraft((prev) => ({ ...prev, depTime: event.target.value }))}
          />
        </td>
        <td className="px-4 py-3 align-top">
          <input
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
            placeholder="2025-10-27T10:00:00Z"
            value={draft.arrTime}
            onChange={(event) => setDraft((prev) => ({ ...prev, arrTime: event.target.value }))}
          />
        </td>
        <td className="px-4 py-3 align-top">
          <div className="flex gap-2">
            <input
              className="w-24 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              placeholder="Cost"
              value={draft.cost}
              onChange={(event) => setDraft((prev) => ({ ...prev, cost: event.target.value }))}
            />
            <input
              className="w-16 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              placeholder="Currency"
              value={draft.currency}
              onChange={(event) => setDraft((prev) => ({ ...prev, currency: event.target.value }))}
            />
          </div>
        </td>
        <td className="px-4 py-3 align-top">
          <textarea
            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
            placeholder="Notes"
            rows={2}
            value={draft.notes}
            onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
          />
        </td>
        <td className="px-4 py-3 align-top text-right">
          <button
            className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 transition hover:bg-emerald-400"
            type="button"
            onClick={handleCreate}
          >
            Add segment
          </button>
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
