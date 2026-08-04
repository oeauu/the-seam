import { describe, expect, it } from "vitest";
import {
  createFixtureProjection,
  createRegionProjectionFactory,
  REGION_PROJECTION_FIXTURES,
} from "./regionProjection";

describe("region projection factory", () => {
  it("provides at least three real-region navigation fixtures with valid bounds", () => {
    expect(REGION_PROJECTION_FIXTURES.length).toBeGreaterThanOrEqual(3);
    const ids = new Set(REGION_PROJECTION_FIXTURES.map(fixture => fixture.id));
    expect(ids.size).toBe(REGION_PROJECTION_FIXTURES.length);

    for (const fixture of REGION_PROJECTION_FIXTURES) {
      expect(fixture.bounds.west).toBeLessThan(fixture.bounds.east);
      expect(fixture.bounds.south).toBeLessThan(fixture.bounds.north);
      for (const location of fixture.locations) {
        expect(location.coordinate[0]).toBeGreaterThanOrEqual(fixture.bounds.west);
        expect(location.coordinate[0]).toBeLessThanOrEqual(fixture.bounds.east);
        expect(location.coordinate[1]).toBeGreaterThanOrEqual(fixture.bounds.south);
        expect(location.coordinate[1]).toBeLessThanOrEqual(fixture.bounds.north);
      }
    }
  });

  it("uses the same factory for boundary, marker, and camera target positions", () => {
    const fixture = REGION_PROJECTION_FIXTURES[0];
    const projection = createFixtureProjection(fixture, {
      width: 1200,
      height: 800,
      padding: 80,
    });
    const location = fixture.locations[0];
    const point = projection.projectCoordinate(location.coordinate);
    const boundaryPoint = projection.projectBoundary([location.coordinate])[0];

    expect(boundaryPoint).toBeDefined();
    expect(boundaryPoint?.scenePosition).toEqual(point.scenePosition);
    expect(projection.markerPosition(location.coordinate)).toEqual(point.scenePosition);
    expect(projection.cameraTargetFor(location.coordinate)).toEqual(point.cameraTarget);
  });

  it("fits bounds without a fixed longitude divisor and recomputes on viewport changes", () => {
    const bounds = { west: 0, east: 20, south: 0, north: 10 };
    const first = createRegionProjectionFactory(bounds, {
      width: 1000,
      height: 500,
      padding: 20,
    });
    const second = createRegionProjectionFactory(bounds, {
      width: 500,
      height: 1000,
      padding: 20,
    });
    const center = [10, 5] as const;

    expect(first.contains(center)).toBe(true);
    expect(first.project(center).screenPosition[0]).toBeCloseTo(500);
    expect(first.project(center).screenPosition[1]).toBeCloseTo(250);
    expect(second.project(center).screenPosition[0]).toBeCloseTo(250);
    expect(second.project(center).screenPosition[1]).toBeCloseTo(500);
    expect(first.scale).not.toBe(second.scale);
  });

  it("projects every fixture boundary through the same coordinate transform", () => {
    for (const fixture of REGION_PROJECTION_FIXTURES) {
      const projection = createFixtureProjection(fixture);
      const projectedBoundary = projection.projectBoundary(fixture.boundary);
      expect(projectedBoundary).toHaveLength(fixture.boundary.length);
      expect(projectedBoundary.every(point => Number.isFinite(point.scenePosition[0]))).toBe(true);
      expect(projectedBoundary.every(point => Number.isFinite(point.scenePosition[2]))).toBe(true);
    }
  });
});
