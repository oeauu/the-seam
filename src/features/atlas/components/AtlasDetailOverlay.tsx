import type { ArchiveEntry, Language } from "../types";
import { getEntryDisplayPeriod, getEntryEvidenceLabel, getEntryPrimaryLocation } from "../selectors";
import { taxonomyLabel } from "../data/taxonomy";

interface AtlasDetailOverlayProps {
  entry: ArchiveEntry;
  language: Language;
  onOpenFullRecord: (entryId: string) => void;
  onBack: () => void;
}

export function AtlasDetailOverlay({ entry, language, onOpenFullRecord, onBack }: AtlasDetailOverlayProps) {
  const location = getEntryPrimaryLocation(entry);
  return (
    <aside className="atlas-detail-overlay" role="dialog" aria-labelledby="atlas-focus-title">
      <div className="atlas-detail-eyebrow">{language === "zh" ? "馆藏聚焦" : "Collection focus"}</div>
      <h3 id="atlas-focus-title">{entry.title[language]}</h3>
      {entry.originalName && <p className="atlas-detail-original">{entry.originalName}</p>}
      <dl>
        <div><dt>{language === "zh" ? "时间" : "Time"}</dt><dd>{getEntryDisplayPeriod(entry)[language]}</dd></div>
        <div><dt>{language === "zh" ? "地点" : "Place"}</dt><dd>{location?.name[language] ?? (language === "zh" ? "地点不详" : "Unknown")}</dd></div>
        <div><dt>{language === "zh" ? "来源" : "Source"}</dt><dd>{entry.sourceTypeIds.slice(0, 2).map(id => taxonomyLabel(id, language)).join(" · ")}</dd></div>
        <div><dt>{language === "zh" ? "证据" : "Evidence"}</dt><dd>Grade {getEntryEvidenceLabel(entry)}</dd></div>
      </dl>
      <p>{entry.summary[language]}</p>
      <div className="atlas-demo-status">{language === "zh" ? "演示数据，尚待史料核验" : "Demo content pending source review"}</div>
      <div className="atlas-detail-actions">
        <button type="button" className="atlas-primary-action" onClick={() => onOpenFullRecord(entry.id)}>{language === "zh" ? "查看完整档案" : "Open full record"}</button>
        <button type="button" onClick={onBack}>{language === "zh" ? "返回区域" : "Back to region"}</button>
      </div>
    </aside>
  );
}
