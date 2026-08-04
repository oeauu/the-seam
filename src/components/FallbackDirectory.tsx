import React from "react";
import { MOCK_ENTRIES } from "../db/mockData";

interface FallbackDirectoryProps {
  currentLanguage: "en" | "zh";
  activeCountry: string | null;
  onSelectEntry: (id: string) => void;
  setActiveTab: (tab: string) => void;
}

export const FallbackDirectory: React.FC<FallbackDirectoryProps> = ({
  currentLanguage,
  activeCountry,
  onSelectEntry,
  setActiveTab
}) => {
  const countryName = activeCountry || "Selected Region";

  // Filter entries in mock data matching this country/region
  const relatedEntries = MOCK_ENTRIES.filter(entry => {
    const regionText = entry.region[currentLanguage].toLowerCase();
    const targetText = countryName.toLowerCase();
    return regionText.includes(targetText) || targetText.includes(regionText);
  });

  return (
    <div id="map-fallback-directory" className="map-fallback-directory" style={{ display: "block", padding: "2rem", backgroundColor: "#f8f6f0", minHeight: "100%" }}>
      <h3 className="serif-font" style={{ fontSize: "1.75rem", color: "var(--color-primary)", borderBottom: "1.5px dashed var(--color-border)", paddingBottom: "0.5rem", marginBottom: "1.5rem" }}>
        📁 {countryName} · {currentLanguage === "zh" ? "区域档案目录" : "Region Catalog"}
      </h3>
      
      {relatedEntries.length === 0 ? (
        <div style={{ border: "2px dashed #b8b09f", padding: "3rem", borderRadius: "8px", textAlign: "center", backgroundColor: "rgba(0,0,0,0.02)" }}>
          <p style={{ fontFamily: "var(--font-serif)", fontSize: "1.2rem", color: "#504d44", marginBottom: "1.5rem" }}>
            {currentLanguage === "zh"
              ? "该地区暂无已收录的历史或文献档案。"
              : "No cataloged historical or literary archives for this region yet."}
          </p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setActiveTab("submit")}
            style={{ padding: "0.5rem 1.5rem" }}
          >
            {currentLanguage === "zh" ? "✍️ 立即提交该地区首个条目" : "✍️ Contribute the first entry for this region"}
          </button>
        </div>
      ) : (
        <div className="archive-entries-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
          {relatedEntries.map(entry => (
            <div
              key={entry.id}
              className="entry-card"
              onClick={() => onSelectEntry(entry.id)}
              style={{
                backgroundColor: "white",
                border: "1.5px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "1.25rem",
                cursor: "pointer",
                transition: "var(--transition-smooth)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span className="entry-grade-badge" style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "3px", backgroundColor: "var(--color-bg-tag)", color: "var(--color-primary)", fontWeight: "bold" }}>
                  Grade {entry.evidenceGrade}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                  {entry.periodLabel[currentLanguage]}
                </span>
              </div>
              <h4 className="serif-font" style={{ fontSize: "1.2rem", margin: "0.25rem 0", color: "var(--color-text-primary)" }}>
                {entry.title[currentLanguage]}
              </h4>
              <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", margin: "0.5rem 0", lineHeight: "1.4" }}>
                {entry.summary[currentLanguage]}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
