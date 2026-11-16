import { useState, type FormEvent } from "react";
import { getPendingVerificationLabel } from "../data/recordStatus";
import { useApp } from "../state/useApp";
import type { ArchiveRecord, Coordinates, Language } from "../types";
import { useDialogFocus } from "./useDialogFocus";

interface Props {
  onClose: () => void;
}

interface SourceDraft {
  title: string;
  url: string;
}

interface SubmissionDraftState {
  title: string;
  aliases: string;
  eraLabel: string;
  year: string;
  placeName: string;
  coordinatesText: string;
  summary: string;
  sources: SourceDraft[];
  contributorName: string;
  contributorEmail: string;
  website: string; // Hidden honeypot field recognized by HookForms
}

interface SubmissionContactMeta {
  contributorName: string;
  contributorEmail: string;
}

type DeliveryStatus = "local-only" | "sending" | "sent" | "error";

const MAX_SUBMISSION_SOURCES = 5;

function createInitialForm(): SubmissionDraftState {
  return {
    title: "",
    aliases: "",
    eraLabel: "",
    year: "",
    placeName: "",
    coordinatesText: "",
    summary: "",
    sources: [{ title: "", url: "" }],
    contributorName: "",
    contributorEmail: "",
    website: "",
  };
}

function parseCoordinatesInput(raw: string): Coordinates | null | "invalid" {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/[\s,，]+/).filter(Boolean);
  if (parts.length !== 2) return "invalid";
  const lon = Number(parts[0]);
  const lat = Number(parts[1]);
  if (
    !Number.isFinite(lon)
    || !Number.isFinite(lat)
    || lon < -180
    || lon > 180
    || lat < -90
    || lat > 90
  ) {
    return "invalid";
  }
  return { longitude: Number(lon.toFixed(4)), latitude: Number(lat.toFixed(4)) };
}

function formatSourcesSummary(record: ArchiveRecord): string {
  return record.sources
    .map((s, idx) => `${record.sources.length > 1 ? `${idx + 1}) ` : ""}${s.title}${s.url ? ` (${s.url})` : ""}`)
    .join(record.sources.length > 1 ? "; " : "");
}

function buildSubmissionText(
  record: ArchiveRecord,
  language: Language,
  meta?: SubmissionContactMeta,
): string {
  const coords = record.place.coordinates
    ? `${record.place.coordinates.longitude}, ${record.place.coordinates.latitude}`
    : (language === "zh" ? "待考证" : "Pending");
  const sourcesText = formatSourcesSummary(record);
  if (language === "zh") {
    return [
      "【The Seam 历史档案投稿】",
      `1. 人物/事件名称：${record.title.zh}${record.aliases.length ? `（别名：${record.aliases.join("、")}）` : ""}`,
      `2. 历史时间：${record.time.label.zh}`,
      `3. 发生地点：${record.place.name.zh}（坐标：${coords}）`,
      `4. 简介与史料记述：${record.summary.zh}`,
      `5. 史料/参考文献：${sourcesText}`,
      ...(meta?.contributorName ? [`6. 投稿人署名：${meta.contributorName}`] : []),
      ...(meta?.contributorEmail ? [`7. 联系邮箱：${meta.contributorEmail}`] : []),
    ].join("\n");
  }
  return [
    "[The Seam Archive Submission]",
    `1. Figure / Event Name: ${record.title.en}${record.aliases.length ? ` (Aliases: ${record.aliases.join(", ")})` : ""}`,
    `2. Historical Era: ${record.time.label.en}`,
    `3. Location: ${record.place.name.en} (Coordinates: ${coords})`,
    `4. Summary & Context: ${record.summary.en}`,
    `5. Primary Sources / Citations: ${sourcesText}`,
    ...(meta?.contributorName ? [`6. Contributor Name: ${meta.contributorName}`] : []),
    ...(meta?.contributorEmail ? [`7. Contact Email: ${meta.contributorEmail}`] : []),
  ].join("\n");
}

