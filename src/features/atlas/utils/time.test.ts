import { describe, expect, it } from "vitest";
import {
  axisToHistoricalYear,
  formatHistoricalYear,
  historicalYearToAxis,
  rangesOverlap,
} from "./time";

describe("historical time utilities", () => {
  it("skips year zero when converting to and from an axis", () => {
    expect(historicalYearToAxis(-1)).toBe(-1);
    expect(historicalYearToAxis(1)).toBe(0);
    expect(axisToHistoricalYear(-1)).toBe(-1);
    expect(axisToHistoricalYear(0)).toBe(1);
    expect(() => historicalYearToAxis(0)).toThrow();
  });

  it("formats BCE and CE without exposing year zero", () => {
    expect(formatHistoricalYear(-1, "zh")).toBe("公元前1年");
    expect(formatHistoricalYear(1, "en")).toBe("1 CE");
    expect(() => formatHistoricalYear(0, "en")).toThrow();
  });

  it("checks whether dated extents overlap a selected range", () => {
    expect(rangesOverlap(-10, 10, { start: 0, end: 20 })).toBe(true);
    expect(rangesOverlap(-10, -1, { start: 1, end: 20 })).toBe(false);
    expect(rangesOverlap(100, 120, { start: null, end: 110 })).toBe(true);
  });
});
