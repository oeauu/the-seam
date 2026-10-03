import { useApp } from "../state/appContext";

export function Header() {
  const {
    language,
    setLanguage,
    setSubmitOpen,
    setAboutOpen,
    setIndexOpen,
    returnToGlobe
  } = useApp();

  return (
    <header className="seam-header" role="banner">
      <div className="seam-header-left">
        <a
          href="/"
          className="seam-brand-link"
          onClick={(e) => {
            e.preventDefault();
            returnToGlobe();
          }}
          aria-label="The Seam 首页"
        >
          <span className="seam-brand-title">The Seam</span>
          <span className="seam-brand-subtitle">
            {language === "zh" ? "时空历史数字档案" : "Spatiotemporal Historical Archive"}
          </span>
        </a>
      </div>

      <nav className="seam-header-right" aria-label="Main Navigation">
        <button
          type="button"
          className="seam-nav-link"
          onClick={() => setIndexOpen(true)}
          aria-label={language === "zh" ? "档案索引与搜索" : "Archive Index & Search"}
        >
          <span className="seam-nav-icon" aria-hidden="true">☵</span>
          <span>{language === "zh" ? "档案索引" : "Index"}</span>
        </button>

        <button
          type="button"
          className="seam-nav-link"
          onClick={() => setAboutOpen(true)}
        >
          <span>{language === "zh" ? "关于项目" : "About"}</span>
        </button>

        <button
          type="button"
          className="seam-nav-btn-submit"
          onClick={() => setSubmitOpen(true)}
        >
          <span>Submit</span>
        </button>

        <div className="seam-lang-toggle" role="group" aria-label="Language selection">
          <button
            type="button"
            className={`seam-lang-btn ${language === "zh" ? "is-active" : ""}`}
            onClick={() => setLanguage("zh")}
            aria-pressed={language === "zh"}
          >
            中
          </button>
          <span className="seam-lang-sep">/</span>
          <button
            type="button"
            className={`seam-lang-btn ${language === "en" ? "is-active" : ""}`}
            onClick={() => setLanguage("en")}
            aria-pressed={language === "en"}
          >
            EN
          </button>
        </div>
      </nav>
    </header>
  );
}
