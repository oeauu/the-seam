import { describe, expect, it } from "vitest";
import { ARCHIVE_ENTRIES } from "./data/archiveEntries";
import {
  getEntryPrimaryLocation,
  selectEntriesByFilters,
  selectEntryById,
  selectLocationClusters,
  selectRegionClusters,
} from "./selectors";

describe("archive selectors", () => {
  it("provides a canonical primary location and entry lookup", () => {
    const entry = selectEntryById(ARCHIVE_ENTRIES, "entry_tuer_shen");
    expect(entry).not.toBeNull();
    expect(getEntryPrimaryLocation(entry!)).toMatchObject({ isPrimary: true });
  });

  it("filters by intersecting time, legacy source labels, and canonical meanings", () => {
    const entries = selectEntriesByFilters(ARCHIVE_ENTRIES, {
      searchQuery: "兔儿神",
      selectedSourceIds: ["Cultural Memory"],
      selectedMeaningIds: ["guardianship"],
      selectedObjectTypeIds: [],
      timeRange: { start: 2000, end: 2030 },
      includeUndated: false,
    });
    expect(entries.map(entry => entry.id)).toContain("entry_tuer_shen");
  });

  it("builds region and location clusters from the same entries", () => {
    const regionClusters = selectRegionClusters(ARCHIVE_ENTRIES);
    const locationClusters = selectLocationClusters(ARCHIVE_ENTRIES);
    expect(regionClusters.length).toBeGreaterThanOrEqual(3);
    expect(locationClusters.some(cluster => cluster.count > 1)).toBe(true);
  });
});
