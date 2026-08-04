import type { ReactNode } from "react";

interface PageSectionProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
  paper?: boolean;
}

export function PageSection({ eyebrow, title, children, paper = false }: PageSectionProps) {
  return (
    <section className={`archive-section${paper ? " archive-section--paper" : ""}`}>
      <p className="archive-section__eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
