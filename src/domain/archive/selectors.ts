import type {
  ArchiveEntry,
  ArchiveLocation,
  HistoricalRange,
} from "./types";
import { normalizeHistoricalRange, rangesOverlap, temporalRangeOf } from "./time";

export interface CommittedRangeOptions {
  includeUndated?: boolean;
}

export function getEntryPrimaryLocation(entry: ArchiveEntry): ArchiveLocation | null {
  return entry.locations.find(location => location.isPrimary) ?? entry.locations[0] ?? null;
}

export function getPreviewVisibility(
  entry: ArchiveEntry,
  previewRange: HistoricalRange,
): number {
  const entryRange = temporalRangeOf(entry.temporal);
  if (entryRange.start === null || entryRange.end === null) return 0.5;
  if (rangesOverlap(entryRange.start, entryRange.end, previewRange)) return 1;
  const distance = Math.min(
    Math.abs(entryRange.start - (previewRange.end ?? entryRange.start)),
    Math.abs((previewRange.start ?? entryRange.end) - entryRange.end),
  );
  return distance <= 50 ? 0.65 : 0.18;
}

export function getPreviewVisibilityState(
  entry: ArchiveEntry,
  previewRange: HistoricalRange,
): "visible" | "hidden" | "undated" {
  const entryRange = temporalRangeOf(entry.temporal);
  if (entryRange.start === null || entryRange.end === null) return "undated";
  return rangesOverlap(entryRange.start, entryRange.end, previewRange) ? "visible" : "hidden";
}

export function isEntryVisibleInPreview(
  entry: ArchiveEntry,
  previewRange: HistoricalRange,
  includeUndated = false,
): boolean {
  const visibility = getPreviewVisibilityState(entry, previewRange);
  return visibility === "visible" || (includeUndated && visibility === "undated");
}

function shouldIncludeUndated(options: boolean | CommittedRangeOptions): boolean {
  return typeof options === "boolean" ? options : options.includeUndated ?? false;
}

export function filterEntriesByCommittedRange(
  entries: readonly ArchiveEntry[],
  committedRange: HistoricalRange,
  options: boolean | CommittedRangeOptions = {},
): readonly ArchiveEntry[] {
  const normalizedRange = normalizeHistoricalRange(committedRange);
  const includeUndated = shouldIncludeUndated(options);

  return entries.filter(entry => {
    const entryRange = temporalRangeOf(entry.temporal);
    if (entryRange.start === null || entryRange.end === null) return includeUndated;
    return rangesOverlap(entryRange.start, entryRange.end, normalizedRange);
  });
}

export function selectEntriesByCommittedRange(
  entries: readonly ArchiveEntry[],
  committedRange: HistoricalRange,
  options: boolean | CommittedRangeOptions = {},
): readonly ArchiveEntry[] {
  return filterEntriesByCommittedRange(entries, committedRange, options);
}

export function selectEntriesInCommittedRange(
  entries: readonly ArchiveEntry[],
  committedRange: HistoricalRange,
): readonly ArchiveEntry[] {
  return filterEntriesByCommittedRange(entries, committedRange);
}

export const getEntryPreviewVisibility = getPreviewVisibility;
