import { EVENTS_DATA, type HistoricalEvent } from "../../db/eventsData";
import { GEOGRAPHY_DATABASE } from "../../db/geography";
import { MOCK_ENTRIES, type MockEntry } from "../../db/mockData";
import {
  formatHistoricalYear,
  normalizeHistoricalYear,
} from "./time";
import type {
  ArchiveEntry,
  ArchiveLocation,
  EvidenceGrade,
  LocalizedText,
  LocationPrecision,
  MediaAsset,
  SourceReference,
  TemporalPrecision,
} from "./types";

interface LocalizedValue {
  en: string;
  zh: string;
}

function localized(value: LocalizedValue): LocalizedText {
  return { en: value.en, zh: value.zh };
}

function slugify(value: string): string {
  return value
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function taxonomyId(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase()
    .replace(/[–—−]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const SOURCE_ALIASES: Readonly<Record<string, string>> = {
  "historical documents": "institutional",
  "textual sources": "textual",
  "cultural memory": "cultural-memory",
  "modern research": "modern-research",
  "modern reinterpretation": "modern-reinterpretation",
};

const MEANING_ALIASES: Readonly<Record<string, string>> = {
  sacred: "sacredness",
  taboo: "stigma",
  guardian: "guardianship",
  "local memory": "local-memory",
  "modern re-activation": "modern-reactivation",
  favoritism: "power-intimacy",
  "power intimacy": "power-intimacy",
  "poetic desire": "literary-symbolization",
  "female intimacy": "non-institutional-intimacy",
  reclaiming: "reclamation",
  "performative disguise": "performance",
  "border body": "transformation",
  "artistic image": "visual-artwork",
};

const OBJECT_ALIASES: Readonly<Record<string, string>> = {
  "historical figures": "historical-person",
  "historical figure": "historical-person",
  "historical allusion": "historical-allusion",
  deity: "religious-figure",
  "mythological figure": "mythological-figure",
  "modern reinterpretation": "modern-reinterpretation",
  poet: "literary-character",
  "literary character": "literary-character",
  "theatrical image": "performance-figure",
  "social identity": "social-role",
};

function sourceTypeId(value: string): string {
  const key = value.trim().toLocaleLowerCase();
  return SOURCE_ALIASES[key] ?? taxonomyId(value);
}

function meaningId(value: string): string {
  const key = value.trim().toLocaleLowerCase();
  return MEANING_ALIASES[key] ?? taxonomyId(value);
}

function objectTypeId(value: string): string {
  const key = value.trim().toLocaleLowerCase();
  return OBJECT_ALIASES[key] ?? taxonomyId(value);
}

function locationPrecision(value: string): LocationPrecision {
  const normalized = value.trim().toLocaleLowerCase();
  if (normalized.includes("exact")) return "exact";
  if (normalized.includes("city")) return "city";
  if (normalized.includes("country")) return "country";
  if (normalized.includes("cultural")) return "cultural-region";
  if (normalized.includes("transregional")) return "transregional";
  if (normalized.includes("region")) return "region";
  return "unknown";
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

function temporalPrecision(startYear: number, endYear: number): TemporalPrecision {
  const start = normalizeHistoricalYear(startYear);
  const end = normalizeHistoricalYear(endYear);
  const distance = Math.abs(end - start);
  if (distance === 0) return "exact";
  if (distance >= 100) return "period";
  if (distance >= 10) return "decade";
  return "year";
}

function mediaForEntry(entryId: string, title: LocalizedText): MediaAsset[] {
  return [{
    id: `${entryId}-placeholder`,
    kind: "placeholder",
    src: null,
    thumbnailSrc: null,
    alt: { ...title },
    rightsStatus: "unknown",
    rightsNote: {
      en: "Development placeholder; no reviewed media attached.",
      zh: "开发占位卡，尚未绑定经过审核的媒体。",
    },
  }];
}

function locationForMock(entry: MockEntry): ArchiveLocation {
  const [longitude, latitude] = entry.coordinates;
  return {
    id: `${entry.id}-primary-location`,
    name: localized(entry.region),
    longitude,
    latitude,
    precision: locationPrecision(entry.locationPrecision),
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
    note: entry.references.zh[index]
      ? { en: title, zh: entry.references.zh[index] }
      : undefined,
  }));
}

function evidenceGrades(value: string): EvidenceGrade[] {
  return value
    .split("/")
    .map(item => item.trim())
    .filter((item): item is EvidenceGrade => ["A", "B", "C", "D"].includes(item));
}

function fromMockEntry(entry: MockEntry): ArchiveEntry {
  const title = localized(entry.title);
  const startYear = normalizeHistoricalYear(entry.startYear);
  const endYear = normalizeHistoricalYear(entry.endYear);
  return {
    id: entry.id,
    slug: slugify(entry.id),
    title,
    originalName: entry.originalName,
    aliases: [...entry.alias.en, ...entry.alias.zh],
    summary: localized(entry.summary),
    description: localized(entry.description),
    temporal: {
      startYear,
      endYear,
      precision: temporalPrecision(startYear, endYear),
      label: localized(entry.periodLabel),
      notes: localized(entry.riskDetail),
    },
    locations: [locationForMock(entry)],
    sourceTypeIds: [sourceTypeId(entry.sourceCategory), sourceTypeId(entry.sourceSubcategory)],
    objectTypeIds: entry.objectTypes.map(objectTypeId),
    culturalMeaningIds: entry.culturalMeanings.map(meaningId),
    evidenceGrades: evidenceGrades(entry.evidenceGrade),
    interpretationRisks: [localized(entry.riskDetail)],
    references: referencesForMock(entry),
    media: mediaForEntry(entry.id, title),
    contentStatus: "demo",
    contributorName: "Museum Curation",
    reviewStatus: "approved",
  };
}

interface CityMatch {
  id: string;
  name: LocalizedText;
  coordinates: [number, number];
}

function cityForEvent(location: LocalizedValue): CityMatch | null {
  const match = Object.entries(GEOGRAPHY_DATABASE.cities).find(([key, city]) => (
    key === location.en
    || city.name.en === location.en
    || city.name.zh === location.zh
  ));
  if (!match) return null;

  return {
    id: match[0],
    name: localized(match[1].name),
    coordinates: match[1].coords,
  };
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
  location: LocalizedValue,
  year: number,
  event: HistoricalEvent,
  index: number,
): ArchiveEntry {
  const normalizedYear = normalizeHistoricalYear(year);
  const id = `event-${slugify(location.en)}-${normalizedYear}-${slugify(event.name.en)}-${index}`;
  const title = localized(event.name);
  const city = cityForEvent(location);
  const archiveLocation: ArchiveLocation = city
    ? {
      id: `${id}-location`,
      name: city.name,
      longitude: city.coordinates[0],
      latitude: city.coordinates[1],
      precision: "city",
      regionId: inferRegionId(city.coordinates[0], city.coordinates[1]),
      isPrimary: true,
    }
    : {
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
      label: {
        en: formatHistoricalYear(normalizedYear, "en"),
        zh: formatHistoricalYear(normalizedYear, "zh"),
      },
    },
    locations: [archiveLocation],
    sourceTypeIds: ["institutional"],
    objectTypeIds: ["event"],
    culturalMeaningIds: ["local-memory"],
    evidenceGrades: ["D"],
    interpretationRisks: [{
      en: "This entry is migrated from demo event data and awaits source review.",
      zh: "该条目迁移自演示事件数据，仍待史料核验。",
    }],
    references: [eventReference(id, event, index)],
    media: mediaForEntry(id, title),
    contentStatus: "demo",
    contributorName: event.contributor.en,
    reviewStatus: "approved",
  };
}

const DEMO_ARCHIVE_ENTRIES: ArchiveEntry[] = [
  ...MOCK_ENTRIES.map(fromMockEntry),
  ...EVENTS_DATA.flatMap(group => (
    group.events.map((event, index) => fromHistoricalEvent(group.location, group.year, event, index))
  )),
];

function cloneLocalizedText(value: LocalizedText): LocalizedText {
  return { ...value };
}

function cloneArchiveEntry(entry: ArchiveEntry): ArchiveEntry {
  return {
    ...entry,
    title: cloneLocalizedText(entry.title),
    aliases: [...entry.aliases],
    summary: cloneLocalizedText(entry.summary),
    description: cloneLocalizedText(entry.description),
    temporal: {
      ...entry.temporal,
      label: cloneLocalizedText(entry.temporal.label),
      notes: entry.temporal.notes ? cloneLocalizedText(entry.temporal.notes) : undefined,
    },
    locations: entry.locations.map(location => ({
      ...location,
      name: cloneLocalizedText(location.name),
      notes: location.notes ? cloneLocalizedText(location.notes) : undefined,
    })),
    sourceTypeIds: [...entry.sourceTypeIds],
    objectTypeIds: [...entry.objectTypeIds],
    culturalMeaningIds: [...entry.culturalMeaningIds],
    evidenceGrades: [...entry.evidenceGrades],
    interpretationRisks: entry.interpretationRisks.map(cloneLocalizedText),
    references: entry.references.map(reference => ({
      ...reference,
      note: reference.note ? cloneLocalizedText(reference.note) : undefined,
    })),
    media: entry.media.map(media => ({
      ...media,
      alt: cloneLocalizedText(media.alt),
      caption: media.caption ? cloneLocalizedText(media.caption) : undefined,
      rightsNote: media.rightsNote ? cloneLocalizedText(media.rightsNote) : undefined,
    })),
  };
}

export function getArchiveEntries(): readonly ArchiveEntry[] {
  return DEMO_ARCHIVE_ENTRIES.map(cloneArchiveEntry);
}
