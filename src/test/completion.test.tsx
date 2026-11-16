import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { AppProvider } from "../state/appContext";
import { useApp } from "../state/useApp";
import { Timeline } from "../timeline/Timeline";
import { ALL_RECORDS, findRecord } from "../data/archive";
import { getPendingVerificationLabel, getRecordOtherNames } from "../data/recordStatus";
import { SubmitModal } from "../shell/SubmitModal";
import { buildGitHubIssueUrl, resolveGitHubRepo } from "../shell/submissionIssue";
import {
  recordOverlapsRange,
  timelineTicks,
  calculateTimelineBounds,
  snapYearToInterval,
  timelineIntervalTicks,
} from "../timeline/timelineUtils";
import { parseRoute, buildRoutePath } from "../state/routing";
import { getCountryMetadataForFeature } from "../geo/countryLookup";
import { mergeUnTerritories, getUNTerritoryInfo } from "../geo/unStandards";
import type { CountryFeature } from "../geo/geoTypes";

const country: CountryFeature = {type:"Feature",id:"999",properties:{name:"Test region"},geometry:{type:"Polygon",coordinates:[[[0,0],[0,5],[5,5],[5,0],[0,0]]]}};
vi.mock("../geo/worldGeometry", async importOriginal => {
  const original = await importOriginal<typeof import("../geo/worldGeometry")>();
  return {...original,loadWorldData:async () => ({features:[country],cities:[],borderMesh:[],borderLines2D:[]})};
});

function Probe() {
  const app = useApp();
  return <><output data-testid="state">{app.viewMode}:{app.selectedCountry?.id}:{app.selectedRecord?.slug}:{app.visibleRecords.length}</output>
    <button onClick={() => {const record=findRecord("thomas-hall");if(record)app.openRecord(record);}}>open hall</button>
    <Timeline /></>;
}

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  window.history.replaceState({}, "", "/");
});

