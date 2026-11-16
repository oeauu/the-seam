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
import { getCountryMetadataForFeature, recordBelongsToCountry } from "../geo/countryLookup";
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
  it("uses an archive’s country code only when its coordinates miss all country polygons", () => {
    const record = ALL_RECORDS[0];
    const nearby: CountryFeature = {
      type: "Feature", id: "998", properties: { name: "Nearby region" },
      geometry: { type: "Polygon", coordinates: [[[10, 0], [10, 5], [15, 5], [15, 0], [10, 0]]] },
    };
    const offshore = { ...record, place: { ...record.place, countryCode: "999", coordinates: { longitude: 8, latitude: 2 } } };
    const inland = { ...offshore, place: { ...offshore.place, coordinates: { longitude: 12, latitude: 2 } } };
    expect(recordBelongsToCountry(offshore, country, [country, nearby])).toBe(true);
    expect(recordBelongsToCountry(inland, country, [country, nearby])).toBe(false);
    expect(recordBelongsToCountry(inland, nearby, [country, nearby])).toBe(true);
  });
  it("removes both archived form connectivity tests and keeps other local submissions", () => {
    const key = "the-seam:user-submissions:v1";
    const testRecord = {
      ...ALL_RECORDS[0],
      id: "submission-test-1",
      title: { zh: "【测试投稿】The Seam 表单连通性验证", en: "Connectivity test" },
      place: { ...ALL_RECORDS[0].place, name: { zh: "测试地点", en: "Test site" } },
      summary: { zh: "这是一条用于验证网站投稿和邮件投递的测试记录，请忽略。", en: "Test summary" },
    };
    const otherRecord = { ...testRecord, id: "submission-other", summary: { zh: "其他投稿", en: "Other submission" } };
    const numberedTest = { ...otherRecord, id: "submission-1-1794858284222", title: { zh: "1", en: "1" } };
    const theodoreTest = {
      ...otherRecord,
      id: "submission-theodore-test",
      title: { zh: "Theodore", en: "Theodore" },
      place: { ...otherRecord.place, coordinates: null },
    };
    window.localStorage.setItem(key, JSON.stringify([testRecord, { ...testRecord, id: "submission-test-2" }, numberedTest, theodoreTest, otherRecord]));
    try {
      render(<AppProvider><Probe /></AppProvider>);
      expect(JSON.parse(window.localStorage.getItem(key) ?? "[]")).toEqual([otherRecord]);
    } finally {
      window.localStorage.removeItem(key);
    }
  });

  it("preserves old record URLs and resolves verified vs. unsubstantiated legacy drafts", () => {
    expect(findRecord("entry-thomas-hall")?.slug).toBe("thomas-hall");
    expect(findRecord("entry-sappho")?.slug).toBe("sappho");
    expect(ALL_RECORDS.filter(record => record.id.startsWith("event-"))).toHaveLength(0);
    expect(ALL_RECORDS.some(record => record.title.zh === "数字博物馆时空地图上线")).toBe(false);
    expect(ALL_RECORDS.some(record => record.title.zh === "史前石刻与身体象征")).toBe(false);
    expect(ALL_RECORDS.some(record => record.title.zh === "汉高祖定都长安")).toBe(false);
    for (const slug of ["hadrian-antinous", "athenian-symposium", "michelangelo-cavalieri", "fujian-qixiong-qidi"]) {
      const rec = findRecord(slug);
      expect(rec).toBeDefined();
      expect(rec?.place.coordinates).not.toBeNull();
      expect(rec?.time.startYear).not.toBeNull();
      expect(rec ? getPendingVerificationLabel(rec, "zh") : "pending").toBeNull();
    }
    const verifiedEntry = findRecord("thomas-hall");
    const lanling = findRecord("lanling-wang");
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
    fireEvent.change(screen.getByLabelText(/投稿人署名/), { target: { value: "李四" } });
    fireEvent.change(screen.getByLabelText(/联系邮箱/), { target: { value: "lisi@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "提交投稿" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0]?.[0]).toBe("https://hooks.example.test/hooks/the-seam");
    const sentBody = JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit | undefined)?.body || "{}"));
    expect(sentBody.contributorName).toBe("李四");
    expect(sentBody.contributorEmail).toBe("lisi@example.com");
    expect(sentBody._replyto).toBe("lisi@example.com");
    expect(sentBody._subject).toBe("[The Seam 投稿] 测试档案稿件");
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("投稿服务已接收"));
    expect(screen.getByRole("link", { name: /备用邮件发送/ }).getAttribute("href")).toMatch(/^mailto:/);

    expect(screen.queryByRole("link", { name: /通过 GitHub Issue 投递/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /用邮件发送此稿件/ })).not.toBeInTheDocument();
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
