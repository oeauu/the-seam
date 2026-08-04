import type { HistoricalRange, HistoricalYear, Language, LocalizedText, TemporalExtent } from "../types";

export function assertHistoricalYear(year: HistoricalYear): void {
  if (!Number.isInteger(year) || year === 0) {
    throw new Error("Historical year must be an integer other than year zero");
  }
}

export function historicalYearToAxis(year: HistoricalYear): number {
  assertHistoricalYear(year);
  return year < 0 ? year : year - 1;
}

export function axisToHistoricalYear(axis: number): HistoricalYear {
  if (!Number.isFinite(axis)) throw new Error("Axis coordinate must be finite");
  return axis < 0 ? Math.round(axis) : Math.round(axis) + 1;
}

export function formatHistoricalYear(year: HistoricalYear, language: Language): string {
  assertHistoricalYear(year);
  if (year < 0) return language === "zh" ? `公元前${Math.abs(year)}年` : `${Math.abs(year)} BCE`;
  return language === "zh" ? `公元${year}年` : `${year} CE`;
}

export function formatHistoricalRange(extent: TemporalExtent, language: Language): string {
  if (extent.startYear === null && extent.endYear === null) {
    return language === "zh" ? "时间不详" : "Date unknown";
  }
  if (extent.startYear === extent.endYear && extent.startYear !== null) {
    return formatHistoricalYear(extent.startYear, language);
  }
  const start = extent.startYear === null ? "…" : formatHistoricalYear(extent.startYear, language);
  const end = extent.endYear === null ? "…" : formatHistoricalYear(extent.endYear, language);
  return `${start} — ${end}`;
}

export function rangesOverlap(
  entryStart: HistoricalYear | null,
  entryEnd: HistoricalYear | null,
  filter: HistoricalRange,
): boolean {
  if (entryStart === null || entryEnd === null) return false;
  const filterStart = filter.start ?? Number.NEGATIVE_INFINITY;
  const filterEnd = filter.end ?? Number.POSITIVE_INFINITY;
  return entryStart <= filterEnd && entryEnd >= filterStart;
}

export function normalizeHistoricalYear(year: number): HistoricalYear {
  return year === 0 ? 1 : Math.trunc(year);
}

export function localizedYearLabel(year: number, fallback: LocalizedText): LocalizedText {
  const normalized = normalizeHistoricalYear(year);
  return {
    zh: normalized === year ? fallback.zh : "公元1年",
    en: normalized === year ? fallback.en : "1 CE",
  };
}
