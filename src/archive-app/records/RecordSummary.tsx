import type { ArchiveEntry, Language } from "../../domain/archive/types";
import { displayHistoricalYear } from "../timeline/timelineModel";

interface RecordSummaryProps {
  entry: ArchiveEntry;
  language: Language;
}

export function RecordSummary({ entry, language }: RecordSummaryProps) {
  const location = entry.locations.find(item => item.isPrimary) ?? entry.locations[0];
  const locationLabel = location?.name[language] ?? "未标注位置";
  return (
    <>
      <dl className="record-drawer__meta">
        <div><dt>Original name</dt><dd>{entry.originalName ?? "—"}</dd></div>
        <div><dt>Time</dt><dd>{displayHistoricalYear(entry.temporal.startYear)} – {displayHistoricalYear(entry.temporal.endYear)}</dd></div>
        <div><dt>Location</dt><dd>{locationLabel}</dd></div>
        <div><dt>Evidence</dt><dd>{entry.evidenceGrades.join(" / ") || "D"}</dd></div>
      </dl>
      <p>{entry.description[language]}</p>
      <div className="record-drawer__status">演示数据：此条目用于验证博物馆导航和空间交互，尚不代表正式史料已完成核验。</div>
    </>
  );
}
