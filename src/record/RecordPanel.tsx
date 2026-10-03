import { useEffect, useRef, useState } from "react";
import type { ArchiveRecord } from "../types";
import { useApp } from "../state/appContext";

interface RecordPanelProps {
  record: ArchiveRecord | null;
  onClose: () => void;
}

export function RecordPanel({ record, onClose }: RecordPanelProps) {
  const { language } = useApp();
  const panelRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!record) return;

    // Focus panel on open
    panelRef.current?.focus();

    // ESC to close
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [record, onClose]);

  if (!record) return null;

  const handleCopyLink = () => {
    const url = window.location.origin + `/record/${encodeURIComponent(record.slug)}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const title = record.title[language] || record.title.en;
  const summary = record.summary[language] || record.summary.en;
  const body = record.body[language] || record.body.en;
  const historiography = record.historiographyNote
    ? record.historiographyNote[language] || record.historiographyNote.en
    : null;

  const placeName = record.place.name[language] || record.place.name.en;
  const historicalPlace = record.place.historicalName
    ? record.place.historicalName[language] || record.place.historicalName.en
    : null;

  // Format relation into readable label
  const relationLabels: Record<string, { en: string; zh: string }> = {
    "event-site": { en: "Event Site", zh: "历史事件发生地" },
    "burial-site": { en: "Tomb / Burial Site", zh: "墓葬遗址地" },
    "activity-area": { en: "Historical Activity Area", zh: "主要活动地域" },
    "cultural-origin": { en: "Folk Cultural Origin", zh: "民俗叙事起源地" },
    "residence": { en: "Residence / Court", zh: "居所 / 宫廷地" },
    "court-site": { en: "Imperial Court Site", zh: "宫廷事迹地" },
    "representative": { en: "Representative Regional Anchor", zh: "代表性地域坐标" },
  };

  const relationText = relationLabels[record.place.relation]?.[language] || "";

  return (
    <>
      {/* Backdrop for mobile / focus lock */}
      <div
        className="seam-panel-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        ref={panelRef}
        className="seam-record-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-title"
        tabIndex={-1}
      >
        {/* Header */}
        <header className="seam-record-header">
          <div className="seam-record-header-meta">
            <span className="seam-record-kicker">
              {language === "zh" ? "The Seam · 历史档案" : "The Seam · Historical Record"}
            </span>
            <button
              type="button"
              className="seam-record-share-btn"
              onClick={handleCopyLink}
              title={language === "zh" ? "复制此档案独立链接" : "Copy permalink"}
            >
              {copied
                ? (language === "zh" ? "✓ 已复制链接" : "✓ Copied")
                : (language === "zh" ? "分享链接" : "Share URL")}
            </button>
          </div>

          <div className="seam-record-title-row">
            <h1 id="record-title" className="seam-record-title">
              {title}
            </h1>
            <button
              type="button"
              className="seam-record-close-btn"
              onClick={onClose}
              aria-label={language === "zh" ? "关闭档案面板" : "Close record panel"}
            >
              ×
            </button>
          </div>

          {/* Original Name & Aliases */}
          {(record.originalName || record.aliases.length > 0) && (
            <div className="seam-record-aliases">
              {record.originalName && (
                <span className="seam-record-original-name">
                  {record.originalName}
                </span>
              )}
              {record.aliases.length > 0 && (
                <span className="seam-record-alias-list">
                  {record.originalName && " · "}
                  {record.aliases.join(" / ")}
                </span>
              )}
            </div>
          )}
        </header>

        {/* Optional Image Area - strictly omitted if no image */}
        {record.images && record.images.length > 0 && (
          <div className="seam-record-image-section">
            {record.images.map((img, i) => (
              <figure key={i} className="seam-record-figure">
                <img src={img.src} alt={img.caption?.[language] || title} />
                {img.caption && (
                  <figcaption>{img.caption[language]}</figcaption>
                )}
              </figure>
            ))}
          </div>
        )}

        {/* Spatial and Temporal Anchor Strip */}
        <div className="seam-record-meta-strip">
          <div className="seam-meta-block">
            <span className="seam-meta-icon" aria-hidden="true">⏱</span>
            <div className="seam-meta-content">
              <span className="seam-meta-label">
                {language === "zh" ? "历史时期" : "Temporal Period"}
              </span>
              <strong className="seam-meta-value">
                {record.time.label[language] || record.time.label.en}
              </strong>
            </div>
          </div>

          <div className="seam-meta-block">
            <span className="seam-meta-icon" aria-hidden="true">📍</span>
            <div className="seam-meta-content">
              <span className="seam-meta-label">
                {language === "zh" ? "地理坐标与关系" : "Geographic Anchor"}
              </span>
              <strong className="seam-meta-value">
                {placeName}
                {historicalPlace && ` (${historicalPlace})`}
              </strong>
              {relationText && (
                <span className="seam-meta-sub">{relationText}</span>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="seam-record-body">
          {/* Summary */}
          <section className="seam-record-summary-section">
            <p className="seam-record-summary">{summary}</p>
          </section>

          {/* Full Narrative Text */}
          <section className="seam-record-narrative-section">
            <h2 className="seam-section-title">
              {language === "zh" ? "历史记录与文献记述" : "Historical Account & Documentation"}
            </h2>
            <div className="seam-record-text">
              {body.split("\n\n").map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </section>

          {/* Historiographical & Methodological Notes */}
          {historiography && (
            <section className="seam-record-historiography-section">
              <div className="seam-historiography-box">
                <h3 className="seam-historiography-title">
                  <span aria-hidden="true">✦ </span>
                  {language === "zh" ? "史料解读与边界说明" : "Historiographical & Contextual Note"}
                </h3>
                <p className="seam-historiography-content">{historiography}</p>
              </div>
            </section>
          )}

          {/* Sources and External References */}
          {record.sources && record.sources.length > 0 && (
            <section className="seam-record-sources-section">
              <h2 className="seam-section-title">
                {language === "zh" ? "参考资料与史料来源" : "Primary Sources & References"}
              </h2>
              <ul className="seam-sources-list">
                {record.sources.map((src, index) => (
                  <li key={index} className="seam-source-item">
                    <div className="seam-source-main">
                      <strong className="seam-source-title">{src.title}</strong>
                      {(src.author || src.year) && (
                        <span className="seam-source-author">
                          {src.author} {src.year ? `(${src.year})` : ""}
                        </span>
                      )}
                      {src.citation && (
                        <p className="seam-source-citation">{src.citation}</p>
                      )}
                    </div>
                    {src.url && (
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="seam-source-link"
                      >
                        <span>{language === "zh" ? "查阅文献" : "View Source"}</span>
                        <span aria-hidden="true"> ↗</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </aside>
    </>
  );
}
