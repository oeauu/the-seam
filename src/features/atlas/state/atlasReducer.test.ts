import { describe, expect, it } from "vitest";
import { atlasReducer, initialAtlasState } from "./atlasReducer";

describe("atlas navigation reducer", () => {
  it("moves from global to region to focused and back", () => {
    const region = atlasReducer(initialAtlasState, { type: "ENTER_REGION", regionId: "east-asia" });
    expect(region.sceneMode).toBe("region");
    const focused = atlasReducer(region, { type: "FOCUS_ENTRY", entryId: "entry_tuer_shen", cameraPose: null });
    expect(focused.sceneMode).toBe("focused");
    expect(focused.selectedEntryId).toBe("entry_tuer_shen");
    const returned = atlasReducer(focused, { type: "BACK_TO_REGION" });
    expect(returned.sceneMode).toBe("region");
    expect(returned.selectedEntryId).toBeNull();
  });

  it("keeps filters independent from navigation transitions", () => {
    const filtered = atlasReducer(initialAtlasState, { type: "SET_SOURCE_FILTERS", ids: ["textual"] });
    const region = atlasReducer(filtered, { type: "ENTER_REGION", regionId: "europe" });
    expect(region.selectedSourceIds).toEqual(["textual"]);
  });

  it("keeps timeline preview separate until release commits the range", () => {
    const preview = atlasReducer(initialAtlasState, {
      type: "SET_PREVIEW_RANGE",
      range: { start: -500, end: 1800 },
    });
    const dragging = atlasReducer(preview, { type: "SET_TIMELINE_DRAGGING", dragging: true });
    expect(dragging.previewRange).toEqual({ start: -500, end: 1800 });
    expect(dragging.committedRange).toEqual({ start: null, end: null });
    expect(dragging.isTimelineDragging).toBe(true);

    const committed = atlasReducer(dragging, {
      type: "COMMIT_TIME_RANGE",
      range: { start: -500, end: 1800 },
    });
    expect(committed.committedRange).toEqual({ start: -500, end: 1800 });
    expect(committed.timeRange).toEqual({ start: -500, end: 1800 });
    expect(committed.isTimelineDragging).toBe(false);
  });
});
