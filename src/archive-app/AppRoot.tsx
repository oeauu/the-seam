import { lazy, Suspense, useCallback, useEffect, useMemo, useReducer, useRef, useState, type Dispatch } from "react";
import type { ArchiveEntry, Language } from "../domain/archive/types";
import { getArchiveEntries } from "../domain/archive/entries";
import { groupEntriesByLocation } from "../domain/archive/locations";
import { getLocalizedText } from "../domain/archive/localization";
import { selectVisibleEntries, findEntryBySlug } from "./state/archiveAppSelectors";
import { archiveAppReducer, initialArchiveAppState } from "./state/archiveAppReducer";
import { parseArchiveRoute, navigateArchiveRoute, type ArchiveRoute } from "./routing/archiveRoute";
import { ArchiveShell } from "./shell/ArchiveShell";
import { PageSection } from "./shell/PageSection";
import { ParchmentStage } from "./scene/ParchmentStage";
import { RecordDrawer } from "./records/RecordDrawer";

const LegacyApp = lazy(() => import("../legacy/LegacyApp"));

function detectMotionPreference(): "full" | "reduced" {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "full";
}

function detectRenderingCapability(): "webgl" | "fallback" {
  if (typeof window === "undefined") return "fallback";
  if (new URLSearchParams(window.location.search).get("forceFallback") === "1") return "fallback";
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
  return context ? "webgl" : "fallback";
}

function HomePage({ language, entries, state, dispatch, onSelectLocation, onMapError }: {
  language: Language;
  entries: readonly ArchiveEntry[];
  state: ReturnType<typeof archiveAppReducer>;
  dispatch: Dispatch<Parameters<typeof archiveAppReducer>[1]>;
  onSelectLocation: (groupId: string) => void;
  onMapError: () => void;
}) {
  return (
    <>
      <section className="archive-hero">
        <p className="archive-kicker">A living index / a paper world</p>
        <h1>The map is a surface for memory.</h1>
        <p>在一张具有轻微起伏和卷边的三维羊皮卷上，浏览跨越时间与地域的酷儿档案。拖动、缩放、沿时间轴阅读，然后打开一个地点的故事。</p>
      </section>
      <ParchmentStage
        camera={state.camera}
        entries={entries}
        previewRange={state.previewRange}
        committedRange={state.committedRange}
        isTimelineDragging={state.isTimelineDragging}
        includeUndated={state.includeUndated}
        language={language}
        motion={state.motionPreference}
        capability={state.renderingCapability}
        selectedGroupId={state.selectedLocationGroupId}
        onCamera={camera => { dispatch({ type: "pan", target: camera.target }); dispatch({ type: "zoom", zoom: camera.zoom }); }}
        onSelectLocation={onSelectLocation}
        onPreviewRange={range => dispatch({ type: "set-preview-range", range })}
        onCommitRange={range => dispatch({ type: "set-committed-range", range })}
        onTimelineDragging={value => dispatch({ type: "set-timeline-dragging", value })}
        onIncludeUndated={value => dispatch({ type: "set-include-undated", value })}
        onMapError={onMapError}
      />
      <PageSection eyebrow="Reading room" title="A page that keeps moving">
        <p className="archive-section__intro">The canvas sits inside the document rather than replacing it. Keep scrolling to read the project context, selected records and the limits of this demonstration dataset.</p>
        <div className="archive-card-grid">
          <article className="archive-card"><h3>One paper, many scales</h3><p>Global contours, place groups and record notes share the same projection and parchment surface.</p></article>
          <article className="archive-card"><h3>Coordinates as invitations</h3><p>Brass markers are navigation points, not claims that a demo record is already fully verified.</p></article>
          <article className="archive-card"><h3>Time as a quiet filter</h3><p>Preview changes remain light while a range is dragged; the committed selection updates on release.</p></article>
        </div>
      </PageSection>
      <PageSection eyebrow="Selected records" title="A small working set" paper>
        <p className="archive-section__intro">当前垂直切片使用 {entries.length} 条受控演示档案。正式史料、账号、投稿审核和社交功能不属于本轮交付。</p>
        <div className="archive-card-grid">
          {entries.slice(0, 3).map(entry => <article className="archive-card" key={entry.id}><h3>{entry.title[language]}</h3><p>{entry.summary[language]}</p></article>)}
        </div>
      </PageSection>
    </>
  );
}

