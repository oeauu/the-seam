import { useState } from "react";
import { useApp } from "../state/appContext";
import { useDialogFocus } from "./useDialogFocus";

interface Props {
  onClose: () => void;
}

export function SubmitModal({ onClose }: Props) {
  const { language } = useApp();
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);

  // Read configurable submission email, avoiding fabricated placeholders
  const configuredEmail: string = (import.meta.env.VITE_SUBMISSION_EMAIL || "").trim();
  const displayEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(configuredEmail) ? configuredEmail : "";

  const mailtoSubject = encodeURIComponent("Submission to The Seam");
  const mailtoBody = encodeURIComponent(
    language === "zh"
      ? `【历史档案投稿】\n\n1. 人物或事件名称：\n2. 历史时间（年代/时期）：\n3. 发生地点（城市/地区）：\n4. 简介与历史经过：\n5. 可供核查的第一手史料、文献或学术参考链接：\n6. 可选图片资料及权利归属说明：\n`
      : `[The Seam Archive Submission]\n\n1. Name of Person or Event:\n2. Historical Era / Time:\n3. Location (City / Region):\n4. Summary and Historical Context:\n5. Primary Sources, Citations, or Verifiable Links:\n6. Optional Image and Rights Information:\n`
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayEmail);
      setCopied(true);
      setCopyFailed(false);
    } catch { setCopyFailed(true); }
  };

  return (
    <div ref={dialogRef} className="seam-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="submit-title">
      <div className="seam-modal-content" onClick={(e) => e.stopPropagation()}>
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

        <div className="seam-modal-body">
          <p className="seam-modal-lead">
            {language === "zh"
              ? "The Seam 欢迎学者、研究者与公众提供具有可靠文献记录的历史人物与事件资料。我们关注那些挑战传统二元叙事、揭示既有分类局限性的历史材料。"
              : "The Seam welcomes contributions of historical figures and events supported by reliable documentation, especially records that interrogate binary categories."}
          </p>

          <div className="seam-email-box">
            <span className="seam-email-label">
              {language === "zh" ? "官方投稿联络邮箱" : "Official Submission Email"}
            </span>
            <div className="seam-email-row">
              <code className="seam-email-address">{displayEmail || (language === "zh" ? "投稿邮箱尚未公布" : "Submission email not yet announced")}</code>
              <button
                type="button"
                className="seam-btn-outline"
                onClick={handleCopy}
                disabled={!displayEmail}
              >
                {copied
                  ? (language === "zh" ? "✓ 已复制" : "✓ Copied")
                  : (language === "zh" ? "复制邮箱" : "Copy Email")}
              </button>
            </div>
            {!displayEmail && (
              <p className="seam-email-note">
                {language === "zh"
                  ? "官方邮箱公布后即可通过邮件投稿。"
                  : "Email submissions will be available once the official address is announced."}
              </p>
            )}
            {copyFailed && <p role="status">{language === "zh" ? "复制未成功，请选中邮箱地址手动复制。" : "Copy failed. Select the address and copy it manually."}</p>}
          </div>

          <div className="seam-submit-guidelines">
            <h3>{language === "zh" ? "建议投稿包含的内容" : "Recommended Submission Details"}</h3>
            <ul>
              <li><strong>{language === "zh" ? "人物或事件名称" : "Name of Figure or Event"}</strong></li>
              <li><strong>{language === "zh" ? "简短介绍" : "Brief Overview"}</strong> {language === "zh" ? "（阐述实际发生的事实与收录价值）" : "(Explaining what took place and why it matters)"}</li>
              <li><strong>{language === "zh" ? "相关历史时间" : "Historical Period"}</strong> {language === "zh" ? "（明确年份、时间区间或模糊时代描述）" : "(Exact year, range, or era description)"}</li>
              <li><strong>{language === "zh" ? "相关地点" : "Associated Location"}</strong> {language === "zh" ? "（历史地名及对应现代地理坐标）" : "(Historical place name and modern coordinates)"}</li>
              <li><strong>{language === "zh" ? "史料或参考链接" : "Verifiable Sources"}</strong> {language === "zh" ? "（文献书目、出土报告、学术论文或馆藏链接）" : "(Original records, publications, or museum catalog links)"}</li>
              <li><strong>{language === "zh" ? "可选图片资料" : "Optional Images"}</strong> {language === "zh" ? "（历史肖像、手稿或文物遗迹扫描件）" : "(Historical photos, manuscripts, or relic scans)"}</li>
            </ul>
            <p className="seam-no-taxonomy-reminder">
              <em>{language === "zh"
                ? "※ 提醒：请勿为人物预设现代性别、性取向或现代身份分类标签，项目严格依循第一手史料记录。"
                : "※ Notice: Please do not superimpose modern identity or sexual categories onto historical subjects. The archive adheres strictly to primary documentation."}</em>
            </p>
          </div>
        </div>

        <footer className="seam-modal-footer">
          <button type="button" className="seam-btn-secondary" onClick={onClose}>
            {language === "zh" ? "返回" : "Close"}
          </button>
          {displayEmail ? <a
            href={`mailto:${encodeURIComponent(displayEmail)}?subject=${mailtoSubject}&body=${mailtoBody}`}
            className="seam-btn-primary"
          >
            {language === "zh" ? "撰写邮件投稿 ↗" : "Compose Email ↗"}
          </a> : <button className="seam-btn-primary" type="button" disabled>{language === "zh" ? "投稿暂未开放" : "Submissions unavailable"}</button>}
          <p className="seam-email-note">{language === "zh" ? "撰写邮件仅打开邮件客户端；请在客户端确认发送。" : "Compose opens your email client. Send the message there to submit."}</p>
        </footer>
      </div>
    </div>
  );
}