function buildHookFormsPayload(
  record: ArchiveRecord,
  pendingStatus: string | null,
  honeypot: string,
  meta?: SubmissionContactMeta,
): Record<string, string> {
  const coords = record.place.coordinates
    ? `${record.place.coordinates.longitude}, ${record.place.coordinates.latitude}`
    : "Pending verification";
  const primarySource = record.sources[0];
  const contributorName = meta?.contributorName.trim() || "";
  const contributorEmail = meta?.contributorEmail.trim() || "";
  return {
    _subject: `[The Seam 投稿] ${record.title.zh}`,
    subject: `[The Seam 投稿] ${record.title.zh}`,
    ...(contributorEmail ? { _replyto: contributorEmail } : {}),
    title: record.title.zh,
    aliases: record.aliases.join(", "),
    era: record.time.label.zh,
    year: record.time.startYear === null ? "Pending verification" : String(record.time.startYear),
    location: record.place.name.zh,
    coordinates: coords,
    pendingStatus: pendingStatus || "Verified fields supplied",
    summary: record.summary.zh,
    sourceTitle: primarySource?.title || "",
    sourceUrl: primarySource?.url || "",
    sourcesText: formatSourcesSummary(record),
    contributorName,
    contributorEmail,
    submittedAt: new Date().toISOString(),
    recordJson: JSON.stringify(record),
    website: honeypot,
  };
}

