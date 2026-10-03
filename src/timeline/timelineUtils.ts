import type { HistoricalYear, Language, TimeExtent } from "../types";

export function formatYear(year: HistoricalYear, language: Language): string {
  if (year < 0) {
    const abs = Math.abs(year);
    return language === "zh" ? `公元前${abs}年` : `${abs} BCE`;
  }
  return language === "zh" ? `公元${year}年` : `${year} CE`;
}

export function formatTimeRange(time: TimeExtent, language: Language): string {
  if (time.startYear === time.endYear) {
    return formatYear(time.startYear, language);
  }
  return `${formatYear(time.startYear, language)} – ${formatYear(time.endYear, language)}`;
}

export function calculateTimelineBounds(earliestYear: number, currentYear = 2026): [number, number] {
  // Round earliest year down
  let minYear: number;
  if (earliestYear < 0) {
    minYear = Math.floor(earliestYear / 500) * 500;
  } else {
    minYear = Math.floor(earliestYear / 100) * 100;
  }
  return [minYear, currentYear];
}

export function recordOverlapsRange(
  recordStart: number,
  recordEnd: number,
  filterStart: number,
  filterEnd: number,
  isCollapsed: boolean
): boolean {
  if (isCollapsed) return true;
  return recordStart <= filterEnd && recordEnd >= filterStart;
}
