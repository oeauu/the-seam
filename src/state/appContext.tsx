import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ArchiveRecord, Language, LocationCluster } from "../types";
import { ALL_RECORDS, findRecord } from "../data/archive";
import type { CountryFeature } from "../geo/geoTypes";
import type { CountryMetadata } from "../data/countriesMeta";
import { getCountryMetadataForFeature } from "../geo/countryLookup";
import { clusterRecords } from "../geo/clustering";
import { calculateTimelineBounds, recordOverlapsRange } from "../timeline/timelineUtils";
import { parseRoute, pushRoute } from "./routing";
import { loadWorldData, latLngToVector3 } from "../geo/worldGeometry";
import { normalizeYear } from "../timeline/timelineUtils";

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
  const [globeCameraPosition, setGlobeCameraPosition] = useState<[number, number, number]>(() => [0, 0, Math.max(6.5, 6.5 / Math.max(0.5, window.innerWidth / Math.max(300, window.innerHeight - 220)))]);
  const [globeFocus, setGlobeFocus] = useState<{ position: [number, number, number]; token: number } | null>(null);
  const focusGlobe = (longitude: number, latitude: number) => {
    const position = latLngToVector3(latitude, longitude, 6.5);
    setGlobeCameraPosition(position);
    setGlobeFocus(previous => ({ position, token: (previous?.token || 0) + 1 }));
  };

  // Timeline bounds calculated from vetted records
  const minRecordYear = useMemo(() => {
    return Math.min(...ALL_RECORDS.flatMap(r => r.time.startYear === null ? [] : [r.time.startYear]));
  }, []);
  const [earliestYear, latestYear] = useMemo(() => calculateTimelineBounds(minRecordYear), [minRecordYear]);

  const [startYear, setStartYear] = useState<number>(earliestYear);
  const [endYear, setEndYear] = useState<number>(latestYear);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);

  // Sync with initial URL and popstate
  useEffect(() => {
    let routeVersion = 0;
    function handleRoute() {
      const version = ++routeVersion;
      const route = parseRoute();
      const routeHref = window.location.href;
      const found = route.kind === "record" && route.slug ? findRecord(route.slug) : null;
      setSelectedRecord(found || null);
      setSelectedCluster(null);
      if (!route.countryId) {
        setViewMode("globe");
        setSelectedCountry(null);
        setCountryMeta(null);
        if (found?.place.coordinates) focusGlobe(found.place.coordinates.longitude, found.place.coordinates.latitude);
      } else {
        void loadWorldData().then(data => {
          if (version !== routeVersion || window.location.href !== routeHref) return;
          const country = data.features.find(f => String(f.id) === route.countryId);
          setSelectedCountry(country || null);
          setCountryMeta(country ? getCountryMetadataForFeature(country) : null);
          setViewMode(country ? "country" : "globe");
        }).catch(() => { if (version === routeVersion) setViewMode("globe"); });
      }
      setIndexOpen(window.location.pathname === "/archive");
      setSubmitOpen(window.location.pathname === "/submit");
      setAboutOpen(window.location.pathname === "/about");
    }

    handleRoute();
    window.addEventListener("popstate", handleRoute);
    return () => { routeVersion++; window.removeEventListener("popstate", handleRoute); };
  }, []);

  // Filter records by timeline (if collapsed, shows ALL records)
  const visibleRecords = useMemo(() => {
    const allEras = isTimelineCollapsed || (startYear === earliestYear && endYear === latestYear);
    return ALL_RECORDS.filter(record =>
      recordOverlapsRange(record.time.startYear, record.time.endYear, startYear, endYear, allEras)
    );
  }, [startYear, endYear, isTimelineCollapsed, earliestYear, latestYear]);

  // Geographical clustering of visible records
  const clusters = useMemo(() => {
    return clusterRecords(visibleRecords);
  }, [visibleRecords]);

  const openRecord = (record: ArchiveRecord, locate = false) => {
    if (locate && record.place.coordinates) {
      setViewMode("globe");
      setSelectedCountry(null);
      setCountryMeta(null);
      focusGlobe(record.place.coordinates.longitude, record.place.coordinates.latitude);
    }
    setSelectedRecord(record);
    setSelectedCluster(null);
    pushRoute({ kind: "record", slug: record.slug, countryId: !locate && viewMode === "country" ? String(selectedCountry?.id) : undefined });
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
    setSelectedRecord(null);
    setSelectedCluster(null);
    pushRoute({ kind: "country", countryId: String(country.id || "") });
  };

  const returnToGlobe = (resetHome = false) => {
    setViewMode("globe");
    setSelectedCountry(null);
    setCountryMeta(null);
    setSelectedCluster(null);
    if (resetHome) {
      setSelectedRecord(null);
      pushRoute({kind:"globe"});
    } else if (!selectedRecord) {
      pushRoute({ kind: "globe" });
    } else {
      pushRoute({kind:"record",slug:selectedRecord.slug});
    }
  };

  const setTimeRange = (start: number, end: number) => {
    if (!Number.isFinite(start) || !Number.isFinite(end)) return;
    const nextStart = normalizeYear(Math.max(earliestYear, Math.min(latestYear, start)), start < startYear ? -1 : 1);
    const nextEnd = normalizeYear(Math.max(nextStart, Math.min(latestYear, end)), end < endYear ? -1 : 1);
    setStartYear(nextStart);
    setEndYear(nextEnd);
    setSelectedCluster(null);
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
    records: ALL_RECORDS,
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
    globeFocus,
    focusGlobe,
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