describe("Completion regressions", () => {
  it("preserves old record URLs and the complete original event drafts", () => {
    expect(findRecord("entry-thomas-hall")?.slug).toBe("thomas-hall");
    expect(findRecord("entry-sappho")?.slug).toBe("sappho");
    expect(ALL_RECORDS.filter(record => record.id.startsWith("event-"))).toHaveLength(17);
    expect(ALL_RECORDS.filter(record => record.id.startsWith("event-")).every(record => record.place.coordinates === null && record.time.startYear === null)).toBe(true);
    const pendingEvent = ALL_RECORDS.find(record => record.id.startsWith("event-"));
    const verifiedEntry = findRecord("thomas-hall");
    const lanling = findRecord("lanling-wang");
    expect(pendingEvent && getPendingVerificationLabel(pendingEvent, "zh")).toBe("地点与事件待考证");
    expect(verifiedEntry && getPendingVerificationLabel(verifiedEntry, "zh")).toBeNull();
    expect(lanling && getRecordOtherNames(lanling, "zh")).toBe("高肃、兰陵武王、面具将军");
    expect(lanling && getRecordOtherNames(lanling, "zh")).not.toContain("Prince of Lanling");
  });
  it("does not fabricate capitals and handles unknown dates and malformed URLs", () => {
    expect(getCountryMetadataForFeature(country)?.capital).toBeUndefined();
    expect(recordOverlapsRange(null,null,1600,1700,false)).toBe(false);
    expect(recordOverlapsRange(null,null,1600,1700,true)).toBe(true);
    expect(parseRoute("/record/%ZZ", "")).toEqual({kind:"globe"});
    expect(buildRoutePath({kind:"record",slug:"thomas-hall",countryId:"840"})).toBe("/record/thomas-hall?country=840");
    expect(calculateTimelineBounds(1629,2030)).toEqual([1600,2030]);
    expect(calculateTimelineBounds(-2500,2026)).toEqual([-2500,2026]);
    expect(snapYearToInterval(-2340, -2500, 2026)).toBe(-2300);
    expect(snapYearToInterval(2020, -2500, 2026)).toBe(2026);
    expect(timelineIntervalTicks(-2500, 2026)).not.toContain(0);
    expect(timelineIntervalTicks(-2500, 2026)).toContain(-2400);
    expect(timelineTicks(-2500,2026)).not.toContain(0);
  });
  it("applies UN Map No. 4170 standards for disputed territories", () => {
    const chinaFeature: CountryFeature = {
      type: "Feature",
      id: "156",
      properties: { name: "China" },
      geometry: { type: "Polygon", coordinates: [[[100, 30], [100, 35], [110, 35], [110, 30], [100, 30]]] },
    };
    const taiwanFeature: CountryFeature = {
      type: "Feature",
      id: "158",
      properties: { name: "Taiwan" },
      geometry: { type: "Polygon", coordinates: [[[120, 22], [120, 25], [122, 25], [122, 22], [120, 22]]] },
    };
    const falklandsFeature: CountryFeature = {
      type: "Feature",
      id: "238",
      properties: { name: "Falkland Is." },
      geometry: { type: "Polygon", coordinates: [[[-60, -52], [-60, -51], [-58, -51], [-58, -52], [-60, -52]]] },
    };
    const merged = mergeUnTerritories([chinaFeature, taiwanFeature, falklandsFeature]);
    expect(merged).toHaveLength(2);
    expect(merged[0].geometry.type).toBe("MultiPolygon");
    expect(getUNTerritoryInfo(falklandsFeature)?.displayName?.en).toBe("Falkland Islands (Malvinas)");
    expect(getUNTerritoryInfo(falklandsFeature)?.displayName?.zh).toBe("福克兰群岛（马尔维纳斯群岛）");
  });
  it("restores direct country URLs and responds to browser history", async () => {
    window.history.replaceState({},"","/country/999");
    render(<AppProvider><Probe /></AppProvider>);
    await waitFor(() => expect(screen.getByTestId("state").textContent).toMatch(/^country:999:/));
    window.history.replaceState({},"","/record/entry-sappho");
    fireEvent.popState(window);
    expect(screen.getByTestId("state").textContent).toMatch(/^globe::sappho:/);
    window.history.replaceState({},"","/");
    fireEvent.popState(window);
    expect(screen.getByTestId("state").textContent).toMatch(/^globe:::/);
  });
  it("keyboard filtering and collapse preserve the selected record and reset all eras", () => {
    render(<AppProvider><Probe /></AppProvider>);
    fireEvent.click(screen.getByText("open hall"));
    const initial=screen.getByTestId("state").textContent;
    fireEvent.keyDown(screen.getAllByRole("slider")[0],{key:"End"});
    expect(screen.getByTestId("state").textContent).not.toBe(initial);
    fireEvent.click(screen.getByRole("button",{name:"收起时间轴"}));
    expect(screen.getByTestId("state").textContent).toBe(initial);
    fireEvent.click(screen.getByRole("button",{name:"展开时间轴"}));
    expect(screen.getByTestId("state").textContent).toBe(initial);
  });
  it("never fabricates a mailbox when unconfigured and dispatches HookForms POST when configured", async () => {
    vi.stubEnv("VITE_SUBMISSION_EMAIL", "");
    vi.stubEnv("VITE_SUBMISSION_ENDPOINT", "");
    const { unmount } = render(<AppProvider><SubmitModal onClose={() => {}} /></AppProvider>);
    expect(screen.getByText("投稿邮箱尚未公布")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制邮箱" })).toBeDisabled();
    expect(document.querySelectorAll('a[href^="mailto:"]')).toHaveLength(0);
    unmount();

    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("VITE_SUBMISSION_EMAIL", "the.seam@outlook.com");
    vi.stubEnv("VITE_SUBMISSION_ENDPOINT", "https://hooks.example.test/hooks/the-seam");
    render(<AppProvider><SubmitModal onClose={() => {}} /></AppProvider>);
    expect(screen.getByText("the.seam@outlook.com")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/人物或事件名称/), { target: { value: "测试档案稿件" } });
    fireEvent.change(screen.getByLabelText(/历史时期/), { target: { value: "清代" } });
    fireEvent.change(screen.getByLabelText(/发生或活动地点/), { target: { value: "南京" } });
    fireEvent.change(screen.getByLabelText(/历史简介与文献事实/), { target: { value: "文献记载摘录测试。" } });
    fireEvent.change(screen.getByLabelText(/第一手史料/), { target: { value: "地方志钞本" } });
    fireEvent.click(screen.getByRole("button", { name: "提交投稿" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://hooks.example.test/hooks/the-seam");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("the.seam@outlook.com"));

    const issueLink = screen.getByRole("link", { name: /通过 GitHub Issue 投递/ });
    expect(issueLink.getAttribute("href")).toContain("https://github.com/oeauu/the-seam/issues/new");
    expect(issueLink.getAttribute("href")).toContain("labels=archive-submission");
    expect(resolveGitHubRepo("invalid repo")).toBe("oeauu/the-seam");
    const sampleRecord = findRecord("thomas-hall");
    if (sampleRecord) {
      const issueUrl = buildGitHubIssueUrl(sampleRecord, "zh", null, "oeauu/the-seam");
      expect(issueUrl).toContain("https://github.com/oeauu/the-seam/issues/new");
      expect(issueUrl).toContain("Summary+%26+Documented+Facts");
      expect(issueUrl.length).toBeLessThanOrEqual(7500);
    }
  });
});
