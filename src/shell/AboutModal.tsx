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
            <span className="seam-modal-eyebrow">The Seam</span>
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
              ? "The Seam 是一个专注记录性与性别少数历史及非传统性别实践的在线档案。我们从各地的宫廷记录、庭审文书、诗文与民间传说里，收集历史上关于同性爱恋、跨越性别装束与身份、双性身体记述及第三性别社群的故事，呈现他们当年如何生活、如何与彼此相处，以及同时代人留下了怎样的文字。"
              : "The Seam is an online historical archive documenting lives beyond conventional gender and intimacy norms. Drawing on court annals, trial records, literature, and local folklore around the world, it gathers accounts of same-sex affection, gender crossing, intersex figures, and third-gender traditions—showing how people lived, related to one another, and were recorded by their contemporaries."}
          </p>

          <section className="seam-about-section">
            <p>
              {language === "zh"
                ? "你可以转动地球仪，也可以沿时间轴按年代浏览。点开地图上的金色标记，便能读到一则档案——事情发生在何时何地，以及现存的材料究竟写了什么。有时，同一件事会留下几种不同的说法；我们把它们放在一起，分别注明出处，也会标明哪些细节尚存疑问。"
                : "Turn the globe or move along the timeline to browse across eras. Select any gold marker on the map to open a dossier showing when and where an event took place and what surviving texts actually say. When multiple accounts exist for the same episode, we place them side by side with citations and note where details remain open to question."}
            </p>
          </section>

          <section className="seam-about-section">
            <h3>{language === "zh" ? "地理与边界标准" : "Geographic & Boundary Standards"}</h3>
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
