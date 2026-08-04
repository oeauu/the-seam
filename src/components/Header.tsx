import React from "react";
import { UI_TRANSLATIONS } from "../db/translations";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentLanguage: "en" | "zh";
  setCurrentLanguage: (lang: "en" | "zh") => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  currentLanguage,
  setCurrentLanguage
}) => {
  return (
    <header className="app-header">
      <div className="brand-container">
        <h1 className="brand-title" id="app-logo">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--color-primary)" }}
          >
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            <path d="M2 12h20" />
          </svg>
          <span>THE QUEER ARCHIVE</span>
        </h1>
        <div className="brand-subtitle">
          {UI_TRANSLATIONS.brandSubtitle[currentLanguage]}
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
        <nav className="nav-tabs" aria-label="Main Navigation">
          <button
            className={`nav-tab ${activeTab === "map" ? "active" : ""}`}
            onClick={() => setActiveTab("map")}
            id="nav-btn-map"
          >
            {UI_TRANSLATIONS.tabMap[currentLanguage]}
          </button>
          <button
            className={`nav-tab ${activeTab === "archive" ? "active" : ""}`}
            onClick={() => setActiveTab("archive")}
            id="nav-btn-archive"
          >
            {UI_TRANSLATIONS.tabArchive[currentLanguage]}
          </button>
          <button
            className={`nav-tab ${activeTab === "submit" ? "active" : ""}`}
            onClick={() => setActiveTab("submit")}
            id="nav-btn-submit"
          >
            {UI_TRANSLATIONS.tabSubmit[currentLanguage]}
          </button>
          <button
            className={`nav-tab ${activeTab === "review" ? "active" : ""}`}
            onClick={() => setActiveTab("review")}
            id="nav-btn-review"
          >
            {UI_TRANSLATIONS.tabReview[currentLanguage]}
          </button>
          <button
            className={`nav-tab ${activeTab === "about" ? "active" : ""}`}
            onClick={() => setActiveTab("about")}
            id="nav-btn-about"
          >
            {UI_TRANSLATIONS.tabAbout[currentLanguage]}
          </button>
        </nav>

        <div
          className="lang-switcher"
          style={{
            display: "flex",
            gap: "0.25rem",
            border: "1px solid var(--color-border)",
            borderRadius: "4px",
            padding: "2px",
            backgroundColor: "rgba(0,0,0,0.02)"
          }}
          role="toolbar"
          aria-label="Language selection"
        >
          <button
            type="button"
            className={`lang-btn ${currentLanguage === "en" ? "active" : ""}`}
            id="lang-btn-en"
            onClick={() => setCurrentLanguage("en")}
            style={{
              background: "none",
              border: "none",
              fontFamily: "var(--font-display)",
              fontSize: "0.65rem",
              fontWeight: 600,
              padding: "0.25rem 0.5rem",
              cursor: "pointer",
              borderRadius: "2px",
              transition: "var(--transition-fast)"
            }}
          >
            EN
          </button>
          <button
            type="button"
            className={`lang-btn ${currentLanguage === "zh" ? "active" : ""}`}
            id="lang-btn-zh"
            onClick={() => setCurrentLanguage("zh")}
            style={{
              background: "none",
              border: "none",
              fontFamily: "var(--font-display)",
              fontSize: "0.65rem",
              fontWeight: 600,
              padding: "0.25rem 0.5rem",
              cursor: "pointer",
              borderRadius: "2px",
              transition: "var(--transition-fast)"
            }}
          >
            中文
          </button>
        </div>
      </div>
    </header>
  );
};
