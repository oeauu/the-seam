import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ArchiveRecord, Language, LocationCluster } from "../types";
import { ALL_RECORDS } from "../data/archive";
import type { CountryFeature } from "../geo/geoTypes";
import type { CountryMetadata } from "../data/countriesMeta";
import { getCountryMetadataForFeature } from "../geo/countryLookup";
import {
  TIMELINE_DEFAULT_EARLIEST_YEAR,
  calculateTimelineBounds,
  normalizeYear,
  recordOverlapsRange,
  timelinePeriods,
} from "../timeline/timelineUtils";
import { buildRoutePath, isModalPath, parseRoute, pushRoute, withBasePath } from "./routing";
import { loadWorldData, latLngToVector3 } from "../geo/worldGeometry";
import { AppContext, type AppContextValue } from "./useApp";

const SUBMISSIONS_STORAGE_KEY = "the-seam:user-submissions:v1";

function loadSubmittedRecords(): ArchiveRecord[] {
  try {
    const raw = window.localStorage.getItem(SUBMISSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const records = parsed.filter(
      (item): item is ArchiveRecord =>
        Boolean(item)
        && typeof item.id === "string"
        && typeof item.slug === "string"
        && Boolean(item.title?.zh || item.title?.en)
        && Boolean(item.place?.name)
        && Boolean(item.time?.label),
    );
    const cleaned = records.filter(record => {
      if (!record.id.startsWith("submission-")) return true;
      const numberedTest = record.id === "submission-1-1794858284222";
      const theodoreTest = record.title.zh === "Theodore"
        && record.title.en === "Theodore"
        && (record.place.coordinates == null || record.time.startYear == null);
      const connectivityTest = record.title.zh === "【测试投稿】The Seam 表单连通性验证"
        && record.place.name.zh === "测试地点"
        && record.summary?.zh === "这是一条用于验证网站投稿和邮件投递的测试记录，请忽略。";
      return !numberedTest && !theodoreTest && !connectivityTest;
    });
    if (cleaned.length !== records.length) {
      window.localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(cleaned));
    }
    return cleaned;
  } catch {
    return [];
  }
}

