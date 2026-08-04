import { lazy, Suspense, useEffect, useMemo, useReducer, useState } from "react";
import type { ArchiveEntry, AtlasFilters, Language } from "./types";
import { initialAtlasState, atlasReducer } from "./state/atlasReducer";
import { selectEntriesByFilters, selectEntriesForRegion, selectEntryById, selectRegionClusters, getEntryPrimaryLocation } from "./selectors";
import { Atlas2DFallback } from "./components/Atlas2DFallback";
import { AtlasDetailOverlay } from "./components/AtlasDetailOverlay";
import { AtlasFilters as AtlasFilterControls } from "./components/AtlasFilters";
import { AtlasTimeline } from "./components/AtlasTimeline";
import type { MapEventGroup } from "../../db/eventsData";
import "./atlas.css";

const Atlas3DScene = lazy(() => import("./components/Atlas3DScene"));
const Legacy2DMap = lazy(() => import("./components/Legacy2DMap").then(module => ({ default: module.Legacy2DMap })));

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
  onRequestContribution,
  getCombinedEvents,
}: AtlasViewportProps) {
  const [state, dispatch] = useReducer(atlasReducer, {
    ...initialAtlasState,
    selectedSourceIds,
    selectedMeaningIds,
    selectedObjectTypeIds,
  });
  const [webglAvailable, setWebglAvailable] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setWebglAvailable(detectWebGL());
    setReducedMotion(prefersReducedMotion());
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
      if (state.sceneMode === "focused") {
        dispatch({ type: "BACK_TO_REGION" });
        onSelectEntry(null);
      } else if (state.sceneMode === "region") {
        dispatch({ type: "BACK_TO_GLOBAL" });
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onSelectEntry, state.sceneMode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const nextHash = state.sceneMode === "global"
      ? "#atlas/global"
      : state.sceneMode === "region"
        ? `#atlas/region/${state.selectedRegionId ?? "global"}`
        : `#atlas/entry/${state.selectedEntryId ?? ""}`;
    if (window.location.hash.startsWith("#atlas/")) window.history.replaceState(null, "", nextHash);
  }, [state.sceneMode, state.selectedEntryId, state.selectedRegionId]);

  const filters: AtlasFilters = useMemo(() => ({
    searchQuery,
    selectedSourceIds: state.selectedSourceIds,
    selectedMeaningIds: state.selectedMeaningIds,
    selectedObjectTypeIds: state.selectedObjectTypeIds,
    timeRange: state.timeRange,
    includeUndated: state.includeUndated,
  }), [searchQuery, state.includeUndated, state.selectedMeaningIds, state.selectedObjectTypeIds, state.selectedSourceIds, state.timeRange]);
  const filteredEntries = useMemo(() => selectEntriesByFilters(entries, filters), [entries, filters]);
  const clusters = useMemo(() => selectRegionClusters(filteredEntries), [filteredEntries]);
  const regionEntries = useMemo(() => state.selectedRegionId ? selectEntriesForRegion(filteredEntries, state.selectedRegionId) : filteredEntries, [filteredEntries, state.selectedRegionId]);
  const selectedEntry = selectEntryById(entries, state.selectedEntryId ?? selectedEntryId);
  const focusLocation = selectedEntry ? getEntryPrimaryLocation(selectedEntry) : null;
  const focusPosition: [number, number, number] | null = focusLocation && focusLocation.longitude !== null && focusLocation.latitude !== null
    ? [(focusLocation.longitude / 30), (focusLocation.latitude / 30), 0]
    : null;
  const resolvedMode = state.renderMode === "2d" || !webglAvailable || reducedMotion ? "2d" : "3d";
  const isAutoFallback = state.renderMode === "auto" && (reducedMotion || !webglAvailable);

  const toggle = (items: string[], id: string): string[] => items.includes(id) ? items.filter(item => item !== id) : [...items, id];

  return (
    <section className="atlas-viewport" data-testid="atlas-viewport" aria-label={currentLanguage === "zh" ? "三维博物馆时空地图" : "3D museum atlas"}>
      <header className="atlas-viewport-header">
        <div>
          <span className="atlas-kicker">THE QUEER ARCHIVE / ATLAS</span>
          <h2>{currentLanguage === "zh" ? "博物馆时空地图" : "Museum Atlas"}</h2>
          <p>{currentLanguage === "zh" ? "以地点、时间和文化意义浏览演示档案。" : "Browse demo records through place, time, and cultural meaning."}</p>
        </div>
        <div className="atlas-mode-switch" role="group" aria-label={currentLanguage === "zh" ? "地图模式" : "Map mode"}>
          {(["auto", "3d", "2d"] as const).map(mode => (
            <button
              key={mode}
              type="button"
              className={state.renderMode === mode ? "is-active" : ""}
              disabled={mode === "3d" && (reducedMotion || !webglAvailable)}
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
        <span>{currentLanguage === "zh" ? `当前显示 ${filteredEntries.length} 条档案` : `${filteredEntries.length} records visible`}</span>
        {isAutoFallback && <span>{currentLanguage === "zh" ? "已启用二维回退" : "2D fallback enabled"}</span>}
        {state.sceneMode !== "global" && <button type="button" onClick={() => dispatch({ type: "BACK_TO_GLOBAL" })}>{currentLanguage === "zh" ? "返回全球" : "Back to global"}</button>}
      </div>

      <div className="atlas-stage">
        {resolvedMode === "3d" ? (
          <Suspense fallback={<div className="atlas-loading-state">{currentLanguage === "zh" ? "正在加载三维展厅…" : "Loading 3D gallery…"}</div>}>
            <Atlas3DScene
              mode={state.sceneMode}
              entries={state.sceneMode === "global" ? filteredEntries : regionEntries}
              clusters={clusters}
              language={currentLanguage}
              selectedEntryId={state.selectedEntryId}
              focusPosition={focusPosition}
              onSelectRegion={regionId => {
                dispatch({ type: "ENTER_REGION", regionId });
                onSelectRegion?.(regionId);
              }}
              onSelectEntry={entryId => {
                dispatch({ type: "FOCUS_ENTRY", entryId, cameraPose: null });
                onSelectEntry(entryId);
              }}
              onPerformanceDecline={() => dispatch({ type: "SET_RENDER_MODE", mode: "2d" })}
            />
          </Suspense>
        ) : (
          <div className="atlas-2d-fallback-stack">
            <Suspense fallback={<div className="atlas-loading-state">{currentLanguage === "zh" ? "正在加载二维地图…" : "Loading 2D map…"}</div>}>
              <Legacy2DMap
                currentLanguage={currentLanguage}
                onSelectEntry={onSelectEntry}
                onRequestContribution={onRequestContribution}
                getCombinedEvents={getCombinedEvents}
              />
            </Suspense>
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
              onSelectEntry={entryId => {
                dispatch({ type: "FOCUS_ENTRY", entryId, cameraPose: null });
                onSelectEntry(entryId);
              }}
            />
          </div>
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
      <AtlasTimeline
        language={currentLanguage}
        range={state.timeRange}
        includeUndated={state.includeUndated}
        onChange={range => dispatch({ type: "SET_TIME_RANGE", range })}
        onIncludeUndatedChange={include => dispatch({ type: "SET_INCLUDE_UNDATED", include })}
      />
      <ol className="atlas-accessible-list">
        {filteredEntries.slice(0, 24).map(entry => <li key={entry.id}><button type="button" onClick={() => onSelectEntry(entry.id)}>{entry.title[currentLanguage]}</button></li>)}
      </ol>
    </section>
  );
}

export default AtlasViewport;
