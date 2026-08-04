import React from "react";
import { MOCK_ENTRIES } from "../db/mockData";
import { UI_TRANSLATIONS, TAXONOMY_TRANSLATIONS } from "../db/translations";

interface DetailsDrawerProps {
  selectedEntryId: string | null;
  onClose: () => void;
  currentLanguage: "en" | "zh";
  onSelectEntry: (id: string) => void;
}

export const DetailsDrawer: React.FC<DetailsDrawerProps> = ({
  selectedEntryId,
  onClose,
  currentLanguage,
  onSelectEntry
}) => {
  const entry = MOCK_ENTRIES.find(e => e.id === selectedEntryId);

  if (!entry) return null;

  // Filter related entries by matching region or category
  const relatedEntries = MOCK_ENTRIES.filter(e => 
    e.id !== entry.id && 
    (e.region[currentLanguage] === entry.region[currentLanguage] || 
     e.sourceCategory === entry.sourceCategory)
  ).slice(0, 3);

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#entry/${entry.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(currentLanguage === "zh" ? "分享链接已复制到剪贴板！" : "Share link copied to clipboard!");
    }).catch(err => {
      console.error("Failed to copy share link:", err);
    });
  };

  const tTax = (key: string) => {
    if (TAXONOMY_TRANSLATIONS[key]) {
      return TAXONOMY_TRANSLATIONS[key][currentLanguage] || key;
    }
    return key;
  };

  return (
    <>
      {/* Background Dimmer */}
      <div 
        className="drawer-overlay" 
        onClick={onClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.4)",
          zIndex: 998,
          transition: "opacity 0.3s ease"
        }}
      />

      <article 
        className="detail-drawer active" 
        id="detail-drawer" 
        aria-hidden="false" 
        aria-labelledby="drawer-title"
        style={{ zIndex: 999 }}
      >
        <div className="drawer-header">
          <div className="drawer-title-group">
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h2 className="drawer-title" id="drawer-title">
                {entry.title[currentLanguage]}
              </h2>
              {/* Share Button */}
              <button 
                type="button" 
                className="drawer-share-btn" 
                id="drawer-share-btn" 
                onClick={handleCopyShareLink}
                aria-label="Copy share link" 
                style={{
                  background: "none", 
                  border: "none", 
                  cursor: "pointer", 
                  color: "var(--color-text-secondary)", 
                  padding: "0.25rem", 
                  display: "flex", 
                  alignItems: "center", 
                  transition: "var(--transition-fast)"
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
              </button>
            </div>
            <div className="drawer-original-name" id="drawer-original-name">
              {entry.originalName}
            </div>
          </div>
          <button className="drawer-close-btn" id="drawer-close-btn" onClick={onClose} aria-label="Close details drawer">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="drawer-body">
          {/* Spatiotemporal Metadata Group */}
          <div className="drawer-meta-section">
            <div className="meta-item">
              <span className="meta-label" id="label-drawer-origin">
                {UI_TRANSLATIONS.detailGeographic[currentLanguage]}
              </span>
              <span className="meta-value" id="drawer-region">
                {entry.region[currentLanguage]}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label" id="label-drawer-grade">
                {UI_TRANSLATIONS.detailGrade[currentLanguage]}
              </span>
              <span className="meta-value highlight" id="drawer-grade">
                Grade {entry.evidenceGrade}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label" id="label-drawer-epoch">
                {UI_TRANSLATIONS.detailEpoch[currentLanguage]}
              </span>
              <span className="meta-value" id="drawer-period">
                {entry.periodLabel[currentLanguage]}
              </span>
            </div>
            <div className="meta-item">
              <span className="meta-label" id="label-drawer-source">
                {UI_TRANSLATIONS.detailSource[currentLanguage]}
              </span>
              <span className="meta-value" id="drawer-source">
                {tTax(entry.sourceCategory)}
              </span>
            </div>
            {entry.alias[currentLanguage] && entry.alias[currentLanguage].length > 0 && (
              <div className="meta-item" id="meta-item-alias">
                <span className="meta-label" id="label-drawer-alias">
                  {UI_TRANSLATIONS.detailAlias[currentLanguage]}
                </span>
                <span className="meta-value" id="drawer-alias">
                  {entry.alias[currentLanguage].join(", ")}
                </span>
              </div>
            )}
            <div className="meta-item" id="meta-item-precision">
              <span className="meta-label" id="label-drawer-precision">
                {UI_TRANSLATIONS.detailPrecision[currentLanguage]}
              </span>
              <span className="meta-value" id="drawer-precision">
                {tTax(entry.locationPrecision)}
              </span>
            </div>
            <div className="meta-item" id="meta-item-types">
              <span className="meta-label" id="label-drawer-types">
                {UI_TRANSLATIONS.detailTypes[currentLanguage]}
              </span>
              <span className="meta-value" id="drawer-object-types">
                {entry.objectTypes.map(t => tTax(t)).join(", ")}
              </span>
            </div>
          </div>

          <div className="drawer-section-title">
            {UI_TRANSLATIONS.detailSummaryTitle[currentLanguage]}
          </div>
          <p className="drawer-summary" id="drawer-summary">
            {entry.summary[currentLanguage]}
          </p>
          <p 
            className="drawer-description" 
            id="drawer-description"
            dangerouslySetInnerHTML={{ __html: entry.description[currentLanguage] }}
          />

          {/* Cultural Meanings Badges */}
          <div className="drawer-section-title">
            {UI_TRANSLATIONS.detailMeaningsTitle[currentLanguage]}
          </div>
          <div className="drawer-badge-list" id="drawer-meanings-badges">
            {entry.culturalMeanings.map(meaning => (
              <span key={meaning} className="drawer-badge">
                {tTax(meaning)}
              </span>
            ))}
          </div>

          {/* Interpretive Risks Box */}
          <div className="risk-box">
            <div className="risk-title" id="drawer-risk-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              {UI_TRANSLATIONS.detailRisksTitle[currentLanguage]}
            </div>
            <p className="risk-text" id="drawer-risk-text">
              {entry.riskDetail[currentLanguage]}
            </p>
          </div>

          {/* Literary / Document References */}
          <div className="drawer-section-title">
            {UI_TRANSLATIONS.detailSourcesTitle[currentLanguage]}
          </div>
          <ul className="references-list" id="drawer-references" role="list">
            {entry.references[currentLanguage].map((ref, idx) => (
              <li key={idx}>{ref}</li>
            ))}
          </ul>

          {/* Related Records */}
          <div className="drawer-section-title" id="drawer-related-title">
            {UI_TRANSLATIONS.detailRelatedTitle[currentLanguage]}
          </div>
          <div className="related-records-grid" id="drawer-related-records">
            {relatedEntries.length === 0 ? (
              <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                {UI_TRANSLATIONS.noRelatedRecords[currentLanguage]}
              </div>
            ) : (
              relatedEntries.map(rel => (
                <div 
                  key={rel.id} 
                  className="related-record-card"
                  onClick={() => onSelectEntry(rel.id)}
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: "4px",
                    padding: "0.75rem",
                    cursor: "pointer",
                    backgroundColor: "rgba(0,0,0,0.01)",
                    transition: "var(--transition-fast)"
                  }}
                >
                  <h4 style={{ fontSize: "0.9rem", margin: "0 0 0.25rem 0", color: "var(--color-primary)" }}>
                    {rel.title[currentLanguage]}
                  </h4>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>
                    {rel.periodLabel[currentLanguage]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </article>
    </>
  );
};
