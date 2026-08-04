import { useCallback, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import type { ArchiveEntry, HistoricalRange, Language, LocationGroup } from "../../domain/archive/types";
import { groupEntriesByLocation } from "../../domain/archive/locations";
import { getLocalizedText } from "../../domain/archive/localization";
import type { CameraState } from "../state/archiveAppReducer";
import { ParchmentCanvas } from "./ParchmentCanvas";
import { ParchmentTimeline } from "../timeline/ParchmentTimeline";
import { CompatibilityMap } from "../map/CompatibilityMap";

interface ParchmentStageProps {
  camera: CameraState;
  entries: readonly ArchiveEntry[];
  previewRange: HistoricalRange;
  committedRange: HistoricalRange;
  isTimelineDragging: boolean;
  includeUndated: boolean;
  language: Language;
  motion: "full" | "reduced";
  capability: "webgl" | "fallback";
  selectedGroupId: string | null;
  onCamera: (camera: CameraState) => void;
  onSelectLocation: (groupId: string) => void;
  onPreviewRange: (range: HistoricalRange) => void;
  onCommitRange: (range: HistoricalRange) => void;
  onTimelineDragging: (value: boolean) => void;
  onIncludeUndated: (value: boolean) => void;
  onMapError: () => void;
}

interface PointerState {
  pointerId: number;
  startX: number;
  startY: number;
  startTarget: [number, number];
  moved: boolean;
}

function clampTarget(target: [number, number], zoom: number): [number, number] {
  const limitX = 1.45 / zoom;
  const limitY = 0.78 / zoom;
  return [Math.min(limitX, Math.max(-limitX, target[0])), Math.min(limitY, Math.max(-limitY, target[1]))];
}

function zoomBy(value: number): number {
  return Math.min(1.85, Math.max(0.72, value));
}

export function ParchmentStage({ camera, entries, previewRange, committedRange, isTimelineDragging, includeUndated, language, motion, capability, selectedGroupId, onCamera, onSelectLocation, onPreviewRange, onCommitRange, onTimelineDragging, onIncludeUndated, onMapError }: ParchmentStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<PointerState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [mapReady, setMapReady] = useState(capability === "fallback");
  const handleMapReady = useCallback(() => setMapReady(true), []);
  const groups = useMemo<readonly LocationGroup[]>(() => groupEntriesByLocation(entries), [entries]);
  const quality = capability === "fallback" ? "low" : "high";

  const updatePan = (event: ReactPointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - pointer.startX;
    const deltaY = event.clientY - pointer.startY;
    if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) pointer.moved = true;
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = 6.8 / Math.max(rect.width, 1);
    const scaleY = 3.7 / Math.max(rect.height * 0.82, 1);
    onCamera({
      ...camera,
      target: clampTarget([
        pointer.startTarget[0] - deltaX * scaleX / camera.zoom,
        pointer.startTarget[1] + deltaY * scaleY / camera.zoom,
      ], camera.zoom),
    });
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (event.target instanceof HTMLElement && event.target.closest("button, input, label")) return;
    pointerRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, startTarget: [...camera.target], moved: false };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    pointerRef.current = null;
    setIsDragging(false);
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.92 : 1.08;
    onCamera({ ...camera, zoom: zoomBy(camera.zoom * factor), target: clampTarget(camera.target, zoomBy(camera.zoom * factor)) });
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "0") { event.preventDefault(); onCamera({ target: [0, 0], zoom: 1 }); return; }
    if (event.key === "+" || event.key === "=") { event.preventDefault(); onCamera({ ...camera, zoom: zoomBy(camera.zoom * 1.08) }); return; }
    if (event.key === "-") { event.preventDefault(); onCamera({ ...camera, zoom: zoomBy(camera.zoom * 0.92) }); return; }
    const delta: Record<string, [number, number]> = { ArrowLeft: [-0.15, 0], ArrowRight: [0.15, 0], ArrowUp: [0, 0.12], ArrowDown: [0, -0.12] };
    const movement = delta[event.key];
    if (movement) { event.preventDefault(); onCamera({ ...camera, target: clampTarget([camera.target[0] + movement[0] / camera.zoom, camera.target[1] + movement[1] / camera.zoom], camera.zoom) }); }
  };

  return (
    <section className="parchment-stage" aria-labelledby="parchment-stage-title">
      <h2 id="parchment-stage-title" className="archive-sr-only">三维羊皮卷世界地图</h2>
      <div
        ref={stageRef}
        className="parchment-stage__frame"
        tabIndex={0}
        role="application"
        aria-label="羊皮卷地图。拖动平移，Ctrl 或 Command 加滚轮缩放，方向键移动，0 复位。"
        data-testid="parchment-stage"
        data-camera-target={`${camera.target[0].toFixed(4)},${camera.target[1].toFixed(4)}`}
        data-camera-zoom={camera.zoom.toFixed(4)}
        data-rendering-capability={capability}
        data-motion-profile={motion}
        data-map-ready={mapReady}
        onPointerDown={handlePointerDown}
        onPointerMove={updatePan}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
      >
        <div className={`parchment-stage__canvas${isDragging ? " is-dragging" : ""}`}>
          {capability === "webgl" ? (
            <ParchmentCanvas
              camera={camera}
              entries={entries}
              previewRange={previewRange}
              language={language}
              motion={motion}
              quality={quality}
              onSelectLocation={onSelectLocation}
              selectedGroupId={selectedGroupId}
              onPointerActivity={() => undefined}
              onMapReady={handleMapReady}
              onMapError={onMapError}
            />
          ) : <CompatibilityMap entries={entries} language={language} onSelectLocation={onSelectLocation} />}
          <p className="parchment-stage__hint">拖动浏览地图；按住 Ctrl / Command 滚动以缩放。普通滚轮继续滚动页面。</p>
          <div className="parchment-stage__actions" aria-label="地图控制">
            <button className="parchment-stage__action" type="button" aria-label="放大地图" onClick={() => onCamera({ ...camera, zoom: zoomBy(camera.zoom * 1.12) })}>＋</button>
            <button className="parchment-stage__action" type="button" aria-label="缩小地图" onClick={() => onCamera({ ...camera, zoom: zoomBy(camera.zoom * 0.89) })}>−</button>
            <button className="parchment-stage__action" type="button" aria-label="复位地图视角" onClick={() => onCamera({ target: [0, 0], zoom: 1 })}>0</button>
          </div>
          <span className="parchment-stage__quality" aria-live="polite">{motion === "reduced" ? "Reduced motion / 3D" : capability === "fallback" ? "Compatibility view" : "Museum light / high detail"}</span>
          <div className="archive-marker-list" aria-label="可见地点索引">
            {groups.slice(0, 8).map(group => <button key={group.id} type="button" className="archive-marker-list__item" onClick={() => onSelectLocation(group.id)}>{getLocalizedText(group.displayName, language)}</button>)}
          </div>
          <ul className="archive-sr-only" aria-label="当前可见档案坐标列表">
            {groups.map(group => <li key={group.id}><button type="button" onClick={() => onSelectLocation(group.id)}>{getLocalizedText(group.displayName, language)} · {group.entryIds.length} 条档案</button></li>)}
          </ul>
        </div>
        <ParchmentTimeline
          previewRange={previewRange}
          committedRange={committedRange}
          isDragging={isTimelineDragging}
          includeUndated={includeUndated}
          onPreviewRange={onPreviewRange}
          onCommitRange={onCommitRange}
          onDragging={onTimelineDragging}
          onIncludeUndated={onIncludeUndated}
        />
      </div>
    </section>
  );
}
