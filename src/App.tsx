import React, { useState, useEffect, useMemo } from "react";
import { Header } from "./components/Header";
import { DetailsDrawer } from "./components/DetailsDrawer";
import { ContributeForm } from "./components/ContributeForm";
import { AtlasViewport } from "./features/atlas/AtlasViewport";

import { MOCK_ENTRIES } from "./db/mockData";
import { EVENTS_DATA } from "./db/eventsData";
import { UI_TRANSLATIONS, TAXONOMY_TRANSLATIONS } from "./db/translations";
import { ARCHIVE_ENTRIES } from "./features/atlas/data/archiveEntries";
import { taxonomyLabel } from "./features/atlas/data/taxonomy";


export const App: React.FC = () => {
  // Global States
  const [activeTab, setActiveTab] = useState<string>("map"); // map, archive, submit, review, about
  const [currentLanguage, setCurrentLanguage] = useState<"en" | "zh">("zh");
  const [activeTimelineYear] = useState<number>(2026);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSourceCategories, setSelectedSourceCategories] = useState<string[]>([]);
  const [selectedMeanings, setSelectedMeanings] = useState<string[]>([]);
  const [selectedObjectTypes, setSelectedObjectTypes] = useState<string[]>([]);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);

  // Submissions and Moderation Queue
  const [submissions, setSubmissions] = useState<any[]>([
    {
      id: "submission_mock_1",
      title: { en: "Niankhkhnum Tomb Reinterpretation", zh: "尼安克克努姆合葬墓现代激活" },
      originalName: "Niankhkhnum",
      region: { en: "Egypt / Saqqara", zh: "埃及萨卡拉" },
      periodLabel: { en: "Modern Era", zh: "当代" },
      sourceCategory: "Cultural Memory",
      evidenceGrade: "D",
      summary: { en: "Re-activating old Egyptian paintings in Cairo modern galleries.", zh: "在开罗现代画廊重新激活古埃及壁画叙事。" },
      description: { en: "Description details...", zh: "详细描述内容..." },
      references: { en: ["Egyptology Today"], zh: ["今日埃及学"] },
      contributor: "Archivist Sarah",
      status: "pending",
      comments: ""
    },
    {
      id: "submission_mock_2",
      title: { en: "Sappho's Fragment 31 Translation Dispute", zh: "萨福残篇31翻译争议" },
      originalName: "Σαπφώ",
      region: { en: "Greece / Lesbos", zh: "希腊莱斯沃斯" },
      periodLabel: { en: "Archaic Greece", zh: "古希腊时期" },
      sourceCategory: "Textual Sources",
      evidenceGrade: "B",
      summary: { en: "Analyzing translation bias in Victorian Sappho prints.", zh: "分析维多利亚时期萨福诗作印刷版中的翻译偏差。" },
      description: { en: "Description details...", zh: "详细描述内容..." },
      references: { en: ["Victorian Studies 2004"], zh: ["维多利亚研究 2004"] },
      contributor: "Scholar James",
      status: "needs_revision",
      comments: "Please provide the original Greek text references."
    }
  ]);
  const [userRole, setUserRole] = useState<"contributor" | "reviewer">("contributor");
  const [editorFeedback, setEditorFeedback] = useState<Record<string, string>>({});

  // Archive subtabs
  const [archiveSubtab, setArchiveSubtab] = useState<string>("grid"); // grid, chronology, sources, keywords

  // Collapsible Sidebar Sections
  const [themesExpanded, setThemesExpanded] = useState(true);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  // Region Insights full-screen overlay state
  const [insightsRegion, setInsightsRegion] = useState<string | null>(null);

  // Translate helper
  const tTax = (key: string) => {
    if (TAXONOMY_TRANSLATIONS[key]) {
      return TAXONOMY_TRANSLATIONS[key][currentLanguage] || key;
    }
    return key;
  };

  const tAtlasTax = (key: string) =>
    TAXONOMY_TRANSLATIONS[key]?.[currentLanguage] || taxonomyLabel(key, currentLanguage);

  // Snaps timeline range values
  const getYearDisplay = (year: number) => {
    if (year < 0) {
      return currentLanguage === "zh" ? `公元前${Math.abs(year)}年` : `${Math.abs(year)} BCE`;
    } else if (year === 0) {
      return currentLanguage === "zh" ? "公元元年" : "1 CE / Year 0";
    } else {
      return currentLanguage === "zh" ? `公元${year}年` : `${year} CE`;
    }
  };

  // URL Hash Routing for easy sharing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#entry/")) {
        const id = hash.replace("#entry/", "");
        setSelectedEntryId(id);
      }
    };
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // run once on mount
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Update hash when selectedEntryId changes
  useEffect(() => {
    if (selectedEntryId) {
      window.location.hash = `#entry/${selectedEntryId}`;
    } else {
      // Clear hash only if it was an entry hash
      if (window.location.hash.startsWith("#entry/")) {
        window.location.hash = "";
      }
    }
  }, [selectedEntryId]);

  // Combine event entries (Mock data + approved submissions)
  const getCombinedEvents = () => {
    const approvedSubmissions = submissions
      .filter(s => s.status === "approved")
      .map(s => ({
        location: s.region,
        year: s.periodLabel.zh.includes("前") || s.periodLabel.en.includes("BCE") ? -2000 : 2026, // map approximation
        yearDisplay: s.periodLabel,
        events: [
          {
            name: s.title,
            summary: s.summary,
            contributor: { en: s.contributor, zh: s.contributor },
            source: { en: s.references.en[0], zh: s.references.zh?.[0] || s.references.en[0] }
          }
        ]
      }));

    return [...EVENTS_DATA, ...approvedSubmissions];
  };

  // Curated Themes Filter Handler
  const handleThemeToggle = (theme: string) => {
    if (activeTheme === theme) {
      // Reset theme
      setActiveTheme(null);
      setSelectedSourceCategories([]);
      setSelectedMeanings([]);
      setSelectedObjectTypes([]);
    } else {
      setActiveTheme(theme);
      if (theme === "sacred") {
        setSelectedSourceCategories(["Cultural Memory"]);
        setSelectedMeanings(["Sacred", "Border Body", "Deity"]);
        setSelectedObjectTypes(["Deity", "Mythological Figure"]);
      } else if (theme === "performance") {
        setSelectedSourceCategories(["Textual Sources"]);
        setSelectedMeanings(["Performative Disguise", "Ambiguity"]);
        setSelectedObjectTypes(["Theatrical Image", "Historical Figures"]);
      } else if (theme === "power") {
        setSelectedSourceCategories(["Historical Documents"]);
        setSelectedMeanings(["Favoritism", "Power Intimacy"]);
        setSelectedObjectTypes(["Historical Figures", "Historical Allusion"]);
      } else if (theme === "reclaiming") {
        setSelectedSourceCategories(["Cultural Memory"]);
        setSelectedMeanings(["Modern Re-activation", "Reclaiming"]);
        setSelectedObjectTypes(["Modern Reinterpretation"]);
      }
    }
  };

  const handleSourceFilterToggle = (category: string) => {
    setActiveTheme(null);
    setSelectedSourceCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleMeaningFilterToggle = (meaning: string) => {
    setActiveTheme(null);
    setSelectedMeanings(prev =>
      prev.includes(meaning) ? prev.filter(m => m !== meaning) : [...prev, meaning]
    );
  };

  const handleObjectTypeFilterToggle = (type: string) => {
    setActiveTheme(null);
    setSelectedObjectTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Filter entries based on search & sidebar tags
  const filteredEntries = useMemo(() => {
    return MOCK_ENTRIES.filter(entry => {
      // Search text match
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchTitle = entry.title[currentLanguage].toLowerCase().includes(query) || entry.title.en.toLowerCase().includes(query);
        const matchSummary = entry.summary[currentLanguage].toLowerCase().includes(query) || entry.summary.en.toLowerCase().includes(query);
        const matchOriginal = entry.originalName.toLowerCase().includes(query);
        if (!matchTitle && !matchSummary && !matchOriginal) return false;
      }

      // Source category filter
      if (selectedSourceCategories.length > 0 && !selectedSourceCategories.includes(entry.sourceCategory)) {
        return false;
      }

      // Cultural meanings filter (must match at least one of the selected tags)
      if (selectedMeanings.length > 0 && !entry.culturalMeanings.some(m => selectedMeanings.includes(m))) {
        return false;
      }

      // Object types filter (must match at least one of the selected tags)
      if (selectedObjectTypes.length > 0 && !entry.objectTypes.some(t => selectedObjectTypes.includes(t))) {
        return false;
      }

      return true;
    });
  }, [searchQuery, selectedSourceCategories, selectedMeanings, selectedObjectTypes, currentLanguage]);

  // Sidebar list of active city entries based on timeline year
  const activeTimelineEntries = useMemo(() => {
    const yearEvents = getCombinedEvents().filter(ev => ev.year === activeTimelineYear);
    const activeLocations = yearEvents.map(ev => {
      if (typeof ev.location === "object" && ev.location && ev.location.en) {
        return ev.location.en.toLowerCase();
      }
      return String(ev.location).toLowerCase();
    });

    return filteredEntries.filter(entry => 
      activeLocations.some(loc => 
        entry.region.en.toLowerCase().includes(loc) || loc.includes(entry.region.en.toLowerCase())
      )
    );
  }, [filteredEntries, activeTimelineYear, getCombinedEvents]);

  // Analytics breakdown calculations
  const analytics = useMemo(() => {
    const grades: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
    const sources: Record<string, number> = {};
    const regions: Record<string, number> = {};

    filteredEntries.forEach(entry => {
      // Grades
      const grade = entry.evidenceGrade.split(" / ")[0]; // take first grade
      if (grades[grade] !== undefined) grades[grade]++;

      // Sources
      sources[entry.sourceCategory] = (sources[entry.sourceCategory] || 0) + 1;

      // Regions
      const region = entry.region[currentLanguage].split(" (")[0].split(" / ")[0];
      regions[region] = (regions[region] || 0) + 1;
    });

    return { grades, sources, regions };
  }, [filteredEntries, currentLanguage]);

  // Region Insights statistics calculations
  const regionInsightsStats = useMemo(() => {
    if (!insightsRegion) return null;
    const regionEntries = ARCHIVE_ENTRIES.filter(entry =>
      entry.locations.some(location => location.regionId === insightsRegion),
    );

    const meanings: Record<string, number> = {};
    const sources: Record<string, number> = {};
    let minYear: number | null = null;
    let maxYear: number | null = null;

    regionEntries.forEach(entry => {
      entry.culturalMeaningIds.forEach(meaningId => meanings[meaningId] = (meanings[meaningId] || 0) + 1);
      const primarySource = entry.sourceTypeIds[0] || "unknown";
      sources[primarySource] = (sources[primarySource] || 0) + 1;
      if (entry.temporal.startYear !== null && (minYear === null || entry.temporal.startYear < minYear)) {
        minYear = entry.temporal.startYear;
      }
      if (entry.temporal.endYear !== null && (maxYear === null || entry.temporal.endYear > maxYear)) {
        maxYear = entry.temporal.endYear;
      }
    });

    return {
      count: regionEntries.length,
      span: minYear !== null && maxYear !== null ? `${getYearDisplay(minYear)} ~ ${getYearDisplay(maxYear)}` : "All Time",
      meanings,
      sources
    };
  }, [insightsRegion, currentLanguage]);

  // Add new submission
  const handleAddNewSubmission = (newEntry: any) => {
    setSubmissions(prev => [newEntry, ...prev]);
  };

  // Mod moderation actions
  const handleModeration = (id: string, action: "approve" | "reject", feedback?: string) => {
    setSubmissions(prev =>
      prev.map(s => {
        if (s.id === id) {
          return {
            ...s,
            status: action === "approve" ? "approved" : "needs_revision",
            comments: feedback || ""
          };
        }
        return s;
      })
    );
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentLanguage={currentLanguage}
        setCurrentLanguage={setCurrentLanguage}
      />

      {/* Main Content Area */}
      {activeTab === "map" && (
        <main className="app-main" id="main-map-layout">
          {/* Left Sidebar: Controls & Listing */}
          <aside className="app-sidebar" aria-label="Filters and Entries List">
            {/* Search */}
            <div className="sidebar-header">
              <div className="search-wrapper">
                <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="search-input"
                  placeholder={UI_TRANSLATIONS.searchPlaceholder[currentLanguage]}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  aria-label="Search entries"
                />
              </div>
            </div>

            {/* Collapsible Curated Themes */}
            <button
              className="filter-toggle-btn"
              onClick={() => setThemesExpanded(!themesExpanded)}
              aria-expanded={themesExpanded}
              aria-controls="themes-container"
            >
              <span>{UI_TRANSLATIONS.themesTitle[currentLanguage]}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transition: "var(--transition-smooth)", transform: themesExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {themesExpanded && (
              <div className="themes-container" id="themes-container">
                <button
                  type="button"
                  className={`theme-preset-btn ${activeTheme === "sacred" ? "active" : ""}`}
                  onClick={() => handleThemeToggle("sacred")}
                >
                  <span className="theme-icon">✦</span>
                  <span className="theme-name">
                    {currentLanguage === "zh" ? "神圣肉身与萨满" : "Sacred & Border Bodies"}
                  </span>
                </button>
                <button
                  type="button"
                  className={`theme-preset-btn ${activeTheme === "performance" ? "active" : ""}`}
                  onClick={() => handleThemeToggle("performance")}
                >
                  <span className="theme-icon">🎭</span>
                  <span className="theme-name">
                    {currentLanguage === "zh" ? "性别变装与戏剧" : "Gender Performance & Disguise"}
                  </span>
                </button>
                <button
                  type="button"
                  className={`theme-preset-btn ${activeTheme === "power" ? "active" : ""}`}
                  onClick={() => handleThemeToggle("power")}
                >
                  <span className="theme-icon">👑</span>
                  <span className="theme-name">
                    {currentLanguage === "zh" ? "朝政宠幸与权力亲密" : "Power & Court Intimacy"}
                  </span>
                </button>
                <button
                  type="button"
                  className={`theme-preset-btn ${activeTheme === "reclaiming" ? "active" : ""}`}
                  onClick={() => handleThemeToggle("reclaiming")}
                >
                  <span className="theme-icon">🕯️</span>
                  <span className="theme-name">
                    {currentLanguage === "zh" ? "当代召回与再激活" : "Modern Reclamation"}
                  </span>
                </button>
              </div>
            )}

            {/* Collapsible Curatorial Filters */}
            <button
              className="filter-toggle-btn"
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              aria-expanded={filtersExpanded}
              aria-controls="filters-container"
            >
              <span>{UI_TRANSLATIONS.curatorialFilters[currentLanguage]}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transition: "var(--transition-smooth)", transform: filtersExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {filtersExpanded && (
              <div className="filters-container" id="filters-container">
                {/* Source Categories */}
                <div>
                  <div className="filter-group-title">
                    {UI_TRANSLATIONS.sourceCategoriesTitle[currentLanguage]}
                  </div>
                  <div className="filter-tags-grid">
                    {["Historical Documents", "Textual Sources", "Cultural Memory"].map(cat => (
                      <span
                        key={cat}
                        className={`filter-tag ${selectedSourceCategories.includes(cat) ? "active" : ""}`}
                        onClick={() => handleSourceFilterToggle(cat)}
                      >
                        {tTax(cat)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cultural Meanings */}
                <div>
                  <div className="filter-group-title">
                    {UI_TRANSLATIONS.culturalMeaningsTitle[currentLanguage]}
                  </div>
                  <div className="filter-tags-grid">
                    {["Sacred", "Taboo", "Guardian", "Local Memory", "Modern Re-activation", "Favoritism", "Power Intimacy", "Ambiguity", "Poetic Desire", "Female Intimacy", "Reclaiming"].map(mean => (
                      <span
                        key={mean}
                        className={`filter-tag ${selectedMeanings.includes(mean) ? "active" : ""}`}
                        onClick={() => handleMeaningFilterToggle(mean)}
                      >
                        {tTax(mean)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Object Types */}
                <div>
                  <div className="filter-group-title">
                    {UI_TRANSLATIONS.objectTypesTitle[currentLanguage]}
                  </div>
                  <div className="filter-tags-grid">
                    {["Historical Figures", "Historical Allusion", "Deity", "Mythological Figure", "Modern Reinterpretation", "Poet"].map(type => (
                      <span
                        key={type}
                        className={`filter-tag ${selectedObjectTypes.includes(type) ? "active" : ""}`}
                        onClick={() => handleObjectTypeFilterToggle(type)}
                      >
                        {tTax(type)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Results Sidebar list */}
            <div className="sidebar-results">
              <div className="results-count" id="results-count">
                {UI_TRANSLATIONS.resultsCount[currentLanguage].replace("{num}", String(activeTimelineEntries.length))}
              </div>
              <div className="results-list" id="sidebar-results-list" role="list">
                {activeTimelineEntries.map(entry => (
                  <div
                    key={entry.id}
                    className="sidebar-entry-card"
                    onClick={() => setSelectedEntryId(entry.id)}
                    style={{
                      borderBottom: "1px solid var(--color-border)",
                      padding: "0.75rem",
                      cursor: "pointer",
                      transition: "var(--transition-fast)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.7rem", color: "var(--color-text-secondary)" }}>
                      <span>Grade {entry.evidenceGrade}</span>
                      <span>{entry.periodLabel[currentLanguage]}</span>
                    </div>
                    <h4 style={{ margin: "0.25rem 0", fontSize: "0.95rem", fontFamily: "var(--font-serif)", color: "var(--color-text-primary)" }}>
                      {entry.title[currentLanguage]}
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.summary[currentLanguage]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Center Viewport */}
          <div className="viewport-container">
            <AtlasViewport
              entries={ARCHIVE_ENTRIES}
              currentLanguage={currentLanguage}
              searchQuery={searchQuery}
              selectedSourceIds={selectedSourceCategories}
              selectedMeaningIds={selectedMeanings}
              selectedObjectTypeIds={selectedObjectTypes}
              selectedEntryId={selectedEntryId}
              onSelectEntry={setSelectedEntryId}
              onSelectRegion={setInsightsRegion}
              onRequestContribution={() => setActiveTab("submit")}
              getCombinedEvents={getCombinedEvents}
            />
          </div>

          {/* Details Drawer */}
          <DetailsDrawer
            selectedEntryId={selectedEntryId}
            onClose={() => setSelectedEntryId(null)}
            currentLanguage={currentLanguage}
            onSelectEntry={setSelectedEntryId}
          />
        </main>
      )}

      {/* Browse Cards View (High density Grid) */}
      {activeTab === "archive" && (
        <section className="view-container active" id="view-archive" aria-label="Browse Cards">
          <div className="text-page-layout">
            <h2 className="section-page-title">{currentLanguage === "zh" ? "浏览历史卡片" : "Browse Archival Cards"}</h2>
            <div className="section-page-subtitle">{currentLanguage === "zh" ? "根据左侧多维条件筛选的酷儿人物高密度展示列表" : "A high-density representation of filtered queer cultural figures"}</div>

            <div className="archive-grid-controls" style={{ marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
                {currentLanguage === "zh"
                  ? "请切换回“时空地球”选项卡，在左侧栏使用多维策展筛选以及下方的时间长河播放器，即时同步控制此列表的呈现。"
                  : "Use the left-hand Curatorial Filters and Bottom Timeline (accessible via the 'Globe Map' tab) to dynamically slice this list."}
              </p>
            </div>

            {/* Analytics Dashboard Panel */}
            <div className="analytics-dashboard" id="analytics-dashboard">
              {/* Evidence grades bar chart */}
              <div className="analytics-card">
                <div className="analytics-card-title">{UI_TRANSLATIONS.analTitleGrades[currentLanguage]}</div>
                <div className="analytics-chart">
                  {Object.entries(analytics.grades).map(([grade, count]) => {
                    const total = Math.max(1, filteredEntries.length);
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={grade} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem" }}>
                        <span style={{ width: "60px", fontWeight: "bold" }}>Grade {grade}</span>
                        <div style={{ flexGrow: 1, height: "8px", backgroundColor: "#eae4d9", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "var(--color-primary)" }}></div>
                        </div>
                        <span style={{ width: "30px", textAlign: "right" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sources breakdown */}
              <div className="analytics-card">
                <div className="analytics-card-title">{UI_TRANSLATIONS.analTitleSources[currentLanguage]}</div>
                <div className="analytics-chart">
                  {Object.entries(analytics.sources).map(([source, count]) => {
                    const total = Math.max(1, filteredEntries.length);
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={source} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem" }}>
                        <span style={{ width: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tTax(source)}</span>
                        <div style={{ flexGrow: 1, height: "8px", backgroundColor: "#eae4d9", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "var(--color-accent-red)" }}></div>
                        </div>
                        <span style={{ width: "30px", textAlign: "right" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Geographic scope */}
              <div className="analytics-card">
                <div className="analytics-card-title">{UI_TRANSLATIONS.analTitleRegions[currentLanguage]}</div>
                <div className="analytics-chart">
                  {Object.entries(analytics.regions).slice(0, 4).map(([region, count]) => {
                    const total = Math.max(1, filteredEntries.length);
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={region} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem" }}>
                        <span style={{ width: "80px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{region}</span>
                        <div style={{ flexGrow: 1, height: "8px", backgroundColor: "#eae4d9", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "#a29b8c" }}></div>
                        </div>
                        <span style={{ width: "30px", textAlign: "right" }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Archive Secondary Subtabs */}
            <div className="archive-sub-tabs" role="tablist">
              <button
                type="button"
                className={`archive-sub-tab ${archiveSubtab === "grid" ? "active" : ""}`}
                onClick={() => setArchiveSubtab("grid")}
              >
                {UI_TRANSLATIONS.subtabGrid[currentLanguage]}
              </button>
              <button
                type="button"
                className={`archive-sub-tab ${archiveSubtab === "chronology" ? "active" : ""}`}
                onClick={() => setArchiveSubtab("chronology")}
              >
                {UI_TRANSLATIONS.subtabChronology[currentLanguage]}
              </button>
              <button
                type="button"
                className={`archive-sub-tab ${archiveSubtab === "sources" ? "active" : ""}`}
                onClick={() => setArchiveSubtab("sources")}
              >
                {UI_TRANSLATIONS.subtabSources[currentLanguage]}
              </button>
              <button
                type="button"
                className={`archive-sub-tab ${archiveSubtab === "keywords" ? "active" : ""}`}
                onClick={() => setArchiveSubtab("keywords")}
              >
                {UI_TRANSLATIONS.subtabKeywords[currentLanguage]}
              </button>
            </div>

            {/* Sub-view 1: Grid Cards */}
            {archiveSubtab === "grid" && (
              <div className="archive-sub-view active">
                <div className="archive-entries-grid" id="archive-grid-container">
                  {filteredEntries.map(entry => (
                    <div
                      key={entry.id}
                      className="entry-card"
                      onClick={() => setSelectedEntryId(entry.id)}
                      style={{ border: "1.5px solid var(--color-border)", borderRadius: "var(--radius-md)", padding: "1.25rem", cursor: "pointer", transition: "var(--transition-smooth)", backgroundColor: "white" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span className="entry-grade-badge" style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: "3px", backgroundColor: "var(--color-bg-tag)", color: "var(--color-primary)", fontWeight: "bold" }}>
                          Grade {entry.evidenceGrade}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                          {entry.periodLabel[currentLanguage]}
                        </span>
                      </div>
                      <h3 className="serif-font" style={{ fontSize: "1.3rem", margin: "0.25rem 0", color: "var(--color-text-primary)" }}>
                        {entry.title[currentLanguage]}
                      </h3>
                      <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: "0.5rem 0", lineHeight: "1.4" }}>
                        {entry.summary[currentLanguage]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-view 2: Chronological Stream */}
            {archiveSubtab === "chronology" && (
              <div className="archive-sub-view active">
                <div 
                  className="chronology-stream-container"
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.5rem",
                    borderLeft: "2px solid var(--color-border)",
                    paddingLeft: "1.5rem",
                    marginLeft: "1rem"
                  }}
                >
                  {filteredEntries
                    .sort((a, b) => a.startYear - b.startYear)
                    .map(entry => (
                      <div 
                        key={entry.id} 
                        className="chronology-card"
                        onClick={() => setSelectedEntryId(entry.id)}
                        style={{
                          position: "relative",
                          backgroundColor: "white",
                          border: "1px solid var(--color-border)",
                          borderRadius: "var(--radius-md)",
                          padding: "1rem 1.25rem",
                          cursor: "pointer"
                        }}
                      >
                        {/* Dot on the timeline */}
                        <div 
                          style={{
                            position: "absolute",
                            left: "-1.9rem",
                            top: "1.2rem",
                            width: "10px",
                            height: "10px",
                            borderRadius: "50%",
                            backgroundColor: "var(--color-primary)",
                            border: "2px solid #f8f6f0"
                          }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                          <strong>{entry.periodLabel[currentLanguage]}</strong>
                          <span>{entry.region[currentLanguage]}</span>
                        </div>
                        <h4 className="serif-font" style={{ margin: "0.25rem 0 0.5rem 0", fontSize: "1.15rem", color: "var(--color-text-primary)" }}>
                          {entry.title[currentLanguage]}
                        </h4>
                        <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                          {entry.summary[currentLanguage]}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Sub-view 3: Sources Catalog */}
            {archiveSubtab === "sources" && (
              <div className="archive-sub-view active">
                <div className="sources-catalog-container" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                  {["Historical Documents", "Textual Sources", "Cultural Memory"].map(sourceCat => {
                    const catEntries = filteredEntries.filter(e => e.sourceCategory === sourceCat);
                    return (
                      <div key={sourceCat} style={{ backgroundColor: "white", border: "1px solid var(--color-border)", padding: "1.5rem", borderRadius: "8px" }}>
                        <h3 className="serif-font" style={{ fontSize: "1.4rem", color: "var(--color-primary)", borderBottom: "1px dashed var(--color-border)", paddingBottom: "0.5rem", marginBottom: "1rem" }}>
                          📜 {tTax(sourceCat)}
                        </h3>
                        <ul style={{ paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                          {catEntries.map(e => (
                            <li key={e.id} style={{ fontSize: "0.9rem" }}>
                              <span 
                                onClick={() => setSelectedEntryId(e.id)}
                                style={{ color: "var(--color-accent-red)", cursor: "pointer", textDecoration: "underline", fontWeight: "600" }}
                              >
                                {e.title[currentLanguage]}
                              </span>
                              {" - "}
                              <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                                {e.references[currentLanguage][0]}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-view 4: Curatorial Keywords */}
            {archiveSubtab === "keywords" && (
              <div className="archive-sub-view active">
                <div className="keywords-dictionary-container" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}>
                  {Object.keys(TAXONOMY_TRANSLATIONS)
                    .filter(key => ["Sacred", "Taboo", "Guardian", "Local Memory", "Modern Re-activation", "Favoritism", "Power Intimacy", "Ambiguity", "Poetic Desire", "Female Intimacy", "Reclaiming", "Performative Disguise", "Border Body", "Artistic Image"].includes(key))
                    .map(keyword => {
                      const kwEntries = filteredEntries.filter(e => e.culturalMeanings.includes(keyword));
                      if (kwEntries.length === 0) return null;
                      return (
                        <div key={keyword} style={{ backgroundColor: "white", border: "1px solid var(--color-border)", padding: "1.25rem", borderRadius: "6px" }}>
                          <h4 style={{ fontSize: "1.1rem", margin: "0 0 0.5rem 0", color: "var(--color-text-primary)" }}>
                            🏷️ {tTax(keyword)}
                          </h4>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                            {kwEntries.map(e => (
                              <span
                                key={e.id}
                                onClick={() => setSelectedEntryId(e.id)}
                                style={{
                                  fontSize: "0.75rem",
                                  backgroundColor: "var(--color-bg-tag)",
                                  color: "var(--color-primary)",
                                  padding: "2px 8px",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  border: "1px solid var(--color-border)"
                                }}
                              >
                                {e.title[currentLanguage]}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Details Drawer */}
          <DetailsDrawer
            selectedEntryId={selectedEntryId}
            onClose={() => setSelectedEntryId(null)}
            currentLanguage={currentLanguage}
            onSelectEntry={setSelectedEntryId}
          />
        </section>
      )}

      {/* Contribute Form */}
      {activeTab === "submit" && (
        <section className="view-container active" id="view-submit" aria-label="Contribute to Archive">
          <ContributeForm
            currentLanguage={currentLanguage}
            onSubmitEntry={handleAddNewSubmission}
          />
        </section>
      )}

      {/* Review Queue (Moderation Dashboard) */}
      {activeTab === "review" && (
        <section className="view-container active" id="view-review" aria-label="Review Queue">
          <div className="text-page-layout" style={{ maxWidth: "900px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "2px solid var(--color-primary)", paddingBottom: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <h2 className="section-page-title" style={{ borderBottom: "none", marginBottom: 0, paddingBottom: 0 }}>
                  {UI_TRANSLATIONS.moderationQueue[currentLanguage]}
                </h2>
                <div className="section-page-subtitle" style={{ marginBottom: 0, marginTop: "0.25rem" }}>
                  {UI_TRANSLATIONS.moderationQueueDesc[currentLanguage]}
                </div>
              </div>

              {/* Role Switcher */}
              <div className="role-switcher" style={{ display: "flex", gap: "0.5rem", backgroundColor: "rgba(0,0,0,0.03)", padding: "4px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }} role="toolbar">
                <button
                  type="button"
                  className={`role-btn ${userRole === "contributor" ? "active" : ""}`}
                  onClick={() => setUserRole("contributor")}
                >
                  {UI_TRANSLATIONS.roleContributor[currentLanguage]}
                </button>
                <button
                  type="button"
                  className={`role-btn ${userRole === "reviewer" ? "active" : ""}`}
                  onClick={() => setUserRole("reviewer")}
                >
                  {UI_TRANSLATIONS.roleReviewer[currentLanguage]}
                </button>
              </div>
            </div>

            {/* Contributor Profile View */}
            {userRole === "contributor" && (
              <div className="role-view active">
                <div className="view-header-row" style={{ marginBottom: "1.5rem" }}>
                  <h3 className="serif-font" style={{ fontSize: "1.35rem", color: "var(--color-primary)" }}>
                    {UI_TRANSLATIONS.mySubmissions[currentLanguage]}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    {UI_TRANSLATIONS.mySubmissionsDesc[currentLanguage]}
                  </p>
                </div>

                {/* Profile Stats Card */}
                <div className="contributor-profile-card" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem", padding: "1.25rem", border: "1px solid var(--color-border)", borderRadius: "8px", backgroundColor: "#f8f6f0", marginBottom: "2rem" }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                      {UI_TRANSLATIONS.totalSubmissions[currentLanguage]}
                    </span>
                    <strong style={{ display: "block", fontSize: "1.8rem", color: "var(--color-primary)" }}>
                      {submissions.length}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                      {UI_TRANSLATIONS.publishedSubmissions[currentLanguage]}
                    </span>
                    <strong style={{ display: "block", fontSize: "1.8rem", color: "var(--color-accent-red)" }}>
                      {submissions.filter(s => s.status === "approved").length}
                    </strong>
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                      {UI_TRANSLATIONS.regionsSubmissions[currentLanguage]}
                    </span>
                    <strong style={{ display: "block", fontSize: "1.8rem", color: "#b2801e" }}>
                      {new Set(submissions.map(s => s.region[currentLanguage])).size}
                    </strong>
                  </div>
                </div>

                {/* Submissions List */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                  {submissions.map(sub => (
                    <div key={sub.id} style={{ border: "1px solid var(--color-border)", borderRadius: "6px", padding: "1.25rem", backgroundColor: "white" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                        <span style={{
                          fontSize: "0.7rem",
                          fontWeight: "bold",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          color: "white",
                          backgroundColor: sub.status === "approved" ? "green" : sub.status === "needs_revision" ? "orange" : "gray"
                        }}>
                          {sub.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                          {sub.region[currentLanguage]}
                        </span>
                      </div>
                      <h4 style={{ margin: "0.25rem 0", color: "var(--color-primary)", fontSize: "1.1rem" }}>
                        {sub.title[currentLanguage]}
                      </h4>
                      <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                        {sub.summary[currentLanguage]}
                      </p>
                      {sub.comments && (
                        <div style={{ backgroundColor: "#fdf5e6", padding: "0.5rem 1rem", borderLeft: "3px solid orange", marginTop: "0.5rem", fontSize: "0.8rem" }}>
                          <strong>{UI_TRANSLATIONS.commentsLabel[currentLanguage]}</strong> {sub.comments}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviewer / Admin View */}
            {userRole === "reviewer" && (
              <div className="role-view active">
                <div className="view-header-row" style={{ marginBottom: "1.5rem" }}>
                  <h3 className="serif-font" style={{ fontSize: "1.35rem", color: "var(--color-accent-red)" }}>
                    {UI_TRANSLATIONS.moderationQueue[currentLanguage]}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                    {UI_TRANSLATIONS.moderationQueueDesc[currentLanguage]}
                  </p>
                </div>

                <div className="review-queue-list" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  {submissions.filter(s => s.status === "pending").length === 0 ? (
                    <div style={{ textAlign: "center", padding: "3rem", border: "1px dashed var(--color-border)", borderRadius: "8px" }}>
                      {currentLanguage === "zh" ? "暂无等待审核的投稿。" : "No pending submissions to review."}
                    </div>
                  ) : (
                    submissions
                      .filter(s => s.status === "pending")
                      .map(sub => (
                        <div key={sub.id} style={{ border: "1.5px solid var(--color-border)", borderRadius: "8px", padding: "1.5rem", backgroundColor: "white" }}>
                          <h4 style={{ margin: "0 0 0.5rem 0", fontSize: "1.2rem", color: "var(--color-primary)" }}>
                            {sub.title[currentLanguage]}
                          </h4>
                          <div style={{ display: "flex", gap: "1rem", fontSize: "0.75rem", color: "var(--color-text-secondary)", marginBottom: "0.75rem" }}>
                            <span>Region: {sub.region[currentLanguage]}</span>
                            <span>Grade: {sub.evidenceGrade}</span>
                            <span>Curator: {sub.contributor}</span>
                          </div>
                          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "1rem" }}>
                            {sub.summary[currentLanguage]}
                          </p>

                          {/* Action panel */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: "1px solid var(--color-border)", paddingTop: "1rem" }}>
                            <textarea
                              className="form-textarea"
                              placeholder={currentLanguage === "zh" ? "输入审核反馈或修改要求意见..." : "Add comments or feedback..."}
                              rows={2}
                              value={editorFeedback[sub.id] || ""}
                              onChange={e => setEditorFeedback({ ...editorFeedback, [sub.id]: e.target.value })}
                            />
                            <div style={{ display: "flex", gap: "1rem" }}>
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={() => handleModeration(sub.id, "approve", editorFeedback[sub.id])}
                                style={{ backgroundColor: "green" }}
                              >
                                {currentLanguage === "zh" ? "✅ 批准发布" : "✅ Approve & Publish"}
                              </button>
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={() => handleModeration(sub.id, "reject", editorFeedback[sub.id])}
                                style={{ backgroundColor: "orange" }}
                              >
                                {currentLanguage === "zh" ? "⚠️ 退回修改" : "⚠️ Request Revision"}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Guidelines & About Page */}
      {activeTab === "about" && (
        <section className="view-container active" id="view-about" aria-label="Guidelines and About">
          <div className="text-page-layout">
            <h2 className="section-page-title">{UI_TRANSLATIONS.guidelinesTitle[currentLanguage]}</h2>
            <div className="section-page-subtitle">{UI_TRANSLATIONS.guidelinesSubtitle[currentLanguage]}</div>

            <div className="text-section">
              <h3>{UI_TRANSLATIONS.guidelinesSec1Title[currentLanguage]}</h3>
              <p dangerouslySetInnerHTML={{ __html: UI_TRANSLATIONS.guidelinesSec1Text[currentLanguage] }} />
            </div>

            <div className="text-section">
              <h3>{UI_TRANSLATIONS.guidelinesSec2Title[currentLanguage]}</h3>
              <p>{UI_TRANSLATIONS.guidelinesSec2Text[currentLanguage]}</p>
              
              <table className="table-styled">
                <thead>
                  <tr>
                    <th scope="col">{UI_TRANSLATIONS.gradeTableHeaderGrade[currentLanguage]}</th>
                    <th scope="col">{UI_TRANSLATIONS.gradeTableHeaderDef[currentLanguage]}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">{UI_TRANSLATIONS.gradeATitle[currentLanguage]}</th>
                    <td dangerouslySetInnerHTML={{ __html: UI_TRANSLATIONS.gradeADef[currentLanguage] }} />
                  </tr>
                  <tr>
                    <th scope="row">{UI_TRANSLATIONS.gradeBTitle[currentLanguage]}</th>
                    <td dangerouslySetInnerHTML={{ __html: UI_TRANSLATIONS.gradeBDef[currentLanguage] }} />
                  </tr>
                  <tr>
                    <th scope="row">{UI_TRANSLATIONS.gradeCTitle[currentLanguage]}</th>
                    <td dangerouslySetInnerHTML={{ __html: UI_TRANSLATIONS.gradeCDef[currentLanguage] }} />
                  </tr>
                  <tr>
                    <th scope="row">{UI_TRANSLATIONS.gradeDTitle[currentLanguage]}</th>
                    <td dangerouslySetInnerHTML={{ __html: UI_TRANSLATIONS.gradeDDef[currentLanguage] }} />
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="text-section">
              <h3>{UI_TRANSLATIONS.guidelinesSec3Title[currentLanguage]}</h3>
              <p>{UI_TRANSLATIONS.guidelinesSec3Text[currentLanguage]}</p>
              <ul>
                <li>
                  <strong>{UI_TRANSLATIONS.risk1Title[currentLanguage]}：</strong>
                  {UI_TRANSLATIONS.risk1Def[currentLanguage]}
                </li>
                <li>
                  <strong>{UI_TRANSLATIONS.risk2Title[currentLanguage]}：</strong>
                  {UI_TRANSLATIONS.risk2Def[currentLanguage]}
                </li>
                <li>
                  <strong>{UI_TRANSLATIONS.risk3Title[currentLanguage]}：</strong>
                  {UI_TRANSLATIONS.risk3Def[currentLanguage]}
                </li>
              </ul>
            </div>

            <div className="text-section" style={{ borderTop: "1px solid var(--color-border)", paddingTop: "2rem", marginTop: "3rem" }}>
              <h2 className="serif-font" style={{ fontSize: "1.8rem", marginBottom: "0.5rem", color: "var(--color-text-primary)" }}>
                {UI_TRANSLATIONS.aboutTitle[currentLanguage]}
              </h2>
              <p dangerouslySetInnerHTML={{ __html: UI_TRANSLATIONS.aboutText1[currentLanguage] }} />
              <p dangerouslySetInnerHTML={{ __html: UI_TRANSLATIONS.aboutText2[currentLanguage] }} />
            </div>
          </div>
        </section>
      )}

      {/* Region Insights Dashboard Overlay */}
      {insightsRegion && regionInsightsStats && (
        <div id="region-insights-dashboard" className="insights-overlay active" role="dialog" aria-labelledby="insights-title">
          <div className="insights-container">
            <div className="insights-header">
              <div>
                <h2 className="insights-title" id="insights-title">
                  {UI_TRANSLATIONS.insightsTitle[currentLanguage]}
                </h2>
                <div className="insights-subtitle" id="insights-subtitle">
                  {UI_TRANSLATIONS.insightsSubtitle[currentLanguage].replace("{region}", insightsRegion.replace(/-/g, " "))}
                </div>
              </div>
              <button type="button" className="insights-close-btn" onClick={() => setInsightsRegion(null)} aria-label="Close dashboard">
                &times;
              </button>
            </div>

            <div className="insights-content">
              {/* Stat Cards */}
              <div className="insights-stats-grid">
                <div className="insights-stat-card">
                  <span className="stat-label">{UI_TRANSLATIONS.insightsLabelTotal[currentLanguage]}</span>
                  <strong className="stat-value">{regionInsightsStats.count}</strong>
                </div>
                <div className="insights-stat-card">
                  <span className="stat-label">{UI_TRANSLATIONS.insightsLabelSpan[currentLanguage]}</span>
                  <strong className="stat-value" style={{ fontSize: "1.1rem" }}>{regionInsightsStats.span}</strong>
                </div>
                <div className="insights-stat-card">
                  <span className="stat-label">{UI_TRANSLATIONS.insightsLabelPrimary[currentLanguage]}</span>
                  <strong className="stat-value" style={{ fontSize: "1.1rem" }}>
                    {Object.keys(regionInsightsStats.sources)[0] ? tAtlasTax(Object.keys(regionInsightsStats.sources)[0]) : "N/A"}
                  </strong>
                </div>
              </div>

              {/* Breakdowns */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem", marginTop: "2rem" }}>
                {/* Meanings */}
                <div className="analytics-card" style={{ backgroundColor: "#f8f6f0" }}>
                  <div className="analytics-card-title">{UI_TRANSLATIONS.insightsChartTitleMeanings[currentLanguage]}</div>
                  <div className="analytics-chart">
                    {Object.entries(regionInsightsStats.meanings).map(([meaning, count]) => {
                      const pct = Math.round((count / Math.max(1, regionInsightsStats.count)) * 100);
                      return (
                        <div key={meaning} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                          <span style={{ width: "100px" }}>{tAtlasTax(meaning)}</span>
                          <div style={{ flexGrow: 1, height: "6px", backgroundColor: "#eae4d9", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "var(--color-primary)" }}></div>
                          </div>
                          <span style={{ width: "30px", textAlign: "right" }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Sources */}
                <div className="analytics-card" style={{ backgroundColor: "#f8f6f0" }}>
                  <div className="analytics-card-title">{UI_TRANSLATIONS.insightsChartTitleSources[currentLanguage]}</div>
                  <div className="analytics-chart">
                    {Object.entries(regionInsightsStats.sources).map(([src, count]) => {
                      const pct = Math.round((count / Math.max(1, regionInsightsStats.count)) * 100);
                      return (
                        <div key={src} style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "0.75rem", marginBottom: "0.5rem" }}>
                          <span style={{ width: "130px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tAtlasTax(src)}</span>
                          <div style={{ flexGrow: 1, height: "6px", backgroundColor: "#eae4d9", borderRadius: "3px", overflow: "hidden" }}>
                            <div style={{ width: `${pct}%`, height: "100%", backgroundColor: "var(--color-accent-red)" }}></div>
                          </div>
                          <span style={{ width: "30px", textAlign: "right" }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
