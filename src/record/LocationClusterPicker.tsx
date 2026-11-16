import type { LocationCluster, ArchiveRecord } from "../types";
import { getRecordDisplayNames } from "../data/recordStatus";
import { useApp } from "../state/useApp";
import { useDialogFocus } from "../shell/useDialogFocus";

interface Props {
  cluster: LocationCluster;
  onSelectRecord: (record: ArchiveRecord) => void;
  onClose: () => void;
}

export function LocationClusterPicker({ cluster, onSelectRecord, onClose }: Props) {
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  const { language } = useApp();

  return (
    <div className="seam-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="picker-title">
      <div ref={dialogRef} className="seam-cluster-picker-modal" onClick={(e) => e.stopPropagation()}>
        <header className="seam-modal-header">
          <div>
            <span className="seam-modal-eyebrow">
              {language === "zh" ? "地理坐标档案集合" : "Location Records"}
            </span>
            <h2 id="picker-title" className="seam-modal-title">
              {cluster.name[language] || cluster.name.en}
            </h2>
          </div>
          <button
            type="button"
            className="seam-modal-close"
            onClick={onClose}
            aria-label={language === "zh" ? "关闭" : "Close"}
          >
            ×
          </button>
        </header>

        <p className="seam-cluster-desc">
          {language === "zh"
            ? `此坐标关联 ${cluster.records.length} 条历史档案，请选择具体记录进行阅读：`
            : `This coordinate includes ${cluster.records.length} archive records. Select an entry to read:`}
        </p>

        <ul className="seam-cluster-list">
          {cluster.records.map((r) => {
            const { mapTitle, mapOriginalName } = getRecordDisplayNames(r, language);
            return (
            <li key={r.id}>
              <button
                type="button"
                className="seam-cluster-item-btn"
                onClick={() => onSelectRecord(r)}
              >
                <div className="seam-cluster-item-main">
                  <strong className="seam-cluster-item-title">
                    {mapTitle}
                    {mapOriginalName && (
                      <span className="seam-cluster-item-orig" dir="auto"> · {mapOriginalName}</span>
                    )}
                  </strong>
                  <span className="seam-cluster-item-time">{r.time.label[language]}</span>
                </div>
                <p className="seam-cluster-item-summary">{r.summary[language]}</p>
                <span className="seam-cluster-item-arrow" aria-hidden="true">→</span>
              </button>
            </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
