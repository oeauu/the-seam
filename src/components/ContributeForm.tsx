import React, { useState } from "react";
import { UI_TRANSLATIONS } from "../db/translations";

interface ContributeFormProps {
  currentLanguage: "en" | "zh";
  onSubmitEntry: (newEntry: any) => void;
}

export const ContributeForm: React.FC<ContributeFormProps> = ({
  currentLanguage,
  onSubmitEntry
}) => {
  const [title, setTitle] = useState("");
  const [region, setRegion] = useState("");
  const [period, setPeriod] = useState("");
  const [sourceCategory, setSourceCategory] = useState("Historical Documents");
  const [evidenceGrade, setEvidenceGrade] = useState("C");
  const [description, setDescription] = useState("");
  const [references, setReferences] = useState("");
  const [contributor, setContributor] = useState("");
  const [selectedMeanings, setSelectedMeanings] = useState<string[]>([]);
  const [toastVisible, setToastVisible] = useState(false);

  // Auto-fill campaign preset
  const handleApplyPreset = () => {
    setTitle(currentLanguage === "zh" ? "湿婆半女之主神格" : "Shiva's Ardhanarishvara Deity");
    setRegion(currentLanguage === "zh" ? "古代南亚地区" : "Ancient India / Varanasi");
    setPeriod(currentLanguage === "zh" ? "吠陀时期（公元前800年）" : "Vedic Period (c. 800 BCE)");
    setSourceCategory("Cultural Memory");
    setEvidenceGrade("C");
    setDescription(
      currentLanguage === "zh"
        ? "湿婆神作为半女之主（Ardhanarishvara）的化身，象征着宇宙阴阳能量的绝对融合，也是印度第三性别社群（海吉拉）获取神圣祝祷权力的核心神话来源。"
        : "Ardhanarishvara is a composite androgynous form of the Hindu deities Shiva and Parvati, representing the synthesis of masculine and feminine energies, and serving as a sacred source of blessing authority for third-gender communities."
    );
    setReferences("Rigveda, Tenth Mandala; contemporary Hindu theological analyses.");
    setSelectedMeanings(["Sacred", "Border Body", "Deity"]);

    // Trigger visual toast
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  };

  const handleCheckboxChange = (meaning: string) => {
    setSelectedMeanings(prev => 
      prev.includes(meaning) ? prev.filter(m => m !== meaning) : [...prev, meaning]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !region || !period || !description || !references) {
      alert(currentLanguage === "zh" ? "请填写所有必填字段 (*)" : "Please fill in all required fields (*)");
      return;
    }

    const newEntry = {
      id: `submission_${Date.now()}`,
      title: { en: title, zh: title },
      originalName: title,
      alias: { en: [title], zh: [title] },
      region: { en: region, zh: region },
      coordinates: [100, 35], // default coordinates
      locationPrecision: "Cultural Region",
      startYear: 2000,
      endYear: 2026,
      periodLabel: { en: period, zh: period },
      sourceCategory,
      sourceSubcategory: "Folklore & Folk Beliefs",
      objectTypes: ["Deity"],
      culturalMeanings: selectedMeanings,
      evidenceGrade,
      interpretationRisks: ["Anachronistic Identity Projection"],
      riskDetail: {
        en: "Requires careful archival review to prevent modern definitions projection.",
        zh: "需要严谨的文献审查以防止现代身份概念的过度投射。"
      },
      summary: { en: description.slice(0, 100) + "...", zh: description.slice(0, 100) + "..." },
      description: { en: description, zh: description },
      references: { en: [references], zh: [references] },
      contributor: contributor || (currentLanguage === "zh" ? "热心贡献者" : "Anonymous Contributor"),
      status: "pending",
      comments: ""
    };

    onSubmitEntry(newEntry);

    // Reset Form
    setTitle("");
    setRegion("");
    setPeriod("");
    setDescription("");
    setReferences("");
    setContributor("");
    setSelectedMeanings([]);

    // Show success toast
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 4000);
  };

  return (
    <div className="text-page-layout">
      {/* Toast Notification */}
      {toastVisible && (
        <div id="toast-message" className="toast-msg active" role="status">
          {currentLanguage === "zh"
            ? "投稿已接收！该条目已成功进入编辑待审队列 (Mock)。感谢您对酷儿历史的贡献！"
            : "Submission Received! It has entered the pending queue (Mock). Thank you for contributing to the archive!"}
        </div>
      )}

      {/* Monthly Campaign Banner */}
      <div id="monthly-campaign-banner" className="campaign-banner">
        <div className="campaign-banner-content">
          <div className="campaign-badge">
            <span className="campaign-badge-icon">✦</span>
            <span id="campaign-header-text">
              {UI_TRANSLATIONS.campaignHeader[currentLanguage]}
            </span>
          </div>
          <h3 id="campaign-title-text" className="campaign-title">
            {UI_TRANSLATIONS.campaignTitle[currentLanguage]}
          </h3>
          <p id="campaign-desc-text" className="campaign-desc">
            {UI_TRANSLATIONS.campaignDesc[currentLanguage]}
          </p>
          <button
            type="button"
            className="btn-campaign-apply-btn"
            id="btn-campaign-apply"
            onClick={handleApplyPreset}
          >
            {UI_TRANSLATIONS.campaignApplyBtn[currentLanguage]}
          </button>
        </div>
      </div>

      <div className="submit-card">
        <h2 className="serif-font" style={{ fontSize: "2rem", marginBottom: "0.5rem", textAlign: "center", color: "var(--color-primary)" }}>
          {UI_TRANSLATIONS.formHeader[currentLanguage]}
        </h2>
        <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "2rem", fontFamily: "var(--font-display)" }}>
          {UI_TRANSLATIONS.formSubheader[currentLanguage]}
        </p>

        <div className="submit-alert" dangerouslySetInnerHTML={{ __html: UI_TRANSLATIONS.formAlert[currentLanguage] }} />

        <form id="mock-submit-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="sub-title">{UI_TRANSLATIONS.formLabelTitle[currentLanguage]}</label>
            <input
              type="text"
              id="sub-title"
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Lanling Wang, Athena, Gilgamesh"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sub-region">{UI_TRANSLATIONS.formLabelRegion[currentLanguage]}</label>
              <input
                type="text"
                id="sub-region"
                className="form-input"
                value={region}
                onChange={e => setRegion(e.target.value)}
                placeholder="e.g. Mesopotamia, Greece"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="sub-period">{UI_TRANSLATIONS.formLabelPeriod[currentLanguage]}</label>
              <input
                type="text"
                id="sub-period"
                className="form-input"
                value={period}
                onChange={e => setPeriod(e.target.value)}
                placeholder="e.g. 5th Century BCE, Tang Dynasty"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="sub-source">{UI_TRANSLATIONS.formLabelSource[currentLanguage]}</label>
              <select
                id="sub-source"
                className="form-select"
                value={sourceCategory}
                onChange={e => setSourceCategory(e.target.value)}
              >
                <option value="Historical Documents">Historical Documents</option>
                <option value="Textual Sources">Textual Sources (Poetry / Novels)</option>
                <option value="Cultural Memory">Cultural Memory (Folklore / Oral history)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="sub-grade">{UI_TRANSLATIONS.formLabelGrade[currentLanguage]}</label>
              <select
                id="sub-grade"
                className="form-select"
                value={evidenceGrade}
                onChange={e => setEvidenceGrade(e.target.value)}
              >
                <option value="A">Grade A (Strictly Documented)</option>
                <option value="B">Grade B (Adequately Researched)</option>
                <option value="C">Grade C (Folklore / Local Myth)</option>
                <option value="D">Grade D (Modern Queer Reinterpretation)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label id="form-label-meanings">Cultural Meanings (Select all that apply)</label>
            <div className="form-checkbox-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.5rem", marginTop: "0.5rem", background: "white", border: "1px solid var(--color-border)", borderRadius: "var(--radius-sm)", padding: "0.75rem" }}>
              {["Sacred", "Taboo", "Guardian", "Local Memory", "Modern Re-activation", "Favoritism", "Power Intimacy", "Ambiguity", "Poetic Desire", "Female Intimacy", "Reclaiming", "Performative Disguise", "Border Body", "Artistic Image"].map(meaning => (
                <label key={meaning} style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontFamily: "var(--font-sans)", textTransform: "none", fontWeight: "normal", color: "var(--color-text-primary)", cursor: "pointer", margin: 0 }}>
                  <input
                    type="checkbox"
                    name="sub-meanings"
                    value={meaning}
                    checked={selectedMeanings.includes(meaning)}
                    onChange={() => handleCheckboxChange(meaning)}
                  />
                  <span>{meaning}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="sub-description">{UI_TRANSLATIONS.formLabelDesc[currentLanguage]}</label>
            <textarea
              id="sub-description"
              className="form-textarea"
              rows={5}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the figure, their relationship to non-normative gender, bodies, or desire, and their cultural significance..."
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label htmlFor="sub-references">{UI_TRANSLATIONS.formLabelRefs[currentLanguage]}</label>
            <input
              type="text"
              id="sub-references"
              className="form-input"
              value={references}
              onChange={e => setReferences(e.target.value)}
              placeholder="e.g. Ban Gu, Book of Han (汉书), Chapter 93."
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="sub-contributor" id="form-label-contributor">
              {UI_TRANSLATIONS.detailCurator[currentLanguage]}
            </label>
            <input
              type="text"
              id="sub-contributor"
              className="form-input"
              value={contributor}
              onChange={e => setContributor(e.target.value)}
              placeholder="e.g. Archivist Alex, Scholar Jade (Optional)"
            />
          </div>

          <button type="submit" className="btn-primary" id="btn-submit-entry">
            {UI_TRANSLATIONS.formSubmitBtn[currentLanguage]}
          </button>
        </form>
      </div>
    </div>
  );
};
