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

export function normalizeYear(year: number, direction = 1): number {
  return year === 0 ? (direction < 0 ? -1 : 1) : Math.round(year);
}

export function timelineTicks(start: number, end: number): number[] {
  const step = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2000, 5000, 10000]
    .find(value => (end - start) / value <= 5) || Math.ceil((end - start) / 5);
  const ticks = [start];
  for (let year = Math.ceil(start / step) * step; year < end; year += step) {
    if (year > start + step * 0.75 && end - year > step * 0.75) ticks.push(year === 0 ? 1 : year);
  }
  return [...ticks, end];
}
