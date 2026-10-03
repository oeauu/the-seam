import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ArchiveRecord, Language, LocationCluster } from "../types";
import { ARCHIVE_RECORDS } from "../data/records";
import type { CountryFeature } from "../geo/geoTypes";
import type { CountryMetadata } from "../data/countriesMeta";
import { getCountryMetadataForFeature } from "../geo/countryLookup";
import { clusterRecords } from "../geo/clustering";
import { calculateTimelineBounds, recordOverlapsRange } from "../timeline/timelineUtils";
import { parseRoute, pushRoute } from "./routing";

interface AppContextValue {
  language: Language;
  records: ArchiveRecord[];
  visibleRecords: ArchiveRecord[];
  clusters: LocationCluster[];
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
  setLanguage: (lang: Language) => void;
  openRecord: (record: ArchiveRecord) => void;
  closeRecord: () => void;
  selectCluster: (cluster: LocationCluster | null) => void;
  selectCountry: (country: CountryFeature, meta?: CountryMetadata) => void;
  returnToGlobe: () => void;
  setTimeRange: (start: number, end: number) => void;
  setTimelineCollapsed: (collapsed: boolean) => void;
  toggleTimelineCollapse: () => void;
  setSubmitOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
  setIndexOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("zh");
  const [viewMode, setViewMode] = useState<"globe" | "country">("globe");
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null);
  const [countryMeta, setCountryMeta] = useState<CountryMetadata | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ArchiveRecord | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<LocationCluster | null>(null);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [globeCameraPosition, setGlobeCameraPosition] = useState<[number, number, number]>([0, 0, 5.0]);

  // Timeline bounds calculated from vetted records
  const minRecordYear = useMemo(() => {
    return Math.min(...ARCHIVE_RECORDS.map(r => r.time.startYear));
  }, []);
  const [earliestYear, latestYear] = useMemo(() => calculateTimelineBounds(minRecordYear, 2026), [minRecordYear]);

  const [startYear, setStartYear] = useState<number>(earliestYear);
  const [endYear, setEndYear] = useState<number>(latestYear);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);

  // Sync with initial URL and popstate
  useEffect(() => {
    function handleRoute() {
      const route = parseRoute();
      if (route.kind === "record" && route.slug) {
        const found = ARCHIVE_RECORDS.find(r => r.slug === route.slug);
        if (found) {
          setSelectedRecord(found);
        }
      } else if (route.kind === "globe") {
        setSelectedRecord(null);
      }
    }

    handleRoute();
    window.addEventListener("popstate", handleRoute);
    return () => window.removeEventListener("popstate", handleRoute);
  }, []);

  // Filter records by timeline (if collapsed, shows ALL records)
  const visibleRecords = useMemo(() => {
    return ARCHIVE_RECORDS.filter(record =>
      recordOverlapsRange(record.time.startYear, record.time.endYear, startYear, endYear, isTimelineCollapsed)
    );
  }, [startYear, endYear, isTimelineCollapsed]);

  // Geographical clustering of visible records
  const clusters = useMemo(() => {
    return clusterRecords(visibleRecords);
  }, [visibleRecords]);

  const openRecord = (record: ArchiveRecord) => {
    setSelectedRecord(record);
    setSelectedCluster(null);
    pushRoute({ kind: "record", slug: record.slug });
  };

  const closeRecord = () => {
    setSelectedRecord(null);
    if (viewMode === "country" && selectedCountry) {
      pushRoute({ kind: "country", countryId: String(selectedCountry.id || "") });
    } else {
      pushRoute({ kind: "globe" });
    }
  };

  const selectCountry = (country: CountryFeature, meta?: CountryMetadata) => {
    setSelectedCountry(country);
    const resolvedMeta = meta || getCountryMetadataForFeature(country);
    setCountryMeta(resolvedMeta);
    setViewMode("country");
    pushRoute({ kind: "country", countryId: String(country.id || "") });
  };

  const returnToGlobe = () => {
    setViewMode("globe");
    setSelectedCountry(null);
    setCountryMeta(null);
    if (!selectedRecord) {
      pushRoute({ kind: "globe" });
    }
  };

  const setTimeRange = (start: number, end: number) => {
    setStartYear(start);
    setEndYear(end);
  };

  const setTimelineCollapsed = (collapsed: boolean) => {
    setIsTimelineCollapsed(collapsed);
    // When expanding timeline, default to full range as required by Section 8.4
    if (!collapsed) {
      setStartYear(earliestYear);
      setEndYear(latestYear);
    }
  };

  const toggleTimelineCollapse = () => {
    setTimelineCollapsed(!isTimelineCollapsed);
  };

  const value: AppContextValue = {
    language,
    records: ARCHIVE_RECORDS,
    visibleRecords,
    clusters,
    viewMode,
    selectedCountry,
    countryMeta,
    selectedRecord,
    selectedCluster,
    earliestYear,
    latestYear,
    startYear,
    endYear,
    isTimelineCollapsed,
    submitOpen,
    aboutOpen,
    indexOpen,
    searchQuery,
    globeCameraPosition,
    setGlobeCameraPosition,
    setLanguage,
    openRecord,
    closeRecord,
    selectCluster: setSelectedCluster,
    selectCountry,
    returnToGlobe,
    setTimeRange,
    setTimelineCollapsed,
    toggleTimelineCollapse,
    setSubmitOpen,
    setAboutOpen,
    setIndexOpen,
    setSearchQuery,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
