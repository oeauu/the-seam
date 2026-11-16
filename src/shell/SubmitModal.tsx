import { useState, type FormEvent } from "react";
import { getPendingVerificationLabel } from "../data/recordStatus";
import { useApp } from "../state/useApp";
import type { ArchiveRecord, Coordinates, Language } from "../types";
import { useDialogFocus } from "./useDialogFocus";

interface Props {
  onClose: () => void;
}

interface SubmissionDraftState {
  title: string;
  aliases: string;
  eraLabel: string;
  year: string;
  eventPending: boolean;
  placeName: string;
  coordinatesText: string;
  locationPending: boolean;
  summary: string;
  sourceTitle: string;
  sourceUrl: string;
  website: string; // Hidden honeypot field recognized by HookForms
}

type DeliveryStatus = "local-only" | "sending" | "sent" | "error";

const INITIAL_FORM: SubmissionDraftState = {
  title: "",
  aliases: "",
  eraLabel: "",
  year: "",
  eventPending: false,
  placeName: "",
  coordinatesText: "",
  locationPending: false,
  summary: "",
  sourceTitle: "",
  sourceUrl: "",
  website: "",
};

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

function buildSubmissionText(record: ArchiveRecord, language: Language): string {
  const coords = record.place.coordinates
    ? `${record.place.coordinates.longitude}, ${record.place.coordinates.latitude}`
    : (language === "zh" ? "待考证" : "Pending");
  const source = record.sources[0];
  if (language === "zh") {
    return [
      "【The Seam 历史档案投稿】",
      `1. 人物/事件名称：${record.title.zh}${record.aliases.length ? `（别名：${record.aliases.join("、")}）` : ""}`,
      `2. 历史时间：${record.time.label.zh}`,
      `3. 发生地点：${record.place.name.zh}（坐标：${coords}）`,
      `4. 简介与史料记述：${record.summary.zh}`,
      `5. 史料/参考文献：${source?.title || ""}${source?.url ? ` (${source.url})` : ""}`,
    ].join("\n");
  }
  return [
    "[The Seam Archive Submission]",
    `1. Figure / Event Name: ${record.title.en}${record.aliases.length ? ` (Aliases: ${record.aliases.join(", ")})` : ""}`,
    `2. Historical Era: ${record.time.label.en}`,
    `3. Location: ${record.place.name.en} (Coordinates: ${coords})`,
    `4. Summary & Context: ${record.summary.en}`,
    `5. Primary Source / Citation: ${source?.title || ""}${source?.url ? ` (${source.url})` : ""}`,
  ].join("\n");
}

function buildHookFormsPayload(
  record: ArchiveRecord,
  pendingStatus: string | null,
  honeypot: string,
): Record<string, string> {
  const coords = record.place.coordinates
    ? `${record.place.coordinates.longitude}, ${record.place.coordinates.latitude}`
    : "Pending verification";
  const source = record.sources[0];
  return {
    subject: `[The Seam 投稿] ${record.title.zh}`,
    title: record.title.zh,
    aliases: record.aliases.join(", "),
    era: record.time.label.zh,
    year: record.time.startYear === null ? "Pending verification" : String(record.time.startYear),
    location: record.place.name.zh,
    coordinates: coords,
    pendingStatus: pendingStatus || "Verified fields supplied",
    summary: record.summary.zh,
    sourceTitle: source?.title || "",
    sourceUrl: source?.url || "",
    submittedAt: new Date().toISOString(),
    recordJson: JSON.stringify(record),
    website: honeypot,
  };
}

