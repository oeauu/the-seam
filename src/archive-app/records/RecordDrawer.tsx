import { useEffect, useRef, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { ArchiveEntry, Language } from "../../domain/archive/types";
import { RecordSummary } from "./RecordSummary";

interface RecordDrawerProps {
  entry: ArchiveEntry | null;
  language: Language;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
}

export function RecordDrawer({ entry, language, onClose, returnFocusRef }: RecordDrawerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!entry) return undefined;
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusable = Array.from(document.querySelectorAll<HTMLElement>('[data-record-drawer="true"] button, [data-record-drawer="true"] a, [data-record-drawer="true"] input'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [entry, onClose]);

  useEffect(() => {
    if (entry) return undefined;
    returnFocusRef.current?.focus();
  }, [entry, returnFocusRef]);

  if (!entry) return null;
  return createPortal(
    <>
      <div className="record-drawer-backdrop" aria-hidden="true" onClick={onClose} />
      <aside className="record-drawer" role="dialog" aria-modal="true" aria-labelledby="record-drawer-title" data-record-drawer="true">
        <header className="record-drawer__header">
          <div>
            <p className="archive-section__eyebrow">Archive record</p>
            <h2 id="record-drawer-title">{entry.title[language]}</h2>
          </div>
          <button ref={closeRef} className="record-drawer__close" type="button" aria-label="关闭档案抽屉" onClick={onClose}>×</button>
        </header>
        <div className="record-drawer__body">
          <RecordSummary entry={entry} language={language} />
        </div>
      </aside>
    </>,
    document.body,
  );
}
