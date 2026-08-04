import type {
  ArchiveEntry,
  ArchiveLocation,
  AtlasFilters,
  HistoricalRange,
  Language,
  MediaAsset,
  LocalizedText,
} from "./types";
import {
  meaningId,
  objectTypeId,
  sourceTypeId,
  taxonomyLabel,
} from "./data/taxonomy";
import { coordinateKey } from "./utils/geo";
import { rangesOverlap } from "./utils/time";

export interface RegionCluster {
  id: string;
  label: LocalizedText;
  center: { latitude: number; longitude: number };
  count: number;
  entryIds: string[];
  startYear: number | null;
  endYear: number | null;
}

export interface LocationCluster extends RegionCluster {
  locationIds: string[];
}

export type EntryMapVisibility = "visible" | "undated" | "no-location";

export function getEntryPrimaryLocation(entry: ArchiveEntry): ArchiveLocation | null {
  return entry.locations.find(location => location.isPrimary) ?? entry.locations[0] ?? null;
}

export function getEntryDisplayPeriod(entry: ArchiveEntry): LocalizedText {
  return entry.temporal.label;
}

export function getEntryPrimaryMedia(entry: ArchiveEntry): MediaAsset {
  return entry.media[0] ?? {
    id: `${entry.id}-placeholder`,
    kind: "placeholder",
    src: null,
    thumbnailSrc: null,
    alt: entry.title,
    rightsStatus: "unknown",
  };
}

export function getEntryEvidenceLabel(entry: ArchiveEntry): string {
  return entry.evidenceGrades.length > 0 ? entry.evidenceGrades.join(" / ") : "D";
}

export function getEntryMapVisibility(entry: ArchiveEntry, range: HistoricalRange, includeUndated: boolean): EntryMapVisibility {
  const location = getEntryPrimaryLocation(entry);
  if (!location || location.latitude === null || location.longitude === null) return "no-location";
  if (entry.temporal.startYear === null || entry.temporal.endYear === null) {
    return includeUndated ? "undated" : "no-location";
  }
  return rangesOverlap(entry.temporal.startYear, entry.temporal.endYear, range) ? "visible" : "no-location";
}

function matchesText(entry: ArchiveEntry, searchQuery: string): boolean {
  const query = searchQuery.trim().toLocaleLowerCase();
  if (!query) return true;
  const locationText = entry.locations.flatMap(location => [location.name.en, location.name.zh]);
  const haystack = [
    entry.title.en,
    entry.title.zh,
    entry.originalName ?? "",
    entry.summary.en,
    entry.summary.zh,
    ...entry.aliases,
    ...locationText,
  ].join(" ").toLocaleLowerCase();
  return haystack.includes(query);
}

function matchesAny(entryValues: string[], requested: string[], normalizer: (value: string) => string): boolean {
  if (requested.length === 0) return true;
  const normalizedValues = entryValues.map(normalizer);
  return requested.some(value => normalizedValues.includes(normalizer(value)));
}

export function selectEntriesInTimeRange(
  entries: ArchiveEntry[],
  range: HistoricalRange,
  includeUndated: boolean,
): ArchiveEntry[] {
  return entries.filter(entry => {
    const { startYear, endYear } = entry.temporal;
    if (startYear === null || endYear === null) return includeUndated;
    return rangesOverlap(startYear, endYear, range);
  });
}

export function selectEntriesByFilters(entries: ArchiveEntry[], filters: AtlasFilters): ArchiveEntry[] {
  return selectEntriesInTimeRange(entries, filters.timeRange, filters.includeUndated).filter(entry =>
    matchesText(entry, filters.searchQuery)
    && matchesAny(entry.sourceTypeIds, filters.selectedSourceIds, sourceTypeId)
    && matchesAny(entry.culturalMeaningIds, filters.selectedMeaningIds, meaningId)
    && matchesAny(entry.objectTypeIds, filters.selectedObjectTypeIds, objectTypeId),
  );
}

function clusterEntries(entries: ArchiveEntry[], getLocation: (entry: ArchiveEntry) => ArchiveLocation | null): RegionCluster[] {
  const grouped = new Map<string, { location: ArchiveLocation; entries: ArchiveEntry[] }>();
  entries.forEach(entry => {
    const location = getLocation(entry);
    if (!location || location.latitude === null || location.longitude === null) return;
    const groupId = location.regionId ?? coordinateKey(location.longitude, location.latitude);
    const existing = grouped.get(groupId);
    if (existing) existing.entries.push(entry);
    else grouped.set(groupId, { location, entries: [entry] });
  });

  return Array.from(grouped.entries()).map(([id, group]) => {
    const coordinates = group.entries
      .map(entry => getLocation(entry))
      .filter((location): location is ArchiveLocation => location?.latitude !== null && location?.longitude !== null);
    const startYears = group.entries.map(entry => entry.temporal.startYear).filter((year): year is number => year !== null);
    const endYears = group.entries.map(entry => entry.temporal.endYear).filter((year): year is number => year !== null);
    return {
      id,
      label: group.location.name,
      center: {
        latitude: coordinates.reduce((sum, location) => sum + (location.latitude ?? 0), 0) / Math.max(1, coordinates.length),
        longitude: coordinates.reduce((sum, location) => sum + (location.longitude ?? 0), 0) / Math.max(1, coordinates.length),
      },
      count: group.entries.length,
      entryIds: group.entries.map(entry => entry.id),
      startYear: startYears.length > 0 ? Math.min(...startYears) : null,
      endYear: endYears.length > 0 ? Math.max(...endYears) : null,
    };
  });
}

export function selectRegionClusters(entries: ArchiveEntry[]): RegionCluster[] {
  return clusterEntries(entries, getEntryPrimaryLocation);
}

export function selectEntriesForRegion(entries: ArchiveEntry[], regionId: string): ArchiveEntry[] {
  return entries.filter(entry => entry.locations.some(location => location.regionId === regionId));
}

export function selectLocationClusters(entries: ArchiveEntry[]): LocationCluster[] {
  const groups = new Map<string, ArchiveEntry[]>();
  entries.forEach(entry => {
    const location = getEntryPrimaryLocation(entry);
    const key = location ? `${location.regionId ?? "location"}:${coordinateKey(location.longitude, location.latitude)}` : "unknown";
    const group = groups.get(key);
    if (group) group.push(entry);
    else groups.set(key, [entry]);
  });
  return Array.from(groups.entries()).flatMap(([id, group]) => {
    const location = getEntryPrimaryLocation(group[0]);
    if (!location || location.latitude === null || location.longitude === null) return [];
    return [{
      ...clusterEntries(group, getEntryPrimaryLocation)[0],
      id,
      label: location.name,
      locationIds: group.flatMap(entry => entry.locations.map(item => item.id)),
    }];
  });
}

export function selectEntryById(entries: ArchiveEntry[], entryId: string | null): ArchiveEntry | null {
  return entryId ? entries.find(entry => entry.id === entryId) ?? null : null;
}

export function labelTaxonomyIds(ids: string[], language: Language): string[] {
  return ids.map(id => taxonomyLabel(id, language));
}
