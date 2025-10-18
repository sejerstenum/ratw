export const LEG_NUMBERS = [1, 2, 3, 4, 5, 6] as const;

export type LegNumber = (typeof LEG_NUMBERS)[number];

export const isLegNumber = (value: number): value is LegNumber =>
  LEG_NUMBERS.includes(value as LegNumber);
