import { createContext, useContext } from "react";
import type { ArchiveRecord, Language, LocationCluster } from "../types";
import type { CountryFeature } from "../geo/geoTypes";
import type { CountryMetadata } from "../data/countriesMeta";

export interface AppContextValue {
  language: Language;
  records: ArchiveRecord[];
  visibleRecords: ArchiveRecord[];
  viewMode: "globe" | "country";
  selectedCountry: CountryFeature | null;
  countryMeta: CountryMetadata | null;
  selectedRecord: ArchiveRecord | null;
  selectedCluster: LocationCluster | null;
  earliestYear: number;
  latestYear: number;
  startYear: number;
  endYear: number;
  isTimelineCollapsed: boolean;
  submitOpen: boolean;
  aboutOpen: boolean;
  indexOpen: boolean;
  searchQuery: string;
  globeCameraPosition: [number, number, number];
  setGlobeCameraPosition: (pos: [number, number, number]) => void;
  globeFocus: { position: [number, number, number]; token: number } | null;
  focusGlobe: (longitude: number, latitude: number) => void;
  setLanguage: (lang: Language) => void;
  openRecord: (record: ArchiveRecord, locate?: boolean) => void;
  closeRecord: () => void;
  selectCluster: (cluster: LocationCluster | null) => void;
  selectCountry: (country: CountryFeature, meta?: CountryMetadata) => void;
  returnToGlobe: (resetHome?: boolean) => void;
  setTimeRange: (start: number, end: number) => void;
  setTimelineCollapsed: (collapsed: boolean) => void;
  toggleTimelineCollapse: () => void;
  setSubmitOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
  setIndexOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  addSubmittedRecord: (record: ArchiveRecord) => void;
}

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
