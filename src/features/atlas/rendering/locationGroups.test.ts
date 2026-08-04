import { describe, expect, it } from "vitest";
import type { ArchiveEntry, ArchiveLocation, LocalizedText } from "../types";
import {
  coordinateToleranceForPrecision,
  coordinatesWithinTolerance,
  groupEntriesByLocation,
} from "./locationGroups";

const title: LocalizedText = { en: "Fixture", zh: "测试条目" };

function makeLocation(overrides: Partial<ArchiveLocation> = {}): ArchiveLocation {
  return {
    id: "location-fixture",
    name: { en: "Paris", zh: "巴黎" },
    latitude: 48.8566,
    longitude: 2.3522,
    precision: "city",
    regionId: "western-europe",
    isPrimary: true,
    ...overrides,
  };
}

function makeEntry(id: string, location: ArchiveLocation): ArchiveEntry {
  return {
    id,
    slug: id,
    title,
    aliases: [],
    summary: title,
    description: title,
    temporal: {
      startYear: 2000,
      endYear: 2001,
      precision: "year",
      label: title,
    },
    locations: [location],
    sourceTypeIds: [],
    objectTypeIds: [],
    culturalMeaningIds: [],
    evidenceGrades: ["C"],
    interpretationRisks: [],
    references: [],
    media: [],
    contentStatus: "demo",
    contributorName: "fixture",
    reviewStatus: "draft",
  };
}

describe("location groups", () => {
  it("uses a tighter tolerance for exact locations than for city locations", () => {
    const exact = coordinateToleranceForPrecision("exact", 48);
    const city = coordinateToleranceForPrecision("city", 48);
    const region = coordinateToleranceForPrecision("region", 48);

    expect(exact.radiusKilometers).toBeLessThan(city.radiusKilometers);
    expect(city.radiusKilometers).toBeLessThan(region.radiusKilometers);
    expect(exact.latitudeDegrees).toBeLessThan(city.latitudeDegrees);
    expect(city.longitudeDegrees).toBeLessThan(region.longitudeDegrees);
  });

  it("groups entries with the same explicit location ID before fallback matching", () => {
    const first = makeLocation();
    const second = makeLocation({
      latitude: 48.9,
      longitude: 2.4,
      name: { en: "Different label", zh: "不同标签" },
      regionId: "different-region",
    });
    const groups = groupEntriesByLocation([
      makeEntry("first", first),
      makeEntry("second", second),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.locationId).toBe("location-fixture");
    expect(groups[0]?.entryIds).toEqual(["first", "second"]);
  });

  it("groups nearby same-name city records but keeps adjacent cities separate", () => {
    const nearbyParis = makeLocation({
      id: "",
      latitude: 48.86,
      longitude: 2.35,
    });
    const Brussels = makeLocation({
      id: "",
      name: { en: "Brussels", zh: "布鲁塞尔" },
      latitude: 50.8503,
      longitude: 4.3517,
    });
    const groups = groupEntriesByLocation([
      makeEntry("paris-a", makeLocation({ id: "" })),
      makeEntry("paris-b", nearbyParis),
      makeEntry("brussels", Brussels),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.find(group => group.entryIds.includes("paris-a"))?.entryIds).toEqual([
      "paris-a",
      "paris-b",
    ]);
    expect(groups.find(group => group.entryIds.includes("brussels"))?.entryIds).toEqual(["brussels"]);
  });

  it("uses same-region coordinates for unnamed fallback groups and skips missing coordinates", () => {
    const first = makeLocation({
      id: "",
      name: { en: "", zh: "" },
      latitude: 48.8566,
      longitude: 2.3522,
    });
    const second = makeLocation({
      id: "",
      name: { en: "", zh: "" },
      latitude: 48.86,
      longitude: 2.35,
    });
    const noCoordinates = makeLocation({ id: "missing", latitude: null, longitude: null });
    const groups = groupEntriesByLocation([
      makeEntry("first", first),
      makeEntry("second", second),
      makeEntry("missing", noCoordinates),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.entryIds).toEqual(["first", "second"]);
    expect(groups[0]?.latitude).toBeCloseTo((48.8566 + 48.86) / 2);
    expect(groups[0]?.longitude).toBeCloseTo((2.3522 + 2.35) / 2);
  });

  it("does not merge different regions through coordinate proximity alone", () => {
    const groups = groupEntriesByLocation([
      makeEntry("west", makeLocation({ id: "", name: { en: "", zh: "" } })),
      makeEntry("other", makeLocation({
        id: "",
        name: { en: "", zh: "" },
        regionId: "east-asia",
      })),
    ]);

    expect(groups).toHaveLength(2);
  });

  it("exposes the tolerance predicate for coordinate-model tests", () => {
    expect(coordinatesWithinTolerance(
      { latitude: 48.8566, longitude: 2.3522, precision: "city" },
      { latitude: 48.86, longitude: 2.35, precision: "city" },
    )).toBe(true);
    expect(coordinatesWithinTolerance(
      { latitude: 48.8566, longitude: 2.3522, precision: "exact" },
      { latitude: 48.86, longitude: 2.35, precision: "exact" },
    )).toBe(false);
  });
});
