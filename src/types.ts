export type Language = "en" | "zh";

export interface LocalizedString {
  en: string;
  zh: string;
}

/** Negative for BCE (e.g. -2400 = 2400 BCE), positive for CE. There is no year 0. */
export type HistoricalYear = number;

export interface TimeExtent {
  startYear: HistoricalYear | null;
  endYear: HistoricalYear | null;
  label: LocalizedString;
  certainty?: "exact" | "approximate" | "period" | "legendary";
  periods?: Array<{ startYear: HistoricalYear; endYear: HistoricalYear; label: LocalizedString }>;
}

export interface Coordinates {
  longitude: number;
  latitude: number;
}

export type LocationPrecision =
  | "exact"
  | "city"
  | "region"
  | "cultural-region"
  | "transregional"
  | "pending";

export type LocationRelation =
  | "event-site"
  | "burial-site"
  | "activity-area"
  | "cultural-origin"
  | "residence"
  | "court-site"
  | "representative";

export interface PlaceInfo {
  name: LocalizedString;
  historicalName?: LocalizedString;
  countryName?: LocalizedString;
  countryCode?: string;
  coordinates: Coordinates | null;
  precision: LocationPrecision;
  relation: LocationRelation;
  notes?: LocalizedString;
}

export interface SourceReference {
  title: string;
  author?: string;
  year?: string | number;
  citation?: string;
  url?: string;
  note?: LocalizedString;
}

export interface RecordImage {
  src: string;
  caption?: LocalizedString;
  credit?: string;
  sourceUrl?: string;
}

export interface ArchiveRecord {
  id: string;
  slug: string;
  title: LocalizedString;
  originalName?: string;
  aliases: string[];
  summary: LocalizedString;
  body: LocalizedString;
  time: TimeExtent;
  place: PlaceInfo;
  historiographyNote?: LocalizedString;
  images?: RecordImage[];
  sources: SourceReference[];
  reviewNote?: LocalizedString;
  legacySlugs?: string[];
}

export interface LocationCluster {
  id: string;
  name: LocalizedString;
  coordinates: Coordinates;
  recordIds: string[];
  records: ArchiveRecord[];
}
