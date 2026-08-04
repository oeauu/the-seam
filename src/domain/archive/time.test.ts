import { describe, expect, it } from "vitest";
import {
  axisToHistoricalYear,
  formatHistoricalYear,
  historicalYearToAxis,
  normalizeHistoricalRange,
  normalizeHistoricalYear,
  rangesOverlap,
} from "./index";

describe("archive historical time", () => {
  it("normalizes legacy year zero to the first CE year", () => {
    expect(normalizeHistoricalYear(0)).toBe(1);
    expect(normalizeHistoricalRange({ start: 0, end: 0 })).toEqual({ start: 1, end: 1 });
  });

  it("rejects year zero as a stored historical year", () => {
    expect(() => historicalYearToAxis(0)).toThrow(/year zero/);
  });

  it("keeps the axis continuous without inventing a year zero", () => {
    expect(historicalYearToAxis(-1)).toBe(-1);
    expect(historicalYearToAxis(1)).toBe(0);
    expect(axisToHistoricalYear(-1)).toBe(-1);
    expect(axisToHistoricalYear(0)).toBe(1);
  });

  it("normalizes reversed ranges and uses inclusive overlap", () => {
    expect(normalizeHistoricalRange({ start: 50, end: -50 })).toEqual({ start: -50, end: 50 });
    expect(rangesOverlap(-10, 10, { start: 10, end: 20 })).toBe(true);
    expect(rangesOverlap(-10, -1, { start: 1, end: 20 })).toBe(false);
  });

  it("formats BCE and CE without a year-zero label", () => {
    expect(formatHistoricalYear(-1, "en")).toBe("1 BCE");
    expect(formatHistoricalYear(1, "zh")).toBe("公元1年");
    expect(() => formatHistoricalYear(0, "en")).toThrow(/year zero/);
  });
});
