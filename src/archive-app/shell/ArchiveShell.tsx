import type { ReactNode } from "react";
import type { ArchiveRoute } from "../routing/archiveRoute";
import { ArchiveHeader } from "./ArchiveHeader";

interface ArchiveShellProps {
  route: ArchiveRoute;
  language: "en" | "zh";
  onLanguageChange: (language: "en" | "zh") => void;
  children: ReactNode;
}

export function ArchiveShell({ route, language, onLanguageChange, children }: ArchiveShellProps) {
  return (
    <div className="archive-app">
      <ArchiveHeader route={route} language={language} onLanguageChange={onLanguageChange} />
      <main className="archive-main">{children}</main>
      <footer className="archive-footer">
        <span>The Queer Archive / Parchment Scroll Rebuild V4</span>
        <br />
        演示数据与导航层用于空间交互验证，不替代正式史料审核。
      </footer>
    </div>
  );
}
