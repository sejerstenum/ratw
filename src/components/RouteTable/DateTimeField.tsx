import { useEffect, useRef, useState } from 'react';

import { normaliseIsoString, parseIsoDate } from '../../lib/time';

const pad = (value: number): string => value.toString().padStart(2, '0');

const buildDatePart = (date: Date): string =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

const buildTimePart = (date: Date): string => `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;

const toIso = (dateValue: string, timeValue: string): string => {
  if (!dateValue || !timeValue) {
    return '';
  }

  const [year, month, day] = dateValue.split('-').map(Number);
  const [hours, minutes] = timeValue.split(':').map(Number);

  if ([year, month, day, hours, minutes].some((part) => Number.isNaN(part))) {
    return '';
  }

  const next = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0));
  return normaliseIsoString(next);
};

const parseIsoToParts = (iso: string): { datePart: string; timePart: string } | null => {
  const parsed = parseIsoDate(iso);
  if (!parsed) {
    return null;
  }

  return {
    datePart: buildDatePart(parsed),
    timePart: buildTimePart(parsed),
  };
};

interface DateTimeFieldProps {
  id: string;
  value: string;
  onChange: (iso: string) => void;
  dateAriaLabel: string;
  timeAriaLabel: string;
}

export function DateTimeField({ id, value, onChange, dateAriaLabel, timeAriaLabel }: DateTimeFieldProps) {
  const [datePart, setDatePart] = useState('');
  const [timePart, setTimePart] = useState('');
  const skipSyncRef = useRef(false);

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      if (!value) {
        return;
      }
    }

    if (!value) {
      setDatePart('');
      setTimePart('');
      return;
    }

    const parts = parseIsoToParts(value);
    if (!parts) {
      setDatePart('');
      setTimePart('');
      return;
    }

    setDatePart(parts.datePart);
    setTimePart(parts.timePart);
  }, [value]);

  const updateValue = (nextDate: string, nextTime: string) => {
    setDatePart(nextDate);
    setTimePart(nextTime);
    skipSyncRef.current = true;
    onChange(toIso(nextDate, nextTime));
  };

  return (
    <div className="flex gap-2">
      <input
        id={`${id}-date`}
        aria-label={dateAriaLabel}
        className="flex-1 min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
        type="date"
        value={datePart}
        onChange={(event) => updateValue(event.target.value, timePart)}
      />
      <input
        id={`${id}-time`}
        aria-label={timeAriaLabel}
        className="flex-1 min-w-0 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-white"
        type="time"
        value={timePart}
        onChange={(event) => updateValue(datePart, event.target.value)}
      />
    </div>
  );
}

