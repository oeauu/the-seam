import { describe, expect, it } from "vitest";
import type { ArchiveEntry, LocalizedText } from "./index";
import {
  filterEntriesByCommittedRange,
  getPreviewVisibility,
  getPreviewVisibilityState,
  isEntryVisibleInPreview,
  selectEntriesInCommittedRange,
} from "./index";

const title: LocalizedText = { en: "Fixture", zh: "测试条目" };

function makeEntry(
  id: string,
  startYear: number | null,
  endYear: number | null,
): ArchiveEntry {
  return {
    id,
    slug: id,
    title,
    aliases: [],
    summary: title,
    description: title,
    temporal: { startYear, endYear, precision: "year", label: title },
    locations: [],
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

describe("archive range selectors", () => {
  const entries = [
    makeEntry("ancient", -500, -400),
    makeEntry("modern", 2000, 2020),
    makeEntry("undated", null, null),
  ];

  it("returns numeric preview visibility for overlapping entries", () => {
    expect(getPreviewVisibility(entries[0], { start: -400, end: -300 })).toBe(1);
    expect(getPreviewVisibility(entries[1], { start: 100, end: 199 })).toBe(0.18);
    expect(getPreviewVisibility(entries[2], { start: -500, end: 2026 })).toBe(0.5);
    expect(getPreviewVisibility(entries[1], { start: 1000, end: 1990 })).toBe(0.65);
  });

  it("exposes a readable preview state and optional undated inclusion", () => {
    expect(getPreviewVisibilityState(entries[0], { start: -400, end: -300 })).toBe("visible");
    expect(getPreviewVisibilityState(entries[2], { start: -400, end: -300 })).toBe("undated");
    expect(isEntryVisibleInPreview(entries[2], { start: -400, end: -300 })).toBe(false);
    expect(isEntryVisibleInPreview(entries[2], { start: -400, end: -300 }, true)).toBe(true);
  });

  it("selects committed ranges inclusively and leaves the source unchanged", () => {
    const selected = selectEntriesInCommittedRange(entries, { start: -400, end: 2000 });

    expect(selected.map(entry => entry.id)).toEqual(["ancient", "modern"]);
    expect(entries.map(entry => entry.id)).toEqual(["ancient", "modern", "undated"]);
    expect(filterEntriesByCommittedRange(entries, { start: -400, end: 2000 }, true)
      .map(entry => entry.id)).toEqual(["ancient", "modern", "undated"]);
  });
});
