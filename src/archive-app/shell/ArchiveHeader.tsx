import type { ArchiveRoute } from "../routing/archiveRoute";
import { navigateArchiveRoute } from "../routing/archiveRoute";

interface ArchiveHeaderProps {
  route: ArchiveRoute;
  language: "en" | "zh";
  onLanguageChange: (language: "en" | "zh") => void;
}

const links: readonly { label: string; route: ArchiveRoute }[] = [
  { label: "首页", route: { kind: "home" } },
  { label: "档案", route: { kind: "archive" } },
  { label: "投稿", route: { kind: "submit" } },
  { label: "关于", route: { kind: "about" } },
];

function routeMatches(left: ArchiveRoute, right: ArchiveRoute): boolean {
  return left.kind === right.kind;
}

export function ArchiveHeader({ route, language, onLanguageChange }: ArchiveHeaderProps) {
  return (
    <header className="archive-header">
      <a className="archive-brand" href="/" onClick={event => { event.preventDefault(); navigateArchiveRoute({ kind: "home" }); }}>
        <span className="archive-brand__title">The Queer Archive</span>
        <span className="archive-brand__subtitle">Digital Museum / Digital Memory</span>
      </a>
      <nav className="archive-nav" aria-label="主要导航">
        {links.map(link => (
          <a
            key={link.label}
            className="archive-nav__link"
            href={link.route.kind === "home" ? "/" : `/${link.route.kind}`}
            aria-current={routeMatches(route, link.route) ? "page" : undefined}
            onClick={event => { event.preventDefault(); navigateArchiveRoute(link.route); }}
          >
            {link.label}
          </a>
        ))}
        <button className="archive-nav__link" type="button" aria-label="切换语言" onClick={() => onLanguageChange(language === "zh" ? "en" : "zh")}>
          {language === "zh" ? "EN" : "中文"}
        </button>
      </nav>
    </header>
  );
}
