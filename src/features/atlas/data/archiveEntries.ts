import { GEOGRAPHY_DATABASE } from "../../../db/geography";
import { EVENTS_DATA, type HistoricalEvent } from "../../../db/eventsData";
import { MOCK_ENTRIES, type MockEntry } from "../../../db/mockData";
import { meaningId, objectTypeId, sourceTypeId } from "./taxonomy";
import type {
  ArchiveEntry,
  ArchiveLocation,
  EvidenceGrade,
  LocalizedText,
  LocationPrecision,
  MediaAsset,
  SourceReference,
  TemporalPrecision,
} from "../types";
import { normalizeHistoricalYear } from "../utils/time";

function localized(value: { en: string; zh: string }): LocalizedText {
  return { en: value.en, zh: value.zh };
}

function slugify(value: string): string {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function precision(value: string): LocationPrecision {
  const normalized = value.toLocaleLowerCase();
  if (normalized.includes("city")) return "city";
  if (normalized.includes("country")) return "country";
  if (normalized.includes("region")) return "cultural-region";
  return "unknown";
}

function temporalPrecision(startYear: number, endYear: number): TemporalPrecision {
  if (startYear === endYear) return "exact";
  if (Math.abs(endYear - startYear) >= 100) return "period";
  return "year";
}

function inferRegionId(longitude: number | null, latitude: number | null): string | null {
  if (longitude === null || latitude === null) return null;
  if (longitude >= 100 && latitude >= 0) return "east-asia";
  if (longitude >= 60 && longitude < 100 && latitude >= -10 && latitude <= 40) return "south-asia";
  if (longitude >= -15 && longitude < 40 && latitude >= 30) return "europe";
  if (longitude >= 30 && longitude < 65 && latitude < 40) return "west-asia";
  if (longitude >= -20 && longitude < 45 && latitude < 30) return "north-africa";
  return "global";
}

function mediaForEntry(entryId: string, title: LocalizedText): MediaAsset[] {
  return [{
    id: `${entryId}-placeholder`,
    kind: "placeholder",
    src: null,
    thumbnailSrc: null,
    alt: title,
    rightsStatus: "unknown",
    rightsNote: { zh: "开发占位卡，尚未绑定经核验媒体。", en: "Development placeholder; no reviewed media attached." },
  }];
}

function locationForMock(entry: MockEntry): ArchiveLocation {
  const [longitude, latitude] = entry.coordinates;
  return {
    id: `${entry.id}-primary-location`,
    name: localized(entry.region),
    longitude,
    latitude,
    precision: precision(entry.locationPrecision),
    regionId: inferRegionId(longitude, latitude),
    isPrimary: true,
  };
}

function referencesForMock(entry: MockEntry): SourceReference[] {
  return entry.references.en.map((title, index) => ({
    id: `${entry.id}-reference-${index + 1}`,
    title,
    sourceTypeId: sourceTypeId(entry.sourceCategory),
    language: "en",
    note: entry.references.zh[index] ? { en: title, zh: entry.references.zh[index] } : undefined,
  }));
}

function toEvidenceGrades(value: string): EvidenceGrade[] {
  return value.split("/").map(item => item.trim()).filter((item): item is EvidenceGrade => ["A", "B", "C", "D"].includes(item));
}

function fromMockEntry(entry: MockEntry): ArchiveEntry {
  const title = localized(entry.title);
  return {
    id: entry.id,
    slug: slugify(entry.id),
    title,
    originalName: entry.originalName,
    aliases: [...entry.alias.en, ...entry.alias.zh],
    summary: localized(entry.summary),
    description: localized(entry.description),
    temporal: {
      startYear: normalizeHistoricalYear(entry.startYear),
      endYear: normalizeHistoricalYear(entry.endYear),
      precision: temporalPrecision(entry.startYear, entry.endYear),
      label: localized(entry.periodLabel),
      notes: localized(entry.riskDetail),
    },
    locations: [locationForMock(entry)],
    sourceTypeIds: [sourceTypeId(entry.sourceCategory), sourceTypeId(entry.sourceSubcategory)],
    objectTypeIds: entry.objectTypes.map(objectTypeId),
    culturalMeaningIds: entry.culturalMeanings.map(meaningId),
    evidenceGrades: toEvidenceGrades(entry.evidenceGrade),
    interpretationRisks: [{ en: entry.riskDetail.en, zh: entry.riskDetail.zh }],
    references: referencesForMock(entry),
    media: mediaForEntry(entry.id, title),
    contentStatus: "demo",
    contributorName: "Museum Curation",
    reviewStatus: "approved",
  };
}

function cityForEvent(location: { en: string; zh: string }): { id: string; name: LocalizedText; coords: [number, number] } | null {
  const match = Object.entries(GEOGRAPHY_DATABASE.cities).find(([key, city]) =>
    key === location.en || city.name.en === location.en || city.name.zh === location.zh,
  );
  if (!match) return null;
  return { id: match[0], name: localized(match[1].name), coords: match[1].coords };
}

function eventReference(entryId: string, event: HistoricalEvent, index: number): SourceReference {
  return {
    id: `${entryId}-reference-${index}`,
    title: event.source.en,
    sourceTypeId: "institutional",
    language: "en",
    note: localized(event.source),
  };
}

function fromHistoricalEvent(
  location: { en: string; zh: string },
  year: number,
  event: HistoricalEvent,
  index: number,
): ArchiveEntry {
  const normalizedYear = normalizeHistoricalYear(year);
  const id = `event-${slugify(location.en)}-${normalizedYear}-${slugify(event.name.en)}-${index}`;
  const title = localized(event.name);
  const city = cityForEvent(location);
  const archiveLocation: ArchiveLocation = city ? {
    id: `${id}-location`,
    name: city.name,
    longitude: city.coords[0],
    latitude: city.coords[1],
    precision: "city",
    regionId: inferRegionId(city.coords[0], city.coords[1]),
    isPrimary: true,
  } : {
    id: `${id}-location`,
    name: localized(location),
    longitude: null,
    latitude: null,
    precision: "unknown",
    regionId: null,
    isPrimary: true,
  };
  return {
    id,
    slug: slugify(id),
    title,
    aliases: [],
    summary: localized(event.summary),
    description: localized(event.summary),
    temporal: {
      startYear: normalizedYear,
      endYear: normalizedYear,
      precision: "exact",
      label: normalizedYear === year ? localized({ en: `${Math.abs(year)} ${year < 0 ? "BCE" : "CE"}`, zh: year < 0 ? `公元前${Math.abs(year)}年` : `公元${year}年` }) : { en: "1 CE", zh: "公元1年" },
    },
    locations: [archiveLocation],
    sourceTypeIds: ["institutional"],
    objectTypeIds: ["event"],
    culturalMeaningIds: ["local-memory"],
    evidenceGrades: ["D"],
    interpretationRisks: [{ zh: "该条目来自当前仓库的演示事件数据，尚待史料核验。", en: "This entry is migrated from demo event data and awaits source review." }],
    references: [eventReference(id, event, index)],
    media: mediaForEntry(id, title),
    contentStatus: "demo",
    contributorName: event.contributor.en,
    reviewStatus: "approved",
  };
}

const mockEntries = MOCK_ENTRIES.map(fromMockEntry);
const eventEntries = EVENTS_DATA.flatMap(group => group.events.map((event, index) => fromHistoricalEvent(group.location, group.year, event, index)));

export const ARCHIVE_ENTRIES: ArchiveEntry[] = [...mockEntries, ...eventEntries];

export const ARCHIVE_ENTRY_BY_ID: ReadonlyMap<string, ArchiveEntry> = new Map(
  ARCHIVE_ENTRIES.map(entry => [entry.id, entry]),
);