export function SubmitModal({ onClose }: Props) {
  const { language, addSubmittedRecord, openRecord } = useApp();
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  const [form, setForm] = useState<SubmissionDraftState>(INITIAL_FORM);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [submittedRecord, setSubmittedRecord] = useState<ArchiveRecord | null>(null);
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

  const sendToHookForms = async (record: ArchiveRecord, honeypot: string) => {
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
        body: JSON.stringify(buildHookFormsPayload(record, pendingStatus, honeypot)),
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
    const sourceTitle = form.sourceTitle.trim();

    if (!title || !eraLabel || !placeName || !summary || !sourceTitle) {
      setErrorMsg(
        language === "zh"
          ? "请填写名称、历史时期、地点、简介及史料来源后再提交。"
          : "Please complete name, historical era, location, summary, and source before submitting.",
      );
      return;
    }

    let parsedYear: number | null = null;
    if (!form.eventPending && form.year.trim()) {
      const n = Number(form.year.trim());
      if (!Number.isInteger(n) || n === 0) {
        setErrorMsg(
          language === "zh"
            ? "年份请填写非零整数（公元前请使用负数，如 -214），或勾选“具体年代/事件待考证”。"
            : "Year must be a non-zero integer (use negative numbers for BCE), or mark event timing pending.",
        );
        return;
      }
      parsedYear = n;
    }

    let parsedCoords: Coordinates | null = null;
    if (!form.locationPending && form.coordinatesText.trim()) {
      const result = parseCoordinatesInput(form.coordinatesText);
      if (result === "invalid") {
        setErrorMsg(
          language === "zh"
            ? "坐标格式请填写“经度, 纬度”，例如 116.4074, 39.9042（经度 -180~180，纬度 -90~90）。"
            : "Coordinates must be formatted as 'longitude, latitude', e.g. 116.4074, 39.9042.",
        );
        return;
      }
      parsedCoords = result;
    }

    const sourceUrl = form.sourceUrl.trim();
    if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) {
      setErrorMsg(
        language === "zh"
          ? "参考链接请以 http:// 或 https:// 开头。"
          : "Reference URL must start with http:// or https://.",
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
      sources: [
        {
          title: sourceTitle,
          url: sourceUrl || undefined,
        },
      ],
    };

    addSubmittedRecord(record);
    setSubmittedRecord(record);
    setDraftCopied(false);
    void sendToHookForms(record, form.website);
  };

  const handleCopyDraft = async () => {
    if (!submittedRecord) return;
    try {
      await navigator.clipboard.writeText(buildSubmissionText(submittedRecord, language));
      setDraftCopied(true);
    } catch {
      setDraftCopied(false);
    }
  };

  const handleDownloadJson = () => {
    if (!submittedRecord) return;
    const blob = new Blob([JSON.stringify(submittedRecord, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${submittedRecord.slug}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const mailtoHref = submittedRecord && displayEmail
    ? `mailto:${encodeURIComponent(displayEmail)}?subject=${encodeURIComponent(`Submission: ${submittedRecord.title.zh}`)}&body=${encodeURIComponent(buildSubmissionText(submittedRecord, language))}`
    : "";

  const pendingBadge = submittedRecord ? getPendingVerificationLabel(submittedRecord, language) : null;

  return (
    <div ref={dialogRef} className="seam-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="submit-title">
      <div className="seam-modal-content seam-modal-wide" onClick={(e) => e.stopPropagation()}>
        <header className="seam-modal-header">
          <div>
            <span className="seam-modal-eyebrow">The Seam · Contribution</span>
            <h2 id="submit-title" className="seam-modal-title">
              {language === "zh" ? "向 The Seam 投稿档案" : "Submit to The Seam"}
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
            <p className="seam-modal-lead">
              {language === "zh"
                ? "填写以下史料信息即可生成标准化档案草稿并立即加入本地索引预览，也可一键导出、复制或直接投递。"
                : "Complete the structured fields below to preview a draft locally, send via the configured inbox endpoint, copy text, or export JSON."}
            </p>

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

            <div className="seam-form-row">
              <label className="seam-form-field">
                <span className="seam-form-label">{language === "zh" ? "人物或事件名称 *" : "Figure or Event Name *"}</span>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder={language === "zh" ? "例如：李渔 / 某地历史事件" : "e.g. Historical figure or event"}
                />
              </label>
              <label className="seam-form-field">
                <span className="seam-form-label">{language === "zh" ? "别名或原文名（选填）" : "Aliases / Original Name"}</span>
                <input
                  type="text"
                  value={form.aliases}
                  onChange={e => setForm(prev => ({ ...prev, aliases: e.target.value }))}
                  placeholder={language === "zh" ? "多个用顿号或逗号分隔" : "Comma-separated"}
                />
              </label>
            </div>

            <div className="seam-form-row">
              <div className="seam-form-field">
                <label htmlFor="submit-era" className="seam-form-label">{language === "zh" ? "历史时期 *" : "Historical Era *"}</label>
                <input
                  id="submit-era"
                  type="text"
                  required
                  value={form.eraLabel}
                  onChange={e => setForm(prev => ({ ...prev, eraLabel: e.target.value }))}
                  placeholder={language === "zh" ? "例如：约1629年 / 西汉晚期" : "e.g. c. 1629 / Late Han"}
                />
                <label className="seam-form-checkbox">
                  <input
                    type="checkbox"
                    checked={form.eventPending}
                    onChange={e => setForm(prev => ({ ...prev, eventPending: e.target.checked }))}
                  />
                  <span>{language === "zh" ? "具体年代/事件待考证" : "Exact date/event pending"}</span>
                </label>
              </div>
              <label className="seam-form-field">
                <span className="seam-form-label">{language === "zh" ? "年份数字（选填，前用负数）" : "Year (optional, BCE negative)"}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={form.eventPending}
                  value={form.eventPending ? "" : form.year}
                  onChange={e => setForm(prev => ({ ...prev, year: e.target.value }))}
                  placeholder={language === "zh" ? "例如：1629 或 -214" : "e.g. 1629 or -214"}
                />
              </label>
            </div>

            <div className="seam-form-row">
              <div className="seam-form-field">
                <label htmlFor="submit-place" className="seam-form-label">{language === "zh" ? "发生或活动地点 *" : "Historical Location *"}</label>
                <input
                  id="submit-place"
                  type="text"
                  required
                  value={form.placeName}
                  onChange={e => setForm(prev => ({ ...prev, placeName: e.target.value }))}
                  placeholder={language === "zh" ? "例如：中国福建 / 弗吉尼亚詹姆斯敦" : "e.g. Fujian / Jamestown"}
                />
                <label className="seam-form-checkbox">
                  <input
                    type="checkbox"
                    checked={form.locationPending}
                    onChange={e => setForm(prev => ({ ...prev, locationPending: e.target.checked }))}
                  />
                  <span>{language === "zh" ? "精确地理坐标待考证" : "Exact coordinates pending"}</span>
                </label>
              </div>
              <label className="seam-form-field">
                <span className="seam-form-label">{language === "zh" ? "经度, 纬度（选填）" : "Longitude, Latitude (optional)"}</span>
                <input
                  type="text"
                  disabled={form.locationPending}
                  value={form.locationPending ? "" : form.coordinatesText}
                  onChange={e => setForm(prev => ({ ...prev, coordinatesText: e.target.value }))}
                  placeholder="116.4074, 39.9042"
                />
              </label>
            </div>

            <label className="seam-form-field">
              <span className="seam-form-label">{language === "zh" ? "历史简介与文献事实 *" : "Summary & Documented Facts *"}</span>
              <textarea
                rows={3}
                required
                value={form.summary}
                onChange={e => setForm(prev => ({ ...prev, summary: e.target.value }))}
                placeholder={language === "zh" ? "简述有据可查的历史经过，请勿附加现代身份标签..." : "Describe documented facts without modern identity labels..."}
              />
            </label>

            <div className="seam-form-row">
              <label className="seam-form-field">
                <span className="seam-form-label">{language === "zh" ? "第一手史料 / 参考文献 *" : "Primary Source / Citation *"}</span>
                <input
                  type="text"
                  required
                  value={form.sourceTitle}
                  onChange={e => setForm(prev => ({ ...prev, sourceTitle: e.target.value }))}
                  placeholder={language === "zh" ? "例如：《史记》卷一二五 / 某馆藏文献" : "e.g. Archival dossier / scholarly edition"}
                />
              </label>
              <label className="seam-form-field">
                <span className="seam-form-label">{language === "zh" ? "史料参考链接（选填）" : "Source URL (optional)"}</span>
                <input
                  type="url"
                  value={form.sourceUrl}
                  onChange={e => setForm(prev => ({ ...prev, sourceUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </label>
            </div>

            <p className="seam-no-taxonomy-reminder">
              <em>
                {language === "zh"
                  ? "※ 请依循第一手史料记述，勿为人物预设现代性别或性取向分类标签。"
                  : "※ Adhere strictly to primary documentation without projecting modern categories."}
              </em>
            </p>

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
                  {language === "zh" ? "正在通过 HookForms 向官方收件箱发送投稿…" : "Sending submission via HookForms…"}
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
                      ? "在线直投暂时失败（本地草稿已保存），可点击重试或改用邮件客户端发送。"
                      : "Direct webhook delivery failed (draft saved locally). Retry or send via email client."}
                  </span>
                  <button
                    type="button"
                    className="seam-btn-outline"
                    onClick={() => { void sendToHookForms(submittedRecord, form.website); }}
                  >
                    {language === "zh" ? "重新发送" : "Retry"}
                  </button>
                </div>
              )}
              {deliveryStatus === "local-only" && (
                <p className="seam-email-note">
                  {displayEmail
                    ? (language === "zh"
                        ? `已生成标准档案草稿；请点击下方“用邮件发送此稿件 ↗”发往 ${displayEmail}，或复制文本 / 导出 JSON 稿件。`
                        : `Draft created. Click "Send via Email ↗" below to send to ${displayEmail}, or copy text / download JSON.`)
                    : (language === "zh"
                        ? "已生成标准档案草稿并同步至本地“档案索引”；点击下方按钮可立即预览效果、复制文本或导出 JSON 文件。"
                        : "Draft saved to your local Archive Index. Preview it live, copy formatted text, or download JSON below.")}
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
                {language === "zh" ? "在档案中查看并定位" : "View in Archive"}
              </button>
              {displayEmail && (
                <a href={mailtoHref} className="seam-btn-outline">
                  {language === "zh" ? "用邮件发送此稿件 ↗" : "Send via Email ↗"}
                </a>
              )}
              <button type="button" className="seam-btn-outline" onClick={handleCopyDraft}>
                {draftCopied
                  ? (language === "zh" ? "✓ 已复制投稿文本" : "✓ Text Copied")
                  : (language === "zh" ? "复制投稿文本" : "Copy Submission Text")}
              </button>
              <button type="button" className="seam-btn-outline" onClick={handleDownloadJson}>
                {language === "zh" ? "导出 JSON 稿件" : "Download JSON"}
              </button>
            </div>

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
                  : (language === "zh" ? "提交并生成草稿" : "Submit Draft")}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="seam-btn-secondary"
                onClick={() => {
                  setSubmittedRecord(null);
                  setDeliveryStatus("local-only");
                  setForm(INITIAL_FORM);
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
