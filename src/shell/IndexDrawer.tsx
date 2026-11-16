import { useMemo, useState } from "react";
import { getPendingVerificationLabel } from "../data/recordStatus";
import { useApp } from "../state/useApp";
import type { ArchiveRecord } from "../types";
import { useDialogFocus } from "./useDialogFocus";

interface Props {
  onClose: () => void;
}

export function IndexDrawer({ onClose }: Props) {
  const { records, openRecord, language } = useApp();
  const dialogRef = useDialogFocus<HTMLElement>(onClose);
  const [search, setSearch] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);

  const pendingCount = useMemo(
    () => records.filter(r => getPendingVerificationLabel(r, language) !== null).length,
    [records, language],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter(r => {
      if (pendingOnly && getPendingVerificationLabel(r, language) === null) return false;
      if (!q) return true;
      const matchTitle = (r.title.en + " " + r.title.zh).toLowerCase().includes(q);
      const matchAlias = r.aliases.some(a => a.toLowerCase().includes(q));
      const matchPlace = [r.place.name.en, r.place.name.zh, r.place.historicalName?.en, r.place.historicalName?.zh].filter(Boolean).join(" ").toLowerCase().includes(q);
      const matchOriginal = r.originalName?.toLowerCase().includes(q) || false;
      const matchSummary = (r.summary.en + " " + r.summary.zh).toLowerCase().includes(q);
      const matchBody = (r.body.en + " " + r.body.zh).toLowerCase().includes(q);
      return matchTitle || matchAlias || matchPlace || matchOriginal || matchSummary || matchBody;
    });
  }, [records, search, pendingOnly, language]);

  const handleSelect = (record: ArchiveRecord) => {
    openRecord(record, true);
    onClose();
  };

  return (
    <>
      <div className="seam-panel-backdrop" onClick={onClose} aria-hidden="true" />
      <aside ref={dialogRef} className="seam-index-drawer" role="dialog" aria-modal="true" aria-labelledby="index-title">
        <header className="seam-index-header">
          <div>
            <span className="seam-record-kicker">The Seam · Directory</span>
            <h2 id="index-title" className="seam-modal-title">
              {language === "zh" ? "全宗档案索引与检索" : "Archive Index & Search"}
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

        <div className="seam-index-search-bar">
          <input
            type="search"
            aria-label={language === "zh" ? "搜索档案" : "Search archive"}
            className="seam-search-input"
            placeholder={language === "zh" ? "搜索人物、别名、历史地点或正文内容..." : "Search figures, aliases, places, or texts..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        <div className="seam-index-stats">
          <button
            type="button"
            className="seam-pending-filter-btn"
            aria-pressed={pendingOnly}
            onClick={() => setPendingOnly(!pendingOnly)}
          >
            {language === "zh" ? "地点与事件待考" : "Pending verification"} ({pendingCount})
          </button>
          <span>
            {language === "zh"
              ? `共检索到 ${filtered.length} / ${records.length} 份历史档案`
              : `Showing ${filtered.length} of ${records.length} records`}
          </span>
        </div>

        <div className="seam-index-body">
          <ul className="seam-index-list">
            {filtered.map(record => {
              const pendingLabel = getPendingVerificationLabel(record, language);
              return (
                <li key={record.id} className="seam-index-item">
                  <button
                    type="button"
                    className="seam-index-item-btn"
                    onClick={() => handleSelect(record)}
                  >
                    <div className="seam-index-item-header">
                      <strong className="seam-index-title">
                        {record.title[language] || record.title.en}
                      </strong>
                      <span className="seam-index-era">
                        {record.time.label[language]}
                      </span>
                    </div>
                    <div className="seam-index-item-meta">
                      <span className="seam-index-place">
                        📍 {record.place.name[language] || record.place.name.en}
                      </span>
                      {pendingLabel && (
                        <span className="seam-pending-tag">{pendingLabel}</span>
                      )}
                      {record.aliases.length > 0 && (
                        <span className="seam-index-alias">
                          · {record.aliases.slice(0, 2).join(", ")}
                        </span>
                      )}
                    </div>
                    <p className="seam-index-summary">
                      {record.summary[language] || record.summary.en}
                    </p>
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="seam-index-empty">
                <p>
                  {language === "zh"
                    ? "未找到匹配的历史记录。可尝试其他关键词或提交新档案。"
                    : "No matching records found. Try another search term or submit a new entry."}
                </p>
              </li>
            )}
          </ul>
        </div>
      </aside>
    </>
  );
}
