import { describe, expect, it } from "vitest";
import type { ArchiveEntry } from "./index";
import { getArchiveEntries } from "./index";

describe("archive demo data entry point", () => {
  it("returns canonical demo entries without year zero", () => {
    const entries: readonly ArchiveEntry[] = getArchiveEntries();
    const ids = entries.map(entry => entry.id);

    expect(entries.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect(entries.every(entry => entry.contentStatus === "demo")).toBe(true);
    expect(entries.every(entry => (
      entry.temporal.startYear !== 0 && entry.temporal.endYear !== 0
    ))).toBe(true);
  });

  it("returns isolated snapshots from each call", () => {
    const first = getArchiveEntries();
    const second = getArchiveEntries();
    const firstEntry = first[0];
    const secondEntry = second[0];

    expect(firstEntry).toBeDefined();
    expect(secondEntry).toBeDefined();
    if (!firstEntry || !secondEntry) return;

    expect(firstEntry).not.toBe(secondEntry);
    expect(firstEntry.title).not.toBe(secondEntry.title);
    expect(firstEntry.title).toEqual(secondEntry.title);
  });
});
