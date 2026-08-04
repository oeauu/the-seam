import type { HistoricalRange } from "../../domain/archive/types";

export const TIMELINE_MIN = -500;
export const TIMELINE_MAX = 2026;

export function displayHistoricalYear(year: number | null): string {
  if (year === null) return "不详";
  if (year < 0) return `${Math.abs(year)} BCE`;
  if (year === 0) return "1 CE";
  return `${year} CE`;
}

export function inputToHistoricalYear(value: number): number {
  if (value === 0) return 1;
  return value;
}

export function historicalYearToInput(value: number | null): number {
  if (value === null) return 1;
  return value === 0 ? 1 : value;
}

export function normalizeTimelineRange(start: number, end: number): HistoricalRange {
  const safeStart = inputToHistoricalYear(Math.max(TIMELINE_MIN, Math.min(TIMELINE_MAX, start)));
  const safeEnd = inputToHistoricalYear(Math.max(TIMELINE_MIN, Math.min(TIMELINE_MAX, end)));
  return safeStart <= safeEnd ? { start: safeStart, end: safeEnd } : { start: safeEnd, end: safeStart };
}
