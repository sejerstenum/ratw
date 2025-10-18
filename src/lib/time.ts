import { isNonMovementSegmentType, type Segment } from '../features/segments/segments.types';

const MS_IN_MINUTE = 60_000;
const MS_IN_HOUR = 60 * MS_IN_MINUTE;

export const normaliseIsoString = (date: Date): string => date.toISOString().replace(/\.\d{3}Z$/, 'Z');

const padTwo = (value: number): string => value.toString().padStart(2, '0');

export const parseIsoDate = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const addMinutesToIso = (iso: string, minutes: number): string | null => {
  const base = parseIsoDate(iso);
  if (!base) {
    return null;
  }
  const next = new Date(base.getTime() + minutes * MS_IN_MINUTE);
  return normaliseIsoString(next);
};

export const setUtcTime = (date: Date, hours: number, minutes = 0): Date => {
  const clone = new Date(date.getTime());
  clone.setUTCHours(hours, minutes, 0, 0);
  return clone;
};

export const incrementUtcDays = (date: Date, days: number): Date => {
  const clone = new Date(date.getTime());
  clone.setUTCDate(clone.getUTCDate() + days);
  return clone;
};

export const sortSegmentsChronologically = (segments: Segment[]): Segment[] =>
  segments
    .slice()
    .sort((a, b) => {
      if (a.orderIdx !== b.orderIdx) {
        return a.orderIdx - b.orderIdx;
      }
      const depDiff = (parseIsoDate(a.depTime)?.getTime() ?? 0) - (parseIsoDate(b.depTime)?.getTime() ?? 0);
      if (depDiff !== 0) {
        return depDiff;
      }
      const arrDiff = (parseIsoDate(a.arrTime)?.getTime() ?? 0) - (parseIsoDate(b.arrTime)?.getTime() ?? 0);
      if (arrDiff !== 0) {
        return arrDiff;
      }
      return a.id.localeCompare(b.id);
    });

export interface LegDurations {
  movementMs: number;
  totalMs: number;
}

export const calculateElapsedDurations = (segments: Segment[]): LegDurations => {
  return segments.reduce<LegDurations>(
    (acc, segment) => {
      const dep = parseIsoDate(segment.depTime);
      const arr = parseIsoDate(segment.arrTime);
      if (!dep || !arr) {
        return acc;
      }
      const diff = arr.getTime() - dep.getTime();
      if (diff <= 0) {
        return acc;
      }
      acc.totalMs += diff;
      if (!isNonMovementSegmentType(segment.type)) {
        acc.movementMs += diff;
      }
      return acc;
    },
    { movementMs: 0, totalMs: 0 },
  );
};

export interface CalculateEtaOptions {
  checkpointCity?: string;
}

export const calculateEta = (
  segments: Segment[],
  options: CalculateEtaOptions = {},
): string | null => {
  if (segments.length === 0) {
    return null;
  }
  const sorted = sortSegmentsChronologically(segments);
  const normalisedCheckpoint = options.checkpointCity?.trim().toLowerCase();
  if (normalisedCheckpoint) {
    for (let index = sorted.length - 1; index >= 0; index -= 1) {
      const candidate = sorted[index];
      if (candidate.toCity.trim().toLowerCase() === normalisedCheckpoint) {
        const eta = parseIsoDate(candidate.arrTime);
        return eta ? normaliseIsoString(eta) : null;
      }
    }
  }
  const last = sorted[sorted.length - 1];
  const eta = parseIsoDate(last.arrTime);
  return eta ? normaliseIsoString(eta) : null;
};

export interface LegMetrics {
  elapsedMovementMs: number;
  elapsedTotalMs: number;
  etaIso: string | null;
  lastCity: string | null;
}

export const calculateLegMetrics = (
  segments: Segment[],
  options: CalculateEtaOptions = {},
): LegMetrics => {
  if (segments.length === 0) {
    return { elapsedMovementMs: 0, elapsedTotalMs: 0, etaIso: null, lastCity: null };
  }

  const sorted = sortSegmentsChronologically(segments);
  const durations = calculateElapsedDurations(sorted);
  const etaIso = calculateEta(sorted, options);

  let lastCity: string | null = null;
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const candidate = sorted[index];
    if (candidate.toCity.trim()) {
      lastCity = candidate.toCity;
      break;
    }
  }

  return {
    elapsedMovementMs: durations.movementMs,
    elapsedTotalMs: durations.totalMs,
    etaIso,
    lastCity,
  };
};

export const formatDuration = (ms: number): string => {
  if (ms <= 0) {
    return '0m';
  }
  const totalMinutes = Math.round(ms / MS_IN_MINUTE);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  const parts: string[] = [];
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (remainingHours > 0) {
    parts.push(`${remainingHours}h`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes}m`);
  }
  return parts.join(' ');
};

export const formatUtcDateTime = (iso: string | null): string => {
  if (!iso) {
    return '—';
  }
  const date = parseIsoDate(iso);
  if (!date) {
    return '—';
  }
  const day = padTwo(date.getUTCDate());
  const month = padTwo(date.getUTCMonth() + 1);
  const hours = padTwo(date.getUTCHours());
  const minutes = padTwo(date.getUTCMinutes());
  return `${day}-${month} @ ${hours}:${minutes}`;
};

export const formatEta = (iso: string | null): string => formatUtcDateTime(iso);

export const formatLastCity = (value: string | null): string => value ?? '—';

export const hoursBetween = (startIso: string, endIso: string): number | null => {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  if (!start || !end) {
    return null;
  }
  return (end.getTime() - start.getTime()) / MS_IN_HOUR;
};
