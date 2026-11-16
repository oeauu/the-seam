import { useApp } from "../state/useApp";
import { UN_MAP_DISCLAIMER } from "../geo/unStandards";

import { useDialogFocus } from "./useDialogFocus";

interface Props {
  onClose: () => void;
}

export function AboutModal({ onClose }: Props) {
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  const { language } = useApp();

  return (
    <div className="seam-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="about-title">
      <div ref={dialogRef} className="seam-modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="seam-modal-header">
          <div>
            <span className="seam-modal-eyebrow">The Seam · Project Manifesto</span>
            <h2 id="about-title" className="seam-modal-title">
              {language === "zh" ? "关于 The Seam" : "About The Seam"}
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

        <div className="seam-modal-body seam-about-copy">
          <p className="seam-about-lead">
            {language === "zh"
              ? "The Seam 是一个记录历史人物、事件及相关史料的数字档案空间。项目关注那些挑战传统二元叙事，或揭示既有身份与社会分类局限性的历史记录。"
              : "The Seam is a digital archive of historical figures, events, and primary documentation. It focuses on records that challenge conventional binary narratives or expose the limitations of static social and identity categories."}
          </p>

          <section className="seam-about-section">
            <h3>{language === "zh" ? "空间、时间与未被定义的历史" : "Space, Time, and Uncategorized Memory"}</h3>
            <p>
              {language === "zh"
                ? "历史从未按照现代预设的分类系统展开。许多历史人物的身体实践、社会角色与情感联系，在当时的法律裁决、宫廷起居注、民间神话与审判书里留下了深刻的痕迹，却往往被后世强行剪裁以迎合当下的概念。"
                : "History has never conformed to anachronistic categories. Embodied experiences, social practices, and intimate bonds left profound traces across legal trials, court annals, and folklore, only to be flattened by later eras into rigid concepts."}
            </p>
            <p>
              {language === "zh"
                ? "The Seam 不预先为人物规定现代身份，也不通过身份标签组织历史。我们以三维空间与时间为主要线索，通过金色坐标连接全球各地留存的第一手史料。"
                : "The Seam rejects pre-assigned identity labels. By anchoring historical accounts solely through geography and time, brass coordinates invite open exploration across eras and cultures."}
            </p>
          </section>

          <section className="seam-about-section">
            <h3>{language === "zh" ? "考辨与存疑的原则" : "Principles of Evidence and Restraint"}</h3>
            <p>
              {language === "zh"
                ? "对于史料未及之处，我们克制做结论；对于学术界尚存争鸣之处，我们并列呈现不同假说。每一个坐标都是一段待探索的线索，而非盖棺定论的现代标签。"
                : "Where historical evidence concludes, we refrain from speculation. Where historiographical disputes persist, we present competing theses side by side. Each coordinate is an invitation to examine primary sources, not a verdict."}
            </p>
          </section>

          <section className="seam-about-section">
            <h3>{language === "zh" ? "地理与边界标准" : "Cartographic & Boundary Standards"}</h3>
            <p>{UN_MAP_DISCLAIMER[language]}</p>
          </section>
        </div>

        <footer className="seam-modal-footer">
          <button type="button" className="seam-btn-primary" onClick={onClose}>
            {language === "zh" ? "进入探索" : "Explore The Archive"}
          </button>
        </footer>
      </div>
    </div>
  );
}
