import type { HistoricalRange, Language } from "../types";
import { formatHistoricalYear, normalizeHistoricalYear } from "../utils/time";

const MIN_YEAR = -5000;
const MAX_YEAR = 2026;

interface AtlasTimelineProps {
  language: Language;
  range: HistoricalRange;
  includeUndated: boolean;
  onChange: (range: HistoricalRange) => void;
  onIncludeUndatedChange: (include: boolean) => void;
}

function displayBound(year: number | null, language: Language, fallback: string): string {
  return year === null ? fallback : formatHistoricalYear(year, language);
}

function parseYear(value: string): number | null {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = normalizeHistoricalYear(parsed);
  return Math.max(MIN_YEAR, Math.min(MAX_YEAR, normalized));
}

export function AtlasTimeline({ language, range, includeUndated, onChange, onIncludeUndatedChange }: AtlasTimelineProps) {
  const start = range.start ?? MIN_YEAR;
  const end = range.end ?? MAX_YEAR;
  const update = (nextStart: number, nextEnd: number) => {
    onChange({ start: Math.min(nextStart, nextEnd), end: Math.max(nextStart, nextEnd) });
  };

  return (
    <section className="atlas-timeline" aria-label={language === "zh" ? "历史时间范围" : "Historical time range"}>
      <div className="atlas-timeline-header">
        <div>
          <strong>{language === "zh" ? "时间范围" : "Time range"}</strong>
          <span>{displayBound(range.start, language, language === "zh" ? "起点" : "Start")} — {displayBound(range.end, language, language === "zh" ? "终点" : "End")}</span>
        </div>
        <label className="atlas-undated-toggle">
          <input type="checkbox" checked={includeUndated} onChange={event => onIncludeUndatedChange(event.target.checked)} />
          {language === "zh" ? "包括时间不详" : "Include undated"}
        </label>
      </div>
      <div className="atlas-range-controls">
        <input
          type="range"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={start}
          aria-label={language === "zh" ? "起始年份" : "Start year"}
          onChange={event => update(Number(event.target.value), end)}
        />
        <input
          type="range"
          min={MIN_YEAR}
          max={MAX_YEAR}
          value={end}
          aria-label={language === "zh" ? "结束年份" : "End year"}
          onChange={event => update(start, Number(event.target.value))}
        />
      </div>
      <div className="atlas-year-inputs">
        <label>{language === "zh" ? "起始" : "From"}<input type="number" value={range.start ?? ""} placeholder="—" onChange={event => onChange({ start: parseYear(event.target.value), end: range.end })} /></label>
        <label>{language === "zh" ? "结束" : "To"}<input type="number" value={range.end ?? ""} placeholder="—" onChange={event => onChange({ start: range.start, end: parseYear(event.target.value) })} /></label>
        <div className="atlas-presets" role="group" aria-label={language === "zh" ? "时间预设" : "Time presets"}>
          <button type="button" onClick={() => onChange({ start: null, end: null })}>{language === "zh" ? "全部" : "All"}</button>
          <button type="button" onClick={() => onChange({ start: -5000, end: 500 })}>{language === "zh" ? "古代" : "Ancient"}</button>
          <button type="button" onClick={() => onChange({ start: 1800, end: MAX_YEAR })}>{language === "zh" ? "近现代" : "Modern"}</button>
        </div>
      </div>
    </section>
  );
}
