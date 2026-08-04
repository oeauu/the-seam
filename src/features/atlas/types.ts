export type Language = "en" | "zh";

export interface LocalizedText {
  zh: string;
  en: string;
  original?: string;
}

export type ContentStatus = "demo" | "reviewed" | "published";
export type EvidenceGrade = "A" | "B" | "C" | "D";
export type TemporalPrecision =
  | "exact"
  | "year"
  | "decade"
  | "century"
  | "period"
  | "legendary"
  | "unknown";

export type HistoricalYear = number;

export interface TemporalExtent {
  startYear: HistoricalYear | null;
  endYear: HistoricalYear | null;
  precision: TemporalPrecision;
  label: LocalizedText;
  notes?: LocalizedText;
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
  language?: string;
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
  reviewStatus: "draft" | "pending" | "needs-revision" | "approved";
  createdAt?: string;
  updatedAt?: string;
}

export interface HistoricalRange {
  start: HistoricalYear | null;
  end: HistoricalYear | null;
}

export interface AtlasFilters {
  searchQuery: string;
  selectedSourceIds: string[];
  selectedMeaningIds: string[];
  selectedObjectTypeIds: string[];
  timeRange: HistoricalRange;
  includeUndated: boolean;
}

export type AtlasRenderMode = "auto" | "3d" | "2d";
export type AtlasSceneMode = "global" | "region" | "focused";
export type AtlasTransition = "idle" | "entering" | "focusing" | "returning";
export type AtlasQualityLevel = "high" | "medium" | "low";
export type AtlasMotionProfile = "full" | "reduced";

export interface CameraPose {
  position: [number, number, number];
  target: [number, number, number];
  zoom?: number;
}

export interface AtlasState {
  renderMode: AtlasRenderMode;
  qualityLevel: AtlasQualityLevel;
  motionProfile: AtlasMotionProfile;
  sceneMode: AtlasSceneMode;
  selectedRegionId: string | null;
  selectedLocationGroupId: string | null;
  selectedEntryId: string | null;
  previousCameraPose: CameraPose | null;
  previewRange: HistoricalRange;
  committedRange: HistoricalRange;
  isTimelineDragging: boolean;
  hoveredMarkerId: string | null;
  /** @deprecated Use previewRange and committedRange for timeline state. */
  timeRange: HistoricalRange;
  includeUndated: boolean;
  selectedSourceIds: string[];
  selectedMeaningIds: string[];
  selectedObjectTypeIds: string[];
  cameraTransition: AtlasTransition;
}
