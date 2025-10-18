import { FormEvent, useEffect, useMemo, useState } from 'react';

import {
  LEG_NUMBERS,
  SEGMENT_TYPES,
  TEAM_IDS,
  type LegNumber,
  type Segment,
  type SegmentInput,
  type SegmentType,
  type TeamId,
} from './segments.types';
import { selectSegments, useSegmentsStore } from './segments.store';

type SegmentDraft = Omit<SegmentInput, 'cost'> & { cost?: string };

const createEmptyDraft = (teamId: TeamId, legNo: LegNumber): SegmentDraft => ({
  teamId,
  legNo,
  type: 'bus',
  fromCity: '',
  toCity: '',
  depTime: '',
  arrTime: '',
  cost: '',
  currency: 'EUR',
  notes: '',
});

interface SegmentsDevPanelProps {
  activeLeg: LegNumber;
  activeTeam: TeamId;
}

const toNumber = (value?: string) => {
  if (value === undefined || value === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const formatIsoForInput = (iso: string) => iso?.replace('Z', '');

const parseInputToIso = (value: string) =>
  value.endsWith('Z') ? value : `${value}${value ? 'Z' : ''}`;

export function SegmentsDevPanel({ activeLeg, activeTeam }: SegmentsDevPanelProps) {
  const segments = useSegmentsStore(selectSegments);
  const addSegment = useSegmentsStore((state) => state.addSegment);
  const updateSegment = useSegmentsStore((state) => state.updateSegment);
  const deleteSegment = useSegmentsStore((state) => state.deleteSegment);
  const reset = useSegmentsStore((state) => state.reset);

  const [draft, setDraft] = useState<SegmentDraft>(() => createEmptyDraft(activeTeam, activeLeg));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<SegmentDraft | null>(null);

  const filteredSegments = useMemo(
    () =>
      segments
        .filter((segment) => segment.teamId === activeTeam && segment.legNo === activeLeg)
        .sort((a, b) => a.orderIdx - b.orderIdx),
    [segments, activeTeam, activeLeg],
  );

  useEffect(() => {
    setDraft((prev) => ({ ...prev, teamId: activeTeam, legNo: activeLeg }));
  }, [activeTeam, activeLeg]);

  useEffect(() => {
    if (editingId && !filteredSegments.some((segment) => segment.id === editingId)) {
      setEditingId(null);
      setEditingDraft(null);
    }
  }, [editingId, filteredSegments]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload: SegmentInput = {
      ...draft,
      cost: toNumber(draft.cost),
      depTime: parseInputToIso(draft.depTime),
      arrTime: parseInputToIso(draft.arrTime),
    };

    addSegment(payload);
    setDraft(createEmptyDraft(activeTeam, activeLeg));
  };

  const startEditing = (segment: Segment) => {
    setEditingId(segment.id);
    setEditingDraft({
      teamId: segment.teamId,
      legNo: segment.legNo,
      type: segment.type,
      fromCity: segment.fromCity,
      toCity: segment.toCity,
      depTime: formatIsoForInput(segment.depTime),
      arrTime: formatIsoForInput(segment.arrTime),
      cost: segment.cost?.toString() ?? '',
      currency: segment.currency,
      notes: segment.notes ?? '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingDraft(null);
  };

  const saveEditing = () => {
    if (!editingId || !editingDraft) {
      return;
    }

    updateSegment(editingId, {
      ...editingDraft,
      cost: toNumber(editingDraft.cost),
      depTime: parseInputToIso(editingDraft.depTime),
      arrTime: parseInputToIso(editingDraft.arrTime),
    });
    cancelEditing();
  };

  const isEditing = (id: string) => editingId === id;

  return (
    <section className="mt-8 space-y-8">
      <header>
        <h2 className="text-lg font-semibold text-white">Segments development console</h2>
        <p className="mt-2 text-sm text-slate-300">
          A temporary interface to exercise the in-memory store during Iteration 2. Filter by leg and
          team, then add, update, and delete segments to verify ordering before the editable route
          table arrives.
        </p>
      </header>

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-6">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Add segment</h3>
        <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <label className="flex flex-col text-sm font-medium text-slate-200">
            Team
            <select
              className="mt-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              value={draft.teamId}
              onChange={(event) => setDraft((prev) => ({ ...prev, teamId: event.target.value as SegmentDraft['teamId'] }))}
            >
              {TEAM_IDS.map((team) => (
                <option key={team} value={team}>
                  Team {team}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-200">
            Leg
            <select
              className="mt-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              value={draft.legNo}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, legNo: Number(event.target.value) as SegmentDraft['legNo'] }))
              }
            >
              {LEG_NUMBERS.map((leg) => (
                <option key={leg} value={leg}>
                  Leg {leg}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-200">
            Type
            <select
              className="mt-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              value={draft.type}
              onChange={(event) => setDraft((prev) => ({ ...prev, type: event.target.value as SegmentType }))}
            >
              {SEGMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-200">
            From city
            <input
              className="mt-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              placeholder="e.g. Porto"
              required
              value={draft.fromCity}
              onChange={(event) => setDraft((prev) => ({ ...prev, fromCity: event.target.value }))}
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-200">
            To city
            <input
              className="mt-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              placeholder="e.g. Lisbon"
              required
              value={draft.toCity}
              onChange={(event) => setDraft((prev) => ({ ...prev, toCity: event.target.value }))}
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-200">
            Departure (ISO 8601)
            <input
              className="mt-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              placeholder="2025-10-27T08:00:00Z"
              required
              value={draft.depTime}
              onChange={(event) => setDraft((prev) => ({ ...prev, depTime: event.target.value }))}
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-200">
            Arrival (ISO 8601)
            <input
              className="mt-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              placeholder="2025-10-27T10:15:00Z"
              required
              value={draft.arrTime}
              onChange={(event) => setDraft((prev) => ({ ...prev, arrTime: event.target.value }))}
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-200">
            Cost
            <input
              className="mt-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              placeholder="Optional"
              value={draft.cost}
              onChange={(event) => setDraft((prev) => ({ ...prev, cost: event.target.value }))}
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-slate-200">
            Currency
            <input
              className="mt-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              placeholder="EUR"
              value={draft.currency ?? ''}
              onChange={(event) => setDraft((prev) => ({ ...prev, currency: event.target.value }))}
            />
          </label>
          <label className="md:col-span-2 flex flex-col text-sm font-medium text-slate-200">
            Notes
            <textarea
              className="mt-1 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
              placeholder="Optional context"
              rows={3}
              value={draft.notes ?? ''}
              onChange={(event) => setDraft((prev) => ({ ...prev, notes: event.target.value }))}
            />
          </label>
          <div className="md:col-span-2 flex items-center justify-between">
            <button
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400"
              type="submit"
            >
              Add segment
            </button>
            <button
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500"
              type="button"
              onClick={() => {
                reset();
                setDraft(createEmptyDraft(activeTeam, activeLeg));
                cancelEditing();
              }}
            >
              Reset seed data
            </button>
          </div>
        </form>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-slate-800/80 bg-slate-900/60">
          <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-sm text-slate-300">
            <span className="font-semibold text-white">Team {activeTeam} · Leg {activeLeg}</span>
            <span>{filteredSegments.length} segments</span>
          </header>
          {filteredSegments.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-400">
              No segments yet for this selection. Use the form above to add the first one.
            </p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {filteredSegments.map((segment) => {
                const editing = isEditing(segment.id);
                const currentDraft = editing && editingDraft ? editingDraft : null;

                return (
                  <li
                    key={segment.id}
                    className="grid gap-4 px-4 py-4 text-sm text-slate-200 md:grid-cols-[2fr_2fr_2fr_1fr_1fr]"
                  >
                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-400">Route</div>
                      {editing ? (
                        <div className="mt-2 space-y-2">
                          <input
                            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
                            value={currentDraft?.fromCity ?? ''}
                            onChange={(event) =>
                              setEditingDraft((prev) =>
                                prev ? { ...prev, fromCity: event.target.value } : prev,
                              )
                            }
                          />
                          <input
                            className="w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
                            value={currentDraft?.toCity ?? ''}
                            onChange={(event) =>
                              setEditingDraft((prev) =>
                                prev ? { ...prev, toCity: event.target.value } : prev,
                              )
                            }
                          />
                        </div>
                      ) : (
                        <p className="mt-2 font-medium text-white">
                          {segment.fromCity} → {segment.toCity}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">Type: {segment.type}</p>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-400">Departure</div>
                      {editing ? (
                        <input
                          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
                          value={currentDraft?.depTime ?? ''}
                          onChange={(event) =>
                            setEditingDraft((prev) =>
                              prev ? { ...prev, depTime: event.target.value } : prev,
                            )
                          }
                        />
                      ) : (
                        <p className="mt-2 font-medium text-white">{segment.depTime}</p>
                      )}
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-400">Arrival</div>
                      {editing ? (
                        <input
                          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
                          value={currentDraft?.arrTime ?? ''}
                          onChange={(event) =>
                            setEditingDraft((prev) =>
                              prev ? { ...prev, arrTime: event.target.value } : prev,
                            )
                          }
                        />
                      ) : (
                        <p className="mt-2 font-medium text-white">{segment.arrTime}</p>
                      )}
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-wide text-slate-400">Cost</div>
                      {editing ? (
                        <input
                          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
                          value={currentDraft?.cost ?? ''}
                          onChange={(event) =>
                            setEditingDraft((prev) =>
                              prev ? { ...prev, cost: event.target.value } : prev,
                            )
                          }
                        />
                      ) : (
                        <p className="mt-2 font-medium text-white">
                          {segment.cost ? `${segment.cost} ${segment.currency ?? ''}` : '—'}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-slate-400">Order #{segment.orderIdx + 1}</p>
                    </div>

                    <div className="flex items-start justify-end gap-2">
                      {editing ? (
                        <>
                          <button
                            className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-emerald-950 hover:bg-emerald-400"
                            onClick={saveEditing}
                            type="button"
                          >
                            Save
                          </button>
                          <button
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500"
                            onClick={cancelEditing}
                            type="button"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-slate-500"
                            onClick={() => startEditing(segment)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-rose-50 hover:bg-rose-400"
                            onClick={() => deleteSegment(segment.id)}
                            type="button"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
