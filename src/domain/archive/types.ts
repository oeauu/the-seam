export type Language = "en" | "zh";

export interface LocalizedText {
  en: string;
  zh: string;
  original?: string;
}

export type HistoricalYear = number;

export interface HistoricalRange {
  start: HistoricalYear | null;
  end: HistoricalYear | null;
}

export type TemporalPrecision =
  | "exact"
  | "year"
  | "decade"
  | "century"
  | "period"
  | "legendary"
  | "unknown";

export interface TemporalExtent {
  startYear: HistoricalYear | null;
  endYear: HistoricalYear | null;
  precision: TemporalPrecision;
  label: LocalizedText;
  notes?: LocalizedText;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type LocationPrecision =
  | "exact"
  | "city"
  | "region"
  | "country"
  | "cultural-region"
  | "transregional"
  | "unknown";

export interface ArchiveLocation {
  id: string;
  name: LocalizedText;
  latitude: number | null;
  longitude: number | null;
  precision: LocationPrecision;
  regionId: string | null;
  isPrimary: boolean;
  notes?: LocalizedText;
}

export type EvidenceGrade = "A" | "B" | "C" | "D";
export type ContentStatus = "demo" | "reviewed" | "published";
export type ReviewStatus = "draft" | "pending" | "needs-revision" | "approved";

export type MediaKind =
  | "image"
  | "document"
  | "text"
  | "oral-history"
  | "legal-record"
  | "placeholder";

export interface MediaAsset {
  id: string;
  kind: MediaKind;
  src: string | null;
  thumbnailSrc: string | null;
  alt: LocalizedText;
  caption?: LocalizedText;
  creator?: string;
  date?: string;
  rightsStatus:
    | "public-domain"
    | "licensed"
    | "fair-use-review-required"
    | "unknown";
  rightsNote?: LocalizedText;
  sourceUrl?: string;
}

export interface SourceReference {
  id: string;
  title: string;
  author?: string;
  year?: string;
  sourceTypeId: string;
  citation?: string;
  url?: string;
  language?: Language;
  note?: LocalizedText;
}

export interface ArchiveEntry {
  id: string;
  slug: string;
  title: LocalizedText;
  originalName?: string;
  aliases: string[];
  summary: LocalizedText;
  description: LocalizedText;
  temporal: TemporalExtent;
  locations: ArchiveLocation[];
  sourceTypeIds: string[];
  objectTypeIds: string[];
  culturalMeaningIds: string[];
  evidenceGrades: EvidenceGrade[];
  interpretationRisks: LocalizedText[];
  references: SourceReference[];
  media: MediaAsset[];
  contentStatus: ContentStatus;
  contributorName: string;
  reviewStatus: ReviewStatus;
  createdAt?: string;
  updatedAt?: string;
}

export type EntryPreviewVisibility = "visible" | "hidden" | "undated";

export interface LocationGroup {
  id: string;
  locationId: string | null;
  name: LocalizedText;
  displayName: LocalizedText;
  latitude: number;
  longitude: number;
  precision: LocationPrecision;
  priority: number;
  entryIds: string[];
  regionId: string;
}

export interface CoordinateTolerance {
  radiusKilometers: number;
  latitudeDegrees: number;
  longitudeDegrees: number;
}

export interface GroupableCoordinate extends Coordinates {
  precision: LocationPrecision;
}
