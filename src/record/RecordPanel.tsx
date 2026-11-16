import { useEffect, useRef, useState } from "react";
import { getPendingVerificationLabel, getRecordOtherNames } from "../data/recordStatus";
import type { ArchiveRecord } from "../types";
import { useApp } from "../state/useApp";

interface RecordPanelProps {
  record: ArchiveRecord | null;
  onClose: () => void;
}

export function RecordPanel({ record, onClose }: RecordPanelProps) {
  const { language } = useApp();
  const panelRef = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const recordId = record?.id;

  useEffect(() => {
    if (!recordId) return;

    // Reset scroll position and focus panel on open
    if (panelRef.current) {
      panelRef.current.scrollTop = 0;
      panelRef.current.focus();
    }

    setCopied(false);
    setCopyFailed(false);
  }, [recordId]);

  if (!record) return null;

  const handleCopyLink = async () => {
    const url = window.location.origin + `/record/${encodeURIComponent(record.slug)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch { setCopyFailed(true); }
  };

  const title = record.title[language] || record.title.en;
  const summary = record.summary[language] || record.summary.en;
  const body = record.body[language] || record.body.en;

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
  const pendingLabel = getPendingVerificationLabel(record, language);
  const otherNames = getRecordOtherNames(record, language);

  return (
    <>
      <aside
        ref={panelRef}
        className="seam-record-panel"
        role="dialog"
        aria-modal="false"
        onKeyDown={e => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } }}
        aria-labelledby="record-title"
        tabIndex={-1}
      >
        {/* Slim Sticky Action Bar */}
        <div className="seam-record-topbar">
          <div className="seam-record-kicker-group">
            <span className="seam-record-kicker">
              {language === "zh" ? "The Seam · 历史档案" : "The Seam · Historical Record"}
            </span>
            {pendingLabel && (
              <span className="seam-pending-tag">{pendingLabel}</span>
            )}
          </div>
          <div className="seam-record-topbar-actions">
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
            <button
              type="button"
              className="seam-record-close-btn"
              onClick={onClose}
              aria-label={language === "zh" ? "关闭档案面板" : "Close record panel"}
            >
              ×
            </button>
          </div>
        </div>

        {/* Scrollable Document Header */}
        <header className="seam-record-header">
          {copyFailed && <p className="seam-copy-fallback" role="status"><a href={`/record/${encodeURIComponent(record.slug)}`}>{language === "zh" ? "复制失败，可手动复制此档案链接" : "Copy failed; copy this permalink manually"}</a></p>}

          <h1 id="record-title" className="seam-record-title">
            {title}
          </h1>

          <p className="seam-record-deck">{summary}</p>
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
                {img.credit && <figcaption>{img.credit}</figcaption>}
                {img.sourceUrl && <a href={img.sourceUrl} target="_blank" rel="noopener noreferrer">{language === "zh" ? "图片来源 ↗" : "Image source ↗"}</a>}
              </figure>
            ))}
          </div>
        )}

        {/* Spatial and Temporal Anchor Strip */}
        <div className="seam-record-meta-strip">
          <div className="seam-meta-block">
            <span className="seam-meta-icon" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 14" />
              </svg>
            </span>
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
            <span className="seam-meta-icon" aria-hidden="true">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 21s-6-5.3-6-10.5a6 6 0 1 1 12 0C18 15.7 12 21 12 21z" />
                <circle cx="12" cy="10.5" r="2" />
              </svg>
            </span>
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
              {record.place.notes && <span className="seam-meta-sub">{record.place.notes[language]}</span>}
            </div>
          </div>

          {otherNames && (
            <div className="seam-meta-block seam-meta-block-wide">
              <span className="seam-meta-icon" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h16M4 12h12M4 18h8" />
                </svg>
              </span>
              <div className="seam-meta-content">
                <span className="seam-meta-label">
                  {language === "zh" ? "原名与别称" : "Original & Other Names"}
                </span>
                <span className="seam-meta-sub seam-meta-names">{otherNames}</span>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Body */}
        <div className="seam-record-body">
          {record.reviewNote && (
            <div className="seam-pending-note">
              {pendingLabel && <span className="seam-pending-tag">{pendingLabel}</span>}
              <p>{record.reviewNote[language]}</p>
            </div>
          )}

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
                      {src.note && <p>{src.note[language]}</p>}
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
