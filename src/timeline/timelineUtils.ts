import type { HistoricalYear, Language, TimeExtent } from "../types";

export function formatYear(year: HistoricalYear, language: Language): string {
  if (year < 0) {
    const abs = Math.abs(year);
    return language === "zh" ? `公元前${abs}年` : `${abs} BCE`;
  }
  return language === "zh" ? `公元${year}年` : `${year} CE`;
}

export function formatTimeRange(time: TimeExtent, language: Language): string {
  if (time.startYear === null || time.endYear === null) return time.label[language];
  if (time.startYear === time.endYear) {
    return formatYear(time.startYear, language);
  }
  return `${formatYear(time.startYear, language)} – ${formatYear(time.endYear, language)}`;
}

export const TIMELINE_DEFAULT_EARLIEST_YEAR = -2500;
export const TIMELINE_INTERVAL_YEARS = 100;

export function calculateTimelineBounds(earliestYear: number, currentYear = new Date().getFullYear()): [number, number] {
  if (!Number.isFinite(earliestYear)) earliestYear = currentYear;
  // Round earliest year down
  let minYear: number;
  if (earliestYear < 0) {
    minYear = Math.floor(earliestYear / 500) * 500;
  } else {
    minYear = Math.floor(earliestYear / 100) * 100;
  }
  return [minYear === 0 ? 1 : Math.min(minYear, currentYear - 1), currentYear];
}

export function snapYearToInterval(
  year: number,
  minYear: number,
  maxYear: number,
  interval = TIMELINE_INTERVAL_YEARS,
): number {
  if (!Number.isFinite(year)) return minYear;
  if (year <= minYear + interval * 0.25) return minYear;
  if (year >= maxYear - interval * 0.25) return maxYear;
  const snapped = Math.round(year / interval) * interval;
  const normalized = snapped === 0 ? (year >= 0 ? 1 : -1) : snapped;
  return Math.max(minYear, Math.min(maxYear, normalized));
}

export function recordOverlapsRange(
  recordStart: number | null,
  recordEnd: number | null,
  filterStart: number,
  filterEnd: number,
  isCollapsed: boolean
): boolean {
  if (isCollapsed) return true;
  if (recordStart === null || recordEnd === null) return false;
  return recordStart <= filterEnd && recordEnd >= filterStart;
}

export function timelinePeriods(time: TimeExtent): readonly Pick<TimeExtent, "startYear" | "endYear">[] {
  return time.periods?.length ? time.periods : [time];
}

export function normalizeYear(year: number, direction = 1): number {
  return year === 0 ? (direction < 0 ? -1 : 1) : Math.round(year);
}

export function timelineTicks(start: number, end: number): number[] {
  const step = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000, 10000]
    .find(value => (end - start) / value <= 8) || Math.ceil((end - start) / 8);
  const ticks = [start];
  for (let year = Math.ceil(start / step) * step; year < end; year += step) {
    if (year > start + step * 0.65 && end - year > step * 0.65) ticks.push(year === 0 ? 1 : year);
  }
  return [...ticks, end];
}

export function timelineIntervalTicks(
  start: number,
  end: number,
  interval = TIMELINE_INTERVAL_YEARS,
): number[] {
  const ticks: number[] = [];
  const firstStep = Math.ceil(start / interval) * interval;
  for (let year = firstStep; year <= end; year += interval) {
    const normalized = year === 0 ? 1 : year;
    if (normalized > start && normalized < end) ticks.push(normalized);
  }
  return ticks;
}
