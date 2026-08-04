import { useRef } from "react";
import type { HistoricalRange } from "../../domain/archive/types";
import { displayHistoricalYear, historicalYearToInput, normalizeTimelineRange, TIMELINE_MAX, TIMELINE_MIN } from "./timelineModel";

interface ParchmentTimelineProps {
  previewRange: HistoricalRange;
  committedRange: HistoricalRange;
  isDragging: boolean;
  includeUndated: boolean;
  onPreviewRange: (range: HistoricalRange) => void;
  onCommitRange: (range: HistoricalRange) => void;
  onDragging: (value: boolean) => void;
  onIncludeUndated: (value: boolean) => void;
}

export function ParchmentTimeline({ previewRange, committedRange, isDragging, includeUndated, onPreviewRange, onCommitRange, onDragging, onIncludeUndated }: ParchmentTimelineProps) {
  const lastCommitRef = useRef<string>(`${committedRange.start}:${committedRange.end}`);
  const commitPreview = () => {
    const key = `${previewRange.start}:${previewRange.end}`;
    if (key === lastCommitRef.current) return;
    lastCommitRef.current = key;
    onCommitRange(previewRange);
  };
  const updateStart = (value: number) => onPreviewRange(normalizeTimelineRange(value, historicalYearToInput(previewRange.end)));
  const updateEnd = (value: number) => onPreviewRange(normalizeTimelineRange(historicalYearToInput(previewRange.start), value));
  return (
    <section
      className="parchment-timeline"
      aria-label="羊皮卷时间轴"
      data-preview-range={`${previewRange.start ?? "unknown"}:${previewRange.end ?? "unknown"}`}
      data-committed-range={`${committedRange.start ?? "unknown"}:${committedRange.end ?? "unknown"}`}
      data-is-dragging={isDragging}
    >
      <div className="parchment-timeline__header">
        <span>Archive time register</span>
        <span>{isDragging ? "预览中" : "已提交"}</span>
      </div>
      <div className="parchment-timeline__range">
        <strong>{displayHistoricalYear(previewRange.start)}</strong>
        <span aria-live="polite">{displayHistoricalYear(previewRange.end)}</span>
      </div>
      <div className="parchment-timeline__track">
        <input
          className="parchment-timeline__input"
          aria-label="时间轴起始年份"
          type="range"
          min={TIMELINE_MIN}
          max={TIMELINE_MAX}
          step={1}
          value={historicalYearToInput(previewRange.start)}
          onPointerDown={() => onDragging(true)}
          onPointerUp={() => { onDragging(false); commitPreview(); }}
          onChange={event => updateStart(Number(event.target.value))}
          onBlur={commitPreview}
        />
        <input
          className="parchment-timeline__input"
          aria-label="时间轴结束年份"
          type="range"
          min={TIMELINE_MIN}
          max={TIMELINE_MAX}
          step={1}
          value={historicalYearToInput(previewRange.end)}
          onPointerDown={() => onDragging(true)}
          onPointerUp={() => { onDragging(false); commitPreview(); }}
          onChange={event => updateEnd(Number(event.target.value))}
          onBlur={commitPreview}
        />
      </div>
      <div className="parchment-timeline__ticks" aria-hidden="true">
        <span>500 BCE</span><span>1 CE</span><span>1000 CE</span><span>2026 CE</span>
      </div>
      <label className="parchment-timeline__toggle">
        <input type="checkbox" checked={includeUndated} onChange={event => onIncludeUndated(event.target.checked)} />
        显示时间不详条目
      </label>
    </section>
  );
}
