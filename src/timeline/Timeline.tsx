import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  TIMELINE_INTERVAL_YEARS,
  formatYear,
  normalizeYear,
  snapYearToInterval,
  timelineIntervalTicks,
  timelineTicks,
} from "./timelineUtils";
import type { KeyboardEvent } from "react";
import { useApp } from "../state/useApp";

export function Timeline() {
  const {
    earliestYear,
    latestYear,
    startYear,
    endYear,
    setTimeRange,
    isTimelineCollapsed,
    toggleTimelineCollapse,
    records,
    language
  } = useApp();

  const trackRef = useRef<HTMLDivElement>(null);
  const [draggingThumb, setDraggingThumb] = useState<"start" | "end" | "range" | null>(null);
  const dragStartRef = useRef<{ clientX: number; startVal: number; endVal: number }>({ clientX: 0, startVal: 0, endVal: 0 });

  const totalSpan = latestYear - earliestYear;

  // Convert year to percentage (0 - 100)
  const yearToPercent = (year: number) => {
    return Math.max(0, Math.min(100, ((year - earliestYear) / totalSpan) * 100));
  };

  // Convert percentage (0 - 100) to year snapped on 100-year intervals
  const percentToYear = useCallback((percent: number) => {
    const raw = earliestYear + (percent / 100) * totalSpan;
    return snapYearToInterval(raw, earliestYear, latestYear, TIMELINE_INTERVAL_YEARS);
  }, [earliestYear, latestYear, totalSpan]);

  const startPercent = yearToPercent(startYear);
  const endPercent = yearToPercent(endYear);

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      if (!draggingThumb || !trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const currentPercent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const currentYear = percentToYear(currentPercent);

      if (draggingThumb === "start") {
        const nextStart = Math.min(currentYear, endYear);
        setTimeRange(nextStart, endYear);
      } else if (draggingThumb === "end") {
        const nextEnd = Math.max(currentYear, startYear);
        setTimeRange(startYear, nextEnd);
      } else if (draggingThumb === "range") {
        const deltaPx = e.clientX - dragStartRef.current.clientX;
        const deltaPercent = (deltaPx / rect.width) * 100;
        const rawDelta = (deltaPercent / 100) * totalSpan;
        const deltaYear = Math.round(rawDelta / TIMELINE_INTERVAL_YEARS) * TIMELINE_INTERVAL_YEARS;

        const rangeSpan = dragStartRef.current.endVal - dragStartRef.current.startVal;
        let nextStart = normalizeYear(dragStartRef.current.startVal + deltaYear, deltaYear);
        let nextEnd = normalizeYear(dragStartRef.current.endVal + deltaYear, deltaYear);

        if (nextStart < earliestYear) {
          nextStart = earliestYear;
          nextEnd = earliestYear + rangeSpan;
        }
        if (nextEnd > latestYear) {
          nextEnd = latestYear;
          nextStart = latestYear - rangeSpan;
        }

        setTimeRange(nextStart, nextEnd);
      }
    }

    function handlePointerUp() {
      setDraggingThumb(null);
    }

    if (draggingThumb) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
      return () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);
      };
    }
  }, [draggingThumb, startYear, endYear, earliestYear, latestYear, totalSpan, percentToYear, setTimeRange]);

  // 100-year interval hairline ticks, major labeled milestones & record density dots
  const intervalTicks = useMemo(
    () => timelineIntervalTicks(earliestYear, latestYear, TIMELINE_INTERVAL_YEARS),
    [earliestYear, latestYear],
  );
  const ticks = timelineTicks(earliestYear, latestYear);
  const recordMarkerPercents = useMemo(() => {
    if (totalSpan <= 0) return [];
    const seen = new Set<number>();
    const points: number[] = [];
    for (const r of records) {
      if (r.time.startYear === null || !r.place.coordinates) continue;
      const pct = Math.max(0.5, Math.min(99.5, ((r.time.startYear - earliestYear) / totalSpan) * 100));
      const bucket = Math.round(pct * 2);
      if (!seen.has(bucket)) {
        seen.add(bucket);
        points.push(pct);
      }
    }
    return points;
  }, [records, earliestYear, totalSpan]);

  function moveWithKeyboard(e: KeyboardEvent<HTMLButtonElement>, thumb: "start" | "end") {
    const value = thumb === "start" ? startYear : endYear;
    const step = e.shiftKey ? TIMELINE_INTERVAL_YEARS * 5 : TIMELINE_INTERVAL_YEARS;
    const delta = ["ArrowLeft", "ArrowDown"].includes(e.key) ? -step : ["ArrowRight", "ArrowUp"].includes(e.key) ? step : 0;
    let next = value;
    if (delta) next = snapYearToInterval(value + delta, earliestYear, latestYear, TIMELINE_INTERVAL_YEARS);
    else if (e.key === "Home") next = thumb === "start" ? earliestYear : startYear;
    else if (e.key === "End") next = thumb === "start" ? endYear : latestYear;
    else return;
    e.preventDefault();
    if (thumb === "start") setTimeRange(Math.min(endYear, next), endYear);
    else setTimeRange(startYear, Math.max(startYear, next));
  }

  const isFullRange = startYear <= earliestYear && endYear >= latestYear;

  // COLLAPSED STATE
  if (isTimelineCollapsed) {
    return (
      <div className="seam-timeline-collapsed-bar">
        <button
          type="button"
          className="seam-timeline-expand-btn"
          onClick={toggleTimelineCollapse}
          aria-label={language === "zh" ? "展开时间轴" : "Expand timeline"}
        >
          <span className="seam-timeline-icon" aria-hidden="true">⏱</span>
          <span className="seam-timeline-status-text">
            {language === "zh" ? "已展示全部历史时期 · 展开时间轴" : "Showing all eras · Expand timeline"}
          </span>
          <span className="seam-timeline-expand-arrow" aria-hidden="true">▲</span>
        </button>
      </div>
    );
  }

  // EXPANDED STATE
  return (
    <nav className="seam-timeline" aria-label={language === "zh" ? "历史时期筛选时间轴" : "Historical timeline filter"}>
      <div className="seam-timeline-inner">
        {/* Top Info Header */}
        <div className="seam-timeline-header">
          <div className="seam-timeline-active-range">
            <span className="seam-timeline-label">
              {language === "zh" ? "历史时期：" : "Era: "}
            </span>
            <strong>
              {formatYear(startYear, language)} — {formatYear(endYear, language)}
            </strong>
          </div>

          <div className="seam-timeline-controls">
            {!isFullRange && (
              <button
                type="button"
                className="seam-timeline-reset-btn"
                onClick={() => setTimeRange(earliestYear, latestYear)}
              >
                {language === "zh" ? "恢复全部时期" : "Reset to All"}
              </button>
            )}

            <button
              type="button"
              className="seam-timeline-collapse-btn"
              onClick={toggleTimelineCollapse}
              title={language === "zh" ? "收起时间轴并显示全部档案" : "Collapse timeline and show all records"}
              aria-label={language === "zh" ? "收起时间轴" : "Collapse timeline"}
            >
              <span>{language === "zh" ? "收起" : "Collapse"}</span>
              <span aria-hidden="true">▼</span>
            </button>
          </div>
        </div>

        {/* Linear Track */}
        <div
          ref={trackRef}
          className="seam-timeline-track"
          onPointerDown={(e) => {
            // Clicking directly on the track
            const rect = trackRef.current?.getBoundingClientRect();
            if (!rect) return;
            const clickPercent = ((e.clientX - rect.left) / rect.width) * 100;
            const clickYear = percentToYear(clickPercent);

            // Move closer thumb
            const distStart = Math.abs(clickYear - startYear);
            const distEnd = Math.abs(clickYear - endYear);
            if (distStart < distEnd) {
              setTimeRange(Math.min(clickYear, endYear), endYear);
            } else {
              setTimeRange(startYear, Math.max(clickYear, startYear));
            }
          }}
        >
          {/* Active Highlight Range Bar */}
          <div
            className="seam-timeline-highlight"
            style={{
              left: `${startPercent}%`,
              width: `${Math.max(1, endPercent - startPercent)}%`
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              dragStartRef.current = {
                clientX: e.clientX,
                startVal: startYear,
                endVal: endYear,
              };
              setDraggingThumb("range");
            }}
          />

          {/* Subtle Archive Temporal Distribution Dots */}
          {recordMarkerPercents.map((pct, idx) => (
            <span
              key={idx}
              className="seam-timeline-record-dot"
              style={{ left: `${pct}%` }}
              aria-hidden="true"
            />
          ))}

          {/* Start Thumb Handle */}
          <button
            type="button"
            className={`seam-timeline-handle ${draggingThumb === "start" ? "is-active" : ""}`}
            style={{ left: `${startPercent}%` }}
            onPointerDown={(e) => {
              e.stopPropagation();
              setDraggingThumb("start");
            }}
            aria-label={language === "zh" ? `起始年份：${formatYear(startYear, language)}` : `Start year: ${formatYear(startYear, language)}`}
            role="slider"
            onKeyDown={e => moveWithKeyboard(e, "start")}
            aria-valuetext={formatYear(startYear, language)}
            aria-valuemin={earliestYear}
            aria-valuemax={endYear}
            aria-valuenow={startYear}
          />

          {/* End Thumb Handle */}
          <button
            type="button"
            className={`seam-timeline-handle ${draggingThumb === "end" ? "is-active" : ""}`}
            style={{ left: `${endPercent}%` }}
            onPointerDown={(e) => {
              e.stopPropagation();
              setDraggingThumb("end");
            }}
            aria-label={language === "zh" ? `结束年份：${formatYear(endYear, language)}` : `End year: ${formatYear(endYear, language)}`}
            role="slider"
            onKeyDown={e => moveWithKeyboard(e, "end")}
            aria-valuetext={formatYear(endYear, language)}
            aria-valuemin={startYear}
            aria-valuemax={latestYear}
            aria-valuenow={endYear}
          />
        </div>

        {/* Bottom Year Ticks (100-year interval marks + readable major year labels) */}
        <div className="seam-timeline-ticks" aria-hidden="true">
          {intervalTicks.map(year => {
            const p = yearToPercent(year);
            const isMajor = year % 1000 === 0;
            return (
              <span
                key={`i-${year}`}
                className={`seam-timeline-interval-mark ${isMajor ? "is-major" : ""}`}
                style={{ left: `${p}%` }}
              />
            );
          })}
          {ticks.map(tick => {
            const p = yearToPercent(tick);
            return (
              <div key={tick} className="seam-timeline-tick" style={{ left: `${p}%` }}>
                <span className="seam-tick-mark" />
                <span className="seam-tick-label">
                  {formatYear(tick, language)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