function getDefaultGlobeDistance(): number {
  const aspect = window.innerWidth / Math.max(300, window.innerHeight - 220);
  return Math.max(6.5, 6.5 / Math.max(0.5, aspect));
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("zh");
  const [submittedRecords, setSubmittedRecords] = useState<ArchiveRecord[]>(() => loadSubmittedRecords());
  const records = useMemo(() => [...ALL_RECORDS, ...submittedRecords], [submittedRecords]);
  const [viewMode, setViewMode] = useState<"globe" | "country">("globe");
  const [selectedCountry, setSelectedCountry] = useState<CountryFeature | null>(null);
  const [countryMeta, setCountryMeta] = useState<CountryMetadata | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ArchiveRecord | null>(null);
  const [recordNotFound, setRecordNotFound] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<LocationCluster | null>(null);
  const [submitOpen, setSubmitOpenState] = useState(false);
  const [aboutOpen, setAboutOpenState] = useState(false);
  const [indexOpen, setIndexOpenState] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [globeCameraPosition, setGlobeCameraPosition] = useState<[number, number, number]>(() => [0, 0, getDefaultGlobeDistance()]);
  const [globeFocus, setGlobeFocus] = useState<{ position: [number, number, number]; token: number } | null>(null);

  const focusGlobe = (longitude: number, latitude: number) => {
    const position = latLngToVector3(latitude, longitude, getDefaultGlobeDistance());
    setGlobeCameraPosition(position);
    setGlobeFocus(previous => ({ position, token: (previous?.token || 0) + 1 }));
  };

  // Timeline bounds calculated from vetted + submitted records
  const recordsRef = useRef<ArchiveRecord[]>(records);
  recordsRef.current = records;

  const minRecordYear = useMemo(() => {
    return Math.min(
      TIMELINE_DEFAULT_EARLIEST_YEAR,
      ...records.flatMap(r => r.time.startYear === null ? [] : [r.time.startYear]),
    );
  }, [records]);
  const [earliestYear, latestYear] = useMemo(() => calculateTimelineBounds(minRecordYear), [minRecordYear]);

  const [startYear, setStartYear] = useState<number>(earliestYear);
  const [endYear, setEndYear] = useState<number>(latestYear);
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);

  // Sync with initial URL and popstate
  useEffect(() => {
    let routeVersion = 0;
    function handleRoute() {
      const version = ++routeVersion;
      const pathname = window.location.pathname.trim().replace(/\/+$/, "") || "/";
      setIndexOpenState(pathname === "/archive");
      setSubmitOpenState(pathname === "/submit");
      setAboutOpenState(pathname === "/about");

      // Modal routes overlay the current view when navigating within the session.
      if (isModalPath(pathname)) return;

      const route = parseRoute(pathname, window.location.search);
      const routeHref = window.location.href;
      const slug = route.slug;
      const found = route.kind === "record" && slug
        ? recordsRef.current.find(r => r.slug === slug || r.id === slug || r.legacySlugs?.includes(slug))
        : null;
      setSelectedRecord(found || null);
      setRecordNotFound(route.kind === "record" && !found);
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
    }

    handleRoute();
    window.addEventListener("popstate", handleRoute);
    return () => { routeVersion++; window.removeEventListener("popstate", handleRoute); };
  }, []);

  // Filter records by timeline (if collapsed, shows ALL records)
  const visibleRecords = useMemo(() => {
    const allEras = isTimelineCollapsed || (startYear === earliestYear && endYear === latestYear);
    return records.filter(record =>
      timelinePeriods(record.time).some(period =>
        recordOverlapsRange(period.startYear, period.endYear, startYear, endYear, allEras)
      )
    );
  }, [records, startYear, endYear, isTimelineCollapsed, earliestYear, latestYear]);

  const restoreUnderlyingRoute = (
    nextViewMode = viewMode,
    nextCountry = selectedCountry,
    nextRecord = selectedRecord,
  ) => {
    if (nextRecord) {
      pushRoute({
        kind: "record",
        slug: nextRecord.slug,
        countryId: nextViewMode === "country" && nextCountry ? String(nextCountry.id || "") : undefined,
      });
    } else if (nextViewMode === "country" && nextCountry) {
      pushRoute({ kind: "country", countryId: String(nextCountry.id || "") });
    } else {
      pushRoute({ kind: "globe" });
    }
  };

  const setModalOpen = (
    path: "/archive" | "/submit" | "/about",
    open: boolean,
    setter: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    setter(open);
    const fullPath = withBasePath(path);
    if (open) {
      if (window.location.pathname !== fullPath) {
        window.history.pushState({}, "", fullPath);
      }
    } else if (window.location.pathname === fullPath) {
      const target = selectedRecord
        ? buildRoutePath({
            kind: "record",
            slug: selectedRecord.slug,
            countryId: viewMode === "country" && selectedCountry ? String(selectedCountry.id || "") : undefined,
          })
        : viewMode === "country" && selectedCountry
          ? buildRoutePath({ kind: "country", countryId: String(selectedCountry.id || "") })
          : buildRoutePath({ kind: "globe" });
      if (window.location.pathname + window.location.search !== target) {
        window.history.pushState({}, "", target);
      }
    }
  };

  const setIndexOpen = (open: boolean) => {
    if (open) {
      setSubmitOpenState(false);
      setAboutOpenState(false);
    }
    setModalOpen("/archive", open, setIndexOpenState);
  };

  const setSubmitOpen = (open: boolean) => {
    if (open) {
      setIndexOpenState(false);
      setAboutOpenState(false);
    }
    setModalOpen("/submit", open, setSubmitOpenState);
  };

  const setAboutOpen = (open: boolean) => {
    if (open) {
      setIndexOpenState(false);
      setSubmitOpenState(false);
    }
    setModalOpen("/about", open, setAboutOpenState);
  };

  const openRecord = (record: ArchiveRecord, locate = false) => {
    setRecordNotFound(false);
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
    setRecordNotFound(false);
    setSelectedRecord(null);
    restoreUnderlyingRoute(viewMode, selectedCountry, null);
  };

  const selectCountry = (country: CountryFeature, meta?: CountryMetadata) => {
    setRecordNotFound(false);
    setSelectedCountry(country);
    const resolvedMeta = meta || getCountryMetadataForFeature(country);
    setCountryMeta(resolvedMeta);
    setViewMode("country");
    setSelectedRecord(null);
    setSelectedCluster(null);
    pushRoute({ kind: "country", countryId: String(country.id || "") });
  };

  const returnToGlobe = (resetHome = false) => {
    setRecordNotFound(false);
    setViewMode("globe");
    setSelectedCountry(null);
    setCountryMeta(null);
    setSelectedCluster(null);
    setIndexOpenState(false);
    setSubmitOpenState(false);
    setAboutOpenState(false);
    if (resetHome) {
      setSelectedRecord(null);
      pushRoute({ kind: "globe" });
    } else if (!selectedRecord) {
      pushRoute({ kind: "globe" });
    } else {
      pushRoute({ kind: "record", slug: selectedRecord.slug });
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

  const addSubmittedRecord = (record: ArchiveRecord) => {
    setSubmittedRecords(prev => {
      const next = [record, ...prev.filter(item => item.id !== record.id)];
      try {
        window.localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore quota / privacy mode storage errors; in-memory state still updates.
      }
      return next;
    });
    if (record.time.startYear !== null && record.time.startYear < startYear) {
      const [nextMin] = calculateTimelineBounds(record.time.startYear);
      setStartYear(nextMin);
    }
  };

  const value: AppContextValue = {
    language,
    records,
    visibleRecords,
    viewMode,
    selectedCountry,
    countryMeta,
    selectedRecord,
    recordNotFound,
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
    addSubmittedRecord,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