function RoutePage({ route, language, entries }: { route: ArchiveRoute; language: Language; entries: readonly ArchiveEntry[] }) {
  if (route.kind === "archive") {
    return <PageSection eyebrow="Archive" title="档案库"><div className="archive-page-copy"><p className="archive-section__intro">这里是与羊皮卷共享领域模型的可滚动目录。选择地图坐标可以回到同一条记录抽屉。</p><div className="archive-card-grid">{entries.map(entry => <article className="archive-card" key={entry.id}><h3>{entry.title[language]}</h3><p>{entry.summary[language]}</p></article>)}</div></div></PageSection>;
  }
  if (route.kind === "submit") {
    return <PageSection eyebrow="Submit" title="投稿入口"><div className="archive-page-copy archive-page-copy__columns"><p>本轮保留投稿页面的正常滚动边界，后端提交和审核流程延后。</p><p>如果你正在准备材料，请保留来源、权利状态和不确定性说明；地图上的演示坐标不等同于正式采纳。</p></div><span className="archive-status-note">演示占位：没有写入数据库</span></PageSection>;
  }
  return <PageSection eyebrow="About" title="关于 The Queer Archive"><div className="archive-page-copy archive-page-copy__columns"><p>这是一个以开放、可修订和可追溯为原则的数字博物馆原型。羊皮卷是阅读界面，不是历史结论。</p><p>V4 首先保证首页的空间体验、文档滚动和可访问档案入口，再逐步扩大内容模型。</p></div></PageSection>;
}

export function AppRoot() {
  const [state, dispatch] = useReducer(archiveAppReducer, initialArchiveAppState, initial => ({ ...initial, motionPreference: detectMotionPreference(), renderingCapability: detectRenderingCapability() }));
  const [language, setLanguage] = useState<Language>("zh");
  const [route, setRoute] = useState<ArchiveRoute>(() => parseArchiveRoute());
  const returnFocusRef = useRef<HTMLButtonElement | null>(null);
  const entries = useMemo(() => getArchiveEntries(), []);
  const handleMapError = useCallback(() => dispatch({ type: "set-capability", value: "fallback" }), []);
  const visibleEntries = useMemo(() => selectVisibleEntries(entries, state.committedRange, state.includeUndated), [entries, state.committedRange, state.includeUndated]);
  const groups = useMemo(() => groupEntriesByLocation(visibleEntries), [visibleEntries]);
  const selectedGroup = groups.find(group => group.id === state.selectedLocationGroupId) ?? null;
  const selectedEntry = state.selectedEntryId ? entries.find(entry => entry.id === state.selectedEntryId) ?? null : null;
  const drawerEntry = selectedEntry ?? state.routeRecord;

  useEffect(() => {
    const onPopState = () => setRoute(parseArchiveRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    const onMotionChange = (event: MediaQueryListEvent) => dispatch({ type: "set-motion", value: event.matches ? "reduced" : "full" });
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener?.("change", onMotionChange);
    return () => media.removeEventListener?.("change", onMotionChange);
  }, []);

  useEffect(() => {
    if (route.kind !== "record") return;
    const record = findEntryBySlug(entries, route.slug);
    if (record && state.selectedEntryId !== record.id) dispatch({ type: "open-record", entry: record });
  }, [entries, route, state.selectedEntryId]);

  const handleSelectLocation = (groupId: string) => {
    if (document.activeElement instanceof HTMLButtonElement) returnFocusRef.current = document.activeElement;
    const group = groups.find(item => item.id === groupId);
    if (!group) return;
    if (group.entryIds.length === 1) {
      const entry = entries.find(item => item.id === group.entryIds[0]);
      if (entry) { dispatch({ type: "open-record", entry }); navigateArchiveRoute({ kind: "record", slug: entry.slug }); setRoute({ kind: "record", slug: entry.slug }); }
      return;
    }
    dispatch({ type: "select-location", groupId });
  };

  const handleCloseDrawer = () => {
    dispatch({ type: "close-drawer" });
    if (route.kind === "record") { navigateArchiveRoute({ kind: "home" }); setRoute({ kind: "home" }); }
  };

  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get("legacy") === "1") {
    return <Suspense fallback={<p>Loading legacy view…</p>}><LegacyApp /></Suspense>;
  }

  const page = route.kind === "home" || route.kind === "record"
    ? <HomePage language={language} entries={visibleEntries} state={state} dispatch={dispatch} onSelectLocation={handleSelectLocation} onMapError={handleMapError} />
    : <RoutePage route={route} language={language} entries={entries} />;

  return (
    <ArchiveShell route={route} language={language} onLanguageChange={setLanguage}>
      {page}
      {selectedGroup && (
        <>
          <div className="record-drawer-backdrop" aria-hidden="true" onClick={() => dispatch({ type: "select-location", groupId: null })} />
          <section className="location-picker" role="dialog" aria-modal="true" aria-labelledby="location-picker-title">
            <h2 id="location-picker-title">{getLocalizedText(selectedGroup.displayName, language)}</h2>
            <p>此地点包含 {selectedGroup.entryIds.length} 条演示档案，请选择一条继续阅读。</p>
            <div className="location-picker__list">{selectedGroup.entryIds.map(id => {
              const entry = entries.find(item => item.id === id);
              if (!entry) return null;
              return <button className="location-picker__item" type="button" key={entry.id} onClick={() => { dispatch({ type: "open-record", entry }); navigateArchiveRoute({ kind: "record", slug: entry.slug }); setRoute({ kind: "record", slug: entry.slug }); }}>{entry.title[language]} <span>→</span></button>;
            })}</div>
          </section>
        </>
      )}
      <RecordDrawer entry={drawerEntry} language={language} onClose={handleCloseDrawer} returnFocusRef={returnFocusRef} />
    </ArchiveShell>
  );
}

export default AppRoot;
