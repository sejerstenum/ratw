import { useId } from 'react';

import { LEG_NUMBERS, type LegNumber } from '../features/segments/segments.types';

interface LegSelectorProps {
  activeLeg: LegNumber;
  onSelect: (leg: LegNumber) => void;
  className?: string;
}

export function LegSelector({ activeLeg, onSelect, className }: LegSelectorProps) {
  const selectId = useId();

  return (
    <div className={className}>
      <label className="block text-sm font-semibold text-slate-200" htmlFor={selectId}>
        Active leg
      </label>
      <div className="mt-2 inline-flex items-center rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2">
        <select
          className="bg-transparent text-sm font-medium text-white focus:outline-none"
          id={selectId}
          value={activeLeg}
          onChange={(event) => onSelect(Number(event.target.value) as LegNumber)}
        >
          {LEG_NUMBERS.map((leg) => (
            <option className="bg-slate-900 text-slate-200" key={leg} value={leg}>
              Leg {leg}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