export function SubmitModal({ onClose }: Props) {
  const { language, addSubmittedRecord, openRecord } = useApp();
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  const [form, setForm] = useState<SubmissionDraftState>(createInitialForm);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [submittedRecord, setSubmittedRecord] = useState<ArchiveRecord | null>(null);
  const [submittedMeta, setSubmittedMeta] = useState<SubmissionContactMeta>({ contributorName: "", contributorEmail: "" });
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>("local-only");
  const [emailCopied, setEmailCopied] = useState(false);
  const [emailCopyFailed, setEmailCopyFailed] = useState(false);
  const [draftCopied, setDraftCopied] = useState(false);

  // Read configurable submission email & optional HookForms endpoint
  const configuredEmail: string = (import.meta.env.VITE_SUBMISSION_EMAIL || "").trim();
  const displayEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail) ? configuredEmail : "";
  const rawEndpoint: string = (import.meta.env.VITE_SUBMISSION_ENDPOINT || "").trim();
  const hookFormsEndpoint = /^https?:\/\/.+/i.test(rawEndpoint) ? rawEndpoint : "";

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(displayEmail);
      setEmailCopied(true);
      setEmailCopyFailed(false);
    } catch {
      setEmailCopyFailed(true);
    }
  };

  const handleAddSource = () => {
    setForm(prev => {
      if (prev.sources.length >= MAX_SUBMISSION_SOURCES) return prev;
      return { ...prev, sources: [...prev.sources, { title: "", url: "" }] };
    });
  };

  const handleRemoveSource = (index: number) => {
    setForm(prev => {
      if (index === 0 || prev.sources.length <= 1) return prev;
      return { ...prev, sources: prev.sources.filter((_, i) => i !== index) };
    });
  };

  const handleSourceChange = (index: number, field: keyof SourceDraft, value: string) => {
    setForm(prev => ({
      ...prev,
      sources: prev.sources.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  };

  const sendToHookForms = async (record: ArchiveRecord, honeypot: string, meta: SubmissionContactMeta) => {
    if (!hookFormsEndpoint) {
      setDeliveryStatus("local-only");
      return;
    }
    setDeliveryStatus("sending");
    try {
      const pendingStatus = getPendingVerificationLabel(record, language);
      const response = await fetch(hookFormsEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(buildHookFormsPayload(record, pendingStatus, honeypot, meta)),
      });
      setDeliveryStatus(response.ok ? "sent" : "error");
    } catch {
      setDeliveryStatus("error");
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setErrorMsg("");

    const title = form.title.trim();
    const eraLabel = form.eraLabel.trim();
    const placeName = form.placeName.trim();
    const summary = form.summary.trim();
    const normalizedSources = form.sources.map(s => ({
      title: s.title.trim(),
      url: s.url.trim(),
    }));
    const firstSourceTitle = normalizedSources[0]?.title || "";

    if (!title || !eraLabel || !placeName || !summary || !firstSourceTitle) {
      setErrorMsg(
        language === "zh"
          ? "请填写名称、历史时期、地点、简介及至少一条参考文献后再提交。"
          : "Please complete name, historical era, location, summary, and at least one reference before submitting.",
      );
      return;
    }

    for (const source of normalizedSources) {
      if (source.url && !source.title) {
        setErrorMsg(
          language === "zh"
            ? "请为填写了参考链接的文献条目补充名称。"
            : "Please provide a citation title for every reference that includes a URL.",
        );
        return;
      }
      if (source.url && !/^https?:\/\//i.test(source.url)) {
        setErrorMsg(
          language === "zh"
            ? "参考链接请以 http:// 或 https:// 开头。"
            : "Reference URL must start with http:// or https://.",
        );
        return;
      }
    }

    let parsedYear: number | null = null;
    if (form.year.trim()) {
      const n = Number(form.year.trim());
      if (!Number.isInteger(n) || n === 0) {
        setErrorMsg(
          language === "zh"
            ? "年份请填写非零整数（公元前请使用负数，如 -630），不确定时可留空。"
            : "Year must be a non-zero integer (use negative numbers for BCE), or leave it blank.",
        );
        return;
      }
      parsedYear = n;
    }

    let parsedCoords: Coordinates | null = null;
    if (form.coordinatesText.trim()) {
      const result = parseCoordinatesInput(form.coordinatesText);
      if (result === "invalid") {
        setErrorMsg(
          language === "zh"
            ? "坐标格式请填写“经度, 纬度”，例如 11.2558, 43.7696（经度 -180~180，纬度 -90~90）。"
            : "Coordinates must be formatted as 'longitude, latitude', e.g. 1.9093, 47.9030.",
        );
        return;
      }
      parsedCoords = result;
    }

    const contributorName = form.contributorName.trim();
    const contributorEmail = form.contributorEmail.trim();
    if (contributorEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contributorEmail)) {
      setErrorMsg(
        language === "zh"
          ? "联系邮箱格式有误，请检查后重试（或留空不填）。"
          : "Contact email format appears invalid (or leave blank).",
      );
      return;
    }

    const aliases = form.aliases
      .split(/[,，、;；]/)
      .map(s => s.trim())
      .filter(Boolean);

    const slugSeed = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "record";
    const id = `submission-${slugSeed}-${Date.now()}`;
    const isPending = !parsedCoords || parsedYear === null;

    const record: ArchiveRecord = {
      id,
      slug: id,
      title: { zh: title, en: title },
      aliases,
      summary: { zh: summary, en: summary },
      body: { zh: summary, en: summary },
      time: {
        startYear: parsedYear,
        endYear: parsedYear,
        label: { zh: eraLabel, en: eraLabel },
        certainty: parsedYear === null ? "approximate" : "exact",
      },
      place: {
        name: { zh: placeName, en: placeName },
        coordinates: parsedCoords,
        precision: parsedCoords ? "city" : "pending",
        relation: "event-site",
      },
      reviewNote: isPending
        ? {
            zh: "用户投稿草稿。部分年代、事件或地理坐标尚待结合第一手史料进一步考证。",
            en: "User submission draft. Some dates, event details, or coordinates remain pending verification against primary sources.",
          }
        : {
            zh: "用户投稿草稿。已附初步坐标与年份，仍待编辑依据原始文献复核。",
            en: "User submission draft with preliminary date and coordinates; awaiting editorial source verification.",
          },
      sources: normalizedSources
        .filter(s => s.title.length > 0)
        .map(s => ({
          title: s.title,
          url: s.url || undefined,
        })),
    };

    const contactMeta: SubmissionContactMeta = { contributorName, contributorEmail };
    addSubmittedRecord(record);
    setSubmittedRecord(record);
    setSubmittedMeta(contactMeta);
    setDraftCopied(false);
    void sendToHookForms(record, form.website, contactMeta);
  };

  const handleCopyDraft = async () => {
    if (!submittedRecord) return;
    try {
      await navigator.clipboard.writeText(buildSubmissionText(submittedRecord, language, submittedMeta));
      setDraftCopied(true);
    } catch {
      setDraftCopied(false);
    }
  };

  const mailtoHref = submittedRecord && displayEmail
    ? `mailto:${encodeURIComponent(displayEmail)}?subject=${encodeURIComponent(`Submission: ${submittedRecord.title.zh}`)}&body=${encodeURIComponent(buildSubmissionText(submittedRecord, language, submittedMeta))}`
    : "";

  const pendingBadge = submittedRecord ? getPendingVerificationLabel(submittedRecord, language) : null;
  return (
    <div ref={dialogRef} className="seam-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="submit-title">
      <div className="seam-modal-content seam-modal-wide" onClick={(e) => e.stopPropagation()}>
        <header className="seam-modal-header">
          <div>
            <span className="seam-modal-eyebrow">The Seam · Contribution</span>
            <h2 id="submit-title" className="seam-modal-title">
              {language === "zh" ? "向 The Seam 投稿" : "Submit to The Seam"}
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

        {!submittedRecord ? (
          <form id="seam-submit-form" className="seam-modal-body seam-submit-form" onSubmit={handleSubmit} noValidate>
            {/* Hidden honeypot for HookForms spam filtering */}
            <div className="seam-honeypot" aria-hidden="true">
              <label htmlFor="seam-hp-website">Website</label>
              <input
                id="seam-hp-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={form.website}
                onChange={e => setForm(prev => ({ ...prev, website: e.target.value }))}
              />
            </div>

            <label className="seam-form-field">
              <span className="seam-form-label">{language === "zh" ? "人物或事件名称 *" : "Figure or Event Name *"}</span>
              <input
                type="text"
                required
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder={language === "zh" ? "例如：萨福 / 达·芬奇" : "e.g. Joan of Arc / Alexander the Great"}
              />
            </label>

            <div className="seam-form-field">
              <label htmlFor="submit-era" className="seam-form-label">{language === "zh" ? "历史时期 *" : "Historical Era *"}</label>
              <input
                id="submit-era"
                type="text"
                required
                value={form.eraLabel}
                onChange={e => setForm(prev => ({ ...prev, eraLabel: e.target.value }))}
                placeholder={language === "zh" ? "例如：公元前6世纪 / 文艺复兴时期" : "e.g. 15th century / Classical Greece"}
              />
            </div>

            <div className="seam-form-field">
              <label htmlFor="submit-place" className="seam-form-label">{language === "zh" ? "发生或活动地点 *" : "Historical Location *"}</label>
              <input
                id="submit-place"
                type="text"
                required
                value={form.placeName}
                onChange={e => setForm(prev => ({ ...prev, placeName: e.target.value }))}
                placeholder={language === "zh" ? "例如：意大利佛罗伦萨 / 希腊莱斯博斯岛" : "e.g. Orléans, France / Athens, Greece"}
              />
            </div>

            <label className="seam-form-field">
              <span className="seam-form-label">{language === "zh" ? "历史简介与文献事实 *" : "Summary & Documented Facts *"}</span>
              <textarea
                rows={3}
                required
                value={form.summary}
                onChange={e => setForm(prev => ({ ...prev, summary: e.target.value }))}
                placeholder={language === "zh" ? "简述有据可查的历史经过、时间地点与文献依据..." : "Briefly summarize documented historical facts, dates, locations, and sources..."}
              />
            </label>

            <div className="seam-sources-block">
              <div className="seam-sources-header">
                <label htmlFor="submit-source-0" className="seam-form-label">
                  {language === "zh" ? "第一手史料 / 参考文献 *" : "Primary Source / Citation *"}
                </label>
                <div className="seam-sources-header-actions">
                  <span className="seam-sources-count">
                    {form.sources.length}/{MAX_SUBMISSION_SOURCES}
                  </span>
                  <button
                    type="button"
                    className="seam-source-add-btn"
                    onClick={handleAddSource}
                    disabled={form.sources.length >= MAX_SUBMISSION_SOURCES}
                    aria-label={language === "zh" ? "新增参考文献" : "Add reference"}
                    title={language === "zh" ? "最多添加5条" : "Up to 5 references"}
                  >
                    +
                  </button>
                </div>
              </div>

              {form.sources.map((sourceItem, index) => (
                <div key={index} className="seam-source-item-row">
                  <div className="seam-form-field">
                    {index > 0 && (
                      <label htmlFor={`submit-source-${index}`} className="seam-form-label">
                        {language === "zh" ? `补充参考文献 ${index + 1}` : `Additional Reference ${index + 1}`}
                      </label>
                    )}
                    <input
                      id={`submit-source-${index}`}
                      type="text"
                      required={index === 0}
                      value={sourceItem.title}
                      onChange={e => handleSourceChange(index, "title", e.target.value)}
                      placeholder={
                        index === 0
                          ? (language === "zh"
                              ? "例如：佛罗伦萨国家档案馆藏卷宗 / 联合国教科文组织档案"
                              : "e.g. British Library Manuscript Collection / Louvre Dossier")
                          : (language === "zh" ? "填写补充文献名称或馆藏编号" : "Supplementary citation or archival ID")
                      }
                    />
                  </div>
                  <div className="seam-form-field">
                    <label htmlFor={`submit-source-url-${index}`} className="seam-form-label">
                      {language === "zh" ? "史料参考链接（选填）" : "Source URL (optional)"}
                    </label>
                    <div className="seam-source-url-wrap">
                      <input
                        id={`submit-source-url-${index}`}
                        type="url"
                        value={sourceItem.url}
                        onChange={e => handleSourceChange(index, "url", e.target.value)}
                        placeholder="https://..."
                      />
                      {index > 0 && (
                        <button
                          type="button"
                          className="seam-source-remove-btn"
                          onClick={() => handleRemoveSource(index)}
                          aria-label={language === "zh" ? `删除参考文献 ${index + 1}` : `Remove reference ${index + 1}`}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <details className="seam-submit-options">
              <summary>{language === "zh" ? "补充资料（选填）" : "Additional details (optional)"}</summary>
              <div className="seam-submit-option-fields">
                <label className="seam-form-field">
                  <span className="seam-form-label">{language === "zh" ? "别名或原文名（选填）" : "Aliases / Original Name"}</span>
                  <input
                    type="text"
                    value={form.aliases}
                    onChange={e => setForm(prev => ({ ...prev, aliases: e.target.value }))}
                    placeholder={language === "zh" ? "多个用顿号或逗号分隔，如：列奥纳多·达·芬奇" : "Comma-separated, e.g. Jeanne d'Arc, Maid of Orléans"}
                  />
                </label>
                <label className="seam-form-field">
                  <span className="seam-form-label">{language === "zh" ? "年份数字（选填，前用负数）" : "Year (optional, BCE negative)"}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.year}
                    onChange={e => setForm(prev => ({ ...prev, year: e.target.value }))}
                    placeholder={language === "zh" ? "例如：1452 或 -630" : "e.g. 1431 or -336"}
                  />
                </label>
                <label className="seam-form-field">
                  <span className="seam-form-label">{language === "zh" ? "经度, 纬度（选填）" : "Longitude, Latitude (optional)"}</span>
                  <input
                    type="text"
                    value={form.coordinatesText}
                    onChange={e => setForm(prev => ({ ...prev, coordinatesText: e.target.value }))}
                    placeholder={language === "zh" ? "例如：11.2558, 43.7696" : "e.g. 1.9093, 47.9030"}
                  />
                </label>
                <div className="seam-form-row">
                  <label className="seam-form-field">
                    <span className="seam-form-label">{language === "zh" ? "投稿人署名（选填）" : "Your Name / Attribution (optional)"}</span>
                    <input
                      type="text"
                      value={form.contributorName}
                      onChange={e => setForm(prev => ({ ...prev, contributorName: e.target.value }))}
                      placeholder={language === "zh" ? "例如：张三 / 历史系研究者" : "e.g. Jane Doe"}
                    />
                  </label>
                  <label className="seam-form-field">
                    <span className="seam-form-label">{language === "zh" ? "联系邮箱（选填）" : "Contact Email (optional)"}</span>
                    <input
                      type="email"
                      value={form.contributorEmail}
                      onChange={e => setForm(prev => ({ ...prev, contributorEmail: e.target.value }))}
                      placeholder="name@example.com"
                    />
                  </label>
                </div>
              </div>
            </details>

            {errorMsg && (
              <p className="seam-form-error" role="alert">{errorMsg}</p>
            )}

            <div className="seam-email-box">
              <span className="seam-email-label">
                {language === "zh" ? "官方投稿联络邮箱" : "Official Submission Email"}
              </span>
              <div className="seam-email-row">
                <code className="seam-email-address">
                  {displayEmail || (language === "zh" ? "投稿邮箱尚未公布" : "Submission email not yet announced")}
                </code>
                <button
                  type="button"
                  className="seam-btn-outline"
                  onClick={handleCopyEmail}
                  disabled={!displayEmail}
                >
                  {emailCopied
                    ? (language === "zh" ? "✓ 已复制" : "✓ Copied")
                    : (language === "zh" ? "复制邮箱" : "Copy Email")}
                </button>
              </div>
              {emailCopyFailed && (
                <p role="status" className="seam-email-note">
                  {language === "zh" ? "复制未成功，请选中邮箱地址手动复制。" : "Copy failed. Select and copy manually."}
                </p>
              )}
            </div>
          </form>
        ) : (
          <div className="seam-modal-body">
            <div className="seam-submit-success-card">
              <div className="seam-submit-success-header">
                <h3>{submittedRecord.title[language]}</h3>
                {pendingBadge && <span className="seam-pending-tag">{pendingBadge}</span>}
              </div>
              <p className="seam-submit-success-meta">
                <span>⏱ {submittedRecord.time.label[language]}</span>
                <span>📍 {submittedRecord.place.name[language]}</span>
              </p>
              <p className="seam-submit-success-summary">{submittedRecord.summary[language]}</p>

              {deliveryStatus === "sending" && (
                <p role="status" className="seam-delivery-status is-sending">
                  {language === "zh" ? "正在向官方收件箱发送投稿…" : "Sending submission to editorial inbox…"}
                </p>
              )}
              {deliveryStatus === "sent" && (
                <p role="status" className="seam-delivery-status is-sent">
                  {language === "zh"
                    ? `✓ 已成功直投至官方审稿收件箱${displayEmail ? `（${displayEmail}）` : ""}，并已保存本地档案预览。`
                    : `✓ Sent to the official editorial inbox${displayEmail ? ` (${displayEmail})` : ""} and saved locally for preview.`}
                </p>
              )}
              {deliveryStatus === "error" && (
                <div role="status" className="seam-delivery-status is-error">
                  <span>
                    {language === "zh"
                      ? "投稿未送达，草稿已保存。请重试或使用下方可用的方式。"
                      : "Delivery failed. Your draft is saved. Retry or use an option below."}
                  </span>
                  <button
                    type="button"
                    className="seam-btn-outline"
                    onClick={() => { void sendToHookForms(submittedRecord, form.website, submittedMeta); }}
                  >
                    {language === "zh" ? "重新发送" : "Retry"}
                  </button>
                </div>
              )}
              {deliveryStatus === "local-only" && (
                <p className="seam-email-note">
                  {displayEmail
                    ? (language === "zh" ? "草稿已保存，请用邮件发送给编辑部。" : "Draft saved. Send it to the editors by email.")
                    : (language === "zh" ? "草稿已保存。你可以复制投稿文本。" : "Draft saved. You can copy the submission text.")}
                </p>
              )}
            </div>

            <div className="seam-submit-actions-grid">
              <button
                type="button"
                className="seam-btn-primary"
                onClick={() => {
                  openRecord(submittedRecord, true);
                  onClose();
                }}
              >
                {language === "zh" ? "查看本地草稿" : "View local draft"}
              </button>
              {(deliveryStatus === "local-only" || deliveryStatus === "error") && (
                <>
                  {displayEmail && (
                    <a href={mailtoHref} className="seam-btn-primary">
                      {language === "zh" ? "用邮件发送此稿件 ↗" : "Send via Email ↗"}
                    </a>
                  )}
                  <button type="button" className="seam-btn-outline" onClick={handleCopyDraft}>
                    {draftCopied
                      ? (language === "zh" ? "✓ 已复制投稿文本" : "✓ Text Copied")
                      : (language === "zh" ? "复制投稿文本" : "Copy Submission Text")}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        <footer className="seam-modal-footer">
          {!submittedRecord ? (
            <>
              <button type="button" className="seam-btn-secondary" onClick={onClose}>
                {language === "zh" ? "取消" : "Cancel"}
              </button>
              <button type="submit" form="seam-submit-form" className="seam-btn-primary">
                {hookFormsEndpoint
                  ? (language === "zh" ? "提交投稿" : "Submit Entry")
                  : (language === "zh" ? "保存投稿草稿" : "Save Draft")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="seam-btn-secondary"
                disabled={deliveryStatus === "sending"}
                onClick={() => {
                  setSubmittedRecord(null);
                  setSubmittedMeta({ contributorName: "", contributorEmail: "" });
                  setDeliveryStatus("local-only");
                  setForm(createInitialForm());
                  setErrorMsg("");
                }}
              >
                {language === "zh" ? "继续投稿下一条" : "Submit Another"}
              </button>
              <button type="button" className="seam-btn-primary" onClick={onClose}>
                {language === "zh" ? "完成" : "Done"}
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
