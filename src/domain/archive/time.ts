import type {
  HistoricalRange,
  HistoricalYear,
  Language,
  LocalizedText,
  TemporalExtent,
} from "./types";

export function assertHistoricalYear(year: number): asserts year is HistoricalYear {
  if (!Number.isInteger(year) || year === 0) {
    throw new Error("Historical year must be an integer other than year zero");
  }
}

/** Converts legacy year-zero input to the first CE year before it enters the domain. */
export function normalizeHistoricalYear(year: number): HistoricalYear {
  if (!Number.isFinite(year) || !Number.isInteger(year)) {
    throw new Error("Historical year must be a finite integer");
  }
  return year === 0 ? 1 : year;
}

export function normalizeHistoricalRange(range: HistoricalRange): HistoricalRange {
  const start = range.start === null ? null : normalizeHistoricalYear(range.start);
  const end = range.end === null ? null : normalizeHistoricalYear(range.end);

  if (start !== null && end !== null && start > end) {
    return { start: end, end: start };
  }
  return { start, end };
}

export function historicalYearToAxis(year: HistoricalYear): number {
  assertHistoricalYear(year);
  return year < 0 ? year : year - 1;
}

export function axisToHistoricalYear(axis: number): HistoricalYear {
  if (!Number.isFinite(axis)) {
    throw new Error("Historical axis coordinate must be finite");
  }
  const rounded = Math.round(axis);
  return rounded < 0 ? rounded : rounded + 1;
}

export function rangesOverlap(
  entryStart: HistoricalYear | null,
  entryEnd: HistoricalYear | null,
  filter: HistoricalRange,
): boolean {
  if (entryStart === null || entryEnd === null) return false;

  const entryRange = normalizeHistoricalRange({ start: entryStart, end: entryEnd });
  const filterRange = normalizeHistoricalRange(filter);
  const filterStart = filterRange.start ?? Number.NEGATIVE_INFINITY;
  const filterEnd = filterRange.end ?? Number.POSITIVE_INFINITY;

  return entryRange.start !== null
    && entryRange.end !== null
    && entryRange.start <= filterEnd
    && entryRange.end >= filterStart;
}

export function formatHistoricalYear(year: HistoricalYear, language: Language): string {
  assertHistoricalYear(year);
  if (year < 0) {
    return language === "zh" ? `公元前${Math.abs(year)}年` : `${Math.abs(year)} BCE`;
  }
  return language === "zh" ? `公元${year}年` : `${year} CE`;
}

export function formatHistoricalRange(extent: TemporalExtent, language: Language): string {
  const start = extent.startYear;
  const end = extent.endYear;
  if (start === null && end === null) {
    return language === "zh" ? "时间不详" : "Date unknown";
  }
  if (start !== null && start === end) return formatHistoricalYear(start, language);

  const formattedStart = start === null ? "—" : formatHistoricalYear(start, language);
  const formattedEnd = end === null ? "—" : formatHistoricalYear(end, language);
  return `${formattedStart} – ${formattedEnd}`;
}

export function temporalRangeOf(extent: TemporalExtent): HistoricalRange {
  return normalizeHistoricalRange({ start: extent.startYear, end: extent.endYear });
}

export function localizedYearLabel(year: number, fallback: LocalizedText): LocalizedText {
  const normalized = normalizeHistoricalYear(year);
  if (normalized === year) return { ...fallback };

  return {
    en: formatHistoricalYear(normalized, "en"),
    zh: formatHistoricalYear(normalized, "zh"),
  };
}
