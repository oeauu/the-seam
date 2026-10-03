import { useRef, useState, useEffect, useCallback } from "react";
import { formatYear, timelineTicks, normalizeYear } from "./timelineUtils";
import type { KeyboardEvent } from "react";
import { useApp } from "../state/appContext";

export function Timeline() {
  const {
    earliestYear,
    latestYear,
    startYear,
    endYear,
    setTimeRange,
    isTimelineCollapsed,
    toggleTimelineCollapse,
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

  // Convert percentage (0 - 100) to year
  const percentToYear = useCallback((percent: number) => {
    const raw = earliestYear + (percent / 100) * totalSpan;
    return normalizeYear(Math.max(earliestYear, Math.min(latestYear, Math.round(raw))));
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
        const deltaYear = Math.round((deltaPercent / 100) * totalSpan);

        const rangeSpan = dragStartRef.current.endVal - dragStartRef.current.startVal;
        let nextStart = dragStartRef.current.startVal + deltaYear;
        let nextEnd = dragStartRef.current.endVal + deltaYear;

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

  // Major ticks to display along the bottom
  const ticks = timelineTicks(earliestYear, latestYear);

  function moveWithKeyboard(e: KeyboardEvent<HTMLButtonElement>, thumb: "start" | "end") {
    const value = thumb === "start" ? startYear : endYear;
    const step = e.shiftKey ? 100 : 1;
    const delta = ["ArrowLeft", "ArrowDown"].includes(e.key) ? -step : ["ArrowRight", "ArrowUp"].includes(e.key) ? step : 0;
    let next = value;
    if (delta) next = normalizeYear(value + delta, delta);
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
            {isFullRange && (
              <span className="seam-timeline-tag">
                {language === "zh" ? "全部时期" : "All Eras"}
              </span>
            )}
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

        {/* Bottom Year Ticks */}
        <div className="seam-timeline-ticks" aria-hidden="true">
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
