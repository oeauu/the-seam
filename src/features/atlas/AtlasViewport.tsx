import { lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import type { ArchiveEntry, AtlasFilters, Language, HistoricalRange } from "./types";
import { initialAtlasState, atlasReducer } from "./state/atlasReducer";
import { selectEntriesByFilters, selectEntriesForRegion, selectEntryById, selectRegionClusters } from "./selectors";
import { groupEntriesByLocation } from "./rendering/locationGroups";
import { latLngToVector3 } from "./utils/geo";
import { Atlas2DFallback } from "./components/Atlas2DFallback";
import { AtlasDetailOverlay } from "./components/AtlasDetailOverlay";
import { AtlasFilters as AtlasFilterControls } from "./components/AtlasFilters";
import { LocationEntryPopover } from "./components/LocationEntryPopover";
import { ParchmentTimeline } from "./components/ParchmentTimeline";
import type { MapEventGroup } from "../../db/eventsData";
import "./atlas.css";

const Atlas3DScene = lazy(() => import("./components/Atlas3DScene"));

interface AtlasViewportProps {
  entries: ArchiveEntry[];
  currentLanguage: Language;
  searchQuery?: string;
  selectedSourceIds?: string[];
  selectedMeaningIds?: string[];
  selectedObjectTypeIds?: string[];
  selectedEntryId: string | null;
  onSelectEntry: (entryId: string | null) => void;
  onSelectRegion?: (regionId: string) => void;
  onRequestContribution?: () => void;
  getCombinedEvents?: () => MapEventGroup[];
}

function detectWebGL(): boolean {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  try {
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

function isMobileViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia?.("(max-width: 720px)").matches === true;
}

function nextQuality(level: "high" | "medium" | "low"): "high" | "medium" | "low" {
  return level === "high" ? "medium" : "low";
}

export function AtlasViewport({
  entries,
  currentLanguage,
  searchQuery = "",
  selectedSourceIds = [],
  selectedMeaningIds = [],
  selectedObjectTypeIds = [],
  selectedEntryId,
  onSelectEntry,
  onSelectRegion,
}: AtlasViewportProps) {
  const [state, dispatch] = useReducer(atlasReducer, {
    ...initialAtlasState,
    selectedSourceIds,
    selectedMeaningIds,
    selectedObjectTypeIds,
  });
  const [webglAvailable, setWebglAvailable] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [performancePrompt, setPerformancePrompt] = useState(false);
  const previewFrame = useRef<number | null>(null);
  const pendingPreview = useRef<HistoricalRange | null>(null);

  useEffect(() => {
    setWebglAvailable(detectWebGL());
    setIsMobile(isMobileViewport());
    dispatch({ type: "SET_MOTION_PROFILE", profile: prefersReducedMotion() ? "reduced" : "full" });
  }, []);

  useEffect(() => {
    dispatch({ type: "SET_SOURCE_FILTERS", ids: selectedSourceIds });
  }, [selectedSourceIds]);

  useEffect(() => {
    dispatch({ type: "SET_MEANING_FILTERS", ids: selectedMeaningIds });
  }, [selectedMeaningIds]);

  useEffect(() => {
    dispatch({ type: "SET_OBJECT_FILTERS", ids: selectedObjectTypeIds });
  }, [selectedObjectTypeIds]);

  useEffect(() => {
    if (selectedEntryId && selectedEntryId !== state.selectedEntryId) {
      dispatch({ type: "FOCUS_ENTRY", entryId: selectedEntryId, cameraPose: null });
    }
    if (!selectedEntryId && state.selectedEntryId) {
      dispatch({ type: "BACK_TO_REGION" });
    }
  }, [selectedEntryId, state.selectedEntryId]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (state.selectedLocationGroupId) {
        dispatch({ type: "SELECT_LOCATION_GROUP", groupId: null });
      } else if (state.sceneMode === "focused") {
        dispatch({ type: "BACK_TO_REGION" });
        onSelectEntry(null);
      } else if (state.sceneMode === "region") {
        dispatch({ type: "BACK_TO_GLOBAL" });
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onSelectEntry, state.sceneMode, state.selectedLocationGroupId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextHash = state.selectedLocationGroupId
      ? `#atlas/location/${encodeURIComponent(state.selectedLocationGroupId)}`
      : state.sceneMode === "global"
        ? "#atlas/global"
        : state.sceneMode === "region"
          ? `#atlas/region/${state.selectedRegionId ?? "global"}`
          : `#atlas/entry/${state.selectedEntryId ?? ""}`;
    if (window.location.hash.startsWith("#atlas/")) window.history.replaceState(null, "", nextHash);
  }, [state.sceneMode, state.selectedEntryId, state.selectedLocationGroupId, state.selectedRegionId]);

  const filters: AtlasFilters = useMemo(() => ({
    searchQuery,
    selectedSourceIds: state.selectedSourceIds,
    selectedMeaningIds: state.selectedMeaningIds,
    selectedObjectTypeIds: state.selectedObjectTypeIds,
    timeRange: state.previewRange,
    includeUndated: state.includeUndated,
  }), [searchQuery, state.includeUndated, state.previewRange, state.selectedMeaningIds, state.selectedObjectTypeIds, state.selectedSourceIds]);
  const filteredEntries = useMemo(() => selectEntriesByFilters(entries, filters), [entries, filters]);
  const clusters = useMemo(() => selectRegionClusters(filteredEntries), [filteredEntries]);
  const regionEntries = useMemo(() => state.selectedRegionId ? selectEntriesForRegion(filteredEntries, state.selectedRegionId) : filteredEntries, [filteredEntries, state.selectedRegionId]);
  const selectedEntry = selectEntryById(entries, state.selectedEntryId ?? selectedEntryId);
  const locationGroups = useMemo(() => groupEntriesByLocation(state.sceneMode === "global" ? filteredEntries : regionEntries), [filteredEntries, regionEntries, state.sceneMode]);
  const selectedLocationGroup = useMemo(() => locationGroups.find(group => group.id === state.selectedLocationGroupId) ?? null, [locationGroups, state.selectedLocationGroupId]);
  const selectedLocationEntries = useMemo(() => selectedLocationGroup ? entries.filter(entry => selectedLocationGroup.entryIds.includes(entry.id)) : [], [entries, selectedLocationGroup]);
  const focusLocation = selectedEntry?.locations.find(location => location.isPrimary) ?? selectedEntry?.locations[0] ?? null;
  const focusPosition: [number, number, number] | null = focusLocation && focusLocation.longitude !== null && focusLocation.latitude !== null
    ? latLngToVector3(focusLocation.latitude, focusLocation.longitude, 1.72)
    : null;
  const resolvedMode = state.renderMode === "2d" || !webglAvailable ? "2d" : "3d";
  const isAutoFallback = state.renderMode === "auto" && !webglAvailable;

  const handlePreviewChange = useCallback((range: HistoricalRange) => {
    pendingPreview.current = range;
    if (previewFrame.current !== null) return;
    if (typeof window === "undefined") {
      dispatch({ type: "SET_PREVIEW_RANGE", range });
      return;
    }
    previewFrame.current = window.requestAnimationFrame(() => {
      previewFrame.current = null;
      if (pendingPreview.current) dispatch({ type: "SET_PREVIEW_RANGE", range: pendingPreview.current });
    });
  }, []);

  const handleCommitRange = useCallback((range: HistoricalRange) => {
    pendingPreview.current = null;
    if (previewFrame.current !== null && typeof window !== "undefined") {
      window.cancelAnimationFrame(previewFrame.current);
      previewFrame.current = null;
    }
    dispatch({ type: "COMMIT_TIME_RANGE", range });
  }, []);

  const handleSelectEntry = useCallback((entryId: string) => {
    dispatch({ type: "SELECT_LOCATION_GROUP", groupId: null });
    dispatch({ type: "FOCUS_ENTRY", entryId, cameraPose: null });
    onSelectEntry(entryId);
  }, [onSelectEntry]);

  const toggle = (items: string[], id: string): string[] => items.includes(id) ? items.filter(item => item !== id) : [...items, id];

  return (
    <section className="atlas-viewport" data-testid="atlas-viewport" aria-label={currentLanguage === "zh" ? "博物馆时空地图" : "Museum atlas"}>
      <header className="atlas-viewport-header">
        <div>
          <span className="atlas-kicker">THE QUEER ARCHIVE / COORDINATE ATLAS</span>
          <h2>{currentLanguage === "zh" ? "博物馆时空地图" : "Museum Atlas"}</h2>
          <p>{currentLanguage === "zh" ? "以真实地点、时间和文化意义浏览档案。" : "Browse the archive through real places, time, and cultural meaning."}</p>
        </div>
        <div className="atlas-mode-switch" role="group" aria-label={currentLanguage === "zh" ? "地图模式" : "Map mode"}>
          {(["auto", "3d", "2d"] as const).map(mode => (
            <button
              key={mode}
              type="button"
              className={state.renderMode === mode ? "is-active" : ""}
              disabled={mode === "3d" && !webglAvailable}
              aria-pressed={state.renderMode === mode}
              data-testid={`atlas-mode-${mode}`}
              onClick={() => dispatch({ type: "SET_RENDER_MODE", mode })}
            >
              {mode === "auto" ? (currentLanguage === "zh" ? "自动" : "Auto") : mode.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div className="atlas-status-strip" role="status">
        <span>{filteredEntries.length} records visible · {state.qualityLevel} render</span>
        <span>Country contours are a navigation layer, not historical borders</span>
        {isAutoFallback && <span>WebGL unavailable — 2D fallback enabled</span>}
        {state.motionProfile === "reduced" && <span data-testid="reduced-motion-status">Reduced-motion 3D profile</span>}
        {performancePrompt && <button type="button" data-testid="performance-fallback-action" onClick={() => { dispatch({ type: "SET_RENDER_MODE", mode: "2d" }); setPerformancePrompt(false); }}>Use 2D fallback</button>}
        {state.sceneMode !== "global" && <button type="button" onClick={() => dispatch({ type: "BACK_TO_GLOBAL" })}>Back to global</button>}
      </div>

      <div className="atlas-stage">
        {resolvedMode === "3d" ? (
          <Suspense fallback={<div className="atlas-loading-state">Loading parchment atlas…</div>}>
            <Atlas3DScene
              mode={state.sceneMode}
              entries={state.sceneMode === "global" ? filteredEntries : regionEntries}
              clusters={clusters}
              language={currentLanguage}
              regionId={state.selectedRegionId}
              qualityLevel={state.qualityLevel}
              motionProfile={state.motionProfile}
              selectedLocationGroupId={state.selectedLocationGroupId}
              hoveredLocationGroupId={state.hoveredMarkerId}
              focusPosition={focusPosition}
              mobile={isMobile}
              onSelectRegion={regionId => {
                dispatch({ type: "ENTER_REGION", regionId });
                onSelectRegion?.(regionId);
              }}
              onSelectLocationGroup={groupId => dispatch({ type: "SELECT_LOCATION_GROUP", groupId })}
              onHoverLocationGroup={groupId => dispatch({ type: "SET_HOVERED_MARKER", markerId: groupId })}
              onPerformanceDecline={() => {
                if (state.qualityLevel === "low") setPerformancePrompt(true);
                else dispatch({ type: "SET_QUALITY_LEVEL", level: nextQuality(state.qualityLevel) });
              }}
              onPerformanceRecover={() => {
                if (state.qualityLevel === "low") dispatch({ type: "SET_QUALITY_LEVEL", level: "medium" });
              }}
            />
          </Suspense>
        ) : (
          <Atlas2DFallback
            entries={state.sceneMode === "global" ? filteredEntries : regionEntries}
            clusters={clusters}
            mode={state.sceneMode}
            selectedRegionId={state.selectedRegionId}
            language={currentLanguage}
            onSelectRegion={regionId => {
              dispatch({ type: "ENTER_REGION", regionId });
              onSelectRegion?.(regionId);
            }}
            onSelectEntry={handleSelectEntry}
          />
        )}
        {selectedLocationGroup && selectedLocationEntries.length > 0 && (
          <LocationEntryPopover group={selectedLocationGroup} entries={selectedLocationEntries} language={currentLanguage} onSelectEntry={handleSelectEntry} onClose={() => dispatch({ type: "SELECT_LOCATION_GROUP", groupId: null })} />
        )}
        {selectedEntry && state.sceneMode === "focused" && (
          <AtlasDetailOverlay
            entry={selectedEntry}
            language={currentLanguage}
            onOpenFullRecord={onSelectEntry}
            onBack={() => {
              dispatch({ type: "BACK_TO_REGION" });
              onSelectEntry(null);
            }}
          />
        )}
      </div>

      <AtlasFilterControls
        language={currentLanguage}
        selectedSourceIds={state.selectedSourceIds}
        selectedMeaningIds={state.selectedMeaningIds}
        onToggleSource={id => dispatch({ type: "SET_SOURCE_FILTERS", ids: toggle(state.selectedSourceIds, id) })}
        onToggleMeaning={id => dispatch({ type: "SET_MEANING_FILTERS", ids: toggle(state.selectedMeaningIds, id) })}
      />
      <ParchmentTimeline
        language={currentLanguage}
        previewRange={state.previewRange}
        committedRange={state.committedRange}
        isDragging={state.isTimelineDragging}
        includeUndated={state.includeUndated}
        onPreviewChange={handlePreviewChange}
        onCommit={handleCommitRange}
        onDraggingChange={dragging => dispatch({ type: "SET_TIMELINE_DRAGGING", dragging })}
        onIncludeUndatedChange={include => dispatch({ type: "SET_INCLUDE_UNDATED", include })}
      />
      <ol className="atlas-accessible-list">
        {filteredEntries.slice(0, 24).map(entry => <li key={entry.id}><button type="button" onClick={() => handleSelectEntry(entry.id)}>{entry.title[currentLanguage]}</button></li>)}
      </ol>
    </section>
  );
}

export default AtlasViewport;
