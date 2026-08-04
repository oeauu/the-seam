import { useCallback, useEffect, useRef } from "react";
import type { HistoricalRange, Language } from "../types";
import { formatHistoricalYear, normalizeHistoricalYear } from "../utils/time";

const MIN_YEAR = -5000;
const MAX_YEAR = 2026;

interface ParchmentTimelineProps {
  language: Language;
  previewRange: HistoricalRange;
  committedRange: HistoricalRange;
  isDragging: boolean;
  includeUndated: boolean;
  onPreviewChange: (range: HistoricalRange) => void;
  onCommit: (range: HistoricalRange) => void;
  onDraggingChange: (dragging: boolean) => void;
  onIncludeUndatedChange: (include: boolean) => void;
}
function clampYear(value: number): number {
  return Math.max(MIN_YEAR, Math.min(MAX_YEAR, normalizeHistoricalYear(value)));
}

function parseYear(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? clampYear(parsed) : null;
}

function normalizeRange(start: number | null, end: number | null): HistoricalRange {
  if (start !== null && end !== null && start > end) return { start: end, end: start };
  return { start, end };
}

function label(year: number | null, language: Language, fallback: string): string {
  return year === null ? fallback : formatHistoricalYear(year, language);
}

export function ParchmentTimeline({
  language,
  previewRange,
  committedRange,
  isDragging,
  includeUndated,
  onPreviewChange,
  onCommit,
  onDraggingChange,
  onIncludeUndatedChange,
}: ParchmentTimelineProps) {
  const latestPreview = useRef(previewRange);
  useEffect(() => {
    latestPreview.current = previewRange;
  }, [previewRange]);

  const commitLatest = useCallback(() => {
    onCommit(latestPreview.current);
    onDraggingChange(false);
  }, [onCommit, onDraggingChange]);

  const updatePreview = (next: HistoricalRange) => {
    latestPreview.current = next;
    onPreviewChange(next);
  };

  const updateStart = (value: number) => updatePreview(normalizeRange(clampYear(value), previewRange.end));
  const updateEnd = (value: number) => updatePreview(normalizeRange(previewRange.start, clampYear(value)));
  const committedLabel = `${label(committedRange.start, language, language === "zh" ? "起点" : "Open")} — ${label(committedRange.end, language, language === "zh" ? "终点" : "Now")}`;
  const previewLabel = `${label(previewRange.start, language, language === "zh" ? "起点" : "Open")} — ${label(previewRange.end, language, language === "zh" ? "终点" : "Now")}`;

  return (
    <section className={`atlas-timeline parchment-timeline${isDragging ? " is-dragging" : ""}`} aria-label={language === "zh" ? "羊皮纸时间轴" : "Parchment timeline"}>
      <div className="atlas-timeline-scroll-edge" aria-hidden="true" />
      <div className="atlas-timeline-header">
        <div>
          <span className="atlas-timeline-overline">ARCHIVE TIME / CONTINUOUS RANGE</span>
          <strong>{language === "zh" ? "时间轴" : "Timeline"}</strong>
          <span className="atlas-timeline-committed" data-testid="timeline-committed-range">{committedLabel}</span>
          {isDragging && <span className="atlas-timeline-preview" data-testid="timeline-preview-range">{language === "zh" ? `预览：${previewLabel}` : `Preview: ${previewLabel}`}</span>}
        </div>
        <label className="atlas-undated-toggle">
          <input type="checkbox" checked={includeUndated} onChange={event => onIncludeUndatedChange(event.target.checked)} />
          {language === "zh" ? "包括时间不详" : "Include undated"}
        </label>
      </div>
      <div className="atlas-range-controls parchment-range-controls">
        <span className="atlas-range-bound">5000 BCE</span>
        <div className="atlas-range-track-wrap">
          <input
            data-testid="timeline-start"
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={previewRange.start ?? MIN_YEAR}
            aria-label={language === "zh" ? "起始年份" : "Start year"}
            onPointerDown={() => onDraggingChange(true)}
            onChange={event => updateStart(Number(event.target.value))}
            onPointerUp={commitLatest}
            onBlur={() => { if (isDragging) commitLatest(); }}
            onKeyUp={event => { if (event.key === "Enter" || event.key === "Escape") commitLatest(); }}
          />
          <input
            data-testid="timeline-end"
            type="range"
            min={MIN_YEAR}
            max={MAX_YEAR}
            value={previewRange.end ?? MAX_YEAR}
            aria-label={language === "zh" ? "结束年份" : "End year"}
            onPointerDown={() => onDraggingChange(true)}
            onChange={event => updateEnd(Number(event.target.value))}
            onPointerUp={commitLatest}
            onBlur={() => { if (isDragging) commitLatest(); }}
            onKeyUp={event => { if (event.key === "Enter" || event.key === "Escape") commitLatest(); }}
          />
        </div>
        <span className="atlas-range-bound">2026 CE</span>
      </div>
      <div className="atlas-year-inputs">
        <label>{language === "zh" ? "从" : "From"}<input type="number" value={previewRange.start ?? ""} placeholder="—" onChange={event => updatePreview(normalizeRange(parseYear(event.target.value), previewRange.end))} onBlur={commitLatest} /></label>
        <label>{language === "zh" ? "到" : "To"}<input type="number" value={previewRange.end ?? ""} placeholder="—" onChange={event => updatePreview(normalizeRange(previewRange.start, parseYear(event.target.value)))} onBlur={commitLatest} /></label>
        <div className="atlas-presets" role="group" aria-label={language === "zh" ? "时间预设" : "Time presets"}>
          <button type="button" onClick={() => onCommit({ start: null, end: null })}>{language === "zh" ? "全部" : "All"}</button>
          <button type="button" onClick={() => onCommit({ start: -5000, end: 500 })}>{language === "zh" ? "古代" : "Ancient"}</button>
          <button type="button" onClick={() => onCommit({ start: 1800, end: MAX_YEAR })}>{language === "zh" ? "近现代" : "Modern"}</button>
        </div>
      </div>
      <p className="atlas-timeline-hint">{language === "zh" ? "拖动时只预览，松开或确认后提交筛选。历史年份不使用公元 0 年。" : "Drag to preview; release or confirm to commit the filter. Historical ranges skip year 0."}</p>
    </section>
  );
}
