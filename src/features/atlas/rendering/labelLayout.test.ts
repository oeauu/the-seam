import { describe, expect, it } from "vitest";
import {
  estimateLabelSize,
  layoutAtlasLabels,
  rectsOverlap,
  type LabelCandidate,
  type LabelProjection,
} from "./labelLayout";

function candidate(id: string, overrides: Partial<LabelCandidate> = {}): LabelCandidate {
  return {
    id,
    text: id,
    worldPosition: [0, 0, 0],
    size: { width: 100, height: 50 },
    ...overrides,
  };
}

function projection(overrides: Partial<LabelProjection> = {}): LabelProjection {
  return {
    ndcX: 0,
    ndcY: 0,
    ndcZ: 0,
    facing: 1,
    ...overrides,
  };
}

describe("layoutAtlasLabels", () => {
  it("converts NDC points to screen bounds and tries the four placements", () => {
    const result = layoutAtlasLabels([candidate("label")], {
      viewport: { width: 240, height: 160 },
      project: () => projection(),
      edgePadding: 0,
      collisionGap: 4,
    });

    expect(result.visibleLabels).toHaveLength(1);
    expect(result.visibleLabels[0]?.placement).toBe("right-top");
    expect(result.visibleLabels[0]?.anchor).toEqual({ x: 120, y: 80 });
    expect(result.visibleLabels[0]?.bounds).toMatchObject({
      left: 124,
      top: 26,
      right: 224,
      bottom: 76,
    });
  });

  it("culls backface and outside-frustum points before layout", () => {
    const points: Record<string, LabelProjection> = {
      back: projection({ facing: -1 }),
      outside: projection({ ndcX: 1.2 }),
    };
    const result = layoutAtlasLabels([candidate("back"), candidate("outside")], {
      viewport: { width: 240, height: 160 },
      project: item => points[item.id] ?? null,
    });

    expect(result.visibleLabels).toHaveLength(0);
    expect(result.hiddenLabels).toEqual([
      expect.objectContaining({ candidate: expect.objectContaining({ id: "back" }), reason: "backface" }),
      expect.objectContaining({ candidate: expect.objectContaining({ id: "outside" }), reason: "outside-frustum" }),
    ]);
  });

  it("orders priority and hides a lower-priority label when all placements collide", () => {
    const result = layoutAtlasLabels([
      candidate("low", { priority: 1 }),
      candidate("high", { priority: 10 }),
      candidate("third", { priority: 5 }),
      candidate("fourth", { priority: 4 }),
      candidate("fifth", { priority: 3 }),
    ], {
      viewport: { width: 240, height: 160 },
      project: () => projection(),
      edgePadding: 0,
      collisionGap: 0,
    });

    expect(result.visibleLabels.map(label => label.candidate.id)).toEqual(["high", "third", "fourth", "fifth"]);
    expect(result.hiddenLabels.map(label => label.candidate.id)).toEqual(["low"]);
    expect(result.hiddenLabels[0]?.reason).toBe("collision");
  });

  it("applies the mobile budget while retaining selected and hovered labels", () => {
    const result = layoutAtlasLabels([
      candidate("ordinary-a", { priority: 1 }),
      candidate("selected", { selected: true, priority: 0 }),
      candidate("ordinary-b", { priority: 2 }),
      candidate("hovered", { hovered: true, priority: 0 }),
    ], {
      viewport: { width: 720, height: 480 },
      project: item => ({ ...projection(), ndcX: item.id === "ordinary-b" ? 0.6 : -0.6 }),
      mobile: true,
      mobileMaxLabels: 1,
    });

    expect(result.visibleLabels.map(label => label.candidate.id)).toEqual(["selected", "hovered", "ordinary-b"]);
    expect(result.hiddenLabels).toEqual([
      expect.objectContaining({ candidate: expect.objectContaining({ id: "ordinary-a" }), reason: "budget" }),
    ]);
  });

  it("supports bilingual label length estimates and rectangle collision checks", () => {
    expect(estimateLabelSize("Archive").width).toBeLessThan(estimateLabelSize("档案地点").width);
    expect(rectsOverlap(
      { left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 },
      { left: 9, top: 0, right: 19, bottom: 10, width: 10, height: 10 },
    )).toBe(true);
    expect(rectsOverlap(
      { left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 },
      { left: 10, top: 0, right: 20, bottom: 10, width: 10, height: 10 },
    )).toBe(false);
  });
});
