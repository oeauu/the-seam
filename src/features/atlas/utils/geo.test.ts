import { describe, expect, it } from "vitest";
import { createRegionProjection, latLngToVector3 } from "./geo";

describe("geography utilities", () => {
  it("maps latitude and longitude to a stable globe vector", () => {
    const equator = latLngToVector3(0, 0, 2);
    expect(equator[0]).toBeCloseTo(0);
    expect(equator[1]).toBeCloseTo(0);
    expect(equator[2]).toBeCloseTo(2);
    expect(latLngToVector3(90, 0, 1)[1]).toBeCloseTo(1);
  });

  it("uses the same bounded projection for region geometry and cards", () => {
    const projection = createRegionProjection(
      { west: 0, east: 10, south: 0, north: 10 },
      { width: 1000, height: 500, padding: 20 },
    );
    const center = projection([5, 5]);
    expect(center[0]).toBeCloseTo(500);
    expect(center[1]).toBeCloseTo(250);
  });
});
