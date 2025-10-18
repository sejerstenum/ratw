import {
  normaliseIsoString,
  parseIsoDate,
  setUtcTime,
  incrementUtcDays,
} from '../../lib/time';
import type {
  LegNumber,
  Segment,
  SegmentInput,
  SegmentType,
  TeamId,
} from './segments.types';

export type SegmentPresetId = 'break' | 'overnight' | 'waiting' | 'job';

interface SegmentPresetDefinition {
  id: SegmentPresetId;
  label: string;
  description: string;
  type: SegmentType;
  durationMinutes?: number;
  note: string;
}

const TEN_HOURS_IN_MS = 10 * 60 * 60 * 1000;

const PRESET_DEFINITIONS: Record<SegmentPresetId, SegmentPresetDefinition> = {
  break: {
    id: 'break',
    label: 'Break · 60m',
    description: 'Mandatory rest window to reset fatigue timers.',
    type: 'break',
    durationMinutes: 60,
    note: 'Mandatory break',
  },
  overnight: {
    id: 'overnight',
    label: 'Overnight · 20:00→06:00',
    description: 'Mandatory overnight stop from 20:00 UTC to 06:00 UTC.',
    type: 'overnight',
    note: 'Overnight rest block',
  },
  waiting: {
    id: 'waiting',
    label: 'Waiting · 30m',
    description: 'Buffer time when teams are waiting for a connection.',
    type: 'waiting',
    durationMinutes: 30,
    note: 'Waiting for transport',
  },
  job: {
    id: 'job',
    label: 'Job · 2h',
    description: 'Production or challenge job that pauses travel.',
    type: 'job',
    durationMinutes: 120,
    note: 'Job / task requirement',
  },
};

export interface SegmentPresetMeta {
  id: SegmentPresetId;
  label: string;
  description: string;
}

export const SEGMENT_PRESETS: SegmentPresetMeta[] = Object.values(PRESET_DEFINITIONS).map(
  ({ id, label, description }) => ({ id, label, description }),
);

export interface BuildPresetContext {
  teamId: TeamId;
  legNo: LegNumber;
  lastSegment: Segment | null;
}

export type BuildPresetResult =
  | { success: true; segment: SegmentInput; preset: SegmentPresetDefinition }
  | { success: false; reason: string };

export const buildPresetSegment = (
  presetId: SegmentPresetId,
  context: BuildPresetContext,
): BuildPresetResult => {
  const preset = PRESET_DEFINITIONS[presetId];
  if (!preset) {
    return { success: false, reason: 'Unknown preset selected.' };
  }
  const { lastSegment } = context;
  if (!lastSegment) {
    return {
      success: false,
      reason: 'Add at least one segment before applying a preset.',
    };
  }
  const baseCity = lastSegment.toCity.trim();
  if (!baseCity) {
    return {
      success: false,
      reason: 'The previous segment must have a destination city to anchor the preset.',
    };
  }
  const anchor = parseIsoDate(lastSegment.arrTime);
  if (!anchor) {
    return {
      success: false,
      reason: 'The previous segment has an invalid arrival time.',
    };
  }

  if (preset.id === 'overnight') {
    const sameDayStart = setUtcTime(anchor, 20);
    const start = sameDayStart.getTime() <= anchor.getTime() ? incrementUtcDays(sameDayStart, 1) : sameDayStart;
    const end = new Date(start.getTime() + TEN_HOURS_IN_MS);

    const segment: SegmentInput = {
      teamId: context.teamId,
      legNo: context.legNo,
      type: preset.type,
      fromCity: baseCity,
      toCity: baseCity,
      depTime: normaliseIsoString(start),
      arrTime: normaliseIsoString(end),
      notes: preset.note,
    };
    return { success: true, segment, preset };
  }

  if (!preset.durationMinutes) {
    return {
      success: false,
      reason: 'Preset missing duration configuration.',
    };
  }

  const startIso = normaliseIsoString(anchor);
  const end = new Date(anchor.getTime() + preset.durationMinutes * 60_000);
  const segment: SegmentInput = {
    teamId: context.teamId,
    legNo: context.legNo,
    type: preset.type,
    fromCity: baseCity,
    toCity: baseCity,
    depTime: startIso,
    arrTime: normaliseIsoString(end),
    notes: preset.note,
  };
  return { success: true, segment, preset };
};
