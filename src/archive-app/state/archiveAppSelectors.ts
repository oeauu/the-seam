import type { ArchiveEntry, HistoricalRange } from "../../domain/archive/types";
import { selectEntriesByCommittedRange } from "../../domain/archive/selectors";

export function selectVisibleEntries(entries: readonly ArchiveEntry[], range: HistoricalRange, includeUndated = false): readonly ArchiveEntry[] {
  return selectEntriesByCommittedRange(entries, range, { includeUndated });
}

export function findEntryBySlug(entries: readonly ArchiveEntry[], slug: string): ArchiveEntry | null {
  return entries.find(entry => entry.slug === slug) ?? null;
}
