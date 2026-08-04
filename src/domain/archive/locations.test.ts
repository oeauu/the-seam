import { describe, expect, it } from "vitest";
import type { ArchiveEntry, ArchiveLocation, LocalizedText } from "./index";
import {
  coordinateToleranceForPrecision,
  coordinatesWithinTolerance,
  groupEntriesByLocation,
} from "./index";

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

describe("archive location groups", () => {
  it("uses tighter tolerances for more precise locations", () => {
    const exact = coordinateToleranceForPrecision("exact", 48);
    const city = coordinateToleranceForPrecision("city", 48);
    const region = coordinateToleranceForPrecision("region", 48);

    expect(exact.radiusKilometers).toBeLessThan(city.radiusKilometers);
    expect(city.radiusKilometers).toBeLessThan(region.radiusKilometers);
    expect(exact.longitudeDegrees).toBeLessThan(city.longitudeDegrees);
  });

  it("requires coordinate and region compatibility even for an explicit location ID", () => {
    const groups = groupEntriesByLocation([
      makeEntry("first", makeLocation()),
      makeEntry("second", makeLocation({
        latitude: 0,
        longitude: 0,
        name: { en: "Different label", zh: "不同标签" },
        regionId: "different-region",
      })),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.every(group => group.locationId === "location-fixture")).toBe(true);
    expect(groups.map(group => group.entryIds)).toEqual([["first"], ["second"]]);
  });

  it("merges nearby same-region locations but keeps other regions separate", () => {
    const groups = groupEntriesByLocation([
      makeEntry("paris-a", makeLocation({ id: "", name: { en: "", zh: "" } })),
      makeEntry("paris-b", makeLocation({
        id: "",
        name: { en: "", zh: "" },
        latitude: 48.86,
        longitude: 2.35,
      })),
      makeEntry("other", makeLocation({
        id: "",
        name: { en: "", zh: "" },
        regionId: "east-asia",
      })),
    ]);

    expect(groups).toHaveLength(2);
    expect(groups.find(group => group.entryIds.includes("paris-a"))?.entryIds)
      .toEqual(["paris-a", "paris-b"]);
    expect(groups.find(group => group.entryIds.includes("other"))?.entryIds).toEqual(["other"]);
  });

  it("skips locations without coordinates and exposes the coordinate predicate", () => {
    const groups = groupEntriesByLocation([
      makeEntry("located", makeLocation()),
      makeEntry("unknown", makeLocation({ id: "missing", latitude: null, longitude: null })),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.entryIds).toEqual(["located"]);
    expect(coordinatesWithinTolerance(
      { latitude: 48.8566, longitude: 2.3522, precision: "city" },
      { latitude: 48.86, longitude: 2.35, precision: "city" },
    )).toBe(true);
  });
});
