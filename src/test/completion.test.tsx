import { describe, expect, it, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { AppProvider, useApp } from "../state/appContext";
import { Timeline } from "../timeline/Timeline";
import { ALL_RECORDS, findRecord } from "../data/archive";
import { recordOverlapsRange, timelineTicks, calculateTimelineBounds } from "../timeline/timelineUtils";
import { parseRoute, buildRoutePath } from "../state/routing";
import { getCountryMetadataForFeature } from "../geo/countryLookup";
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

afterEach(() => {cleanup();window.history.replaceState({},"","/");});

describe("Completion regressions", () => {
  it("preserves old record URLs and the complete original event drafts", () => {
    expect(findRecord("entry-thomas-hall")?.slug).toBe("thomas-hall");
    expect(findRecord("entry-sappho")?.slug).toBe("sappho");
    expect(ALL_RECORDS.filter(record => record.id.startsWith("event-"))).toHaveLength(17);
    expect(ALL_RECORDS.filter(record => record.id.startsWith("event-")).every(record => record.place.coordinates === null && record.time.startYear === null)).toBe(true);
  });
  it("does not fabricate capitals and handles unknown dates and malformed URLs", () => {
    expect(getCountryMetadataForFeature(country)?.capital).toBeUndefined();
    expect(recordOverlapsRange(null,null,1600,1700,false)).toBe(false);
    expect(recordOverlapsRange(null,null,1600,1700,true)).toBe(true);
    expect(parseRoute("/record/%ZZ", "")).toEqual({kind:"globe"});
    expect(buildRoutePath({kind:"record",slug:"thomas-hall",countryId:"840"})).toBe("/record/thomas-hall?country=840");
    expect(calculateTimelineBounds(1629,2030)).toEqual([1600,2030]);
    expect(timelineTicks(-2500,2030)).not.toContain(0);
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
});
